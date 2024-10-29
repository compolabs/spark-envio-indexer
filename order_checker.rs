use anyhow::Result;
use dotenv::dotenv;
use fuels::{
    accounts::{provider::Provider, wallet::WalletUnlocked},
    crypto::SecretKey,
    types::{Address, Bits256, ContractId},
};
use serde::Serialize;
use spark_market_sdk::SparkMarketContract;
use std::env;
use std::str::FromStr;

const ORDER_ID: &str = "0x94a9a3cc7ceac8b2fdcae0bbcd79c1137ddd9534b0e606bde321e63798646eb0";

#[derive(Debug, Serialize)]
struct OrderChangeInfoWithTxId {
    change_type: String,
    block_height: u32,
    sender: String,
    tx_id: String,
    amount_before: u64,
    amount_after: u64,
}

pub(crate) async fn setup() -> Result<WalletUnlocked> {
    // Connect to the provider
    let provider = Provider::connect("testnet.fuel.network").await?;

    // Try to get the private key from environment
    if let Ok(private_key) = env::var("PRIVATE_KEY") {
        let wallet = WalletUnlocked::new_from_private_key(
            SecretKey::from_str(&private_key)?,
            Some(provider.clone()),
        );
        return Ok(wallet);
    }

    // If no private key, try to get the mnemonic phrase
    if let Ok(mnemonic) = env::var("MNEMONIC") {
        let wallet = WalletUnlocked::new_from_mnemonic_phrase(&mnemonic, Some(provider.clone()))?;
        return Ok(wallet);
    }

    // If neither PRIVATE_KEY nor MNEMONIC are provided, return an error
    Err(anyhow::anyhow!(
        "No valid private key or mnemonic found in environment"
    ))
}

#[tokio::test]
async fn get_order() -> Result<()> {
    dotenv().ok(); // Load .env file

    // Setup the wallet
    let wallet = setup().await?;

    // Get the contract ID from the environment
    let contract_id = env::var("CONTRACT_ID").unwrap();

    // Connect to the contract using the wallet
    let market =
        SparkMarketContract::new(ContractId::from_str(&contract_id).unwrap(), wallet).await;

    // Fetch the order using the provided ORDER_ID
    let order_id = Bits256::from_hex_str(ORDER_ID)?;
    let order = market.order(order_id).await?.value;

    println!("Order = {:#?}", order);

    // Fetch the order change info
    let order_change_info = market.order_change_info(order_id).await?.value;

    let order_change_info_with_tx_id: Vec<OrderChangeInfoWithTxId> = order_change_info
        .iter()
        .map(|info| OrderChangeInfoWithTxId {
            change_type: format!("{:?}", info.change_type),
            block_height: info.block_height,
            sender: format!("{:?}", info.sender),
            tx_id: Address::from(info.tx_id.0).to_string(),
            amount_before: info.amount_before,
            amount_after: info.amount_after,
        })
        .collect();

    for info in &order_change_info_with_tx_id {
        println!("OrderChangeInfoWithTxId = {:#?}", info);
    }

    Ok(())
}

pub fn ev(key: &str) -> Result<String> {
    env::var(key).map_err(|_| anyhow::anyhow!("Environment variable {} not found", key))
}
