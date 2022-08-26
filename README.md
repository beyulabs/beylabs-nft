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
