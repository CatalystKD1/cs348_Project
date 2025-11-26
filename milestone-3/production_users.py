import os
import random
from datetime import datetime
import pandas as pd

CSV_TRACKS = "../csv-setup/spotify_tracks.csv"
CSV_USERS = "../csv-setup/users.csv"
CSV_PLAYLISTS = "../csv-setup/playlists.csv"
CSV_OWNER = "../csv-setup/owner.csv"
CSV_PLAYLIST_SONGS = "../csv-setup/playlist_songs.csv"
CSV_LIKES = "../csv-setup/likes.csv"
CSV_PLAYLIST_ACTIONS = "../csv-setup/playlist_actions.csv"

NUM_USERS = 120
PLAYLISTS_PER_USER = (0, 10)
SONGS_PER_PLAYLIST = (1, 25)
LIKES_PER_USER = (0, 50)
RANDOM_SEED = 42


def load_track_ids():
    df_tracks = pd.read_csv(CSV_TRACKS)
    track_ids = df_tracks["track_id"].dropna().drop_duplicates().tolist()
    if len(track_ids) < 200:
        raise RuntimeError(f"Only {len(track_ids)} track IDs found. Need more tracks.")
    return track_ids


def generate_data():
    rnd = random.Random(RANDOM_SEED)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    track_ids = load_track_ids()

    users = []
    playlists = []
    owners = []
    playlist_songs = []
    likes = []
    playlist_actions = []

    next_playlist_id = 1

    for user_id in range(1, NUM_USERS + 1):
        username = f"user{user_id}"
        email = f"{username}@example.com"
        password = f"password{user_id}"

        users.append({"user_id": user_id, "username": username, "email": email, "password": password})

        # playlists 4 users
        num_playlists = rnd.randint(*PLAYLISTS_PER_USER)
        for i in range(num_playlists):
            pid = next_playlist_id
            next_playlist_id += 1

            playlist_name = f"{username}_mix_{i+1}"
            playlists.append({"playlist_id": pid, "playlist_name": playlist_name,
                              "created_at": now_str, "updated_at": now_str})
            owners.append({"playlist_id": pid, "user_id": user_id})
            playlist_actions.append({"user_id": user_id, "playlist_id": pid,
                                     "action_type": "create", "action_time": now_str, "details": playlist_name})

            chosen_tracks = rnd.sample(track_ids, rnd.randint(*SONGS_PER_PLAYLIST))
            for tid in chosen_tracks:
                playlist_songs.append({"playlist_id": pid, "song_id": tid})

        liked_tracks = rnd.sample(track_ids, rnd.randint(*LIKES_PER_USER))
        for tid in liked_tracks:
            likes.append({"user_id": user_id, "song_id": tid, "liked_at": now_str})

    return users, playlists, owners, playlist_songs, likes, playlist_actions


def write_csvs():
    users, playlists, owners, playlist_songs, likes, playlist_actions = generate_data()
    os.makedirs(os.path.dirname(CSV_USERS), exist_ok=True)

    pd.DataFrame(users).to_csv(CSV_USERS, index=False)
    pd.DataFrame(playlists).to_csv(CSV_PLAYLISTS, index=False)
    pd.DataFrame(owners).to_csv(CSV_OWNER, index=False)
    pd.DataFrame(playlist_songs).to_csv(CSV_PLAYLIST_SONGS, index=False)
    pd.DataFrame(likes).to_csv(CSV_LIKES, index=False)
    pd.DataFrame(playlist_actions).to_csv(CSV_PLAYLIST_ACTIONS, index=False)

    print("Generated CSV files:")
    print(f"  {CSV_USERS}")
    print(f"  {CSV_PLAYLISTS}")
    print(f"  {CSV_OWNER}")
    print(f"  {CSV_PLAYLIST_SONGS}")
    print(f"  {CSV_LIKES}")
    print(f"  {CSV_PLAYLIST_ACTIONS}")


if __name__ == "__main__":
    write_csvs()
