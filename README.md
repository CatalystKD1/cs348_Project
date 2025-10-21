# cs348_Project

# We have updated out table for the database, please read the new Set Up section

# .env format:
DB_HOST=localhost  
DB_USER=root  
DB_PASS=<your_password_here>  
DB_NAME=music_db  
 
# cs348_Project

## Set Up
1. Download MySQL
2. Create an account for MySQL with a password
3. Create the music_db databse (or name it anything you want, make sure it matches in your .env file)
4. Match the .env file format at the top of the README file
5. Download Python3
6. Download these Python Libraries:
```
pip install mysql-connector-python
pip install python-dotenv
pip install pandas
```
6. Open up milestone-1 and run the new setup.py program. WARNING: If you are NOT using a Windows device, you might need to change the .csv file path to match the syntax for your device.
7. Load the tables on MySQL to check if all of the tables are there.
8. Run the sample_users.py program to load test user data into the playlist, user, and other tables for sample querying.
