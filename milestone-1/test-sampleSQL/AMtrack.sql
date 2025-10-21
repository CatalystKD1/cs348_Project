/* Display the tracks in the album the user picked */

SELECT track_number, song_name, explicit
FROM Songs
WHERE album_id = '78bpIziExqiI9qztvNFlQu'
ORDER BY track_number ASC;
