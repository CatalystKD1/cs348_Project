DROP TRIGGER IF EXISTS AutoLike;
CREATE TRIGGER AutoLike
AFTER INSERT ON playlistsongs
FOR EACH ROW
INSERT INTO likes (user_id, song_id)
SELECT o.user_id, NEW.song_id
FROM owner o 
WHERE o.playlist_id = NEW.playlist_id
    AND NOT EXISTS (
        SELECT *
        FROM likes l
        WHERE l.user_id = o.user_id
            AND l.song_id = NEW.song_id
    );