import os
import random
from datetime import datetime, timezone

import mysql.connector
from dotenv import load_dotenv


load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}


def connect_db():
    return mysql.connector.connect(**DB_CONFIG)


def fetch_song_ids(cursor, limit=100):
    cursor.execute("SELECT song_id FROM Songs ORDER BY song_id LIMIT %s", (limit,))
    return [row[0] for row in cursor.fetchall()]


def upsert_user(cursor, user_id: int, username: str, email: str, password: str):
    # Users table: (user_id PK, username UNIQUE)
    cursor.execute(
        """
        INSERT INTO Users (user_id, username, email, password)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            email = VALUES(email),
            password = VALUES(password)
        """,
        (user_id, username, email, password),
    )


def upsert_playlist(cursor, playlist_id: int, name: str, created_at: datetime, updated_at: datetime):
    cursor.execute(
        """
        INSERT INTO Playlists (playlist_id, playlist_name, created_at, updated_at)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            playlist_name = VALUES(playlist_name),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)
        """,
        (playlist_id, name, created_at, updated_at),
    )


def ensure_owner(cursor, owner_table: str | None, playlist_id: int, user_id: int):
    if not owner_table:
        return

    cursor.execute(
        f"""
        INSERT IGNORE INTO {owner_table} (playlist_id, user_id)
        VALUES (%s, %s)
        """,
        (playlist_id, user_id),
    )


def add_playlist_songs(cursor, playlist_id: int, song_ids):
    for sid in song_ids:
        cursor.execute(
            """
            INSERT IGNORE INTO PlaylistSongs (playlist_id, song_id)
            VALUES (%s, %s)
            """,
            (playlist_id, sid),
        )


def add_likes(cursor, user_id: int, song_ids):
    for sid in song_ids:
        cursor.execute(
            """
            INSERT IGNORE INTO Likes (user_id, song_id)
            VALUES (%s, %s)
            """,
            (user_id, sid),
        )


def resolve_owner_table(cursor) -> str | None:
    for candidate in ("Owner", "owner", "Owners", "owners"):
        cursor.execute("SHOW TABLES LIKE %s", (candidate,))
        if cursor.fetchone():
            return candidate
    return None


def seed_users_playlists_likes():
    conn = connect_db()
    cursor = conn.cursor()

    try:
        song_ids = fetch_song_ids(cursor, limit=50)
        if len(song_ids) < 10:
            raise RuntimeError(
                "Not enough songs found in Songs table. Please ingest songs first."
            )

        # Deterministic randomness for repeatability
        rnd = random.Random(42)

        owner_table = resolve_owner_table(cursor)

        # Define 10 dummy users with varied edge cases
        users = [
            # user_id, username, email, password, has_playlists, has_likes
            (1, "alice", "alice@example.com", "passAlice", False, True),     # no playlists
            (2, "bob", "bob@example.com", "passBob", True, False),           # no liked songs
            (3, "carol", "carol@example.com", "passCarol", True, True),
            (4, "dave", "dave@example.com", "passDave", True, True),
            (5, "erin", "erin@example.com", "passErin", True, True),
            (6, "frank", "frank@example.com", "passFrank", True, True),
            (7, "grace", "grace@example.com", "passGrace", False, False),   # no playlists and no likes
            (8, "heidi", "heidi@example.com", "passHeidi", True, True),
            (9, "ivan", "ivan@example.com", "passIvan", True, True),
            (10, "judy", "judy@example.com", "passJudy", True, True),
        ]

        # Use a high playlist_id range to avoid collisions with real data
        next_playlist_id = 9001

        now = datetime.now(timezone.utc)

        for (uid, uname, email, pwd, has_pl, has_likes) in users:
            upsert_user(cursor, uid, uname, email, pwd)

            # Add likes (varied counts) if applicable
            if has_likes:
                like_count = rnd.randint(1, 8)
                liked = rnd.sample(song_ids, like_count)
                add_likes(cursor, uid, liked)

            # Create 0–3 playlists if applicable
            if has_pl:
                pcount = rnd.randint(1, 3)
                for i in range(pcount):
                    pid = next_playlist_id
                    next_playlist_id += 1

                    pname = f"{uname}_mix_{i+1}"
                    upsert_playlist(cursor, pid, pname, now, now)
                    ensure_owner(cursor, owner_table, pid, uid)

                    # Each playlist gets 3–6 songs
                    p_song_count = rnd.randint(3, 6)
                    p_songs = rnd.sample(song_ids, p_song_count)
                    add_playlist_songs(cursor, pid, p_songs)

        conn.commit()
        print("Inserted sample users, playlists, likes, and playlist songs.")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed_users_playlists_likes()
