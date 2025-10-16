SELECT DISTINCT e.ename
    FROM Employee e, Pilot p, Certified c, Aircraft a
    WHERE e.eid = p.eid
    AND p.eid = c.eid
    AND c.aid = a.aid
    AND a.cruisingrange > 3000
    AND p.eid NOT IN (
        SELECT c2.eid
        FROM Certified c2, Aircraft a2
        WHERE c2.aid = a2.aid
        AND a2.producer = 'Boeing'
    );
