/* Display the tracks in the album the user picked */

SELECT track_number, song_name, song_id, explicit
FROM Songs
WHERE album_id = ? /* User input */
ORDER BY track_number ASC;
