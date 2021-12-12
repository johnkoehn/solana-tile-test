// @ts-nocheck
import React, { useState } from 'react';
import { Offcanvas, Row } from 'react-bootstrap';
import { Hexagon } from 'react-hexgrid';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider, web3
} from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import LoadingButton from '../util/components/LoadingButton';
import { TileTest, IDL } from '../tile_test';
import TileTestIdl from '../tile_test_idl.json';
import getProvider from '../util/getProvider';
import DisplayMessage from '../util/components/DisplayMessage';

const programId = new PublicKey(TileTestIdl.metadata.address);

const COLOR_MAPPING = {
    gold: 'gold',
    wheat: 'yellow',
    wood: 'brown',
    iron: '#434341'
};

const Tile = ({ tile, onSelect, onUnselect, selected }) => {
    const [showTileInformation, setShowTileInformation] = useState(false);
    const [message, setMessage] = useState(null);
    const wallet = useWallet();

    console.log(tile);

    const getHexagonColor = () => {
        if (selected) {
            return {
                fill: '#ff00ea'
            };
        }

        return {
            fill: COLOR_MAPPING[tile.tileType]
        };
    };

    const generateResource = async () => {
        setMessage(null);
        const provider = getProvider(wallet, 'http://127.0.0.1:8899');
        const program = new Program(TileTestIdl, programId, provider);

        const resourceMintSeed = `r${tile.q}r${tile.r}`;
        const [resourceMint, resourceMintBump] = await web3.PublicKey.findProgramAddress([Buffer.from(resourceMintSeed)], programId);

        const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            tile.mintKey,
            program.provider.wallet.publicKey
        );

        const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            tile.resourceKey,
            program.provider.wallet.publicKey
        );

        try {
            await program.rpc.generateResource(
                resourceMintBump,
                resourceMintSeed,
                {
                    accounts: {
                        tile: tile.tileKey,
                        tileTokenAccount,
                        resourceTokenAccount,
                        resourceMint,
                        authority: program.provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        tokenProgram: spl.TOKEN_PROGRAM_ID,
                        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                        rent: web3.SYSVAR_RENT_PUBKEY
                    }
                }
            );

            const tokenAccountInfo = await program.provider.connection.getAccountInfo(resourceTokenAccount);
            // console.log(JSON.stringify(tokenAccountInfo, null, 4))
            const tokenAccountData = spl.AccountLayout.decode(tokenAccountInfo.data);
            console.log(tokenAccountData);

            setMessage({
                type: 'success',
                text: `Successfully generated a ${tile.tileType} resource at (${tile.q},${tile.r})`
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: `Transaction failed: ${err.message}`
            });
            console.log(err);
        }
    };

    const handleClose = () => {
        onUnselect();
        setShowTileInformation(false);
    };
    const handleShow = () => {
        onSelect();
        setShowTileInformation(true);
    };

    return (
        <>
            <Hexagon onClick={handleShow} key={tile.mintKey.toString()} cellStyle={getHexagonColor()} q={tile.q} r={tile.r} s={-tile.q - tile.r} />
            <Offcanvas placement="end" show={showTileInformation} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Tile ({tile.q},{tile.r})</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Row>
                        Resource Type: {tile.tileType}
                    </Row>
                    <Row>
                        <LoadingButton onClick={generateResource}>Generate Resource</LoadingButton>
                    </Row>
                    <Row>
                        <DisplayMessage message={message} />
                    </Row>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Tile;
