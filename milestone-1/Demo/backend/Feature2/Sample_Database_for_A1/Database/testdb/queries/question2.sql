WITH CraftCount AS (
    SELECT c.eid, COUNT(DISTINCT c.aid) AS AirNumber
    FROM Certified c
    GROUP BY c.eid
)
SELECT avg(e.salary) AS avgSal
    FROM CraftCount cc, Employee e
    WHERE cc.AirNumber = (SELECT MAX(AirNumber) FROM CraftCount)
    AND cc.eid = e.eid;
