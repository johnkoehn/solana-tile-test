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

describe('Worker', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Workers as Program<Workers>;
  const programId = program.programId;

  const tileProgram = anchor.workspace.TileTest as Program<TileTest>
  const tileProgramId = tileProgram.programId;

  const uiPublicKey = new anchor.web3.PublicKey('bgEUZT6TdrRB1oRE9QtKEKjZXTksq2afeHqPRZeoTEq');
  const gameAccountPublicKey = new anchor.web3.PublicKey('NmxSeFArvRoTLoxm2FnogMbGhWcjsouVCSys4eAdqHA');

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
  const workerProgramAccountPublicKey = '3pymbNnN2VYi79iRVddNcUefTL2T2AhqNjSJaZm9PTmr';

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

  it('should allow owner of the work to set the worker to perform a task', async () => {
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

  it('should not allow a user to complete a work task', async () => {
    const gameAccount = await tileProgram.account.gameAccount.fetch(gameAccountPublicKey);
    const tileAccount = await tileProgram.account.tileAccount.fetch(gameAccount.firstTileKey);

    // get bump for resource
    const seed = `r${tileAccount.q}r${tileAccount.r}`;
    const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], tileProgram.programId);

    const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mint,
        tileProgram.provider.wallet.publicKey
    );

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
    // pub resource_mint: Account<'info, Mint>,

    // pub resource_token_account: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub worker_token_account: Account<'info, TokenAccount>,

    // pub signer: Signer<'info>,

    // pub authority: Signer<'info>,
    // pub system_program: Program<'info, System>,
    // pub associated_token_program: Program<'info, AssociatedToken>,
    // pub token_program: Program<'info, Token>,
    // pub rent: Sysvar<'info, Rent>
  });
});
