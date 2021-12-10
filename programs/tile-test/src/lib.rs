use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

declare_id!("4FZCjDLXZbRGvqHD3W6FyQoYn5YkgrsYxj7KG3xW5AW7");

#[derive(Debug, Clone, PartialEq, BorshDeserialize, AnchorSerialize)]
pub enum TileTypes {
    Wood = 0,
    Gold = 1,
    Wheat = 2,
    Iron = 3
}

#[program]
pub mod tile_test {
    use std::{env::current_exe, thread::current};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let initial_account = &mut ctx.accounts.initial_account;
        let tile_account = &mut ctx.accounts.tile;
        let authoriy = &mut ctx.accounts.authority;

        initial_account.first_tile_key = tile_account.key();
        initial_account.tiles = 1;

        tile_account.owner = authoriy.key();
        tile_account.next_tile = None;
        tile_account.x = 0;
        tile_account.y = 0;
        tile_account.tile_type = TileTypes::Wheat;

        Ok(())
    }

    pub fn mint_tile(ctx: Context<MintTile>, tile_type: TileTypes) -> ProgramResult {
        // this must be the most recent tile (i.e. next tile none)
        let current_tile = &mut ctx.accounts.current_tile;

        if current_tile.next_tile.is_some() {
            return Err(ErrorCode::WrongTile.into());
        }

        let new_tile = &mut ctx.accounts.new_tile;
        let authority = &mut ctx.accounts.authority;

        new_tile.next_tile = None;
        new_tile.owner = authority.key();
        if current_tile.x == 5 {
            new_tile.x = 0;
            new_tile.y = current_tile.y + 1;
        } else {
            new_tile.x = current_tile.x + 1;
            new_tile.y = current_tile.y;
        }
        new_tile.tile_type = tile_type;

        current_tile.next_tile = Some(new_tile.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub initial_account: Account<'info, InitializeAccount>,

    // failed to deseralize account is when we don't have enough space
    #[account(init, payer = authority, space = 8 + 32 + 2 + 2 + 1 + 32 + 1)]
    pub tile: Account<'info, TileAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct MintTile<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 2 + 2 + 1 + 32 + 1)]
    pub new_tile: Account<'info, TileAccount>,

    #[account(mut)]
    pub initial_account: Account<'info, InitializeAccount>,

    #[account(mut)]
    pub current_tile: Account<'info, TileAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[account]
pub struct TileAccount {
    pub owner: Pubkey,
    pub x: u16,
    pub y: u16,
    pub tile_type: TileTypes,
    // GAH an option is 1 additional byte!!!
    pub next_tile: Option<Pubkey>
}

#[account]
pub struct InitializeAccount {
    pub first_tile_key: Pubkey,
    pub tiles: u64
}

// notes for self, has_one=authority enforces a constraint.
// #[account(has_one = authority) say that x.some_account.authority == Acccounts.authority.key
// https://project-serum.github.io/anchor/tutorials/tutorial-2.html#defining-a-program

#[error]
pub enum ErrorCode {
    #[msg("Not the most recent tile")]
    WrongTile
}