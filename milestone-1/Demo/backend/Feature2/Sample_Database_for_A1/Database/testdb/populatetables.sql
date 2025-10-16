INSERT INTO Aircraft SELECT * FROM read_csv('./aircrafts.csv');
SELECT * FROM Aircraft;

INSERT INTO Employee SELECT * FROM read_csv('./employees.csv');
SELECT * FROM Employee;

INSERT INTO Pilot SELECT * FROM read_csv('./pilots.csv');
SELECT * FROM Pilot;

INSERT INTO Certified SELECT * FROM read_csv('./certified.csv');
SELECT * FROM Certified;
