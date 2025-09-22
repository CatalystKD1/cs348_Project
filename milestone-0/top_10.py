import csv
import mysql.connector
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Fail fast if environment variables are missing
if not all([DB_HOST, DB_USER, DB_PASS, DB_NAME]):
    raise ValueError("Missing one or more database credentials in .env file")

# Step 1: Connect to MySQL
conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASS,
    database=DB_NAME
)
cursor = conn.cursor()

# Step 2: Return the top 10 most streamed tracks
cursor.execute("""
    WITH ranked_tracks AS (
    SELECT 
        Track, Artist, Album_Name, Spotify_Streams,
        ROW_NUMBER() OVER (PARTITION BY Track, Artist ORDER BY Spotify_Streams DESC) AS rn
    FROM Tracks
    )
    SELECT Track, Artist, Album_Name, Spotify_Streams
        FROM ranked_tracks
        WHERE rn = 1
        ORDER BY Spotify_Streams DESC
        LIMIT 5;
""")
results = cursor.fetchall()

# Step 3: Print nicely
print("\n🎵 Top 5 Most Streamed Tracks:\n")
print(f"{'Track':40} {'Artist':25} {'Streams'}")
print("-" * 80)
for track, artist, streams in results:
    print(f"{track[:38]:40} {artist[:23]:25} {streams}")

cursor.close()
conn.close()
