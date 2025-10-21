/* Searches for artist name (assume arctic monkeys, then select the album id, then get songs and tracks) */

SELECT track_number, song_name, explicit
FROM Songs
WHERE album_id = '78bpIziExqiI9qztvNFlQu'
ORDER BY track_number ASC;
