select Employee.eid, salary from Certified, Employee
where Certified.eId = Employee.eId 
and Employee.salary > 0.5 * (select avg(salary) from Employee) 
and Certified.cyear < 2015
and Employee.salary < (select avg(salary) from Employee, Certified WHERE cyear >= 2020 and Certified.eId = Employee.eId);