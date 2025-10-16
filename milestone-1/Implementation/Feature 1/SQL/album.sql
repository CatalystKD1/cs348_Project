/* Get the albums from an artist, after the user has selected the artist */
SELECT alb.album_id, alb.name AS album_name
FROM AlbumArtists aa
JOIN Albums alb ON aa.album_id = alb.album_id
WHERE aa.artist_id = ? /* ? gets user input */;
