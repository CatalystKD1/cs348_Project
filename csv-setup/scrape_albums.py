import requests
import csv
import time
import pandas as pd


ACCESS_TOKEN = "TOKEN"
HEADERS = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

ARTISTS_CSV = "spotify_artists.csv"  
ALBUMS_CSV = "spotify_albums.csv"    

MAX_ALBUMS_PER_ARTIST = 50          
BATCH_SIZE = 20   

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


def get_artist_first_page_albums(artist_id, market="US", include_groups="album"):
    params = {
        "include_groups": include_groups,
        "limit": MAX_ALBUMS_PER_ARTIST,
        "offset": 0,
        "market": market
    }
    url = f"https://api.spotify.com/v1/artists/{artist_id}/albums"
    data = safe_request(url, HEADERS, params)
    if not data:
        return []
    return data.get("items", [])


def get_album_details_batch(album_ids):
    if not album_ids:
        return []

    url = "https://api.spotify.com/v1/albums"
    params = {"ids": ",".join(album_ids)}
    data = safe_request(url, HEADERS, params)
    if not data:
        return []

    return data.get("albums", [])



def main():
    df = pd.read_csv(ARTISTS_CSV)
    artists = df[df["popularity"] > 75]["id"].tolist()
    print(f"🎵 Processing {len(artists)} artists with popularity > 75")

    album_ids = set()

    keys = ["id", "name", "release_date", "artists", "tracks", "label", "popularity", "url"]
    ## THIS NEEDS TO MANUALLY BE CHANGED TO NOT APPEND I WAS LAZY WHEN I WROTE IT 
    with open(ALBUMS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        # writer.writeheader()

        for i, artist_id in enumerate(artists[271:], 271):
            print(f"\n🎤 [{i}/{len(artists)}] Fetching first page of albums for artist {artist_id}")

            albums = get_artist_first_page_albums(artist_id)
            print(f"  Found {len(albums)} albums (first page) for artist {artist_id}")

            new_album_ids = [a["id"] for a in albums if a["id"] not in album_ids]

            for j in range(0, len(new_album_ids), BATCH_SIZE):
                batch_ids = new_album_ids[j:j + BATCH_SIZE]
                details = get_album_details_batch(batch_ids)
                time.sleep(0.5) 

                for album in details:
                    if not album or album.get("popularity", 0) <= 20:
                        continue  

                    album_info = {
                        "id": album["id"],
                        "name": album.get("name", ""),
                        "release_date": album.get("release_date", ""),
                        "artists": ",".join([a["id"] for a in album.get("artists", [])]),
                        "tracks": album.get("total_tracks", 0),
                        "label": album.get("label", ""),
                        "popularity": album.get("popularity", 0),
                        "url": album["external_urls"]["spotify"]
                    }

                    print(f"{album_info['name']} ({album_info['id']})")

                    writer.writerow(album_info)
                    album_ids.add(album["id"])
            time.sleep(30)

    print(f"Unique album IDs collected: {len(album_ids)}")


if __name__ == "__main__":
    main()
