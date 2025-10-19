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
        const [userRows] = await conn.execute('SELECT user_id FROM Users WHERE username = ?', [username]);
        if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user_id = userRows[0].user_id;

        // Get playlists
        const [playlistRows] = await conn.execute(
            ``, [user_id]
        );

        res.json(playlistRows);
        await conn.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})



// F1: Get user's liked songs 
app.get('/user/:username/likes', async (req, res) => {
    res.send('Getting likes..');
})


// F1: Get songs from a playlist
app.get('/playlist/:pID/songs', async (req, res) => {
    const pID = req.params.pID;

    try {
        const conn = await mysql.createConnection(dbConfig);
        const [songRows] = await conn.execute(
            ``, [pID]
        );

        res.json(songRows);
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



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});