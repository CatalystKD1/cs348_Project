// ./Feature1/getAlbTrack.js
import fs from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// Helper: Load SQL from a file
function loadQuery(filePath) {
  return fs.readFileSync(filePath, { encoding: "utf-8" });
}

// --- Exported Functions ---

export async function getArtists() {
  const conn = await mysql.createConnection(DB_CONFIG);
  const artistQuery = loadQuery("./sql/artist.sql");
  const [artists] = await conn.execute(artistQuery);
  await conn.end();
  return artists;
}

export async function getAlbumsByArtist(artistId) {
  const conn = await mysql.createConnection(DB_CONFIG);
  const albumQuery = loadQuery("./sql/album.sql");
  const [albums] = await conn.execute(albumQuery, [artistId]);
  await conn.end();
  return albums;
}

export async function getTracksByAlbum(albumId) {
  const conn = await mysql.createConnection(DB_CONFIG);
  const trackQuery = loadQuery("./sql/track.sql");
  const [tracks] = await conn.execute(trackQuery, [albumId]);
  await conn.end();
  return tracks;
}
