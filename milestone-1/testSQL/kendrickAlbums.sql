/* Displays all of the albums of an artist (Kendrick Lamar) and the number of tracks on each album */

SELECT ar.name AS artist_name, alb.name AS album_name, COUNT(s.song_id) AS total_tracks
FROM Artists ar
JOIN AlbumArtists aa ON ar.artist_id = aa.artist_id
JOIN Albums alb ON aa.album_id = alb.album_id
JOIN Songs s ON alb.album_id = s.album_id
WHERE ar.name = 'Kendrick Lamar'
GROUP BY alb.album_id
HAVING COUNT(s.song_id) > 10
ORDER BY total_tracks DESC;
