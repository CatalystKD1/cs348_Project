-- Finds a song for the genre rap

SELECT DISTINCT
    s.song_name        AS song_title,
    ar.artist_name     AS artist
FROM Genres         AS g
JOIN AlbumArtists   AS aa ON aa.artist_id = g.artist_id
JOIN Albums         AS al ON al.album_id  = aa.album_id
JOIN Songs          AS s  ON s.album_id   = al.album_id
JOIN SongArtists    AS sa ON sa.song_id   = s.song_id
JOIN Artists        AS ar ON ar.artist_id = sa.artist_id
WHERE g.gname = 'rap'
ORDER BY s.song_name ASC, ar.artist_name ASC;
