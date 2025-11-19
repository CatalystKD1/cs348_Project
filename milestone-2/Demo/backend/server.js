const { getArtists, getAlbumsByArtist, getTracksByAlbum } = require('./Feature2/getAlbTrack.js');
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
   🔍 GLOBAL SONG SEARCH
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

/* ================================================================
   CREATE NEW PLAYLIST (NEW FEATURE)
================================================================ */
app.post('/playlists/create', async (req, res) => {
  const { user_id, playlist_name } = req.body;

  if (!user_id || !playlist_name)
    return res.status(400).json({ error: 'Missing user_id or playlist_name' });

  try {
    const conn = await mysql.createConnection(dbConfig);

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

    await conn.end();
    res.json({ success: true, playlist_id: nextId, playlist_name });
  } catch (err) {
    console.error('Create playlist failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   ADD SONG TO PLAYLIST (legacy)
================================================================ */
app.post('/playlists/:playlist_id/songs/:song_id', async (req, res) => {
  const playlist_id = Number(req.params.playlist_id);
  const song_id = req.params.song_id;

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      `INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id)
       VALUES (?, ?)`,
      [playlist_id, song_id]
    );

    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Legacy add song error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================================================================
   ADD SONG TO PLAYLIST (clean + ownership check)
================================================================ */
app.post('/playlist/add', async (req, res) => {
  const { user_id, playlist_id, song_id } = req.body;

  if (!user_id || !playlist_id || !song_id)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    const conn = await mysql.createConnection(dbConfig);

    // verify ownership
    const [rows] = await conn.execute(
      `SELECT 1 FROM Owner WHERE playlist_id = ? AND user_id = ? LIMIT 1`,
      [playlist_id, user_id]
    );

    if (rows.length === 0) {
      await conn.end();
      return res.status(403).json({ error: 'You do not own this playlist' });
    }

    // insert safely
    await conn.execute(
      `INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id)
       VALUES (?, ?)`,
      [playlist_id, song_id]
    );

    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Add to playlist failed:', err);
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
      `INSERT IGNORE INTO Likes (user_id, song_id)
       VALUES (?, ?)`,
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
      `INSERT IGNORE INTO Likes (user_id, song_id)
       VALUES (?, ?)`,
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
   START SERVER
================================================================ */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
