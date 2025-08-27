// File: /frontend/src/components/DraftGrid.js
import React from 'react';
import { useDrop } from 'react-dnd';
import PlayerCard from './PlayerCard';

const ItemTypes = {
    PLAYER: 'player',
};

// This is a single cell in the grid
function DraftSlot({ slotId, player, onDrop }) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.PLAYER,
        drop: (item) => onDrop(slotId, item.player),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className="draft-slot"
            style={{ backgroundColor: isOver ? 'lightblue' : 'white' }}
        >
            {player ? <PlayerCard player={player} /> : `${slotId}`}
        </div>
    );

}

// This is the main grid component
function DraftGrid({ draftBoard, teamNames, onDrop, onTeamNameChange }) {
    const TEAMS = 12;
    const ROUNDS = 17;

    const renderGrid = () => {
        const columns = [];
        for (let team = 1; team <= TEAMS; team++) {
            const teamId = `T${team}`;
            const cells = [];
            for (let round = 1; round <= ROUNDS; round++) {
                const slotId = `${teamId}-R${round}`;
                const player = draftBoard[slotId];
                cells.push(
                    <DraftSlot
                        key={slotId}
                        slotId={slotId}
                        player={player}
                        onDrop={onDrop}
                    />
                );
            }
            columns.push(
                <div key={`team-${team}`} className="team-column">
                    <input
                        type="text"
                        className="team-name-input"
                        value={teamNames[teamId] || `Team ${team}`}
                        onChange={(e) => onTeamNameChange(teamId, e.target.value)}
                    />
                    {cells}</div>
            );
        }
        return columns;
    };

    return <div className="draft-grid">{renderGrid()}</div>;
}

export default DraftGrid;
