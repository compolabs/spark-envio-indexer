use anyhow::{Context, Result};
use fuels::{
    accounts::{provider::Provider, wallet::WalletUnlocked},
    crypto::SecretKey,
    types::{Address, Bits256, ContractId},
};
use spark_market_sdk::MarketContract;
use std::env;
use std::str::FromStr;
use dotenv::dotenv;
use serde::Serialize;


const ORDER_ID: &str = "0x951c2ce6beac1c6798f3beae9dd1751aa24b7f88fb01b30aee41ebed50c13eba";


#[derive(Debug, Serialize)]
struct OrderChangeInfoWithTxId {
    change_type: String,
    block_height: u32,
    sender: String,
    tx_id: String,
    amount_before: u64,
    amount_after: u64,
}

#[tokio::test]
async fn get_order() {
    dotenv().ok();

    let provider = Provider::connect("testnet.fuel.network").await.unwrap();
    let private_key = ev("PRIVATE_KEY").unwrap();
    let contract_id = ev("CONTRACT_ID").unwrap();
    let wallet = WalletUnlocked::new_from_private_key(
        SecretKey::from_str(&private_key).unwrap(),
        Some(provider.clone()),
    );
    let market = MarketContract::new(ContractId::from_str(&contract_id).unwrap(), wallet).await;
    let order_id = Bits256::from_hex_str(ORDER_ID).unwrap();
    let order = market.order(order_id).await.unwrap().value;
    println!("order = {:#?}", order);

    let order_change_info = market.order_change_info(order_id).await.unwrap().value;
    let order_change_info_with_tx_id: Vec<OrderChangeInfoWithTxId> = order_change_info.iter().map(|info| {
        OrderChangeInfoWithTxId {
            change_type: format!("{:?}", info.change_type),
            block_height: info.block_height,
            sender: format!("{:?}", info.sender),
            tx_id: Address::from(info.tx_id.0).to_string(),
            amount_before: info.amount_before,
            amount_after: info.amount_after,
        }
    }).collect();

    for info in &order_change_info_with_tx_id {
        println!("order_change_info_with_tx_id = {:#?}", info);
    }
}

pub fn ev(key: &str) -> Result<String> {
    env::var(key).context(format!("Environment variable {} not found", key))
}
