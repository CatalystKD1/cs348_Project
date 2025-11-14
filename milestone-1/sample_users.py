import os
import random
from datetime import datetime
import pandas as pd

# ---- Paths (adjust if needed) ----
CSV_TRACKS = "../csv-setup/spotify_tracks.csv"
CSV_USERS = "../csv-setup/users.csv"
CSV_PLAYLISTS = "../csv-setup/playlists.csv"
CSV_OWNER = "../csv-setup/owner.csv"
CSV_PLAYLIST_SONGS = "../csv-setup/playlist_songs.csv"
CSV_LIKES = "../csv-setup/likes.csv"

# ---- Config ----
NUM_USERS = 120               # >= 100 users as requested
PLAYLISTS_PER_USER = (0, 10)   # min, max playlists per user
SONGS_PER_PLAYLIST = (1, 25)  # songs per playlist
LIKES_PER_USER = (0, 50)     # liked songs per user
RANDOM_SEED = 42              # deterministic for repeatability


def load_track_ids():
    """Read spotify_tracks.csv and return a list of unique track_ids."""
    df_tracks = pd.read_csv(CSV_TRACKS)
    if "track_id" not in df_tracks.columns:
        raise RuntimeError("spotify_tracks.csv must have a 'track_id' column")

    track_ids = (
        df_tracks["track_id"]
        .dropna()
        .drop_duplicates()
        .tolist()
    )

    if len(track_ids) < 200:
        raise RuntimeError(
            f"Only found {len(track_ids)} unique track_ids. "
            "You probably want more tracks in spotify_tracks.csv."
        )

    return track_ids


def generate_data():
    track_ids = load_track_ids()
    rnd = random.Random(RANDOM_SEED)

    users = []
    playlists = []
    owners = []
    playlist_songs = []
    likes = []

    next_playlist_id = 1
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ---- Users ----
    for user_id in range(1, NUM_USERS + 1):
        username = f"user{user_id}"
        email = f"{username}@example.com"
        password = f"password{user_id}"  # demo only

        users.append(
            {
                "user_id": user_id,
                "username": username,
                "email": email,
                "password": password,
            }
        )

        # ---- Playlists per user ----
        num_playlists = rnd.randint(*PLAYLISTS_PER_USER)
        for i in range(num_playlists):
            pid = next_playlist_id
            next_playlist_id += 1

            playlist_name = f"{username}_mix_{i + 1}"

            playlists.append(
                {
                    "playlist_id": pid,
                    "playlist_name": playlist_name,
                    "created_at": now_str,
                    "updated_at": now_str,
                }
            )

            owners.append(
                {
                    "playlist_id": pid,
                    "user_id": user_id,
                }
            )

            # songs for this playlist (unique within playlist)
            num_songs_pl = min(
                len(track_ids),
                rnd.randint(*SONGS_PER_PLAYLIST),
            )
            chosen_tracks = rnd.sample(track_ids, num_songs_pl)

            for tid in chosen_tracks:
                playlist_songs.append(
                    {
                        "playlist_id": pid,
                        "song_id": tid,
                    }
                )

        # ---- Likes per user ----
        num_likes = min(
            len(track_ids),
            rnd.randint(*LIKES_PER_USER),
        )
        liked_tracks = rnd.sample(track_ids, num_likes)
        for tid in liked_tracks:
            likes.append(
                {
                    "user_id": user_id,
                    "song_id": tid,
                }
            )

    return users, playlists, owners, playlist_songs, likes


def write_csvs():
    users, playlists, owners, playlist_songs, likes = generate_data()

    os.makedirs(os.path.dirname(CSV_USERS), exist_ok=True)

    pd.DataFrame(users).to_csv(CSV_USERS, index=False)
    pd.DataFrame(playlists).to_csv(CSV_PLAYLISTS, index=False)
    pd.DataFrame(owners).to_csv(CSV_OWNER, index=False)
    pd.DataFrame(playlist_songs).to_csv(CSV_PLAYLIST_SONGS, index=False)
    pd.DataFrame(likes).to_csv(CSV_LIKES, index=False)

    print("Generated CSV files:")
    print(f"  {CSV_USERS}")
    print(f"  {CSV_PLAYLISTS}")
    print(f"  {CSV_OWNER}")
    print(f"  {CSV_PLAYLIST_SONGS}")
    print(f"  {CSV_LIKES}")


if __name__ == "__main__":
    write_csvs()
