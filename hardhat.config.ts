import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";

dotenv.config();

// Utils
const getConnectedContract = async (
  hre: HardhatRuntimeEnvironment
): Promise<Contract | null> => {
  try {
    const signer = await hre.ethers.getSigner(
      String(process.env.NV_CONTRACT_OWNER_DEVELOPMENT)
    );
    const NexusVoyagers = await hre.ethers.getContractAt(
      "NexusVoyagers",
      String(process.env.NV_CONTRACT_ADDRESS_DEVELOPMENT)
    );

    return await NexusVoyagers.connect(signer);
  } catch (error) {
    console.log("Failed to connect to contract:", error);
    return null;
  }
};

const parseBoolean = (flag: string): boolean | null => {
  switch (flag) {
    case "true":
      return JSON.parse(flag);
    case "false":
      return JSON.parse(flag);
    default:
      return null;
  }
};

// Tasks
task("base-uri")
  .setDescription("Set contract BASE_URI")
  .addParam("uri")
  .setAction(
    async (taskArgs: { uri: string }, hre: HardhatRuntimeEnvironment) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        console.log("Current base URI:", await connectedContract.BASE_URI());

        await connectedContract.setBaseURI(taskArgs.uri);

        console.log("New base URI:", await connectedContract.BASE_URI());
      }
    }
  );

task("boarding")
  .setDescription("Enable/disable boarding phase")
  .addParam("enabled")
  .setAction(
    async (taskArgs: { enabled: string }, hre: HardhatRuntimeEnvironment) => {
      const flag = parseBoolean(taskArgs.enabled);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null && flag != null) {
        console.log(
          "Current boarding status:",
          await connectedContract.generalBoarding()
        );

        await connectedContract.toggleGeneralBoarding(flag);

        console.log(
          "New boarding status:",
          await connectedContract.generalBoarding()
        );
      }
    }
  );

task("gift")
  .setDescription("Mint and gift token(s) to address")
  .addParam("address")
  .addParam("tokens")
  .setAction(
    async (
      taskArgs: { address: string; tokens: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const connectedContract = await getConnectedContract(hre);
      const tokensToGift = parseInt(taskArgs.tokens);

      if (connectedContract != null) {
        console.log(
          `Sending ${taskArgs.tokens} token(s) to ${taskArgs.address}`
        );

        await connectedContract.giftToken(taskArgs.address, tokensToGift);
      }
    }
  );

task("preboarding")
  .setDescription("Enable/disable preboarding phase")
  .addParam("enabled")
  .setAction(
    async (taskArgs: { enabled: string }, hre: HardhatRuntimeEnvironment) => {
      const flag = parseBoolean(taskArgs.enabled);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null && flag != null) {
        console.log(
          "Current preboarding status:",
          await connectedContract.preboarding()
        );

        await connectedContract.togglePreboarding(flag);

        console.log(
          "New preboarding status:",
          await connectedContract.preboarding()
        );
      }
    }
  );

task("wallet-limit")
  .setDescription("Set per wallet token limit")
  .addParam("limit")
  .setAction(
    async (taskArgs: { limit: string }, hre: HardhatRuntimeEnvironment) => {
      const walletLimit = parseInt(taskArgs.limit);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        console.log(
          "Current per wallet limit:",
          await connectedContract.MAX_TOKEN_PER_WALLET()
        );

        await connectedContract.setPerWalletLimit(walletLimit);

        console.log(
          "New per wallet limit:",
          await connectedContract.MAX_TOKEN_PER_WALLET()
        );
      }
    }
  );

task("withdrawal-address")
  .setDescription("Set withdrawal address")
  .addParam("address")
  .setAction(
    async (taskArgs: { address: string }, hre: HardhatRuntimeEnvironment) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        console.log(
          "Current withdrawal address:",
          await connectedContract.withdrawalAddress()
        );

        await connectedContract.setWithdrawalAddress(taskArgs.address);

        console.log(
          "New withdrawal address:",
          await connectedContract.withdrawalAddress()
        );
      }
    }
  );

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
    enabled: true,
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
