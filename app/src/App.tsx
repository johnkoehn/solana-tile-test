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
import { HexGrid, Layout, Hexagon, GridGenerator } from 'react-hexgrid';
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
            tilesList.push({
                ...currentTile,
                tileKey: nextTileKey
            });
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

    const buildTiles = () => {
        return tiles.map((tile) => <Tile tile={tile} />);
    };

    return (
        <Container>
            <HexGrid width={2000} height={2000}>
                <Layout size={{ x: 1, y: 1 }} origin={{ x: 0, y: 0 }}>
                    {buildTiles()}
                </Layout>
            </HexGrid>
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
