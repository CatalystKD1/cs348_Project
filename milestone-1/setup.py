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

# CSV file paths (adjust these)
CSV1 = os.getenv("CSV_GLOBAL", "Cleaned_Spotify_2024_Global_Streaming_Data.csv")
CSV2 = os.getenv("CSV_MOST", "Most Streamed Spotify Songs 2024.csv")

def connect_db():
    return mysql.connector.connect(**DB_CONFIG)

def create_tables(cursor):
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Artists (
        artist_id INT AUTO_INCREMENT PRIMARY KEY,
        artist_name VARCHAR(255) UNIQUE
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Albums (
        album_id INT AUTO_INCREMENT PRIMARY KEY,
        album_name VARCHAR(255),
        -- since we may not have album data, we don’t enforce NOT NULL
        artist_id INT,
        FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Songs (
        song_id INT AUTO_INCREMENT PRIMARY KEY,
        spotify_track_id VARCHAR(255),
        song_name VARCHAR(255),
        streams BIGINT,
        artist_id INT,
        album_id INT,
        -- other numeric / audio feature columns if present
        FOREIGN KEY (artist_id) REFERENCES Artists(artist_id),
        FOREIGN KEY (album_id) REFERENCES Albums(album_id)
    );
    """)

def load_csvs():
    df1 = pd.read_csv(CSV1)
    df2 = pd.read_csv(CSV2)
    # Normalize column names: lower, replace spaces etc.
    def norm_cols(df):
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        return df
    df1 = norm_cols(df1)
    df2 = norm_cols(df2)
    # Combine (use concat then drop duplicates)
    df = pd.concat([df1, df2], ignore_index=True, sort=False)
    df = df.drop_duplicates(subset=["spotify_id", "track_name", "artist(s)_name"], keep="first")
    return df

def ingest():
    df = load_csvs()
    conn = connect_db()
    cursor = conn.cursor()
    create_tables(cursor)
    conn.commit()

    # Insert artists
    print("Inserting artists...")
    artist_map = {}
    unique_artists = df["artist(s)_name"].dropna().unique()
    for artist in unique_artists:
        cursor.execute("INSERT IGNORE INTO Artists (artist_name) VALUES (%s)", (artist,))
    conn.commit()
    # Query back artist_ids:
    cursor.execute("SELECT artist_id, artist_name FROM Artists")
    for aid, aname in cursor.fetchall():
        artist_map[aname] = aid

    # Insert albums (if album name column exists)
    print("Inserting albums (if available)...")
    album_map = {}  # (artist_name, album_name) → album_id
    # check if df has an album_name or similar column
    album_col = None
    for possible in ["album", "album_name", "album_title"]:
        if possible in df.columns:
            album_col = possible
            break
    if album_col:
        albums = df[[ "artist(s)_name", album_col ]].dropna().drop_duplicates()
        for _, row in albums.iterrows():
            artist = row["artist(s)_name"]
            alb = row[album_col]
            # Insert album
            cursor.execute(
                "INSERT INTO Albums (album_name, artist_id) VALUES (%s, %s)",
                (alb, artist_map.get(artist))
            )
            album_map[(artist, alb)] = cursor.lastrowid
        conn.commit()

    # Insert songs
    print("Inserting songs...")
    for _, row in df.iterrows():
        artist = row["artist(s)_name"]
        song = row.get("track_name")
        spotify_id = row.get("spotify_id")
        streams = row.get("streams") or 0

        # Determine artist_id
        aid = artist_map.get(artist)

        # Determine album_id (if album column exists and matched)
        alb_id = None
        if album_col and pd.notna(row.get(album_col)):
            alb = row.get(album_col)
            alb_id = album_map.get((artist, alb))

        cursor.execute("""
        INSERT INTO Songs (spotify_track_id, song_name, streams, artist_id, album_id)
        VALUES (%s, %s, %s, %s, %s)
        """, (spotify_id, song, streams, aid, alb_id))

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Done ingesting songs, albums, artists.")

if __name__ == "__main__":
    ingest()
