import requests
import csv
import time
import string

SPOTIFY_API_URL = "https://api.spotify.com/v1/search"
ACCESS_TOKEN = "token"

def search_artists(query, limit=50, offset=0, market="US"):

    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = {
        "q": query,
        "type": "artist",
        "limit": limit,
        "offset": offset,
        "market": market
    }

    response = requests.get(SPOTIFY_API_URL, headers=headers, params=params)
    if response.status_code != 200:
        print(f"[ERROR] Spotify API {response.status_code}: {response.text}")
        return []

    data = response.json()
    artists = data.get("artists", {}).get("items", [])
    return artists


def main():
    output_file = "spotify_artists.csv"
    artist_ids = set()
    all_artists = []

    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "popularity", "followers", "genres", "url"])

        for letter in string.ascii_lowercase:
            for offset in [0, 50]:  
                artists = search_artists(letter, limit=50, offset=offset)

                if not artists:
                    continue

                for artist in artists:
                    artist_id = artist["id"]
                    if artist_id in artist_ids:
                        continue  

                    artist_ids.add(artist_id)

                    artist_info = {
                        "id": artist_id,
                        "name": artist["name"],
                        "popularity": artist.get("popularity", 0),
                        "followers": artist.get("followers", {}).get("total", 0),
                        "genres": ", ".join(artist.get("genres", [])),
                        "url": artist["external_urls"]["spotify"]
                    }

                    all_artists.append(artist_info)
                    writer.writerow(artist_info.values())

                    print(f"{artist_info['name']} (ID: {artist_info['id']})")

                time.sleep(30)

    print(f"Unique artist IDs collected: {len(artist_ids)}")

if __name__ == "__main__":
    main()
