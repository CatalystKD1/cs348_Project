# cs348_Project

# .env format:
DB_HOST=localhost  
DB_USER=root  
DB_PASS=<your_password_here>  
DB_NAME=music_db  
 

## Set Up
1. Download MySQL
2. Create an account for MySQL with a password
3. Match the .env file format at the top of the README file
4. Download Python3
5. Download these Python Libraries:
```
pip install mysql-connector-python
pip install python-dotenv
```
6. In the MySQL folder, run the "set_up.sql" file to make the required sql database (if it does not work, just copy and past in the commands)
7. Run the app.py program to download the .csv file into a database table.

## Test code
We have provided a script called to_10.py for you to test out if the data base has worked! This script will run a query that will return the top 10 most popular songs of 2024!
