// Feature1/getAlbTrack.js
const fs = require("fs");
const mysql = require("mysql2/promise");
require("dotenv").config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

function loadQuery(filePath) {
  return fs.readFileSync(filePath, { encoding: "utf-8" });
}

// Get all artists
async function getArtists() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const artistQuery = loadQuery("./sql/artist.sql");
    const [artists] = await conn.execute(artistQuery);
    return artists;
  } finally {
    await conn.end();
  }
}

// Get albums for a specific artist
async function getAlbumsByArtist(artistId) {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const albumQuery = loadQuery("./sql/album.sql");
    const [albums] = await conn.execute(albumQuery, [artistId]);
    return albums;
  } finally {
    await conn.end();
  }
}

// Get tracks for a specific album
async function getTracksByAlbum(albumId) {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const trackQuery = loadQuery("./sql/track.sql");
    const [tracks] = await conn.execute(trackQuery, [albumId]);
    return tracks;
  } finally {
    await conn.end();
  }
}

module.exports = {
  getArtists,
  getAlbumsByArtist,
  getTracksByAlbum,
};
