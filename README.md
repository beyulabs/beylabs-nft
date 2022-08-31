# Nexus Voyagers

### Smart contract

This smart contract was built using [Hardhat](https://hardhat.org/). You can refer to their [documentation](https://hardhat.org/docs) for more details.

### TL;DR

#### Local development

1. Spin up a local blockchain instance

```shell
npx hardhat node
```

2. Deploy the Nexus Voyagers contract to the local chain

```shell
npx hardhat run --network localhost scripts/deploy.ts
```

#### Unit tests

Unit tests are defined in the `test` subdirectory and can be executed locally by running:

```shell
npx hardhat test
```

We also have a GitHub Action (defined in `.github/workflows/hardhat.yml`) that automatically runs the tests when a PR is issued against the `main` branch.

Gas estimates are generated when tests are run using [hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter) and the [CoinMarketCap](https://coinmarketcap.com/) API.

### Environment variables

These values need to be defined in a local `.env` file:

- `COINMARKETCAP_API_KEY`: API key for CoinMarketCap, which is used to generate gas estimates when running unit tests
- `MAINNET_ETHERSCAN_API_KEY`: Etherscan API key for verifying contracts on mainnet
- `GOERLI_ETHERSCAN_API_KEY`: Etherscan API key for verifying contracts on Goerli testnet
- `HARDHAT_CONTRACT_ADDRESS`: Address of contract owner for local development
- `HARDHAT_CONTRACT_OWNER`: Address of deployed contract on local chain
- `GOERLI_URL`: URL for Goerli JSON-RPC provider
- `GOERLI_PRIVATE_KEY`: Private key for Goerli account to use for deployments/interactions
- `GOERLI_CONTRACT_ADDRESS`: Address of deployed contract on Goerli
- `GOERLI_CONTRACT_OWNER`: Address of contract owner on Goerli
- `MAINNET_URL`: URL for mainnet JSON-RPC provider
- `MAINNET_PRIVATE_KEY`: Private key for mainnet account to use for deployments/interactions
- `MAINNET_CONTRACT_ADDRESS`: Address of deployed contract on mainnet
- `MAINNET_CONTRACT_OWNER`: Address of contract owner on mainnet
