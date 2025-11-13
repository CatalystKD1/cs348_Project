import React, { useEffect, useState } from 'react';
import axios from 'axios';

function F5PopularSongs() {
    const [songs, setSongs] = useState([]);

    const loadSongs = async () => {
    try {
        const res = await axios.get('http://localhost:3000/popular/songs');
        setSongs(res.data || []);
    } catch (err) {
        console.error('Failed to fetch songs', err);
        setSongs([]);
    }
    };

    useEffect(() => {
    loadSongs();
    }, []);

    return (
    <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
        <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Most Popular User Songs</h2>
        </div>
        <div className="mt-2 w-full max-w-2xl">
            <div className="bg-gray-800 p-3 rounded-md flex justify-between font-semibold text-gray-300 mb-2">
              <span className="w-3/4">Song Name</span>
              <span className="text-right">User Likes</span>
            </div>

            <ul className="space-y-2">
              {songs.map((s, i) => (
                <li
                  key={i}
                  className="bg-gray-900 p-3 rounded-md flex justify-between items-center"
                >
                  <span className="truncate w-3/4">
                    {i + 1}. {s.song_name}
                  </span>
                  <span className="text-gray-400 text-right">{s.like_count}</span>
                </li>
              ))}
            </ul>
        </div>
    </div>
    );
}

export default F5PopularSongs;