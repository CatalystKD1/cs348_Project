const { getArtists, getAlbumsByArtist, getTracksByAlbum } = require('./Feature2/getAlbTrack.js');
const { generateRecommendedPlaylist } = require('./autogenPlaylist.js');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};

const port = 3000;

// helper to log playlist-related actions
async function logPlaylistAction(conn, { user_id, playlist_id, action_type, details }) {
  await conn.execute(
    `INSERT INTO PlaylistActions (user_id, playlist_id, action_type, action_time, details)
     VALUES (?, ?, ?, NOW(), ?)`,
    [
      user_id,
      playlist_id,
      action_type,
      JSON.stringify(details || {})
    ]
  );
}

app.get('/', (req, res) => {
  res.send('Hello from the Node.js backend! How are you?');
});

/* ================================================================
   F1 — GET USER PLAYLISTS
================================================================ */
app.get('/user/:username/playlists', async (req, res) => {
  const username = req.params.username;

  try {
    const conn = await mysql.createConnection(dbConfig);

    // verify user
    const [userRows] = await conn.execute(
      'SELECT user_id, username FROM Users WHERE username = ?',
      [username]
    );
    if (userRows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const user_id = userRows[0].user_id;

    // playlists
    const [playlistRows] = await conn.execute(
      `SELECT p.playlist_name, p.playlist_id
       FROM Playlists p
       JOIN Owner o ON p.playlist_id = o.playlist_id
       WHERE o.user_id = ?`,
      [user_id]
    );

    await conn.end();
    res.json(playlistRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   ARTIST SEARCH (Used for F2 autocomplete)
================================================================ */
app.get('/artists/search', async (req, res) => {
  const query = req.query.q || '';

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      `SELECT DISTINCT ar.artist_name, ar.artist_id
       FROM Artists ar
       JOIN AlbumArtists aa ON aa.artist_id = ar.artist_id
       JOIN Albums al ON al.album_id = aa.album_id
       JOIN Songs s ON s.album_id = al.album_id
       WHERE ar.artist_name LIKE ?
       LIMIT 10`,
      [`%${query}%`]
    );

    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Artist search failed', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F1 — GET USER LIKED SONGS
================================================================ */
app.get('/user/:username/likes', async (req, res) => {
  const username = req.params.username;

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [userRows] = await conn.execute(
      'SELECT user_id FROM Users WHERE username = ? LIMIT 1',
      [username]
    );
    if (userRows.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = userRows[0].user_id;

    const sql = `
      SELECT s.song_id, s.song_name
      FROM Likes l
      JOIN Songs s ON s.song_id = l.song_id
      WHERE l.user_id = ?
      ORDER BY s.song_name ASC;
    `;

    const [rows] = await conn.execute(sql, [user_id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching liked songs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F1 — GET SONGS IN PLAYLIST
================================================================ */
app.get('/playlist/:pID/songs', async (req, res) => {
  const pID = req.params.pID;

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      `SELECT s.song_name, s.song_id
       FROM Songs s
       JOIN PlaylistSongs pl ON s.song_id = pl.song_id
       WHERE pl.playlist_id = ?`,
      [pID]
    );

    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   GENRE AUTOCOMPLETE
================================================================ */
app.get('/genres/search', async (req, res) => {
  const q = req.query.q || '';

  if (q.trim().length < 2)
    return res.json([]);

  try {
    const conn = await mysql.createConnection(dbConfig);
    const sql = `
      SELECT t.gname, COUNT(*) AS song_count
      FROM (
        SELECT DISTINCT g.gname, s.song_id
        FROM Genres g
        JOIN AlbumArtists aa ON aa.artist_id = g.artist_id
        JOIN Albums al ON al.album_id = aa.album_id
        JOIN Songs s ON s.album_id = al.album_id
        WHERE LOWER(g.gname) LIKE LOWER(CONCAT('%', ?, '%'))
      ) t
      GROUP BY t.gname
      ORDER BY song_count DESC
      LIMIT 5;
    `;

    const [rows] = await conn.execute(sql, [q]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error searching genres:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F3 — SONGS BY GENRE
================================================================ */
app.get('/songs/by-genre', async (req, res) => {
  const genre = req.query.genre;
  let limit = parseInt(req.query.limit ?? '10', 10);
  let page = parseInt(req.query.page ?? '0', 10);

  if (!genre)
    return res.status(400).json({ error: 'Missing genre parameter' });

  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 200) limit = 200;
  if (isNaN(page) || page < 0) page = 0;

  const offset = page * limit;

  try {
    const conn = await mysql.createConnection(dbConfig);
    const sql = `
      SELECT DISTINCT
        s.song_name AS song_title,
        s.song_id,
        ar.artist_name AS artist
      FROM Genres g
      JOIN AlbumArtists aa ON aa.artist_id = g.artist_id
      JOIN Albums al ON al.album_id = aa.album_id
      JOIN Songs s ON s.album_id = al.album_id
      JOIN SongArtists sa ON sa.song_id = s.song_id
      JOIN Artists ar ON ar.artist_id = sa.artist_id
      WHERE LOWER(g.gname) = LOWER(?)
      ORDER BY s.song_name ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const [rows] = await conn.execute(sql, [genre]);
    await conn.end();
    res.json({ page, limit, count: rows.length, songs: rows });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   GLOBAL SONG SEARCH
================================================================ */
app.get('/songs/search', async (req, res) => {
  const q = req.query.q || '';

  if (q.trim().length < 2)
    return res.json([]);

  try {
    const conn = await mysql.createConnection(dbConfig);
    const sql = `
      SELECT s.song_id, s.song_name, ar.artist_name
      FROM Songs s
      JOIN SongArtists sa ON sa.song_id = s.song_id
      JOIN Artists ar ON ar.artist_id = sa.artist_id
      WHERE s.song_name LIKE ?
      LIMIT 20;
    `;

    const [rows] = await conn.execute(sql, [`%${q}%`]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Song search failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   🔍 GLOBAL USER SEARCH
================================================================ */

app.get('/users/search', async (req, res) => {
  const query = req.query.q;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT user_id, username FROM Users WHERE username LIKE ? LIMIT 10',
      [`%${query}%`]
    );
    res.json(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



/* ================================================================
   F4 — RANDOM ARTISTS FOR GAME
================================================================ */
app.get('/artists/random', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT artist_name, artist_id, followers FROM Artists ORDER BY RAND() LIMIT 2'
    );

    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Random artists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/user/:username/topscore', async (req, res) => {
  const username = req.params.username;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT top_score FROM users WHERE username = ?',
      [username]
    );
    await conn.end();

    if (rows.length === 0)
      return res.json({ top_score: 0 });

    res.json({ top_score: rows[0].top_score });
  } catch (err) {
    console.error('Get top score error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/user/topscore', async (req, res) => {
  const { username, score } = req.body;

  if (!username || score === undefined) {
    console.log("Bad request:", req.body);
    return res.status(400).json({ error: 'Missing username or score' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [result] = await conn.execute(
      "UPDATE users SET top_score = GREATEST(IFNULL(top_score, 0), ?) WHERE username = ?",
      [score, username]
    );
    await conn.end();
    
    res.json({ updated: true });
  } catch (err) {
    console.error("Top score SQL error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================================================================
   CREATE NEW PLAYLIST (NEW FEATURE)
================================================================ */
app.post('/playlists/create', async (req, res) => {
  const { user_id, playlist_name } = req.body;

  if (!user_id || !playlist_name)
    return res.status(400).json({ error: 'Missing user_id or playlist_name' });

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    // next playlist id
    const [rows] = await conn.execute('SELECT MAX(playlist_id) AS maxId FROM Playlists');
    const nextId = (rows[0].maxId || 0) + 1;

    // create playlist
    await conn.execute(
      `INSERT INTO Playlists (playlist_id, playlist_name, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [nextId, playlist_name]
    );

    // ownership
    await conn.execute(
      `INSERT INTO Owner (playlist_id, user_id) VALUES (?, ?)`,
      [nextId, user_id]
    );

    await logPlaylistAction(conn, {
      user_id,
      playlist_id: nextId,
      action_type: 'create',
      details: { playlist_name }
    });

    await conn.commit();
    await conn.end();
    res.json({ success: true, playlist_id: nextId, playlist_name });
  } catch (err) {
    console.error('Create playlist failed:', err);
    try {
      if (conn) await conn.rollback();
    } catch (e) {}
    if (conn) try { await conn.end(); } catch (e) {}
    res.status(500).json({ error: 'Server error' });
  }
});


/* ================================================================
   DELETE PLAYLIST 
================================================================ */
app.post('/playlists/delete', async (req, res) => {
  const { user_id, playlist_id } = req.body;

  if (!user_id || !playlist_id)
    return res.status(400).json({ error: 'Missing user_id or playlist_id' });

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    const [ownerRows] = await conn.execute(
      `SELECT 1 FROM Owner WHERE playlist_id = ? AND user_id = ? LIMIT 1`,
      [playlist_id, user_id]
    );

    if (ownerRows.length === 0) {
      await conn.rollback();
      await conn.end();
      return res.status(403).json({ error: 'You do not own this playlist' });
    }

    await logPlaylistAction(conn, {
      user_id,
      playlist_id,
      action_type: 'delete_playlist',
      details: {}
    });

    await conn.execute(
      `DELETE FROM PlaylistActions WHERE playlist_id = ?`,
      [playlist_id]
    );

    await conn.execute(`DELETE FROM PlaylistSongs WHERE playlist_id = ?`, [playlist_id]);
    await conn.execute(`DELETE FROM Owner WHERE playlist_id = ?`, [playlist_id]);
    await conn.execute(`DELETE FROM Playlists WHERE playlist_id = ?`, [playlist_id]);

    await conn.commit();
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete playlist failed:', err);
    try {
      if (conn) await conn.rollback();
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr);
    }
    if (conn) try { await conn.end(); } catch (e) {}
    res.status(500).json({ error: 'Server error' });
  }
});


// Legacy add to playlist 

app.post('/playlists/:playlist_id/songs/:song_id', async (req, res) => {
  const playlist_id = Number(req.params.playlist_id);
  const song_id = req.params.song_id;

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id) VALUES (?, ?)',
      [playlist_id, song_id]
    );
    await conn.end();
    res.json({ success: true, playlist_id, added: 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   ADD SONG TO PLAYLIST 
================================================================ */
app.post('/playlist/add', async (req, res) => {
  const { user_id, playlist_id, song_id } = req.body;

  if (!user_id || !playlist_id || !song_id)
    return res.status(400).json({ error: 'Missing required fields' });

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    // verify ownership
    const [rows] = await conn.execute(
      `SELECT 1 FROM Owner WHERE playlist_id = ? AND user_id = ? LIMIT 1`,
      [playlist_id, user_id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      await conn.end();
      return res.status(403).json({ error: 'You do not own this playlist' });
    }

    // insert safely
    await conn.execute(
      `INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id)
       VALUES (?, ?)`,
      [playlist_id, song_id]
    );

    await logPlaylistAction(conn, {
      user_id,
      playlist_id,
      action_type: 'add_song',
      details: { song_id }
    });

    await conn.commit();
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Add to playlist failed:', err);
    try {
      if (conn) await conn.rollback();
    } catch (e) {}
    if (conn) try { await conn.end(); } catch (e) {}
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   REMOVE SONG FROM PLAYLIST (with logging)
================================================================ */
app.post('/playlist/remove', async (req, res) => {
  const { user_id, playlist_id, song_id } = req.body;

  if (!user_id || !playlist_id || !song_id)
    return res.status(400).json({ error: 'Missing required fields' });

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT 1 FROM Owner WHERE playlist_id = ? AND user_id = ? LIMIT 1`,
      [playlist_id, user_id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      await conn.end();
      return res.status(403).json({ error: 'You do not own this playlist' });
    }

    await conn.execute(
      `DELETE FROM PlaylistSongs
       WHERE playlist_id = ? AND song_id = ?
       LIMIT 1`,
      [playlist_id, song_id]
    );

    await logPlaylistAction(conn, {
      user_id,
      playlist_id,
      action_type: 'remove_song',
      details: { song_id }
    });

    await conn.commit();
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Remove from playlist failed:', err);
    try {
      if (conn) await conn.rollback();
    } catch (e) {}
    if (conn) try { await conn.end(); } catch (e) {}
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   LIKE SONG (path param)
================================================================ */
app.post('/users/:user_id/likes/:song_id', async (req, res) => {
  const user_id = Number(req.params.user_id);
  const song_id = req.params.song_id;

  try {
    const conn = await mysql.createConnection(dbConfig);

    await conn.execute(
      `INSERT IGNORE INTO Likes (user_id, song_id, liked_at)
       VALUES (?, ?, NOW())`,
      [user_id, song_id]
    );

    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   LIKE SONG (frontend cleaner version)
================================================================ */
app.post('/likes', async (req, res) => {
  const { user_id, song_id } = req.body;

  if (!user_id || !song_id)
    return res.status(400).json({ error: 'Missing user_id or song_id' });

  try {
    const conn = await mysql.createConnection(dbConfig);

    await conn.execute(
      `INSERT IGNORE INTO Likes (user_id, song_id, liked_at)
       VALUES (?, ?, NOW())`,
      [user_id, song_id]
    );

    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Add like failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   UNLIKE SONG (remove like)
================================================================ */
app.post('/likes/remove', async (req, res) => {
  const { user_id, song_id } = req.body;

  if (!user_id || !song_id) {
    return res.status(400).json({ error: 'Missing user_id or song_id' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [result] = await conn.execute(
      `DELETE FROM Likes
       WHERE user_id = ? AND song_id = ?
       LIMIT 1`,
      [user_id, song_id]
    );

    await conn.end();

    // result.affectedRows === 0 means there wasn't a like to remove, but
    // we can still treat it as success for a toggle UX.
    res.json({ success: true, removed: result.affectedRows > 0 });
  } catch (err) {
    console.error('Remove like failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F5 — MOST LIKED SONGS
================================================================ */
app.get('/popular/songs', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);

    const [rows] = await conn.execute(
      `SELECT s.song_name, COUNT(l.user_id) AS like_count
       FROM Songs s
       JOIN Likes l ON s.song_id = l.song_id
       GROUP BY s.song_id, s.song_name
       ORDER BY like_count DESC
       LIMIT 10;`
    );

    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Popular songs failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F2 — ARTIST ALBUMS
================================================================ */
app.get('/artist/:artist/albums', async (req, res) => {
  const artistId = req.params.artist;

  try {
    const albums = await getAlbumsByArtist(artistId);
    res.json(albums);
  } catch (err) {
    console.error('Album fetch failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   F2 — ALBUM SONGS
================================================================ */
app.get('/album/:album_id/songs', async (req, res) => {
  const album_id = req.params.album_id;

  try {
    const songs = await getTracksByAlbum(album_id);
    res.json(songs);
  } catch (err) {
    console.error('Get album songs failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   AF1: Auto-Generated Playlist Recommendations
================================================================ */

app.post('/user/:userId/recommendations', async (req, res) => {
  const userId = req.params.userId;
  const playlistName = req.body.playlistName || "Recommended For You";

  try {
    const playlist = await generateRecommendedPlaylist(userId, playlistName);
    res.json(playlist);

  } catch (err) {
    console.error('Recommendation generation failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


/* ================================================================
   LOGIN
================================================================ */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Missing credentials' });

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [rows] = await conn.execute(
      'SELECT user_id, username, email, password FROM Users WHERE email = ? LIMIT 1',
      [email]
    );

    await conn.end();

    if (rows.length === 0)
      return res.status(401).json({ success: false, error: 'User not found' });

    const user = rows[0];

    if (user.password !== password)
      return res.status(401).json({ success: false, error: 'Invalid password' });

    delete user.password;

    res.json({ success: true, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* ================================================================
   SIGNUP
================================================================ */
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ success: false, error: 'Missing fields' });

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [existing] = await conn.execute(
      'SELECT user_id FROM Users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ success: false, error: 'User exists' });
    }

    const [rows] = await conn.execute('SELECT MAX(user_id) AS maxId FROM Users');
    const nextId = (rows[0].maxId || 0) + 1;

    await conn.execute(
      `INSERT INTO Users (user_id, username, email, password)
       VALUES (?, ?, ?, ?)`,
      [nextId, username, email, password]
    );

    await conn.end();
    res.json({ success: true, user: { user_id: nextId, username, email } });
  } catch (err) {
    console.error('Signup failed:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


/* ================================================================
   GET LATEST ACTION FOR A PLAYLIST
================================================================ */
app.get('/playlists/:playlist_id/actions/latest', async (req, res) => {
  const playlist_id = Number(req.params.playlist_id);
  const user_id = req.query.user_id ? Number(req.query.user_id) : null;

  if (!playlist_id) {
    return res.status(400).json({ error: 'Missing playlist_id' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);

    const params = [];
    let where = 'WHERE playlist_id = ?';
    params.push(playlist_id);

    if (user_id) {
      where += ' AND user_id = ?';
      params.push(user_id);
    }

    const [rows] = await conn.execute(
      `SELECT action_id, user_id, playlist_id, action_type, action_time, details
       FROM PlaylistActions
       ${where}
       ORDER BY action_time DESC, action_id DESC
       LIMIT 1`,
      params
    );

    await conn.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No actions found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('Fetch latest action failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   UNDO PREVIOUS PLAYLIST ACTION
================================================================ */
app.post('/playlists/undo', async (req, res) => {
  const { user_id, playlist_id } = req.body;

  if (!user_id || !playlist_id) {
    return res.status(400).json({ error: 'Missing user_id or playlist_id' });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    // Get the most recent action for this user & playlist
    const [actions] = await conn.execute(
      `SELECT action_id, playlist_id, action_type, action_time, details
       FROM PlaylistActions
       WHERE user_id = ? AND playlist_id = ?
       ORDER BY action_time DESC, action_id DESC
       LIMIT 1`,
      [user_id, playlist_id]
    );

    if (actions.length === 0) {
      await conn.rollback();
      await conn.end();
      return res.status(400).json({ error: 'No actions to undo' });
    }

    const action = actions[0];
    const rawType = action.action_type || '';
    const type = rawType.toLowerCase();          // normalize for comparison

    const undoResult = {
      action_id: action.action_id,
      action_type: rawType,
      playlist_id: action.playlist_id
    };

    if (type === 'create_playlist' || type === 'create') {
      // Undo: delete playlist + owner + songs
      const pid = action.playlist_id;

      await conn.execute(
        `DELETE FROM PlaylistSongs WHERE playlist_id = ?`,
        [pid]
      );
      await conn.execute(
        `DELETE FROM Owner WHERE playlist_id = ?`,
        [pid]
      );
      await conn.execute(
        `DELETE FROM Playlists WHERE playlist_id = ?`,
        [pid]
      );

      undoResult.undo_kind = 'CREATE_PLAYLIST';
    } else if (type === 'add_song') {
      // Undo: remove that song from the playlist
      let songId = null;
      try {
        const parsed = JSON.parse(action.details || '{}');
        songId = parsed.song_id || null;
      } catch (e) {
        console.error('Failed to parse action.details JSON', e);
      }

      if (!songId) {
        await conn.rollback();
        await conn.end();
        return res.status(500).json({ error: 'Cannot undo: missing song_id in action details' });
      }

      await conn.execute(
        `DELETE FROM PlaylistSongs
         WHERE playlist_id = ? AND song_id = ?
         LIMIT 1`,
        [action.playlist_id, songId]
      );

      undoResult.song_id = songId;
      undoResult.undo_kind = 'ADD_SONG';
    } else if (type === 'remove_song') {
      // Undo: re-add that song into the playlist
      let songId = null;
      try {
        const parsed = JSON.parse(action.details || '{}');
        songId = parsed.song_id || null;
      } catch (e) {
        console.error('Failed to parse action.details JSON', e);
      }

      if (!songId) {
        await conn.rollback();
        await conn.end();
        return res.status(500).json({ error: 'Cannot undo: missing song_id in action details' });
      }

      await conn.execute(
        `INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id)
         VALUES (?, ?)`,
        [action.playlist_id, songId]
      );

      undoResult.song_id = songId;
      undoResult.undo_kind = 'REMOVE_SONG';
    } else {
      await conn.rollback();
      await conn.end();
      return res.status(400).json({ error: 'Unsupported action type for undo' });
    }

    // Remove this action from the log so it can't be undone twice
    await conn.execute(
      `DELETE FROM PlaylistActions WHERE action_id = ?`,
      [action.action_id]
    );

    await conn.commit();
    await conn.end();
    return res.json({ success: true, undone: undoResult });
  } catch (err) {
    console.error('Undo playlist action failed:', err);
    try {
      if (conn) await conn.rollback();
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr);
    }
    if (conn) {
      try { await conn.end(); } catch (e) {}
    }
    return res.status(500).json({ error: 'Server error' });
  }
});



/* ================================================================
   AF4 - Genre diversity (using entropy)
================================================================ */
app.get("/user/:username/playlists/diversity", async (req, res) => {
  const username = req.params.username;

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [playlists] = await conn.execute(
      `SELECT p.playlist_id, p.playlist_name
       FROM Playlists p
       JOIN Owner o ON o.playlist_id = p.playlist_id
       JOIN Users u ON u.user_id = o.user_id
       WHERE u.username = ?`,
      [username]
    );

    if (playlists.length === 0) {
      await conn.end();
      return res.json([]);
    }

    const diversityPromises = playlists.map(async (pl) => {
      const [rows] = await conn.execute(
        `
        SELECT
          COALESCE(-SUM((cnt / total_songs) * LOG(cnt / total_songs)), 0) AS genre_diversity_score,
          CASE
            WHEN COALESCE(-SUM((cnt / total_songs) * LOG(cnt / total_songs)), 0) <= 1.5 THEN 'Low Diversity'
            WHEN COALESCE(-SUM((cnt / total_songs) * LOG(cnt / total_songs)), 0) <= 3.0 THEN 'Medium Diversity'
            WHEN COALESCE(-SUM((cnt / total_songs) * LOG(cnt / total_songs)), 0) <= 4.5 THEN 'High Diversity'
            ELSE 'Very High Diversity'
          END AS diversity_level
        FROM (
          SELECT
            g.gname,
            COUNT(*) AS cnt,
            (SELECT COUNT(*) 
             FROM PlaylistSongs ps2
             WHERE ps2.playlist_id = ps.playlist_id) AS total_songs
          FROM PlaylistSongs ps
          JOIN Songs s ON ps.song_id = s.song_id
          JOIN SongArtists sa ON s.song_id = sa.song_id
          LEFT JOIN Genres g ON sa.artist_id = g.artist_id
          WHERE ps.playlist_id = ?
          GROUP BY g.gname, ps.playlist_id
        ) AS genre_counts;
        `,
        [pl.playlist_id]
      );

      return {
        playlist_id: pl.playlist_id,
        playlist_name: pl.playlist_name,
        genre_diversity_score: parseFloat(rows[0].genre_diversity_score),
        diversity_level: rows[0].diversity_level
      };
    });

    const diversityData = await Promise.all(diversityPromises);

    await conn.end();
    res.json(diversityData);

  } catch (err) {
    console.error("Error fetching playlist diversity:", err);
    res.status(500).json({ error: "Server error" });
  }
});




/* ================================================================
   AF5 — SONG SIMILARITY ENGINE (Cosine Similarity)
================================================================ */
app.get("/similarity", async (req, res) => {
  const songName = req.query.song;
  let threshold = parseFloat(req.query.threshold ?? "1.000");
  let limit = parseInt(req.query.limit ?? "10", 10);

  if (!songName || songName.trim().length === 0) {
    return res.status(400).json({ error: "Missing 'song' parameter" });
  }

  if (isNaN(threshold) || threshold <= 0 || threshold > 1) {
    threshold = 1.0;
  }

  if (isNaN(limit) || limit < 1) limit = 1;
  if (limit > 200) limit = 200;

  const W_DURATION = 0.5;
  const W_EXPLICIT = 0.25;
  const W_POP = 0.75;

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [targetRows] = await conn.execute(
      `
      SELECT 
        s.song_id,
        s.song_name,
        s.duration_ms,
        s.explicit,
        al.album_pop AS album_pop
      FROM Songs s
      JOIN Albums al ON al.album_id = s.album_id
      WHERE s.song_name LIKE ?
      ORDER BY LENGTH(s.song_name)
      LIMIT 1;
      `,
      [`%${songName}%`]
    );

    if (targetRows.length === 0) {
      await conn.end();
      return res.status(404).json({ error: "Song not found" });
    }

    const t = targetRows[0];

    const t_d = t.duration_ms / 300000;
    const t_e = t.explicit;
    const t_p = t.album_pop / 100;

    const t_wd = W_DURATION * t_d;
    const t_we = W_EXPLICIT * t_e;
    const t_wp = W_POP * t_p;

    const magTarget = Math.sqrt(t_wd * t_wd + t_we * t_we + t_wp * t_wp);

    const [rows] = await conn.execute(
      `
      SELECT
        s2.song_id,
        s2.song_name,
        s2.duration_ms,
        ar.artist_name,
        s2.duration_ms / 300000 AS d2,
        s2.explicit AS e2,
        al2.album_pop / 100 AS p2
      FROM Songs s2
      JOIN Albums al2 ON al2.album_id = s2.album_id
      JOIN SongArtists sa ON sa.song_id = s2.song_id
      JOIN Artists ar ON ar.artist_id = sa.artist_id
      WHERE s2.song_id != ?
      `,
      [t.song_id]
    );

    await conn.end();

    const similarityRows = rows.map(r => {
      const r_wd = W_DURATION * r.d2;
      const r_we = W_EXPLICIT * r.e2;
      const r_wp = W_POP * r.p2;

      const dot = t_wd * r_wd + t_we * r_we + t_wp * r_wp;
      const magR = Math.sqrt(r_wd * r_wd + r_we * r_we + r_wp * r_wp);
      const similarity = (dot / (magTarget * magR)) || 0;

      return {
        song_id: r.song_id,
        song_name: r.song_name,
        artist_name: r.artist_name,
        duration_ms: r.duration_ms,
        duration_formatted: formatTime(r.duration_ms),
        similarity
      };
    });

    const filtered = similarityRows
      .filter(r => r.similarity <= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    res.json({
      input_song: {
        ...t,
        duration_formatted: formatTime(t.duration_ms)
      },
      recommendations: filtered
    });

  } catch (err) {
    console.error("Similarity error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

/* ================================================================
   START SERVER
================================================================ */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
