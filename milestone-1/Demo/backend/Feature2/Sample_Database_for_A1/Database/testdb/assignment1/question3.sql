with PRank AS 
    (select A.aid, P.eid, A.cruisingrange, P.ranking 
        from Pilot P, Certified C, Aircraft A
        where P.eid = C.eid and C.aid = A.aid
        and P.ranking > 6)

select distinct P1.aid 
    from Prank P1, Prank P2
    where P1.eid != P2.eid 
    AND P1.aid = P2.aid
    order by P1.cruisingrange DESC;