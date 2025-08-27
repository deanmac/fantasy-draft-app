// File: /frontend/src/components/PlayerSearch.js
import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';

function PlayerSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }

        const fetchPlayers = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/players?search=${searchTerm}`);
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error("Error fetching players:", error);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchPlayers();
        }, 300); // Debounce to avoid too many API calls

        return () => clearTimeout(debounceTimer);

    }, [searchTerm]);

    return (
        <div>
            <h2>Search Players</h2>
            <input
                type="text"
                placeholder="Enter player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '90%', padding: '8px' }}
            />
            <div className="search-results">
                {results.map(player => (
                    <PlayerCard key={player.id} player={player} />
                ))}
            </div>
        </div>
    );
}

export default PlayerSearch;
