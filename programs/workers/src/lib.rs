use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use borsh::{BorshDeserialize, BorshSerialize};
use spl_token;
use tile_test::program::*;

declare_id!("DCCJ7jBybHT9Z9ZpDhXYKKS5S5LpQEBJeyiqwadCChdz");

#[program]
pub mod workers {
    use super::*;

    // only meant to be run once. Creates a special worker account that can call the tile program
    pub fn initialize(_ctx: Context<Init>) -> ProgramResult {
        Ok(())
    }

    pub fn mint_worker(ctx: Context<MintWorker>, worker_bump: u8, worker_mint_seed: String) -> ProgramResult {
        let worker_account = &mut ctx.accounts.worker_account;
        let worker_mint = &mut ctx.accounts.worker_mint;

        worker_account.task = None;
        worker_account.mint_key = worker_mint.key();

        // mint and turn mint off
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: worker_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: worker_mint.to_account_info(),
                },
                &[&[&worker_mint_seed.as_bytes(), &[worker_bump]]],
            ),
            1,
        )?;

        // turn off the mint forever to make it a "NFT"
        anchor_spl::token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::SetAuthority {
                    current_authority: worker_mint.to_account_info(),
                    account_or_mint: worker_mint.to_account_info()
                },
                &[&[&worker_mint_seed.as_bytes(), &[worker_bump]]]
            ),
            spl_token::instruction::AuthorityType::MintTokens,
            None
        )?;

        Ok(())
    }

    pub fn assign_task(ctx: Context<AssignTask>) -> ProgramResult {
        let worker = &mut ctx.accounts.worker_account;
        let worker_token_account = &ctx.accounts.worker_token_account;
        let signer = & ctx.accounts.signer;

        let tile_account = &ctx.accounts.tile_account;

        if signer.key() != worker_token_account.owner {
            return Err(ErrorCode::InvalidOwner.into());
        }

        if worker.mint_key != worker_token_account.mint.key() {
            return Err(ErrorCode::NoWorkerNFT.into());
        }

        if worker_token_account.amount != 1 {
            return Err(ErrorCode::NoWorkerNFT.into());
        }

        if worker.task.is_some() {
            return Err(ErrorCode::WorkerAlreadyHasTask.into());
        }

        let task = Task {
            tile_public_key: tile_account.key(),
            complete_time: Clock::get().unwrap().unix_timestamp + 120 // adds two minutes from now
        };
        worker.task = Some(task);

        Ok(())
    }

    // pub fn complete_task(ctx: Context<CompleteTask>) -> ProgramResult {
    //     Ok(())
    // }
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init,
        payer = signer,
        space = 8
    )]
    pub worker_program_account: Account<'info, WorkerProgramAccount>,

    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(worker_bump: u8, worker_mint_seed: String)]
pub struct MintWorker<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 1 + 32 + 8
    )]
    pub worker_account: Account<'info, WorkerAccount>,

    #[account(
        init,
        payer = signer,
        seeds = [worker_mint_seed.as_bytes()],
        bump = worker_bump,
        mint::decimals = 0,
        mint::authority = worker_mint
    )]
    pub worker_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub receiver: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = worker_mint,
        associated_token::authority = receiver
    )]
    pub destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct AssignTask<'info> {
    #[account(mut)]
    pub worker_account: Account<'info, WorkerAccount>,

    pub worker_token_account: Account<'info, TokenAccount>,

    pub tile_account: Account<'info, tile_test::TileAccount>,
    pub signer: Signer<'info>
}

#[account]
pub struct WorkerProgramAccount {

}

#[account]
pub struct WorkerAccount {
    pub mint_key: Pubkey,
    // pub mint_seed: [u8; 4], // 4 bytes (4294967296) (don't use strings in the future ya dummy!)
    pub task: Option<Task>
}

#[derive(Debug, Clone, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct Task {
    tile_public_key: Pubkey,
    complete_time: i64
}

#[error]
pub enum ErrorCode {
    #[msg("Worker already has a task")]
    WorkerAlreadyHasTask,

    #[msg("The account does not own the NFT for the worker")]
    NoWorkerNFT,

    #[msg("You are not the owner of this account")]
    InvalidOwner
}