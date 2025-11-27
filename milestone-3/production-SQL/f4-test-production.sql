/* Gets the follower count and artist name for two random artists */

SELECT artist_name, followers FROM Artists ORDER BY rand() LIMIT 2;