/* Display the tracks in the album the user picked */

SELECT track_number, song_name, explicit
FROM Songs
WHERE album_id = ? /* User input */
ORDER BY track_number ASC;
