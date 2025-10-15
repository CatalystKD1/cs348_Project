import requests
import csv
import time
import os


ACCESS_TOKEN = "token"
ALBUMS_CSV = "spotify_albums.csv"
TRACKS_CSV = "spotify_tracks.csv"
MARKET = "CA"
START_INDEX = 212  

def safe_request(url, headers, params=None):
    while True:
        r = requests.get(url, headers=headers, params=params)
        if r.status_code == 429:
            retry_after = int(r.headers.get("Retry-After", "30"))
            print(f"Rate limited. Waiting {retry_after} seconds...")
            time.sleep(retry_after)
            continue
        elif r.status_code != 200:
            print(f"HTTP {r.status_code}: {r.text}")
            return None
        return r.json()


def main():
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

    albums = []
    with open(ALBUMS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        albums = list(reader)

    print(f"Loaded {len(albums)} albums from CSV.")
    albums = [a for a in albums if int(a.get("popularity", 0)) > 75]
    print(f"{len(albums)} albums have popularity > 75.")

    file_exists = os.path.isfile(TRACKS_CSV)
    with open(TRACKS_CSV, mode="a", newline="", encoding="utf-8") as f_out:
        fieldnames = ["id", "name", "artist_ids", "album_id", "duration_ms", "explicit", "track_number"]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        for i, album in enumerate(albums[START_INDEX:], START_INDEX):
            album_id = album["id"]
            album_name = album["name"]

            print(f"\n[{i}] Fetching tracks for album: {album_name} ({album_id})")

            url = f"https://api.spotify.com/v1/albums/{album_id}/tracks"
            params = {"limit": 50, "market": MARKET}
            data = safe_request(url, headers, params)

            if not data or "items" not in data:
                print("No tracks found or request failed.")
                continue

            for t in data["items"]:
                track_info = {
                    "id": t.get("id", ""),
                    "name": t.get("name", ""),
                    "artist_ids": ",".join(a["id"] for a in t.get("artists", [])),
                    "album_id": album_id,
                    "duration_ms": t.get("duration_ms", 0),
                    "explicit": t.get("explicit", False),
                    "track_number": t.get("track_number", 0),
                }
                writer.writerow(track_info)

            f_out.flush()

            print(f"Saved {len(data['items'])} tracks for '{album_name}'")

            time.sleep(30)

    print("\nFinished processing all albums!")

if __name__ == "__main__":
    main()
