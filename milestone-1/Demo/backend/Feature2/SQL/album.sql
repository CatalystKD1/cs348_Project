/* Get the albums from an artist, after the user has selected the artist */
SELECT DISTINCT
    alb.album_id,
    alb.album_name AS album_name,
    ar.artist_id,
    ar.artist_name AS artist_name
FROM AlbumArtists aa
JOIN Albums alb ON aa.album_id = alb.album_id
JOIN artists ar ON aa.artist_id = ar.artist_id
JOIN songs s ON alb.album_id = s.album_id
WHERE ar.artist_id = ?;  /* user input */

