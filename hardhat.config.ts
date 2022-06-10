import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

task("preboarding", "Opens/closes the pre-sale")
  .addParam("open", "boolean")
  .setAction(async (taskArgs, hre) => {});

task("boarding", "Opens/closes the general sale")
  .addParam("open", "boolean")
  .setAction(async (taskArgs, hre) => {});

task("wallet-limit", "Sets the per-wallet token limit")
  .addParam("limit", "# of tokens a wallet can mint")
  .setAction(async (taskArgs, hre) => {});

task("gift", "Gifts token to given address")
  .addParam("address", "address to send token(s) to")
  .addParam("tokens", "# of tokens to gift")
  .setAction(async (taskArgs, hre) => {});

task("withdraw-address", "Sets the withdrawal address")
  .addParam("address", "address receiving withdrawn funds")
  .setAction(async (taskArgs, hre) => {});

task("withdraw", "Gifts token to given address", async (taskArgs, hre) => {});

task("base-uri", "Sets token base URI")
  .addParam("uri", "base URI for token metadata")
  .setAction(async (taskArgs, hre) => {});

task("presale-list", "Sets token base URI")
  .addParam("root", "hex string root of pre-sale merkle tree")
  .setAction(async (taskArgs, hre) => {});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "ETH",
    showTimeSpent: true,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
