// recommendationService.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * generation algo:
 *
 * - artist/genre/album affinity from Likes
 * - time weighting using liked_at (e.g. if you've really been into pop recently)
 * - content similarity (artist/genre/album/popularity) for every song
 * - rank songs
 * - remove dupes
 */
async function generateRecommendedPlaylist(userId, playlistName = 'Recommended For You') {
  let conn;

  try {
    conn = await db.getConnection();

    // ============================================================
    // 1) Artist + Genre Affinity
    // ============================================================
    const [artistGenreRows] = await conn.query(
      `
      SELECT
        sa.artist_id,
        COUNT(*) AS artist_score,
        g.gname AS genre,
        COALESCE(a.artist_name, '') AS artist_name,
        COALESCE(a.artist_pop, 0) AS artist_pop
      FROM Likes l
      STRAIGHT_JOIN SongArtists sa ON sa.song_id = l.song_id
      JOIN Artists a ON a.artist_id = sa.artist_id
      LEFT JOIN Genres g ON g.artist_id = sa.artist_id
      WHERE l.user_id = ?
      GROUP BY sa.artist_id, g.gname, a.artist_name, a.artist_pop;
      `,
      [userId]
    );

    const artistScore = {};
    const genreScore = {};

    for (const r of artistGenreRows) {
      const aid = r.artist_id;
      const sc = Number(r.artist_score) || 0;
      const g = r.genre || 'unknown';
      artistScore[aid] = sc;
      genreScore[g] = (genreScore[g] || 0) + sc;
    }

    // ============================================================
    // 2) Album Affinity
    //    Count likes per album 
    // ============================================================
    const [albumAffinity] = await conn.query(
      `
      WITH UserAlbumLikes AS (
        SELECT s.album_id, COUNT(*) AS album_like_count
        FROM Likes l
        JOIN Songs s ON s.song_id = l.song_id
        WHERE l.user_id = ?
        GROUP BY s.album_id
      )
      SELECT album_id, COALESCE(album_like_count, 0) AS album_score FROM UserAlbumLikes;
      `,
      [userId]
    );

    const albumScore = Object.fromEntries(albumAffinity.map((a) => [a.album_id, a.album_score]));

    // ============================================================
    // 4) Content similarity
    //    compares liked songs to all songs on artist/genre/album/pop
    // ============================================================
    const [contentSim] = await conn.query(
      `
      WITH UserLiked AS (
        SELECT
          l.song_id AS liked_song,
          sa.artist_id,
          g.gname AS genre,
          s.album_id,
          COALESCE(a.artist_pop, 0) AS artist_pop
        FROM Likes l
        JOIN SongArtists sa ON sa.song_id = l.song_id
        JOIN Genres g ON g.artist_id = sa.artist_id
        JOIN Songs s ON s.song_id = l.song_id
        JOIN Artists a ON a.artist_id = sa.artist_id
        WHERE l.user_id = ?
      ),
      GlobalSongs AS (
        SELECT
          s.song_id,
          sa.artist_id,
          g.gname AS genre,
          s.album_id,
          COALESCE(a.artist_pop, 0) AS artist_pop
        FROM Songs s
        JOIN SongArtists sa ON sa.song_id = s.song_id
        JOIN Genres g ON g.artist_id = sa.artist_id
        JOIN Artists a ON a.artist_id = sa.artist_id
      )
      SELECT
        g2.song_id,
        MAX(
          (CASE WHEN ul.artist_id = g2.artist_id THEN 40 ELSE 0 END) +
          (CASE WHEN ul.genre = g2.genre THEN 25 ELSE 0 END) +
          (CASE WHEN ul.album_id = g2.album_id THEN 12 ELSE 0 END) +
          (50 - ABS(ul.artist_pop - g2.artist_pop))
        ) AS sim_score
      FROM UserLiked ul
      JOIN GlobalSongs g2 ON g2.song_id != ul.liked_song
      GROUP BY g2.song_id
      `,
      [userId]
    );

    const contentScore = Object.fromEntries(contentSim.map((s) => [s.song_id, s.sim_score]));

    // ============================================================
    // 5) Candidate set: songs not already liked by the user.
    //    Limit to a safe number (popularity ordering helps quality)
    // ============================================================
    const [candidates] = await conn.query(
      `
      SELECT
        s.song_id,
        s.song_name,
        s.album_id,
        COALESCE(al.album_pop, 0) AS popularity,
        sa.artist_id,
        ar.artist_name AS artist_name,
        g.gname AS genre
      FROM Songs s
      JOIN SongArtists sa ON sa.song_id = s.song_id
      JOIN Artists ar ON ar.artist_id = sa.artist_id
      JOIN Genres g ON g.artist_id = sa.artist_id
      JOIN Albums al ON al.album_id = s.album_id
      WHERE NOT EXISTS (
        SELECT 1 FROM Likes l
        WHERE l.song_id = s.song_id AND l.user_id = ?
      )
      ORDER BY al.album_pop DESC
      `,
      [userId]
    );

    // ============================================================
    // 6) Compute final scores
    // ============================================================
    const ranked = candidates.map((song) => {
      const A = artistScore[song.artist_id] || 0;
      const G = genreScore[song.genre] || 0;
      const C = contentScore[song.song_id] || 0;
      const AL = albumScore[song.album_id] || 0;

      const finalScore = 0.4 * A + 0.3 * G + 0.2 * C + 0.5 * AL;
      return { ...song, finalScore };
    });

    // ============================================================
    // 7) Ensure no duplicates in playlist array
    // ============================================================
    const playlist = [];
    const artistCount = {};
    const genreCount = {};
    const seenSongIds = new Set();

    ranked.sort((a, b) => b.finalScore - a.finalScore);

    for (const song of ranked) {
      if (seenSongIds.has(song.song_id)) continue;
      // optional diversification
      if ((artistCount[song.artist_id] || 0) >= 3) continue;
      if ((genreCount[song.genre] || 0) >= 5) continue;

      playlist.push(song);
      seenSongIds.add(song.song_id);
      artistCount[song.artist_id] = (artistCount[song.artist_id] || 0) + 1;
      genreCount[song.genre] = (genreCount[song.genre] || 0) + 1;

      if (playlist.length >= 20) break;
    }

    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    }

    shuffleArray(playlist);

    // ============================================================
    // 8) Persist playlist atomically using a transaction
    //    - Use explicit playlist_id based on MAX(playlist_id)
    //    - Deduplicate insert params (song_id, playlist_id)
    // ============================================================
    await conn.beginTransaction();
    try {
      const [rows] = await conn.execute('SELECT MAX(playlist_id) AS maxId FROM Playlists');
      const playlistId = (rows[0].maxId || 0) + 1;

      await conn.query(
        `INSERT INTO Playlists (playlist_id, playlist_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
        [playlistId, playlistName]
      );

      await conn.query(`INSERT INTO Owner (playlist_id, user_id) VALUES (?, ?)`, [playlistId, userId]);

      if (playlist.length > 0) {
        const uniqueSongIds = Array.from(new Set(playlist.map((s) => s.song_id)));
        const placeholders = uniqueSongIds.map(() => '(?, ?)').join(', ');
        const params = [];
        for (const sid of uniqueSongIds) params.push(sid, playlistId);

        await conn.query(
          `INSERT IGNORE INTO PlaylistSongs (song_id, playlist_id) VALUES ${placeholders}`,
          params
        );
      }

      await conn.commit();

      return {
        playlistId,
        playlistName,
        totalSongs: playlist.length,
        songs: playlist.map((s) => ({
          song_id: s.song_id,
          song_name: s.song_name,
          artist_id: s.artist_id,
          artist_name: s.artist_name || null,
          album_id: s.album_id || null,
          genre: s.genre,
          score: s.finalScore,
        })),
      };
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error('generateRecommendedPlaylist error:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { generateRecommendedPlaylist };
