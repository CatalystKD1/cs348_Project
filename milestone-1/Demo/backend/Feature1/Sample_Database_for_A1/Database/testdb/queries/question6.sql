WITH PilotCert AS (
    SELECT p.eid, e.ename, e.salary, p.ranking, COUNT(DISTINCT c.aid) AS certCount
    FROM Pilot p
    JOIN Employee e ON p.eid = e.eid
    LEFT JOIN Certified c ON p.eid = c.eid
    GROUP BY p.eid, e.ename, e.salary, p.ranking
)
SELECT p1.eid, p1.ename, MAX(p2.salary - p1.salary) AS maxDiff
FROM PilotCert p1
JOIN PilotCert p2 ON p1.eid != p2.eid
WHERE p1.salary < p2.salary
    AND p1.ranking > p2.ranking
    AND p1.certCount > p2.certCount
    AND p2.certCOUNT >= 1
GROUP BY p1.eid, p1.ename