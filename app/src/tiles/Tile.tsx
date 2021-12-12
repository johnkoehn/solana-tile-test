// @ts-nocheck
import React from 'react';
import { Col } from 'react-bootstrap';
import { Hexagon } from 'react-hexgrid';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider, web3
} from '@project-serum/anchor';
import * as spl from '@solana/spl-token';

import { TileTest, IDL } from '../tile_test';
import TileTestIdl from '../tile_test_idl.json';
import getProvider from '../util/getProvider';

const programId = new PublicKey(TileTestIdl.metadata.address);

const COLOR_MAPPING = {
    gold: 'gold',
    wheat: 'yellow',
    wood: 'brown',
    iron: '#434341'
};

const Tile = (props: any) => {
    const wallet = useWallet();
    const tile = props.tile;

    console.log(tile);

    const getHexagonColor = () => {
        return {
            fill: COLOR_MAPPING[Object.keys(tile.tileType)[0]]
        };
    };

    const generateResource = async () => {
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
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <Hexagon onClick={generateResource} key={tile.mintKey.toString()} cellStyle={getHexagonColor()} q={tile.q} r={tile.r} s={-tile.q - tile.r} />
    );
};

export default Tile;
