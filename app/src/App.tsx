/* eslint-disable no-await-in-loop */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider, web3
} from '@project-serum/anchor';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Button } from 'react-bootstrap';
import * as spl from '@solana/spl-token';
import chunk from 'chunk';
import TileTestIdl from './tile_test_idl.json';
import getProvider from './util/getProvider';
import Loading from './util/components/Loading';
import { TileTest, IDL } from './tile_test';
import Tile from './tiles/Tile';

const wallets = [
    // view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets
    getPhantomWallet()
];

const programId = new PublicKey(TileTestIdl.metadata.address);

const gamePublicKey = 'DHgrjtGSsLukd8J3fEdEwm4NjYRq28EUUzS8sKzC2z8u';

function App() {
    const [tiles, setTiles] = useState<any>(undefined);
    const wallet = useWallet();

    useEffect(async () => {
        if (!wallet.connected) {
            return;
        }

        if (tiles) {
            return;
        }

        const provider = getProvider(wallet, 'http://127.0.0.1:8899');
        const program = new Program(IDL, programId, provider) as Program<TileTest>;

        // get all tiles
        const gameAccountPublicKey = new web3.PublicKey(gamePublicKey);
        const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

        const tilesList = [];
        let currentTile;
        let nextTileKey = gameAccount.firstTileKey;

        while (nextTileKey) {
            console.log(tilesList.length);
            currentTile = await program.account.tileAccount.fetch(nextTileKey);
            tilesList.push(currentTile);
            nextTileKey = currentTile.nextTile;
        }

        setTiles(tilesList);
    }, [wallet]);

    if (!wallet.connected) {
        return (
            <Container>
                <WalletMultiButton />
            </Container>
        );
    }

    if (!tiles) {
        return (
            <Loading />
        );
    }

    // const generateResource = async (x, y) => {
    //     // find the x, y coordinate
    //     // generate the resource
    //     const provider = getProvider(wallet, 'http://127.0.0.1:8899');
    //     const program = new Program(TileTestIdl, programId, provider);

    //     const gameAccountPublicKey = new web3.PublicKey(gamePublicKey);
    //     const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

    //     let foundTile = false;
    //     let currentTile;
    //     let currentTileKey;
    //     do {
    //         currentTileKey = currentTile ?
    //             new web3.PublicKey(currentTile.nextTile) :
    //             new web3.PublicKey(gameAccount.firstTileKey);

    //         currentTile = await program.account.tileAccount.fetch(currentTileKey);

    //         foundTile = currentTile.x === x && currentTile.y === y;
    //     } while (!foundTile);

    //     const resourceMintSeed = `r2${x}r2${y}`;
    //     const [resourceMint, resourceMintBump] = await web3.PublicKey.findProgramAddress([Buffer.from(resourceMintSeed)], programId);

    //     const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
    //         spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    //         spl.TOKEN_PROGRAM_ID,
    //         currentTile.mintKey,
    //         program.provider.wallet.publicKey
    //     );

    //     const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
    //         spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    //         spl.TOKEN_PROGRAM_ID,
    //         currentTile.resourceKey,
    //         program.provider.wallet.publicKey
    //     );

    //     try {
    //         await program.rpc.generateResource(
    //             resourceMintBump,
    //             resourceMintSeed,
    //             {
    //                 accounts: {
    //                     tile: currentTileKey,
    //                     tileTokenAccount,
    //                     resourceTokenAccount,
    //                     resourceMint,
    //                     authority: program.provider.wallet.publicKey,
    //                     systemProgram: web3.SystemProgram.programId,
    //                     tokenProgram: spl.TOKEN_PROGRAM_ID,
    //                     associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    //                     rent: web3.SYSVAR_RENT_PUBKEY
    //                 }
    //             }
    //         );

    //         const tokenAccountInfo = await program.provider.connection.getAccountInfo(resourceTokenAccount);
    //         // console.log(JSON.stringify(tokenAccountInfo, null, 4))
    //         const tokenAccountData = spl.AccountLayout.decode(tokenAccountInfo.data);
    //         console.log(tokenAccountData);
    //     } catch (err) {
    //         console.log(err);
    //     }
    // };

    const buildTiles = () => {
        return chunk(tiles, 5).map((x) => {
            const tilesChunk = x.map((tile) => <Tile tile={tile} />);

            return (
                <Row>
                    {tilesChunk}
                </Row>
            );
        });
    };

    return (
        <Container>
            {buildTiles()}
        </Container>
    );
}

const AppWithProvider = () => {
    return (
        <ConnectionProvider endpoint="http://127.0.0.1:8899">
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <App />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default AppWithProvider;
