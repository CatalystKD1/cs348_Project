SELECT s.song_name, COUNT(l.user_id) AS like_count
FROM Songs s
JOIN Likes l ON s.song_id = l.song_id
GROUP BY s.song_id, s.song_name
ORDER BY like_count DESC
LIMIT 10;
