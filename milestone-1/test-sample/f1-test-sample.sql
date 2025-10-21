/* Gets the likes for a userid */

SELECT
  s.song_id,
  s.song_name,
  s.explicit,
  s.duration_ms
FROM Likes AS l
JOIN Songs AS s ON s.song_id = l.song_id
WHERE l.user_id = 
ORDER BY s.song_name ASC;
