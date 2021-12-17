use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use spl_token;

pub mod hexagon;
use hexagon::*;

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
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, tile_type: TileTypes, tiles_from_center: u8, tile_mint_bump: u8, tile_mint_seed: String, _resource_mint_bump: u8, _resource_mint_seed: String) -> ProgramResult {
        let game_account = &mut ctx.accounts.game_account;
        let new_tile = &mut ctx.accounts.new_tile;

        game_account.first_tile_key = new_tile.key();
        game_account.current_tile_key = new_tile.key();
        game_account.max_tiles = calculate_number_of_tiles(tiles_from_center as u64);
        game_account.current_number_of_tiles = 1;
        game_account.max_tiles_from_center = tiles_from_center;

        new_tile.mint_key = ctx.accounts.tile_mint.key();
        new_tile.resource_key = ctx.accounts.resource_mint.key();
        new_tile.next_tile = None;
        new_tile.q = -(tiles_from_center as i16);
        new_tile.r = 0;
        new_tile.tile_type = tile_type;

        // mint token to repersent the tile
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.tile_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.tile_mint.to_account_info(),
                },
                &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]],
            ),
            1,
        )?;

        // turn off the mint forever to make it a "NFT"
        anchor_spl::token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::SetAuthority {
                    current_authority: ctx.accounts.tile_mint.to_account_info(),
                    account_or_mint: ctx.accounts.tile_mint.to_account_info()
                },
                &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]]
            ),
            spl_token::instruction::AuthorityType::MintTokens,
            None
        )?;

        Ok(())
    }

    pub fn mint_tile(ctx: Context<MintTile>, tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String, _resource_mint_bump: u8, _resource_mint_seed: String) -> ProgramResult {
        // this must be the most recent tile (i.e. next tile none)
        let current_tile = &mut ctx.accounts.current_tile;
        let game_account = &mut ctx.accounts.game_account;

        if current_tile.next_tile.is_some() || game_account.current_tile_key != current_tile.key() {
            return Err(ErrorCode::WrongTile.into());
        }


        if game_account.current_number_of_tiles == game_account.max_tiles {
            return Err(ErrorCode::MaxTiles.into());
        }

        let new_tile = &mut ctx.accounts.new_tile;

        let (q, r) = calculate_next_coordinates(game_account.max_tiles_from_center, current_tile.q, current_tile.r);

        // set up new tile
        new_tile.next_tile = None;
        new_tile.q = q;
        new_tile.r = r;
        new_tile.tile_type = tile_type;
        new_tile.mint_key = ctx.accounts.tile_mint.key();
        new_tile.resource_key = ctx.accounts.resource_mint.key();

        // current tile no longer current
        current_tile.next_tile = Some(new_tile.key());
        game_account.current_tile_key = new_tile.key();

        game_account.current_number_of_tiles += 1;


        // mint token to repersent the tile
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.tile_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.tile_mint.to_account_info(),
                },
                &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]],
            ),
            1,
        )?;

        // turn off the mint forever to make it a "NFT"
        anchor_spl::token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::SetAuthority {
                    current_authority: ctx.accounts.tile_mint.to_account_info(),
                    account_or_mint: ctx.accounts.tile_mint.to_account_info()
                },
                &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]]
            ),
            spl_token::instruction::AuthorityType::MintTokens,
            None
        )?;
        Ok(())
    }

    // the simple goal here
    // can we verify the user has a token repersenting they own the tile
    pub fn generate_resource(ctx: Context<GenerateResource>, resource_mint_bump: u8, resource_mint_seed: String) -> ProgramResult {
        let tile = &ctx.accounts.tile;
        let token_account = &ctx.accounts.tile_token_account;
        let resource_mint = &mut ctx.accounts.resource_mint;

        // correct mint?
        if tile.resource_key != resource_mint.key() {
            return Err(ErrorCode::WrongMint.into());
        }

        // correct token account?
        if tile.mint_key != token_account.mint.key() {
            return Err(ErrorCode::WrongTokenAccount.into())
        }

        // does token account have amount 1 ?
        if token_account.amount != 1 {
            return Err(ErrorCode::NoNFT.into())
        }

        msg!("Mint Token");
        // generate a resource token for the user
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: resource_mint.to_account_info(),
                    to: ctx.accounts.resource_token_account.to_account_info(),
                    authority: resource_mint.to_account_info(),
                },
                &[&[&resource_mint_seed.as_bytes(), &[resource_mint_bump]]],
            ),
            1,
        )?;
        Ok(())
    }

    pub fn worker_complete_task(ctx: Context<WorkerCompleteTask>, resource_mint_bump: u8, resource_mint_seed: String, amount: u64) -> ProgramResult {
        if ctx.accounts.signer.key().to_string() != "AKu39bR5iuaAUHhdppP5nYUTANVwAYSuXwfoaARk4aka" {
            return Err(ErrorCode::WorkerProgramOnly.into())
        }

        msg!("Program successfully called!");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(tile_type: TileTypes, tiles_from_center: u8, tile_mint_bump: u8, tile_mint_seed: String, resource_mint_bump: u8, resource_mint_seed: String)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 8 + 8 + 1)]
    pub game_account: Account<'info, GameAccount>,

    // failed to deseralize account is when we don't have enough space
    #[account(init, payer = authority, space = 8 + 32 + 32 + 2 + 2 + 1 + 32 + 1)]
    pub new_tile: Account<'info, TileAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [tile_mint_seed.as_bytes()],
        bump = tile_mint_bump,
        mint::decimals = 0,
        mint::authority = tile_mint
    )]
    pub tile_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        seeds = [resource_mint_seed.as_bytes()],
        bump = resource_mint_bump,
        mint::decimals = 4,
        mint::authority = resource_mint
    )]
    pub resource_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub receiver: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = tile_mint,
        associated_token::authority = receiver,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

