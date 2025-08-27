// File: /frontend/src/components/PlayerCard.js
import React from 'react';
import { useDrag } from 'react-dnd';

const ItemTypes = {
    PLAYER: 'player',
};

const getPositionColor = (position) => {
    switch (position) {
        case 'QB': return '#a7c7e7'; // Blue
        case 'RB': return '#ffac8e'; // Orange
        case 'WR': return '#fdfd96'; // Yellow
        case 'TE': return '#b2d8b2'; // Green
        case 'DST': return '#d3d3d3'; // Gray
        case 'K': return '#ffffff'; // White
        default: return '#f0f0f0';
    }
};

function PlayerCard({ player }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.PLAYER,
        item: { player },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const cardStyle = {
        padding: '8px',
        margin: '4px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: getPositionColor(player.position),
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={drag} style={cardStyle}>
            <strong>{player.name}</strong> ({player.position}) - {player.team}
        </div>
    );
}

export default PlayerCard;
