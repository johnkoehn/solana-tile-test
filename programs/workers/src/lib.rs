use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use borsh::{BorshDeserialize, BorshSerialize};
use spl_token;
use tile_test::program::*;
// use tile_test::cpi::accounts::WorkerCompleteTask;

declare_id!("DCCJ7jBybHT9Z9ZpDhXYKKS5S5LpQEBJeyiqwadCChdz");

fn worker_checks(worker: &Account<WorkerAccount>, worker_token_account: &Account<TokenAccount>, signer: &Signer) ->  Result<()> {
    if signer.key() != worker_token_account.owner {
        return Err(ErrorCode::InvalidOwner.into());
    }

    if worker.mint_key != worker_token_account.mint.key() {
        return Err(ErrorCode::NoWorkerNFT.into());
    }

    if worker_token_account.amount != 1 {
        return Err(ErrorCode::NoWorkerNFT.into());
    }

    Ok(())
}


#[program]
pub mod workers {
    use std::fmt::Result;

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

        worker_checks(&worker, worker_token_account, signer)?;

        if worker.task.is_some() {
            return Err(ErrorCode::WorkerAlreadyHasTask.into());
        }

        worker.task = Some(Task {
            tile_public_key: tile_account.key(),
            complete_time: Clock::get().unwrap().unix_timestamp + 10 // adds ten seconds minutes from now
        });

        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>, resource_mint_bump: u8, resource_mint_seed: String) -> ProgramResult {
        let worker = &mut ctx.accounts.worker_account;
        let worker_token_account = &ctx.accounts.worker_token_account;
        let signer = & ctx.accounts.signer;

        let tile_account = &ctx.accounts.tile_account;

        worker_checks(&worker, worker_token_account, signer)?;

        match worker.task.as_mut() {
            Some(_) => {},
            None => return Err(ErrorCode::NoWorkerTask.into())
        }

        let task = worker.task.as_ref().unwrap();
        let current_time = Clock::get().unwrap().unix_timestamp;
        msg!("current time: {:?}", current_time);
        msg!("worker task complete time: {:?}", task.complete_time);

        // we still have time until the task completes
        if task.complete_time > current_time {
            return Err(ErrorCode::WorkerHasNotCompletedTheTask.into());
        }


        // this is a failed program
        // worker and tile-test should have been combined under a singular project called econ sim
        // let cpi_accounts = tile_test::WorkerCompleteTask {
        //     resource_mint: ctx.accounts.resource_mint,
        //     resource_token_account: ctx.accounts.resource_token_account,
        //     signer: ctx.accounts.worker_program_account,

        // };
        // mint the resource
        // tile_test::cpi::worker_complete_task();
        Ok(())
    }
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

#[derive(Accounts)]
#[instruction(resource_mint_bump: u8, resource_mint_seed: String)]
pub struct CompleteTask<'info> {
    pub worker_program_account: Account<'info, WorkerProgramAccount>,

    #[account(mut)]
    pub worker_account: Account<'info, WorkerAccount>,

    pub worker_token_account: Account<'info, TokenAccount>,
    pub tile_account: Account<'info, tile_test::TileAccount>,

    pub resource_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = resource_mint,
        associated_token::authority = signer
    )]
    pub resource_token_account: Account<'info, TokenAccount>,

    // when a signer creates an account, make sure it is mutable
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
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
    InvalidOwner,

    #[msg("The worker had no task!")]
    NoWorkerTask,

    #[msg("Worker has not completed the task")]
    WorkerHasNotCompletedTheTask
}