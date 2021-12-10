import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TileTest, IDL } from '../target/types/tile_test';

describe('tile-test', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TileTest as Program<TileTest>;

  // only going to initialize this once
  // eventually we would need to only allow some pubkey we own to init
  // it('Is initialized!', async () => {
  //   // Add your test here.
  //   // create initial account
  //   // create a tile account
  //   const initialAccount = anchor.web3.Keypair.generate();
  //   const tileAccount = anchor.web3.Keypair.generate();

  //   await program.rpc.initialize({
  //     accounts: {
  //       initialAccount: initialAccount.publicKey,
  //       tile: tileAccount.publicKey,
  //       authority: program.provider.wallet.publicKey,
  //       systemProgram: anchor.web3.SystemProgram.programId
  //     },
  //     signers: [initialAccount, tileAccount]
  //   });

  //   console.log(`Initial Account Public Key`, initialAccount.publicKey.toString());

  //   const initialAccountData = await program.account.initializeAccount.fetch(initialAccount.publicKey);
  //   const tileAccountData = await program.account.tileAccount.fetch(tileAccount.publicKey);

  //   console.log(JSON.stringify(initialAccountData, null, 4));
  //   console.log(JSON.stringify(tileAccountData, null, 4));
  // });

  // HWGmB8Nd2L2V61awTfCQ3vPXs8yw4RrA99CQq6ukBJca -- the pub key
  // it('should create more tiles', async () => {
  //   const tileAccount = anchor.web3.Keypair.generate();

  //   const initialAccountPublicKey = new anchor.web3.PublicKey('HWGmB8Nd2L2V61awTfCQ3vPXs8yw4RrA99CQq6ukBJca');
  //   const initialAccountData = await program.account.initializeAccount.fetch(initialAccountPublicKey);

  //   const tileAccountPublicKey = new anchor.web3.PublicKey(initialAccountData.firstTileKey);

  //   const newTileAccount = anchor.web3.Keypair.generate();

  //   const test = { "variant": 0, wood: { } };
  //   await program.rpc.mintTile(test, {
  //     accounts: {
  //       initialAccount: initialAccountPublicKey,
  //       currentTile: tileAccountPublicKey,
  //       newTile: newTileAccount.publicKey,
  //       authority: program.provider.wallet.publicKey,
  //       systemProgram: anchor.web3.SystemProgram.programId
  //     },
  //     signers: [newTileAccount]
  //   });

  //   const tileAccountData = await program.account.tileAccount.fetch(newTileAccount.publicKey);
  //   console.log(JSON.stringify(tileAccountData, null, 4));
  // })

  it('should link each one', async () => {
    const initialAccountPublicKey = new anchor.web3.PublicKey('HWGmB8Nd2L2V61awTfCQ3vPXs8yw4RrA99CQq6ukBJca');
    const initialAccountData = await program.account.initializeAccount.fetch(initialAccountPublicKey);

    const tileAccountPublicKey = new anchor.web3.PublicKey(initialAccountData.firstTileKey);
    const tileAccountData = await program.account.tileAccount.fetch(tileAccountPublicKey);

    const nextTileAccountPublicKey = new anchor.web3.PublicKey(tileAccountData.nextTile)
    const tileAccountData2 = await program.account.tileAccount.fetch(nextTileAccountPublicKey);

    console.log(JSON.stringify(tileAccountData, null, 4));
    console.log(JSON.stringify(tileAccountData2, null, 4));
  });
});
