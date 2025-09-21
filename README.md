# cs348_Project

## Set Up
1. Download MySQL and MySQL workbench onto your device.
2. Create a new Database/Scheme using the command Line for MySQL, or MySQL Workbench and call it "musicdb"
3. Download the .csv file from this Repository
4. On MySQL Workbench, left click the "musicdb" schema and then click "Table Data Import Wizard"
<img width="407" height="495" alt="image" src="https://github.com/user-attachments/assets/1b1d321c-d0b9-49b5-8297-d992eab72bcc" />
5. Copy the file path of the .csv file into the search bar
6. Create a new table with the name "most_streamed_songs_2024" under the musicdb schema
<img width="948" height="230" alt="image" src="https://github.com/user-attachments/assets/d643705a-159b-4c3d-b0ce-121b4968c587" />
7. Make sure that the field separator is correct, and that every column has a data type.
<img width="1891" height="749" alt="image" src="https://github.com/user-attachments/assets/5d35b38d-1c53-478c-8cb6-db0e484f80eb" />

Andrews Set Up (Windows):

In Powershell:

mysql -u root -p
*type password*
CREATE DATABASE musicdb;
USE musicdb;
CREATE TABLE most_streamed_songs_2024 (
    Track VARCHAR(255),
    Album_Name VARCHAR(255),
    Artist VARCHAR(255),
    Release_Date DATE,
    ISRC VARCHAR(50),
    All_Time_Rank INT,
    Track_Score DECIMAL(10,2),
    Spotify_Streams BIGINT,
    Spotify_Playlist_Count INT,
    Spotify_Playlist_Reach BIGINT,
    Spotify_Popularity INT,
    YouTube_Views BIGINT,
    YouTube_Likes BIGINT,
    TikTok_Posts BIGINT,
    TikTok_Likes BIGINT,
    TikTok_Views BIGINT,
    YouTube_Playlist_Reach BIGINT,
    Apple_Music_Playlist_Count INT,
    AirPlay_Spins INT,
    SiriusXM_Spins INT,
    Deezer_Playlist_Count INT,
    Deezer_Playlist_Reach BIGINT,
    Amazon_Playlist_Count INT,
    Pandora_Streams BIGINT,
    Pandora_Track_Stations INT,
    Soundcloud_Streams BIGINT,
    Shazam_Counts INT,
    TIDAL_Popularity INT,
    Explicit_Track VARCHAR(10)
);
exit
mysql -u root -p --local-infile=1
*type password*
SHOW GLOBAL VARIABLES LIKE 'local_infile';
SET GLOBAL local_infile = 1;
USE musicdb;
LOAD DATA LOCAL INFILE 'C:/Users/Owner/playground/cs348_Project/milestone-0/Most Streamed Spotify Songs 2024.csv'
INTO TABLE most_streamed_songs_2024
CHARACTER SET latin1
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
SELECT * FROM most_streamed_songs_2024 LIMIT 10;

Replace 'C:/Users/Owner/playground/cs348_Project/milestone-0/Most Streamed Spotify Songs 2024.csv' with where you git cloned the repo :) tried to retrace my steps best I could