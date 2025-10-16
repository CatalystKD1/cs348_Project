import fs from "fs";
import mysql from "mysql2/promise";
import readline from "readline/promises";
import {stdin as input, stdout as output} from "process";
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
    const conn = await mysql.createConnection(DB_CONFIG); // connect to the database

    try {
        // load queries from the files
        const artistQuery = loadQuery("./sql/artist.sql");
        const albumQuery = loadQuery("./sql/album.sql");
        const tracksQuery = loadQuery("./sql/tracks.sql");

        // step 1: get all artists

        let selectedArtist;
        while (!selectedArtist) {
            const artistInput = await rl.question("\nEnter an Artist name: ");
            selectedArtist = artists.find(
                (a) => a.name.toLowerCase() === artistInput.trim().toLowerCase()
            );
            if(!selectedArtist) {
                console.log(" Artist not Found, try again.")
            }
        }

        // step 3: get albums from selected artists
        const [albums] = await conn.execute(albumQuery, [selectedArtist.artist_id]);

        if(albums.length === 0) {
            console.log("This artist has no albums in our Database. Please search again.");
            return main();
        }

        console.log(`Albums for ${selectedArtist.name}:`);

        // step 4-5 ask user for album
        let selectedAlbum;
        while(!selectedAlnum) {
            const albumInput = await rl.question("\nEnter an album name: ");
            selectedAlbum = albums.find(
                (a) => a.album_name.toLowerCase() === albumInput.trim().toLowerCase()
            );

            if (!selectedAlbum) {
                console.log("This album is not in our database, try again.");
            }
        }

        //step 6: Show tracks

        const [tracks] = await conn.execute(tracksQuery, [selectedAlbum.album_id]);

        if (tracks.length === 0) {
            console.log("No tracks found for this album.");
        } else {
            console.log(`Tracks in the "${selectedAlbum.album_name}":`);
            tracks.forEach((t) => {
                console.log(
                    `#${t.track_number} - ${t.name} (${t.duration_ms} ms) ${t.explicit ? "[Explicit]" : ""}`
                );
            });
        }
    } catch (err) {
        console.error("Error: ", err.message);
    } finally {
        await conn.end()
        rl.close();
    }
}