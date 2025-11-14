import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SongRow from '../components/SongRow';
import MainCard from '../components/MainCard';
import SongsList from '../components/SongsList';

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
    <MainCard title="Most Popular User Songs">
        <div className="mt-2">
            <div className="bg-gray-800 p-3 rounded-md flex justify-between font-semibold text-gray-300 mb-2">
              <span className="w-3/4">Song Name</span>
              <span className="text-right">User Likes</span>
            </div>

            <SongsList>
              {songs.map((s, i) => (
                <SongRow
                  key={i}
                  title={`${i + 1}. ${s.song_name}`}
                  right={s.like_count}
                  songId={s.song_id}
                />
              ))}
            </SongsList>
        </div>
    </MainCard>
    );
}

export default F5PopularSongs;