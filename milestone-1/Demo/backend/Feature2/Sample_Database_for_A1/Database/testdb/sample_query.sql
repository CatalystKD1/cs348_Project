-- This sample query produces the name of employees and the aircraft ids they are certified to fly.
SELECT e.ename, c.aid FROM Employee e, Certified c WHERE e.eid=c.eid;