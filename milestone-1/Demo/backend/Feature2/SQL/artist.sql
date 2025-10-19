/* Query to get all of the artists*/

/* Get the name and artist_id */
SELECT DISTINCT
    ar.artist_id as artist_id,
    ar.name AS name
FROM artists ar
JOIN albumartists aa ON ar.artist_id = aa.artist_id
JOIN albums al ON aa.album_id = al.album_id
JOIN songs s ON al.album_id = s.album_id
LEFT JOIN genres g ON ar.artist_id = g.artist_id;
