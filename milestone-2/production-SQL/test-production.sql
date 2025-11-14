SELECT 
    u.user_id,
    u.username,
    u.email,
    
    p.playlist_id,
    p.playlist_name,
    p.created_at,
    p.updated_at,

    -- number of songs in this playlist
    COUNT(DISTINCT ps.song_id) AS playlist_song_count,

    -- number of songs this user likes
    (
        SELECT COUNT(DISTINCT l.song_id)
        FROM Likes l
        WHERE l.user_id = u.user_id
    ) AS total_songs_liked

FROM Users u
LEFT JOIN Owner o 
    ON u.user_id = o.user_id
LEFT JOIN Playlists p 
    ON o.playlist_id = p.playlist_id
LEFT JOIN PlaylistSongs ps
    ON p.playlist_id = ps.playlist_id

GROUP BY 
    u.user_id, u.username, u.email,
    p.playlist_id, p.playlist_name, p.created_at, p.updated_at

ORDER BY u.username ASC, p.created_at DESC;
