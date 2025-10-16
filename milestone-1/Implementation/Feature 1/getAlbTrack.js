// getAlbumTrack.mjs (or use "type": "module" in package.json)
import fs from "fs";
import mysql from "mysql2/promise";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

function loadQuery(filePath) {
  return fs.readFileSync(filePath, { encoding: "utf-8" });
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // Load SQL queries
    const artistQuery = loadQuery("./sql/artist.sql");
    const albumQuery = loadQuery("./sql/album.sql");
    const tracksQuery = loadQuery("./sql/track.sql");

    // Step 1: Fetch all artists
    const [artists] = await conn.execute(artistQuery);

    if (artists.length === 0) {
      console.log("No artists found in database.");
      return;
    }

    // Step 2: Ask for artist
    let selectedArtist;
    while (!selectedArtist) {
      const artistInput = await rl.question("\nEnter an Artist name: ");
      selectedArtist = artists.find(
        (a) => a.name.toLowerCase() === artistInput.trim().toLowerCase()
      );
      if (!selectedArtist) {
        console.log("Artist not found, try again.");
      }
    }

    // Step 3: Get albums for selected artist
    const [albums] = await conn.execute(albumQuery, [selectedArtist.artist_id]);

    if (albums.length === 0) {
      console.log("This artist has no albums in the database.");
      return await main();
    }

    console.log(`Albums for ${selectedArtist.name}:`);
    albums.forEach((a) => console.log(`- ${a.album_name}`));

    // Step 4: Ask user for album
    let selectedAlbum;
    while (!selectedAlbum) {
      const albumInput = await rl.question("\nEnter an album name: ");
      selectedAlbum = albums.find(
        (a) => a.album_name.toLowerCase() === albumInput.trim().toLowerCase()
      );

      if (!selectedAlbum) {
        console.log("Album not found, try again.");
      }
    }

    // Step 5: Show tracks
    const [tracks] = await conn.execute(tracksQuery, [selectedAlbum.album_id]);

    if (tracks.length === 0) {
      console.log("No tracks found for this album.");
    } else {
      console.log(`\nTracks in "${selectedAlbum.album_name}":`);
      tracks.forEach((t) => {
        console.log(
          `#${t.track_number} - ${t.name} ${
            t.explicit ? "[Explicit]" : ""
          }`
        );
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await conn.end();
    rl.close();
  }
}

main();
