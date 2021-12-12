import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
const { assert } = require('chai');
import { Program } from '@project-serum/anchor';
import { nanoid } from 'nanoid';
import { TileTest, IDL } from '../target/types/tile_test';
import numberOfTilesCalculator from './utils/numberOfTilesCalculator';

const createMintInfo = async (anchor, programId) =>  {
  const seed = nanoid();
  const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

  return {
    mint,
    mintBump,
    seed
  };
}

const createMintInfoResource = async (anchor, programId, q, r) => {
  const seed = `r${q}r${r}`;
  const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

  return {
    mint,
    mintBump,
    seed
  };
}

const nextCoordinate = (maxTilesFromCenter, q, r) => {
  const rMax = Math.min(maxTilesFromCenter, -q + (maxTilesFromCenter));

  if (r === rMax) {
    const newQ = q + 1;
    const rMin = Math.max(-maxTilesFromCenter, -newQ - maxTilesFromCenter);
    return {
      q: newQ,
      r: rMin
    };
  }

  return {
    q,
    r: r + 1
  };
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const resourceTypes = {
  '0': { variant: 0, wood: { } },
  '1': { variant: 1, gold: { } },
  '2': { variant: 2, wheat: { } },
  '3': { variant: 3, iron: { } }
}
const randomResourceType = () => resourceTypes[getRandomInt(Object.keys(resourceTypes).length)]

async function fetchTokenAccount(program, address) {
  const tokenAccountInfo = await program.provider.connection.getAccountInfo(address);

  return spl.AccountLayout.decode(tokenAccountInfo.data);
}

// Not really tests
// Just building myself the game to work with for the UI
describe('Build Game', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TileTest as Program<TileTest>;
  const programId = program.programId;

  const maxTilesFromCenter = 9; // 271 tiles

  const uiPublicKey = new anchor.web3.PublicKey('bgEUZT6TdrRB1oRE9QtKEKjZXTksq2afeHqPRZeoTEq');

  // it('Initilizes the game', async () => {
  //   const gameAccount = anchor.web3.Keypair.generate();
  //   const tileAccount = anchor.web3.Keypair.generate();

  //   const tileMintInfo = await createMintInfo(anchor, programId);
  //   const resourceMintInfo = await createMintInfoResource(anchor, programId, -maxTilesFromCenter, 0);

  //   const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //     spl.TOKEN_PROGRAM_ID,
  //     tileMintInfo.mint,
  //     uiPublicKey
  //   );

  //   const tileType = { "variant": 0, wood: { } };

  //   await program.rpc.initialize(
  //     tileType,
  //     maxTilesFromCenter,
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
  //         receiver: uiPublicKey,
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
  const gameAccountPublicKeyString = 'NmxSeFArvRoTLoxm2FnogMbGhWcjsouVCSys4eAdqHA';

  it('should allow us to mint all da tiles', async () => {
    const gameAccountPublicKey = new anchor.web3.PublicKey(gameAccountPublicKeyString);
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);

    const maxNumberOfTiles = gameAccount.maxTiles.toNumber();

    let currentNumber = 0;
    do {
      const tileAccount = anchor.web3.Keypair.generate();

      const currentGameAccount = await program.account.gameAccount.fetch(gameAccountPublicKey);
      currentNumber = currentGameAccount.currentNumberOfTiles.toNumber();

      console.log(currentNumber);

      const currentTileAccount = await program.account.tileAccount.fetch(currentGameAccount.currentTileKey);

      console.log(JSON.stringify(currentTileAccount, null, 4));

      const tileMintInfo = await createMintInfo(anchor, programId);
      const tileDestinationAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        tileMintInfo.mint,
        uiPublicKey
      );

      const {q, r} = nextCoordinate(maxTilesFromCenter, currentTileAccount.q, currentTileAccount.r);
      const resourceMintInfo = await createMintInfoResource(anchor, programId, q, r);

      const tileType = randomResourceType();
      await program.rpc.mintTile(
        tileType,
        tileMintInfo.mintBump,
        tileMintInfo.seed,
        resourceMintInfo.mintBump,
        resourceMintInfo.seed,
        {
          accounts: {
            newTile: tileAccount.publicKey,
            tileMint: tileMintInfo.mint,
            resourceMint: resourceMintInfo.mint,
            gameAccount: gameAccountPublicKey,
            currentTile: currentGameAccount.currentTileKey,
            authority: program.provider.wallet.publicKey,
            destination: tileDestinationAccount,
            receiver: uiPublicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [tileAccount]
      });

      currentNumber += 1;
    } while(currentNumber < maxNumberOfTiles);
  });
});
