CREATE VIEW valid_artist_albums AS
SELECT DISTINCT
    ar.artist_id,
    ar.name AS ArtistName,
    al.album_id,
    al.name AS AlbumName,
    g.gname AS GenreName
FROM artists ar
JOIN albumartists aa ON ar.artist_id = aa.artist_id
JOIN albums al ON aa.album_id = al.album_id
JOIN songs s ON al.album_id = s.album_id
LEFT JOIN genres g ON ar.artist_id = g.artist_id;
