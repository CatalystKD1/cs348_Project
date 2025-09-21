import csv
import mysql.connector
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Database credentials from .env
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Connect to MySQL
conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

cursor = conn.cursor()

csv_columns = [
    'Track', 'Album Name', 'Artist', 'Release Date', 'ISRC', 'All Time Rank',
    'Track Score', 'Spotify Streams', 'Spotify Playlist Count', 'Spotify Playlist Reach',
    'Spotify Popularity', 'YouTube Views', 'YouTube Likes', 'TikTok Posts',
    'TikTok Likes', 'TikTok Views', 'YouTube Playlist Reach', 'Apple Music Playlist Count',
    'AirPlay Spins', 'SiriusXM Spins', 'Deezer Playlist Count', 'Deezer Playlist Reach',
    'Amazon Playlist Count', 'Pandora Streams', 'Pandora Track Stations',
    'Soundcloud Streams', 'Shazam Counts', 'TIDAL Popularity', 'Explicit Track'
]

column_mapping = {
    'Track': 'Track',
    'Album Name': 'Album_Name',
    'Artist': 'Artist',
    'Release Date': 'Release_Date',
    'ISRC': 'ISRC',
    'All Time Rank': 'All_Time_Rank',
    'Track Score': 'Track_Score',
    'Spotify Streams': 'Spotify_Streams',
    'Spotify Playlist Count': 'Spotify_Playlist_Count',
    'Spotify Playlist Reach': 'Spotify_Playlist_Reach',
    'Spotify Popularity': 'Spotify_Popularity',
    'YouTube Views': 'YouTube_Views',
    'YouTube Likes': 'YouTube_Likes',
    'TikTok Posts': 'TikTok_Posts',
    'TikTok Likes': 'TikTok_Likes',
    'TikTok Views': 'TikTok_Views',
    'YouTube Playlist Reach': 'YouTube_Playlist_Reach',
    'Apple Music Playlist Count': 'Apple_Music_Playlist_Count',
    'AirPlay Spins': 'AirPlay_Spins',
    'SiriusXM Spins': 'SiriusXM_Spins',
    'Deezer Playlist Count': 'Deezer_Playlist_Count',
    'Deezer Playlist Reach': 'Deezer_Playlist_Reach',
    'Amazon Playlist Count': 'Amazon_Playlist_Count',
    'Pandora Streams': 'Pandora_Streams',
    'Pandora Track Stations': 'Pandora_Track_Stations',
    'Soundcloud Streams': 'Soundcloud_Streams',
    'Shazam Counts': 'Shazam_Counts',
    'TIDAL Popularity': 'TIDAL_Popularity',
    'Explicit Track': 'Explicit_Track'
}

table_columns = [column_mapping[c] for c in csv_columns]

with open("C:/Users/fmccr/Documents/CS Project/cs348_Project/milestone-0/Most Streamed Spotify Songs 2024.csv",
          'r', encoding='latin-1') as f:
    # read CSV here

    reader = csv.DictReader(f)
    for row in reader:
        values = []
        for col in csv_columns:
            val = row.get(col, '').strip()
            if val == '':
                values.append(None)
            else:
                if col in [
                    'All Time Rank', 'Track Score', 'Spotify Streams', 'Spotify Playlist Count',
                    'Spotify Playlist Reach', 'Spotify Popularity', 'YouTube Views', 'YouTube Likes',
                    'TikTok Posts', 'TikTok Likes', 'TikTok Views', 'YouTube Playlist Reach',
                    'Apple Music Playlist Count', 'AirPlay Spins', 'SiriusXM Spins',
                    'Deezer Playlist Count', 'Deezer Playlist Reach', 'Amazon Playlist Count',
                    'Pandora Streams', 'Pandora Track Stations', 'Soundcloud Streams', 'Shazam Counts',
                    'TIDAL Popularity', 'Explicit Track'
                ]:
                    val = val.replace(',', '')
                values.append(val)

        release_date_index = csv_columns.index('Release Date')
        raw_date = values[release_date_index]
        if raw_date:
            try:
                dt = datetime.strptime(raw_date, '%m/%d/%Y')
                values[release_date_index] = dt.strftime('%Y-%m-%d')
            except ValueError:
                values[release_date_index] = None  # invalid date → NULL

        cursor.execute(f"""
            INSERT INTO tracks ({', '.join(['`'+c+'`' for c in table_columns])})
            VALUES ({', '.join(['%s']*len(table_columns))})
        """, values)

conn.commit()
cursor.close()
conn.close()

print("Data imported successfully.")
