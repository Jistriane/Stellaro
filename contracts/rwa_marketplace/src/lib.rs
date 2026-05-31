#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, symbol_short, Address, Env, IntoVal, Vec,
};

#[contracttype]
pub enum DataKey {
    Admin,
    VcRegistry,
    Auction(u32),
    AuctionCount,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Auction {
    pub id: u32,
    pub seller: Address,
    pub asset: Address,
    pub amount: i128,
    pub min_bid: i128,
    pub highest_bid: i128,
    pub highest_bidder: Address,
    pub end_time: u64,
    pub status: u32, // 0: Open, 1: Concluded, 2: Cancelled
}

#[contractevent]
pub struct UpgradeEvent {
    pub new_wasm_hash: soroban_sdk::BytesN<32>,
}

#[contractevent]
pub struct PlaceBidEvent {
    pub auction_id: u32,
    pub bidder: Address,
    pub amount: i128,
}

#[contractevent]
pub struct StartAuctionEvent {
    pub auction_id: u32,
    pub seller: Address,
    pub asset: Address,
    pub amount: i128,
    pub min_bid: i128,
    pub end_time: u64,
}

#[contractevent]
pub struct ConcludeAuctionEvent {
    pub auction_id: u32,
    pub winner: Address,
}

#[contract]
pub struct RwaMarketplace;

#[contractimpl]
impl RwaMarketplace {
    pub fn initialize(env: Env, admin: Address, vc_registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::AuctionCount, &0u32);
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr: Address = env.storage().instance().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: user needs KYC VC for RWA");
        }
    }

    pub fn start_auction(env: Env, seller: Address, asset: Address, amount: i128, min_bid: i128, duration: u64) -> u32 {
        seller.require_auth();
        Self::check_compliance(&env, seller.clone());

        let mut count: u32 = env.storage().instance().get(&DataKey::AuctionCount).unwrap_or(0);
        count += 1;

        let end_time = env.ledger().timestamp() + duration;
        let auction = Auction {
            id: count,
            seller: seller.clone(),
            asset: asset.clone(),
            amount,
            min_bid,
            highest_bidder: env.current_contract_address(),
            highest_bid: 0,
            end_time,
            status: 0,
        };

        env.storage().instance().set(&DataKey::Auction(count), &auction);
        env.storage().instance().set(&DataKey::AuctionCount, &count);
        env.events().publish_event(&StartAuctionEvent {
            auction_id: count,
            seller,
            asset,
            amount,
            min_bid,
            end_time,
        });
        count
    }

    pub fn place_bid(env: Env, bidder: Address, auction_id: u32, amount: i128) {
        bidder.require_auth();
        Self::check_compliance(&env, bidder.clone());

        let mut auction: Auction = env.storage().instance().get(&DataKey::Auction(auction_id)).expect("auction not found");
        if env.ledger().timestamp() > auction.end_time {
            panic!("auction ended");
        }
        if amount < auction.min_bid || amount <= auction.highest_bid {
            panic!("bid too low");
        }

        auction.highest_bid = amount;
        auction.highest_bidder = bidder.clone();
        env.storage().instance().set(&DataKey::Auction(auction_id), &auction);

        env.events().publish_event(&PlaceBidEvent { auction_id, bidder, amount });
    }

    pub fn conclude_auction(env: Env, auction_id: u32) {
        let mut auction: Auction = env.storage().instance().get(&DataKey::Auction(auction_id)).expect("auction not found");
        if env.ledger().timestamp() <= auction.end_time {
            panic!("auction not ended");
        }
        if auction.status != 0 {
            panic!("auction not open");
        }

        auction.status = 1;
        env.storage().instance().set(&DataKey::Auction(auction_id), &auction);

        env.events().publish_event(&ConcludeAuctionEvent { auction_id, winner: auction.highest_bidder });
    }

    pub fn auction_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::AuctionCount).unwrap_or(0)
    }

    pub fn get_auction(env: Env, auction_id: u32) -> Auction {
        env.storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .expect("auction not found")
    }

    pub fn list_auctions(env: Env, start: u32, limit: u32) -> Vec<Auction> {
        let total: u32 = env.storage().instance().get(&DataKey::AuctionCount).unwrap_or(0);
        let mut out: Vec<Auction> = Vec::new(&env);
        let mut i = start;
        let end = start.saturating_add(limit);
        while i > 0 && i <= total && i < end {
            if let Some(a) = env.storage().instance().get(&DataKey::Auction(i)) {
                out.push_back(a);
            }
            i += 1;
        }
        out
    }

    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: soroban_sdk::BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        caller.require_auth();
        assert!(caller == admin, "unauthorized");
        
        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        env.events().publish_event(&UpgradeEvent { new_wasm_hash });
    }
}
