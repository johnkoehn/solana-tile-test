import React, { useState } from 'react';
import Tile from './Tile';

const Tiles = ({ tiles }) => {
    const [selectedTile, setSelectedTile] = useState(undefined);

    return tiles.map((tile) => {
        const onTileSelect = () => {
            setSelectedTile({
                q: tile.q,
                r: tile.r
            });
        };

        const onTileUnselect = () => {
            setSelectedTile(undefined);
        };

        if (selectedTile && selectedTile.q === tile.q && selectedTile.r === tile.r) {
            return <Tile tile={tile} selected onSelect={onTileSelect} onUnselect={onTileUnselect} />;
        }

        return <Tile tile={tile} onSelect={onTileSelect} onUnselect={onTileUnselect} />;
    });
};

export default Tiles;
