#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Order {
    pub id: u64,
    pub seller: Address,
    pub asset: Address,
    pub amount: i128,
    pub price_per_unit: i128,
    pub stablecoin: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Orders,
    OrderCount,
}

#[contract]
pub struct RwaMarketplace;

#[contractimpl]
impl RwaMarketplace {
    pub fn place_sell_order(env: Env, seller: Address, asset: Address, amount: i128, price: i128, stablecoin: Address) -> u64 {
        seller.require_auth();
        
        let mut count: u64 = env.storage().instance().get(&DataKey::OrderCount).unwrap_or(0);
        count += 1;

        let order = Order {
            id: count,
            seller: seller.clone(),
            asset,
            amount,
            price_per_unit: price,
            stablecoin,
        };

        let mut orders: Vec<Order> = env.storage().persistent().get(&DataKey::Orders).unwrap_or(Vec::new(&env));
        orders.push_back(order);
        
        env.storage().persistent().set(&DataKey::Orders, &orders);
        env.storage().instance().set(&DataKey::OrderCount, &count);

        count
    }

    pub fn buy_order(env: Env, buyer: Address, order_id: u64) {
        buyer.require_auth();
        
        let mut orders: Vec<Order> = env.storage().persistent().get(&DataKey::Orders).unwrap_or(Vec::new(&env));
        let mut order_index: Option<u32> = None;

        for i in 0..orders.len() {
            if orders.get(i).unwrap().id == order_id {
                order_index = Some(i);
                break;
            }
        }

        if let Some(index) = order_index {
            let order = orders.get(index).unwrap();
            
            // In a real app, transfer tokens here using SEP-41
            // 1. Transfer stablecoin from buyer to seller
            // 2. Transfer RWA token from seller to buyer (or from contract escrow)
            
            orders.remove(index);
            env.storage().persistent().set(&DataKey::Orders, &orders);
            
            env.events().publish((symbol_short!("trade"), order_id), (buyer, order.seller));
        } else {
            panic!("Order not found");
        }
    }

    pub fn get_orders(env: Env) -> Vec<Order> {
        env.storage().persistent().get(&DataKey::Orders).unwrap_or(Vec::new(&env))
    }
}
