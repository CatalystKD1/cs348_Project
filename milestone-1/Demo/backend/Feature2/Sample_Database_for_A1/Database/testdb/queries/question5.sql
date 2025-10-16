SELECT aid, producer, smax 
FROM (
    SELECT a.aid, a.producer, MAX(e.salary) AS smax
    FROM Aircraft a
    JOIN Certified C ON a.aid = C.aid
    JOIN Pilot p on c.eid = p.eid
    JOIN Employee e on p.eid = e.eid
    GROUP BY a.aid, a.producer
    HAVING COUNT(DISTINCT p.eid) <= 3

    UNION

    SELECT a.aid, a.producer, 0 AS smax
    FROM Aircraft a
    WHERE a.aid NOT IN (Select aid FROM Certified)
) as t
ORDER BY aid;