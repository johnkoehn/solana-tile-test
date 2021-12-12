import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
const { assert } = require('chai');
import { Program } from '@project-serum/anchor';
import { nanoid } from 'nanoid';
import { TileTest, IDL } from '../target/types/tile_test';

const createMintInfo = async (anchor, programId) =>  {
  const seed = nanoid();
  const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

  return {
    mint,
    mintBump,
    seed
  };
}

const createMintInfoResource = async (anchor, programId, x, y) => {
  const seed = `r${x}r${y}`;
  const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

  return {
    mint,
    mintBump,
    seed
  };
}

async function fetchTokenAccount(program, address) {
  const tokenAccountInfo = await program.provider.connection.getAccountInfo(address);
  // console.log(JSON.stringify(tokenAccountInfo, null, 4))
  return spl.AccountLayout.decode(tokenAccountInfo.data);
}

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

describe('tile-test', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TileTest as Program<TileTest>;
  const programId = program.programId;

  // only going to initialize this once
  // eventually we would need to only allow some pubkey we own to init
  // it('Is initialized!', async () => {
  //   const gameAccount = anchor.web3.Keypair.generate();
  //   const tileAccount = anchor.web3.Keypair.generate();

  //   const tileMintInfo = await createMintInfo(anchor, programId);
  //   const resourceMintInfo = await createMintInfoResource(anchor, programId, 0, 0);

  //   const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //     spl.TOKEN_PROGRAM_ID,
  //     tileMintInfo.mint,
  //     program.provider.wallet.publicKey
  //   );

  //   await program.rpc.initialize(
  //     tileMintInfo.mintBump,
  //     tileMintInfo.seed,
  //     resourceMintInfo.mintBump,
  //     resourceMintInfo.seed,
  //     {
  //       accounts: {
  //         gameAccount: gameAccount.publicKey,
  //         newTile: tileAccount.publicKey,
  //         tileMint: tileMintInfo.mint,
  //         resourceMint: resourceMintInfo.mint,
  //         destination: tileDestinationAccount,
  //         authority: program.provider.wallet.publicKey,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //         tokenProgram: spl.TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //         rent: anchor.web3.SYSVAR_RENT_PUBKEY
  //       },
  //       signers: [gameAccount, tileAccount]
  //     }
  //   );

  //   console.log(`Initial Account Public Key`, gameAccount.publicKey.toString());

  //   const gameAccountData = await program.account.gameAccount.fetch(gameAccount.publicKey);
  //   const tileAccountData = await program.account.tileAccount.fetch(tileAccount.publicKey);
  //   const tokenAccount = await fetchTokenAccount(program,  tileDestinationAccount)
  //   console.log(JSON.stringify(gameAccountData, null, 4));
  //   console.log(JSON.stringify(tileAccountData, null, 4));
  //   console.log(JSON.stringify(tokenAccount, null, 4));
  // });

  // update this when creating new game account
  const gameAccountPublicKeyString = '3ddGZjGmEB9GdpHcxVoCYEunwERtod8hxZUsh2Guh9Ru';

  // it('should create more tiles', async () => {
  //   const tileMintInfo = await createMintInfo(anchor, programId);

  //   // anchor.web3.PublicKey.findProgramAddress()
  //   const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //     spl.TOKEN_PROGRAM_ID,
  //     tileMintInfo.mint,
  //     program.provider.wallet.publicKey
  //   );

  //   const gameAccountPublicKey = new anchor.web3.PublicKey(gameAccountPublicKeyString);
  //   const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

  //   const tileAccountPublicKey = new anchor.web3.PublicKey(gameAccount.firstTileKey);
  //   const currentTileAccount = await program.account.tileAccount.fetch(tileAccountPublicKey);

  //   const newTileAccount = anchor.web3.Keypair.generate();

  //   const { x, y } = calculateNextXY(currentTileAccount.x, currentTileAccount.y);
  //   const resourceMintInfo = await createMintInfoResource(anchor, programId, x, y);

  //   const tileType = { "variant": 0, wood: { } };
  //   await program.rpc.mintTile(
  //     tileType,
  //     tileMintInfo.mintBump,
  //     tileMintInfo.seed,
  //     resourceMintInfo.mintBump,
  //     resourceMintInfo.seed,
  //     {
  //       accounts: {
  //         newTile: newTileAccount.publicKey,
  //         tileMint: tileMintInfo.mint,
  //         resourceMint: resourceMintInfo.mint,
  //         gameAccount: gameAccountPublicKey,
  //         currentTile: tileAccountPublicKey,
  //         authority: program.provider.wallet.publicKey,
  //         destination: tileDestinationAccount,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //         tokenProgram: spl.TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //         rent: anchor.web3.SYSVAR_RENT_PUBKEY
  //       },
  //       signers: [newTileAccount]
  //   });

  //   const tileAccountData = await program.account.tileAccount.fetch(newTileAccount.publicKey);
  //   console.log(JSON.stringify(tileAccountData, null, 4));
  // })

  // it('should link each one', async () => {
  //   const initialAccountPublicKey = new anchor.web3.PublicKey('HWGmB8Nd2L2V61awTfCQ3vPXs8yw4RrA99CQq6ukBJca');
  //   const initialAccountData = await program.account.initializeAccount.fetch(initialAccountPublicKey);

  //   const tileAccountPublicKey = new anchor.web3.PublicKey(initialAccountData.firstTileKey);
  //   const tileAccountData = await program.account.tileAccount.fetch(tileAccountPublicKey);

  //   const nextTileAccountPublicKey = new anchor.web3.PublicKey(tileAccountData.nextTile)
  //   const tileAccountData2 = await program.account.tileAccount.fetch(nextTileAccountPublicKey);

  //   console.log(JSON.stringify(tileAccountData, null, 4));
  //   console.log(JSON.stringify(tileAccountData2, null, 4));
  // });

  // it('should generate a resource when the user is the owner', async () => {
  //   const gameAccountPublicKey = new anchor.web3.PublicKey(gameAccountPublicKeyString);
  //   const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

  //   const tileAccountPublicKey = new anchor.web3.PublicKey(gameAccount.firstTileKey);
  //   const firstTileAccount = await program.account.tileAccount.fetch(tileAccountPublicKey);

  //   const secondTilePublicKey = new anchor.web3.PublicKey(firstTileAccount.nextTile);
  //   const secondTileAccount = await program.account.tileAccount.fetch(secondTilePublicKey);

  //   const resourceMintSeed = `r${secondTileAccount.x}r${secondTileAccount.y}`
  //   const [resourceMint, resourceMintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(resourceMintSeed)], programId);

  //   const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //     spl.TOKEN_PROGRAM_ID,
  //     secondTileAccount.mintKey,
  //     program.provider.wallet.publicKey
  //   );

  //   const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //     spl.TOKEN_PROGRAM_ID,
  //     secondTileAccount.resourceKey,
  //     program.provider.wallet.publicKey
  //   );

  //   await program.rpc.generateResource(
  //     resourceMintBump,
  //     resourceMintSeed,
  //     {
  //       accounts: {
  //         tile: secondTilePublicKey,
  //         tileTokenAccount,
  //         resourceTokenAccount,
  //         resourceMint,
  //         authority: program.provider.wallet.publicKey,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //         tokenProgram: spl.TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //         rent: anchor.web3.SYSVAR_RENT_PUBKEY
  //       }
  //   });

  //   const accountInfo = await fetchTokenAccount(program, resourceTokenAccount);
  //   console.log('test', Uint32Array.from(accountInfo.amount).toString())
  // })

  // it('should not allow a random user to mint a token', async () => {
  //   let hadError = false;
  //   try {
  //     const resourceMintSeed = `r1r0`;
  //     const [resourceMint, resourceMintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(resourceMintSeed)], programId);

  //     const wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from([141,131,11,232,206,152,203,90,232,114,221,197,26,55,77,169,203,84,110,88,178,126,241,48,95,46,48,65,90,16,172,193,188,45,233,51,62,185,31,50,227,166,4,188,132,233,99,103,202,139,43,233,199,143,223,28,165,31,191,98,199,245,8,150]));
  //     const mint = new spl.Token(program.provider.connection, resourceMint, anchor.web3.SystemProgram.programId, wallet);

  //     console.log((await mint.getMintInfo()).supply);
  //   } catch (err) {
  //     console.log(err.message);
  //     hadError = true;
  //   }

  //   assert.ok(hadError)
  // });
});
