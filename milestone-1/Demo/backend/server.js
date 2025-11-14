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
  database: process.env.DB_NAME,
}

const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from the Node.js backend! How are you?');
});

// F1: Get user's playlists
app.get('/user/:username/playlists', async (req, res) => {
  const username = req.params.username;

  try {
    const conn = await mysql.createConnection(dbConfig);

    // Check if user exists
    const [userRows] = await conn.execute(
      'SELECT user_id, username FROM Users WHERE username = ?',
      [username]
    );
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user_id = userRows[0].user_id;

    // Get playlists
    const [playlistRows] = await conn.execute(
      `SELECT p.playlist_name, p.playlist_id FROM Playlists p JOIN Owner o ON p.playlist_id = o.playlist_id WHERE o.user_id =  ?`, [user_id]
    );

    console.log(playlistRows)

    res.json(playlistRows);
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})


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




// F1: Get user's liked songs 
app.get('/user/:username/likes', async (req, res) => {
  res.send('Getting likes..');
})


// F1: Get songs from a playlist
app.get('/playlist/:pID/songs', async (req, res) => {
  const pID = req.params.pID;
  console.log(pID)

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [songRows] = await conn.execute(
      `SELECT s.song_name
          FROM Songs s 
          JOIN PlaylistSongs pl ON s.song_id = pl.song_id 
          WHERE pl.playlist_id = ?`, [pID]
    );

    res.json(songRows);
    console.log(songRows)
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/artists/search', async (req, res) => {
  const query = req.query.q;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT artist_name, artist_id FROM Artists WHERE artist_name LIKE ? LIMIT 10',
      [`%${query}%`]
    );
    res.json(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// F3 helper: search for genres by partial name (basically autocomplete feature)
app.get('/genres/search', async (req, res) => {
  const q = req.query.q || '';

  if (q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const conn = await mysql.createConnection(dbConfig);

    const sql = `
      SELECT
        t.gname,
        COUNT(*) AS song_count
      FROM (
        SELECT DISTINCT
          g.gname,
          s.song_id,
          ar.artist_id
        FROM Genres       AS g
        JOIN AlbumArtists AS aa ON aa.artist_id = g.artist_id
        JOIN Albums       AS al ON al.album_id  = aa.album_id
        JOIN Songs        AS s  ON s.album_id   = al.album_id
        JOIN SongArtists  AS sa ON sa.song_id   = s.song_id
        JOIN Artists      AS ar ON ar.artist_id = sa.artist_id
        WHERE TRIM(LOWER(g.gname)) LIKE CONCAT('%', TRIM(LOWER(?)), '%')
      ) AS t
      GROUP BY t.gname
      ORDER BY song_count DESC
      LIMIT 5;
    `;

    const [rows] = await conn.execute(sql, [q]);
    await conn.end();

    // rows: [{ gname: "hip hop", song_count: 228 }, ...]
    res.json(rows);
  } catch (err) {
    console.error('Error searching genres:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// F3: Search for songs based on the genre of the album
app.get('/songs/by-genre', async (req, res) => {
  const genre = req.query.genre;
  let limit = parseInt(req.query.limit ?? '10', 10);
  let page  = parseInt(req.query.page  ?? '0', 10);

  if (!genre) {
    return res.status(400).json({ error: 'Missing genre parameter' });
  }

  if (isNaN(limit) || limit <= 0) limit = 10;
  if (isNaN(page)  || page  < 0)  page  = 0;
  if (limit > 200) limit = 200;

  const offset = page * limit;

  try {
    const conn = await mysql.createConnection(dbConfig);

    const sql = `
      SELECT DISTINCT
        s.song_name    AS song_title,
        ar.artist_name AS artist
      FROM Genres       AS g
      JOIN AlbumArtists AS aa ON aa.artist_id = g.artist_id
      JOIN Albums       AS al ON al.album_id  = aa.album_id
      JOIN Songs        AS s  ON s.album_id   = al.album_id
      JOIN SongArtists  AS sa ON sa.song_id   = s.song_id
      JOIN Artists      AS ar ON ar.artist_id = sa.artist_id
      WHERE TRIM(LOWER(g.gname)) = TRIM(LOWER(?))
      ORDER BY s.song_name ASC, ar.artist_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await conn.execute(sql, [genre]);
    await conn.end();

    res.json({
      page,
      limit,
      count: rows.length,
      songs: rows,
    });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// F4: Get two random artists with followers
app.get('/artists/random', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT artist_name, artist_id, followers FROM Artists ORDER BY rand() LIMIT 2'
    );
    res.json(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Creating new playlist
app.post('/users/:user_id/playlists/:playlist_name', async (req, res) => {
  const { user_id, playlist_name } = req.params;

  try {
    const conn = await mysql.createConnection(dbConfig);

    const [rows] = await conn.execute('SELECT MAX(playlist_id) AS maxId FROM Playlists');
    const nextId = (rows[0].maxId || 0) + 1;

    await conn.execute(
      'INSERT INTO Playlists (playlist_id, playlist_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [nextId, playlist_name]
    );

    await conn.execute(
      'INSERT IGNORE INTO Owner (playlist_id, user_id) VALUES (?, ?)',
      [nextId, Number(user_id)]
    );

    await conn.end();

    res.json({ success: true, playlist_id: nextId, playlist_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add song to playlist
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

// Add a liked song for a user
app.post('/users/:user_id/likes/:song_id', async (req, res) => {
  const user_id = Number(req.params.user_id);
  const song_id = req.params.song_id;

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'INSERT IGNORE INTO Likes (user_id, song_id) VALUES (?, ?)',
      [user_id, song_id]
    );
    await conn.end();
    res.json({ success: true, user_id, added: 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// F5: Get list of songs who have the most likes
app.get('/popular/songs', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      `SELECT s.song_name, COUNT(l.user_id) AS like_count 
      FROM Songs s JOIN Likes l ON s.song_id = l.song_id
      GROUP BY s.song_id, s.song_name
      ORDER BY like_count DESC
      LIMIT 10;`
    );
    res.json(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'F5 Server error' });
  }
});


// F2: Get artist's albums
app.get('/artist/:artist/albums', async (req, res) => {
  const artistId = req.params.artist;

  try {
    const conn = await mysql.createConnection(dbConfig);
    // const [artistRow] = await conn.execute(
    //   'SELECT artist_id FROM Artists WHERE artist_name = ?',
    //   [artistName]
    // );
    // await conn.end();

    // if (artistRow.length === 0) {
    //   return res.status(404).json({ error: 'Artist not found' });
    // }

    const albums = await getAlbumsByArtist(artistId);
    res.json(albums);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// F2: Get songs from an album
app.get('/album/:album_id/songs', async (req, res) => {
  const album_id = req.params.album_id;

  try {
    const songs = await getTracksByAlbum(album_id);
    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Log-in 
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, error: "Missing email or password" });

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT user_id, username, email, password FROM Users WHERE email = ? LIMIT 1',
      [email]
    );

    await conn.end();

    if (rows.length === 0)
      return res.status(401).json({ success: false, error: "User not found" });

    const user = rows[0];

    // NOTE: Using plain text passwords ONLY for demo purposes
    if (user.password !== password)
      return res.status(401).json({ success: false, error: "Invalid password" });

    // Don’t send password back to frontend
    delete user.password;

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ success: false, error: "Missing username, email, or password" });

  try {
    const conn = await mysql.createConnection(dbConfig);

    // Check if username or email already exists
    const [existing] = await conn.execute(
      'SELECT user_id FROM Users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ success: false, error: "Username or email already exists" });
    }

    // Get the next available user_id (simple auto increment simulation)
    const [rows] = await conn.execute('SELECT MAX(user_id) AS maxId FROM Users');
    const nextId = (rows[0].maxId || 0) + 1;

    // Insert user
    await conn.execute(
      'INSERT INTO Users (user_id, username, email, password) VALUES (?, ?, ?, ?)',
      [nextId, username, email, password]
    );

    await conn.end();

    res.json({
      success: true,
      message: "User registered successfully",
      user: { user_id: nextId, username, email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


app.listen(port)