/* Counts the total number of songs per artist and sorts them from most to least */

SELECT ar.artist_name AS artist_name, COUNT(s.song_id) AS total_songs
FROM Artists ar
JOIN AlbumArtists aa ON ar.artist_id = aa.artist_id
JOIN Albums alb ON aa.album_id = alb.album_id
JOIN Songs s ON alb.album_id = s.album_id
GROUP BY ar.artist_id
ORDER BY total_songs DESC