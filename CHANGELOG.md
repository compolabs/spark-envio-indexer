# Changelog

## [v0.0.4] - 2024-08-26
### Changes in GraphQL Schema (schema.graphql)

- **Removal of `asset_type` field**:
  - The `asset_type` field has been removed from the following types:
    - `OpenOrderEvent`
    - `Order`
    - `ActiveSellOrder`
    - `ActiveBuyOrder`
  
  This change may impact API integrations that use these types, as the asset type (`AssetType`) data is no longer transmitted.

- **Updated Types**:
  - The types `Order`, `ActiveSellOrder`, and `ActiveBuyOrder` now contain only the following fields:
    - `id`
    - `asset`
    - `amount`
    - `order_type`
    - `price`
    - `user`

- **General Improvements**:
  - Structural data optimizations have been made to simplify the model and improve query performance.

## [v0.0.3] - 2024-08-20
### Additions and Fixes
