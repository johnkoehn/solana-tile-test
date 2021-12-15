import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
const { assert } = require('chai');
import { Program } from '@project-serum/anchor';
import { nanoid } from 'nanoid';
import { Workers, IDL } from '../target/types/workers';
import fetchTokenAccount from './utils/fetchTokenAccount';
import createMintInfo from './utils/createMintInfo';
import { TileTest, IDL as IDL2 } from '../target/types/tile_test';

const testKeyString = require('./testKey.json');
const testKey2String = require('./testKey2.json');

const mintWorker = async (programId, program, key) => {
    const workerAccount = anchor.web3.Keypair.generate();
    const workerMintInfo = await createMintInfo(anchor, programId);

    const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        workerMintInfo.mint,
        key.publicKey
    );

    await program.rpc.mintWorker(workerMintInfo.mintBump, workerMintInfo.seed, {
        accounts: {
            workerAccount: workerAccount.publicKey,
            workerMint: workerMintInfo.mint,
            signer: key.publicKey,
            receiver: key.publicKey,
            destination: workerTokenAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [workerAccount, key]
    });

    return {
        workerAccount,
        workerTokenAccount,
    };
}

const getFirstTileInfo = async (tileProgram, gameAccountPublicKey, key) => {
    const gameAccount = await tileProgram.account.gameAccount.fetch(gameAccountPublicKey);
    const tileAccount = await tileProgram.account.tileAccount.fetch(gameAccount.firstTileKey);

    const seed = `r${tileAccount.q}r${tileAccount.r}`;
    const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], tileProgram.programId);

    const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mint,
        key.publicKey
    );

    return {
        gameAccount,
        tileAccount,
        seed,
        mint,
        mintBump,
        resourceTokenAccount
    };
}

