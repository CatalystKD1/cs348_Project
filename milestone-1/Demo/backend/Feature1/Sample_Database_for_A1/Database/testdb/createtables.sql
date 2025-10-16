CREATE  TABLE Aircraft
  ( 
     aId     INT NOT NULL PRIMARY KEY, 
     producer    VARCHAR(30), 
     cruisingrange      DECIMAL(5, 1) 
  ); 

CREATE TABLE Employee 
  ( 
     eId    INT NOT NULL PRIMARY KEY, 
     ename  VARCHAR(30), 
     salary DECIMAL(6, 1) 
  ); 

CREATE TABLE Pilot 
  ( 
     eId     INT NOT NULL PRIMARY KEY, 
     ranking INT,
     FOREIGN KEY(eId) REFERENCES Employee(eId)
  ); 

CREATE TABLE Certified 
  ( 
     eId INT NOT NULL, 
     aId INT NOT NULL, 
     cyear INT,
     PRIMARY KEY(eId, aId), 
     FOREIGN KEY(eId) REFERENCES Pilot(eId), 
     FOREIGN KEY(aId) REFERENCES Aircraft(aId) 
  ); 
