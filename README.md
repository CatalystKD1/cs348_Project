# cs348_Project

### ⚠️ IMPORTANT

**You will need to run `setup.py` to load in Production Data.**  
You can find all of the data in the `csv-setup` folder.



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

# Demo Instructions

## Prerequisites
- Node.js installed on your system
- NPM (Node Package Manager)

## .Env file
Create a .Env file in the backend folder with the following:
```
DB_HOST=localhost
DB_USER=user
DB_PASS=password
DB_NAME=music_db
```

## Trigger Setup
This demo uses a MySQL trigger that automatically adds a song to a user’s liked songs whenever the user adds a song to one of their playlists.
To install the trigger, run the following command **once** after setting up your database:

```mysql -u root -p music_db < milestone-2/auto-like-trigger.sql```
## Installation
1. Install required packages by running:
```bash
npm install
```

## Running the Application
1. Start the backend server:
```bash
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

3. Open your web browser and navigate to:
```
http://localhost:3000
```

The application should now be running with the frontend communicating with the backend server.



# Application Features

## Sign-in feature
Create and log-in to your own account.

<img width="572" height="506" alt="image" src="https://github.com/user-attachments/assets/66a9e935-1c9f-4fc8-9a18-60648823cc2e" />

For test data, you can use this account:
```
email: user1@example.com
password: password1
```

## Feature 1: Look at Users Playlists

<img width="882" height="663" alt="image" src="https://github.com/user-attachments/assets/057d8a3b-b5ed-4b00-8a7b-3fd6c8961652" />

Search for users and view their playlists. You can brows the songs users have added to their playlists. (all users are named user{number} in the test db)

## Feature 2: Display Artists Albums

<img width="726" height="847" alt="image" src="https://github.com/user-attachments/assets/eeccecb5-c35e-4849-a8af-85e2572f570d" />

Search for Artists in the Database, then the program will return a list of their albums.
You can choose any album view all hte tracks in that album in order.

## Feature 3: View songs in a Genre

<img width="727" height="768" alt="image" src="https://github.com/user-attachments/assets/4676a977-3a62-41cf-a2f9-6942249046fb" />

Use the search bar to search for songs of a specific Genre.

## Feature 4: "Higher Or Lower?" Game With Artists Followers

<img width="742" height="227" alt="image" src="https://github.com/user-attachments/assets/95513fd9-9a03-4a9b-8a9f-493aef606fbf" />

Play a match of higher or lower, there you are given 2 artists, and need to guess which artist has the higher follower count. Try and get a high score!

## Feature 5: List of Most Popular Songs Based on Number of Likes

<img width="708" height="656" alt="image" src="https://github.com/user-attachments/assets/bff71639-085e-4659-bfb9-f61cc7016858" />

Shows a list on most popular songs based on the number of likes those songs have. The list will update when users like songs. Only the top 10 most popular songs will be displayed at any give moment!

## Advanced Feature 1: Auto-Generated Playlist Recommendations

<img width="737" height="882" alt="image" src="https://github.com/user-attachments/assets/0e57aef8-2a96-4a47-8423-5413c00d913c" />

Based on your liked songs, generate a playlist that contains songs that are of a similar genre to the songs in your liked playlist.

## Advanced Feature 2: Undo Previous Playlist Change

<img width="448" height="120" alt="image" src="https://github.com/user-attachments/assets/71dafe1a-d893-4a73-aece-701e79dd3dc8" />

A user can undo changes they recently made to the playlist. Changes include: Adding a song to the playlist, removing a song from the playlist, and creating the playlist.

## Advanced Feature 3: Genre Diversity Score

<img width="272" height="51" alt="image" src="https://github.com/user-attachments/assets/10cfce67-2f0e-44a4-b9bb-285028406634" />

Using an Entropy algorithm, displays the Genre Diversity of a playlist. A higher score means the move diverse the playlist is.

## Advanced Feature 4: Playlist auto-like trigger

When a user adds a song to a playlist, automatically adds it to the users "Liked Songs." Does not work the other way around.

## Advanced Feature 5: Song Similarity Algorithm

<img width="631" height="798" alt="image" src="https://github.com/user-attachments/assets/51a36517-7e59-440a-b523-acc8b8de9802" />

Given a users inputted song, calculates a similar song based on factors like the duration of the song, and the popularity of the song. The user can adjust the threshold of how similar a song can be.
