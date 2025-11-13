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