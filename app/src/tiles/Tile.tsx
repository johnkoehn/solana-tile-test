import React from 'react';
import { Col } from 'react-bootstrap';

const Tile = (props: any) => {
    const tile = props.tile;
    console.log(tile);
    return (
        <Col>
            <span>
                r:
                {' '}
                {tile.r}
            </span>
            <span>
                q:
                {' '}
                {tile.q}
            </span>
        </Col>
    );
};

export default Tile;
