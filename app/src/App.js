/* eslint-disable no-await-in-loop */
import React, { useState } from 'react';
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
import { nanoid } from 'nanoid';
import * as spl from '@solana/spl-token';
import TileTest from './tile_test.json';

const wallets = [
    // view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets
    getPhantomWallet()
];

const programId = new PublicKey(TileTest.metadata.address);

const gamePublicKey = 'DXc6dbz7XSGenHZzQja3zgTzEkwBJpxjNFm37NP72xS5';

const createMintInfoResource = async (x, y) => {
    const seed = `r2${x}r2${y}`;
    const [mint, mintBump] = await PublicKey.findProgramAddress([Buffer.from(seed)], programId);

    return {
        mint,
        mintBump,
        seed
    };
};

const createMintInfo = async () => {
    const seed = nanoid();
    const [mint, mintBump] = await PublicKey.findProgramAddress([Buffer.from(seed)], programId);

    return {
        mint,
        mintBump,
        seed
    };
};

const calculateNextXY = (x, y) => {
    if (x === 5) {
      return {
        x: 0,
        y: y + 1
      };
    }

    return {
      x: x+1,
      y
    };
  }

function App() {
    const [value, setValue] = useState(null);
    const wallet = useWallet();

    const getProvider = () => {
        const network = 'http://127.0.0.1:8899';

        const connection = new Connection(network, 'processed');

        const provider = new Provider(
            connection, wallet, 'processed'
        );

        return provider;
    };

    async function createGame() {
        const provider = getProvider();

        const gameAccount = web3.Keypair.generate();
        const tileAccount = web3.Keypair.generate();

        const tileMintInfo = await createMintInfo();
        const resourceMintInfo = await createMintInfoResource(0, 0);

        const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            tileMintInfo.mint,
            provider.wallet.publicKey
        );

        const program = new Program(TileTest, programId, provider);
        try {
            await program.rpc.initialize(
                tileMintInfo.mintBump,
                tileMintInfo.seed,
                resourceMintInfo.mintBump,
                resourceMintInfo.seed,
                {
                    accounts: {
                        gameAccount: gameAccount.publicKey,
                        newTile: tileAccount.publicKey,
                        tileMint: tileMintInfo.mint,
                        resourceMint: resourceMintInfo.mint,
                        destination: tileDestinationAccount,
                        authority: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        tokenProgram: spl.TOKEN_PROGRAM_ID,
                        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                        rent: web3.SYSVAR_RENT_PUBKEY
                    },
                    signers: [gameAccount, tileAccount]
                }
            );

            console.log(`Initial Account Public Key ${gameAccount.publicKey.toString()}`);
        } catch (err) {
            console.log(err);
        }
    }

    const mintTile = async () => {
        const provider = getProvider();
        const tileMintInfo = await createMintInfo();
        const program = new Program(TileTest, programId, provider);

        const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            tileMintInfo.mint,
            provider.wallet.publicKey
        );

        const gameAccountPublicKey = new web3.PublicKey(gamePublicKey);
        const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

        let currentTile;
        let currentTileKey;
        do {
            currentTileKey = currentTile ?
                new web3.PublicKey(currentTile.nextTile) :
                new web3.PublicKey(gameAccount.firstTileKey);

            currentTile = await program.account.tileAccount.fetch(currentTileKey);
            console.log(currentTile);
        } while (currentTile.nextTile);

        const newTileAccount = web3.Keypair.generate();
        const { x, y } = calculateNextXY(currentTile.x, currentTile.y);
        const resourceMintInfo = await createMintInfoResource(x, y);

        const tileType = { variant: 0, wood: { } };

        try {
            await program.rpc.mintTile(
                tileType,
                tileMintInfo.mintBump,
                tileMintInfo.seed,
                resourceMintInfo.mintBump,
                resourceMintInfo.seed,
                {
                    accounts: {
                        newTile: newTileAccount.publicKey,
                        tileMint: tileMintInfo.mint,
                        resourceMint: resourceMintInfo.mint,
                        gameAccount: gameAccountPublicKey,
                        currentTile: currentTileKey,
                        authority: provider.wallet.publicKey,
                        destination: tileDestinationAccount,
                        systemProgram: web3.SystemProgram.programId,
                        tokenProgram: spl.TOKEN_PROGRAM_ID,
                        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                        rent: web3.SYSVAR_RENT_PUBKEY
                    },
                    signers: [newTileAccount]
                }
            );

            console.log('Created tile!');
        } catch (err) {
            console.log(err);
        }
    };

    if (!wallet.connected) {
        return (
            <Container>
                <WalletMultiButton />
            </Container>
        );
    }

    const generateResource = () => {

    };

    return (
        <Container>
            <Row>
                <Col onClick={() => console.log('hello')}>
                    <p>X 0</p>
                    <p>Y 0</p>
                </Col>
                <Col>
                    <p>X 1</p>
                    <p>Y 0</p>
                </Col>
                <Col>
                    <p>X 2</p>
                    <p>Y 0</p>
                </Col>
                <Col>
                    <p>X 3</p>
                    <p>Y 0</p>
                </Col>
                <Col>
                    <p>X 4</p>
                    <p>Y 0</p>
                </Col>
                <Col>
                    <p>X 5</p>
                    <p>Y 0</p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button onClick={() => createGame()}>
                        Click me to create game!
                    </Button>
                </Col>
                <Col>
                    <Button onClick={() => mintTile()}>
                        Click me to mint tile
                    </Button>
                </Col>
            </Row>
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