// resource mint seed is [`${tile.x}`, `${tile.y}`]
#[derive(Accounts)]
#[instruction(tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String, resource_mint_bump: u8, resource_mint_seed: String)]
pub struct MintTile<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 2 + 2 + 1 + 32 + 1)]
    pub new_tile: Account<'info, TileAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [tile_mint_seed.as_bytes()],
        bump = tile_mint_bump,
        mint::decimals = 0,
        mint::authority = tile_mint
    )]
    pub tile_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        seeds = [resource_mint_seed.as_bytes()],
        bump = resource_mint_bump,
        mint::decimals = 4,
        mint::authority = resource_mint
    )]
    pub resource_mint: Account<'info, Mint>,

    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,

    #[account(mut)]
    pub current_tile: Account<'info, TileAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub receiver: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = tile_mint,
        associated_token::authority = receiver
    )]
    pub destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(resource_mint_bump: u8, resource_mint_seed: String)]
pub struct GenerateResource<'info> {
    pub tile: Account<'info, TileAccount>,
    pub tile_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub resource_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = resource_mint,
        associated_token::authority = authority
    )]
    pub resource_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(resource_mint_bump: u8, resource_mint_seed: String, amount: u64)]
pub struct WorkerCompleteTask<'info> {
    #[account(mut)]
    pub resource_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = resource_mint,
        associated_token::authority = receiver
    )]
    pub resource_token_account: Account<'info, TokenAccount>,

    pub signer: Signer<'info>,
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

// Account not owned by the program
// CpiAccount

#[account]
pub struct TileAccount {
    pub mint_key: Pubkey,
    pub resource_key: Pubkey,
    pub q: i16,
    pub r: i16,
    pub tile_type: TileTypes,
    // GAH an option is 1 additional byte!!!
    pub next_tile: Option<Pubkey>
}

#[account]
pub struct GameAccount {
    pub first_tile_key: Pubkey,
    pub current_tile_key: Pubkey,
    pub max_tiles: u64,
    pub current_number_of_tiles: u64,
    pub max_tiles_from_center: u8
}

// notes for self, has_one=authority enforces a constraint.
// #[account(has_one = authority) say that x.some_account.authority == Acccounts.authority.key
// https://project-serum.github.io/anchor/tutorials/tutorial-2.html#defining-a-program

#[error]
pub enum ErrorCode {
    #[msg("Not the most recent tile")]
    WrongTile,

    #[msg("Not the correct resource mint for the tile")]
    WrongMint,

    #[msg("Not the correct token account for the tile")]
    WrongTokenAccount,

    #[msg("The account does not own the NFT for the tile")]
    NoNFT,

    #[msg("The game has minted the max number of tiles")]
    MaxTiles,

    #[msg("Only the worker program can call this endpoint")]
    WorkerProgramOnly
}