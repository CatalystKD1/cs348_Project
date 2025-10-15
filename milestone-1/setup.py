import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}

def connect_db():
    return mysql.connector.connect(**DB_CONFIG)

def test_query():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT s.song_name, s.streams, a.artist_name, al.album_name
    FROM Songs s
    JOIN Artists a ON s.artist_id = a.artist_id
    LEFT JOIN Albums al ON s.album_id = al.album_id
    ORDER BY s.streams DESC
    LIMIT 10;
    """

    cursor.execute(query)
    results = cursor.fetchall()

    print("Top 10 Most Streamed Songs:")
    for i, row in enumerate(results, start=1):
        print(f"{i}. {row['song_name']} by {row['artist_name']} ({row['album_name']}) - {row['streams']} streams")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    test_query()
