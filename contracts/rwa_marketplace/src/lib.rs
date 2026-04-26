#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Auction {
    pub seller: Address,
    pub asset_token: Address,
    pub amount: i128,
    pub min_bid: i128,
    pub highest_bidder: Address,
    pub highest_bid_amount: i128,
    pub end_time: u64,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Auction(u32),
    AuctionCount,
}

#[contract]
pub struct RwaMarketplace;

#[contractimpl]
impl RwaMarketplace {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn start_auction(env: Env, seller: Address, asset_token: Address, amount: i128, min_bid: i128, duration: u64) -> u32 {
        seller.require_auth();
        
        let mut count: u32 = env.storage().instance().get(&DataKey::AuctionCount).unwrap_or(0);
        count += 1;

        let auction = Auction {
            seller,
            asset_token,
            amount,
            min_bid,
            highest_bidder: env.current_contract_address(), // Placeholder
            highest_bid_amount: 0,
            end_time: env.ledger().timestamp() + duration,
            active: true,
        };

        env.storage().instance().set(&DataKey::Auction(count), &auction);
        env.storage().instance().set(&DataKey::AuctionCount, &count);
        
        count
    }

    pub fn place_bid(env: Env, bidder: Address, auction_id: u32, bid_amount: i128) {
        bidder.require_auth();
        
        let mut auction: Auction = env.storage().instance().get(&DataKey::Auction(auction_id)).expect("not found");
        
        if !auction.active || env.ledger().timestamp() > auction.end_time {
            panic!("auction not active");
        }

        if bid_amount < auction.min_bid || bid_amount <= auction.highest_bid_amount {
            panic!("bid too low");
        }

        // Em produção: o contrato precisaria segurar os fundos (escrow)
        // Aqui atualizamos o estado da maior oferta
        auction.highest_bidder = bidder;
        auction.highest_bid_amount = bid_amount;

        env.storage().instance().set(&DataKey::Auction(auction_id), &auction);
        
        env.events().publish(
            (symbol_short!("BID"), auction_id, bid_amount),
            auction.highest_bidder.clone()
        );
    }

    pub fn conclude_auction(env: Env, auction_id: u32) {
        let mut auction: Auction = env.storage().instance().get(&DataKey::Auction(auction_id)).expect("not found");
        
        if env.ledger().timestamp() <= auction.end_time {
            panic!("auction not yet ended");
        }
        
        if !auction.active {
            panic!("already concluded");
        }

        // Em produção: Transferir o asset RWA para o vencedor e os fundos para o vendedor
        // Aqui marcamos como inativo e emitimos evento
        auction.active = false;
        env.storage().instance().set(&DataKey::Auction(auction_id), &auction);

        env.events().publish(
            (symbol_short!("CONCLUDE"), auction_id),
            auction.highest_bidder
        );
    }
}