describe('Worker', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Workers as Program<Workers>;
  const programId = program.programId;

  const tileProgram = anchor.workspace.TileTest as Program<TileTest>
  const tileProgramId = tileProgram.programId;

  const uiPublicKey = new anchor.web3.PublicKey('bgEUZT6TdrRB1oRE9QtKEKjZXTksq2afeHqPRZeoTEq');
  const gameAccountPublicKey = new anchor.web3.PublicKey('AKu39bR5iuaAUHhdppP5nYUTANVwAYSuXwfoaARk4aka');

  const testKey = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKeyString));
  const testKey2 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey2String));

  it.skip('creates the workerProgramAccount', async () => {
    const workerProgramAccount = anchor.web3.Keypair.generate();

    await program.rpc.initialize({
        accounts: {
            workerProgramAccount: workerProgramAccount.publicKey,
            signer: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId
        },
        signers: [workerProgramAccount]
    });

    // for fun!
    const w = await program.account.workerProgramAccount.fetch(workerProgramAccount.publicKey);
    console.log(w);
    console.log(workerProgramAccount.publicKey.toString());
  });

  // worker program account we will use
  const workerProgramAccountPublicKey = new anchor.web3.PublicKey('9E3Ke4dAWHB5H8ySELFaR2jp3qHt93JmAyZtVNmunCjC');

  let workerAccount;
  let workerDestinationAccount;
  let workerMintKey;
  it('should mint a worker', async () => {
    workerAccount = anchor.web3.Keypair.generate();
    const workerMintInfo = await createMintInfo(anchor, programId);

    workerDestinationAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        workerMintInfo.mint,
        testKey.publicKey
    );

    await program.rpc.mintWorker(workerMintInfo.mintBump, workerMintInfo.seed, {
        accounts: {
            workerAccount: workerAccount.publicKey,
            workerMint: workerMintInfo.mint,
            signer: program.provider.wallet.publicKey,
            receiver: testKey.publicKey,
            destination: workerDestinationAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [workerAccount]
    });

    const workerAccountInfo = await program.account.workerAccount.fetch(workerAccount.publicKey);
    console.log(workerAccountInfo.mintKey.toString());
    console.log(workerAccount.publicKey.toString());

    workerMintKey = workerAccountInfo.mintKey;
  });

  it('should throw an error if a non owner of the worker attempts to assign task', async () => {
    const walletDestAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        workerMintKey,
        testKey2.publicKey
    );

    const tx = spl.Token.createAssociatedTokenAccountInstruction(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        workerMintKey,
        walletDestAccount,
        testKey2.publicKey,
        testKey2.publicKey
    )
    const transaction = new anchor.web3.Transaction().add(tx);
    const connection = new anchor.web3.Connection("http://127.0.0.1:8899", 'processed');
    await anchor.web3.sendAndConfirmTransaction(connection, transaction, [testKey2]);

    const gameAccount = await tileProgram.account.gameAccount.fetch(gameAccountPublicKey);

    let threwError = false;
    try {
        await program.rpc.assignTask({
            accounts: {
                workerAccount: workerAccount.publicKey,
                workerTokenAccount: walletDestAccount,
                tileAccount: gameAccount.firstTileKey,
                signer: testKey2.publicKey
            },
            signers: [testKey2]
        });
    } catch (err) {
        console.log(err.message);
        threwError = true;
    }
    assert.ok(threwError);
  });

  it('should throw an error if a non owner of the worker attempts to assign task', async () => {
    const gameAccount = await tileProgram.account.gameAccount.fetch(gameAccountPublicKey);

    let threwError = false;
    try {
        await program.rpc.assignTask({
            accounts: {
                workerAccount: workerAccount.publicKey,
                workerTokenAccount: workerDestinationAccount,
                tileAccount: gameAccount.firstTileKey,
                signer: testKey2.publicKey
            },
            signers: [testKey2]
        });
    } catch (err) {
        console.log(err.message);
        threwError = true;
    }
    assert.ok(threwError);
  });

  it('should allow owner of the worker to set the worker to perform a task', async () => {
    const gameAccount = await tileProgram.account.gameAccount.fetch(gameAccountPublicKey);

    await program.rpc.assignTask({
        accounts: {
            workerAccount: workerAccount.publicKey,
            workerTokenAccount: workerDestinationAccount,
            tileAccount: gameAccount.firstTileKey,
            signer: testKey.publicKey
        },
        signers: [testKey]
    });
  });

  it('should not allow a user to complete a work task by calling the tile program', async () => {
    const { gameAccount, tileAccount, seed, mint, mintBump, resourceTokenAccount } = await getFirstTileInfo(tileProgram, gameAccountPublicKey, testKey);

    let hadError = false;
    try {
        await tileProgram.rpc.workerCompleteTask(mintBump, seed, new anchor.BN(100), {
            accounts: {
                resourceMint: mint,
                resourceTokenAccount: resourceTokenAccount,
                signer: tileProgram.provider.wallet.publicKey,
                receiver: tileProgram.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: []
        });
    } catch (err) {
        hadError = true;
        console.log(err);
    }

    assert.ok(hadError)
  });

  it('should not allow a user to complete a task on a worker that does not have a task', async () => {
    const workerInfo = await mintWorker(programId, program, testKey);
    const { gameAccount, tileAccount, seed, mint, mintBump, resourceTokenAccount } = await getFirstTileInfo(tileProgram, gameAccountPublicKey, testKey);


    let errorMsg = undefined;
    try {
        await program.rpc.completeTask(mintBump, seed, {
            accounts: {
                workerProgramAccount: workerProgramAccountPublicKey,
                workerAccount: workerInfo.workerAccount.publicKey,
                workerTokenAccount: workerInfo.workerTokenAccount,
                tileAccount: gameAccount.firstTileKey,
                resourceMint: mint,
                resourceTokenAccount: resourceTokenAccount,
                signer: testKey.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [testKey]
        });
    } catch (err) {
        errorMsg = err.msg;
        console.log(err.msg);
    }

    assert.ok(errorMsg === 'The worker had no task!')
  });

  it('should not allow a worker to complete a task before the task completes ^.^', async () => {
    const workerInfo = await mintWorker(programId, program, testKey);
    const { gameAccount, tileAccount, seed, mint, mintBump, resourceTokenAccount } = await getFirstTileInfo(tileProgram, gameAccountPublicKey, testKey);

    let errorMsg = undefined;
    try {
        await program.rpc.assignTask({
            accounts: {
                workerAccount: workerInfo.workerAccount.publicKey,
                workerTokenAccount: workerInfo.workerTokenAccount,
                tileAccount: gameAccount.firstTileKey,
                signer: testKey.publicKey
            },
            signers: [testKey]
        });
        // await program.rpc.assignTask({
        //     accounts: {
        //         workerAccount: workerInfo.workerAccount.publicKey,
        //         workerTokenAccount: workerInfo.workerTokenAccount,
        //         tileAccount: gameAccount.firstTileKey,
        //         signer: testKey.publicKey
        //     },
        //     signers: [testKey]
        // });

        const workerData = await program.account.workerAccount.fetch(workerInfo.workerAccount.publicKey);
        console.log(workerData);
        console.log(workerInfo.workerAccount.publicKey.toString());

        await program.rpc.completeTask(mintBump, seed, {
            accounts: {
                workerProgramAccount: workerProgramAccountPublicKey,
                workerAccount: workerInfo.workerAccount.publicKey,
                workerTokenAccount: workerInfo.workerTokenAccount,
                tileAccount: gameAccount.firstTileKey,
                resourceMint: mint,
                resourceTokenAccount: resourceTokenAccount,
                signer: testKey.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [testKey]
        });
    } catch (err) {
        errorMsg = err.msg;
        console.log(err.msg);
    }

    assert.ok(errorMsg === 'Worker has not completed the task')
  });
});
