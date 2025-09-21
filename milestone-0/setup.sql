CREATE DATABASE IF NOT EXISTS music_db;
USE music_db;

CREATE TABLE IF NOT EXISTS tracks (
    Track VARCHAR(255),
    Album_Name VARCHAR(255),
    Artist VARCHAR(255),
    Release_Date DATE,
    ISRC VARCHAR(20),
    All_Time_Rank VARCHAR(20),
    Track_Score VARCHAR(20),
    Spotify_Streams VARCHAR(50),
    Spotify_Playlist_Count VARCHAR(50),
    Spotify_Playlist_Reach VARCHAR(50),
    Spotify_Popularity VARCHAR(20),
    YouTube_Views VARCHAR(50),
    YouTube_Likes VARCHAR(50),
    TikTok_Posts VARCHAR(50),
    TikTok_Likes VARCHAR(50),
    TikTok_Views VARCHAR(50),
    YouTube_Playlist_Reach VARCHAR(50),
    Apple_Music_Playlist_Count VARCHAR(50),
    AirPlay_Spins VARCHAR(50),
    SiriusXM_Spins VARCHAR(50),
    Deezer_Playlist_Count VARCHAR(50),
    Deezer_Playlist_Reach VARCHAR(50),
    Amazon_Playlist_Count VARCHAR(50),
    Pandora_Streams VARCHAR(50),
    Pandora_Track_Stations VARCHAR(50),
    Soundcloud_Streams VARCHAR(50),
    Shazam_Counts VARCHAR(50),
    TIDAL_Popularity VARCHAR(20),
    Explicit_Track VARCHAR(5)
);
