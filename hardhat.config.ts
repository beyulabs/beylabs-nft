import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// Hardhat tasks for contract interactions
task("base-uri")
  .setDescription("Set contract BASE_URI")
  .addParam("uri")
  .setAction(async (taskArgs: { uri: string }) => {
    console.log("set BASE_URI to", taskArgs.uri);
  });

task("boarding")
  .setDescription("Enable/disable boarding phase")
  .addParam("enabled")
  .setAction(async (taskArgs: { enabled: string }) => {
    console.log("set boarding to", Boolean(taskArgs.enabled));
  });

task("gift")
  .setDescription("Mint and gift token(s) to address")
  .addParam("address")
  .addParam("tokens")
  .setAction(async (taskArgs: { address: string; tokens: string }) => {
    console.log(`send ${taskArgs.tokens} to wallet ${taskArgs.address}`);
  });

task("preboarding")
  .setDescription("Enable/disable preboarding phase")
  .addParam("enabled")
  .setAction(async (taskArgs: { enabled: string }) => {
    console.log("set preboarding to", Boolean(taskArgs.enabled));
  });

task("wallet-limit")
  .setDescription("Set per wallet token limit")
  .addParam("limit")
  .setAction(async (taskArgs: { limit: string }) => {
    console.log("set wallet limit to", Number(taskArgs.limit));
  });

task("withdrawal-address")
  .setDescription("Set withdrawal address")
  .addParam("address")
  .setAction(async (taskArgs: { address: string }) => {
    console.log("set withdrawal addreess to", taskArgs.address);
  });

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
