import os
import pandas as pd
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}


CSV_ARTISTS = "..\\csv-setup\\spotify_artists.csv"
CSV_ALBUMS = "..\\csv-setup\\spotify_albums.csv"
CSV_TRACKS = "..\\csv-setup\\spotify_tracks.csv"


def connect_db():
    return mysql.connector.connect(**DB_CONFIG)

def create_tables(cursor):
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("DROP TABLE IF EXISTS Likes")
    cursor.execute("DROP TABLE IF EXISTS Owner")
    cursor.execute("DROP TABLE IF EXISTS PlaylistSongs")
    cursor.execute("DROP TABLE IF EXISTS Playlists")
    cursor.execute("DROP TABLE IF EXISTS SongArtists")
    cursor.execute("DROP TABLE IF EXISTS Songs")
    cursor.execute("DROP TABLE IF EXISTS AlbumArtists")
    cursor.execute("DROP TABLE IF EXISTS Albums")
    cursor.execute("DROP TABLE IF EXISTS Genres")
    cursor.execute("DROP TABLE IF EXISTS Artists")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Artists (
        artist_id VARCHAR(22) PRIMARY KEY,
        artist_name VARCHAR(255) UNIQUE,
        artist_pop INT, 
        followers BIGINT,
        url VARCHAR(255)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Genres (
        artist_id VARCHAR(22),
        gname VARCHAR(50),
        PRIMARY KEY (artist_id, gname), 
        FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
    );

    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Albums (
        album_id VARCHAR(22),
        album_name VARCHAR(255),
        label VARCHAR(255),
        release_date DATETIME, 
        num_tracks INT, 
        album_pop INT, 
        url VARCHAR(255),            
        PRIMARY KEY (album_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS AlbumArtists (
        album_id VARCHAR(22),
        artist_id VARCHAR(22),
        PRIMARY KEY (album_id, artist_id),
        FOREIGN KEY (album_id) REFERENCES Albums(album_id),
        FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Songs (
        song_id VARCHAR(22) UNIQUE,
        album_id VARCHAR(22),
        name VARCHAR(255),
        duration_ms INT, 
        explicit BOOLEAN, 
        track_number INT,
    
        PRIMARY KEY (song_id, album_id),
        FOREIGN KEY (album_id) REFERENCES Albums(album_id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS SongArtists (
        song_id VARCHAR(22),
        artist_id VARCHAR(22),
        PRIMARY KEY (song_id, artist_id),
        FOREIGN KEY (song_id) REFERENCES Songs(song_id),
        FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id INT PRIMARY KEY, 
        username varChar(50) UNIQUE, 
        email varChar(50),
        password varChar(50)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Playlists (
        playlist_id INT PRIMARY KEY, 
        playlist_name varChar(50), 
        created_at DATETIME,
        updated_at DATETIME
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS PlaylistSongs (
        playlist_id INT NOT NULL, 
        song_id VARCHAR(22) NOT NULL,
        PRIMARY KEY (playlist_id, song_id),
        FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id),
        FOREIGN KEY (song_id) REFERENCES Songs(song_id)  
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Owner (
        playlist_id INT NOT NULL, 
        user_id INT NOT NULL,
        PRIMARY KEY (playlist_id, user_id),
        FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id),
        FOREIGN KEY (user_id) REFERENCES Users(user_id) 
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Likes (
        user_id INT NOT NULL, 
        song_id VARCHAR(22) NOT NULL,
        PRIMARY KEY (user_id, song_id),
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (song_id) REFERENCES Songs(song_id)
    );
    """)


def ingest():
    df_artists = pd.read_csv(CSV_ARTISTS)
    df_albums = pd.read_csv(CSV_ALBUMS)
    df_tracks = pd.read_csv(CSV_TRACKS)
    conn = connect_db()
    cursor = conn.cursor()
    create_tables(cursor)
    conn.commit()

    # Insert artists
    print("Inserting artists...")
    for _, row in df_artists.iterrows():
        cursor.execute("""
            INSERT IGNORE INTO Artists (artist_id, name, pop, followers, url)
            VALUES (%s, %s, %s, %s, %s)
        """, (row["id"], row["name"], row.get("popularity"), row.get("followers"), row.get("url")))
        if pd.notna(row.get("genres")): 
            for genres in str(row["genres"]).split(","): 
                cursor.execute("""
                    INSERT IGNORE INTO Genres (artist_id, gname) VALUES (%s, %s)
                """, (row["id"], genres.strip()))
    conn.commit()

    # Insert albums
    print("Inserting albums...")
    for _, row in df_albums.iterrows():
        cursor.execute("""
            INSERT IGNORE INTO Albums (album_id, name, release_date, num_tracks, label, pop, url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            row["id"], row["name"], row.get("release_date"),
            row.get("tracks"), row.get("label"), row.get("popularity"),
            row.get("url")
        ))
        # Handle album-artist relationships
        if pd.notna(row.get("artists")):
            for aid in str(row["artists"]).split(","):
                cursor.execute("""
                    INSERT IGNORE INTO AlbumArtists (album_id, artist_id) VALUES (%s, %s)
                """, (row["id"], aid.strip()))
    conn.commit()

    # Insert songs
    print("Inserting songs...")
    for _, row in df_tracks.iterrows():
        cursor.execute("""
            INSERT IGNORE INTO Songs (song_id, album_id, name, duration_ms, explicit, track_number)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            row["track_id"], row["album_id"], row["name"], row.get("duration_ms"),
            bool(row.get("explicit", 0)), row.get("track_number")
        ))
        # Handle song-artist relationships
        if pd.notna(row.get("artist_ids")):
            for aid in str(row["artist_ids"]).split(","):
                cursor.execute("""
                    INSERT IGNORE INTO SongArtists (song_id, artist_id) VALUES (%s, %s)
                """, (row["track_id"], aid.strip()))
    conn.commit()

    cursor.close()
    conn.close()
    print("✅ Done ingesting artists, albums, and songs with relationships.")

if __name__ == "__main__":
    ingest()
