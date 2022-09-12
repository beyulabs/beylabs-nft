import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { HardhatRuntimeEnvironment, Network } from "hardhat/types";
import { BigNumber, Contract } from "ethers";

dotenv.config();

// Utils
export const getOwnerAndAddress = (
  network: Network
): {
  contractAddress: string;
  contractOwner: string;
} => {
  console.log(`Using the ${network.name} network!`);

  switch (network.name) {
    case "goerli":
      return {
        contractAddress: process.env.GOERLI_CONTRACT_ADDRESS as string,
        contractOwner: process.env.GOERLI_CONTRACT_OWNER as string,
      };
    case "localhost":
      return {
        contractAddress: process.env.HARDHAT_CONTRACT_ADDRESS as string,
        contractOwner: process.env.HARDHAT_CONTRACT_OWNER as string,
      };
    case "mainnet":
      return {
        contractAddress: process.env.MAINNET_CONTRACT_ADDRESS as string,
        contractOwner: process.env.MAINNET_CONTRACT_OWNER as string,
      };
    default:
      return {
        contractAddress: process.env.HARDHAT_CONTRACT_ADDRESS as string,
        contractOwner: process.env.HARDHAT_CONTRACT_OWNER as string,
      };
  }
};

const getConnectedContract = async (
  hre: HardhatRuntimeEnvironment
): Promise<Contract | null> => {
  const { contractAddress, contractOwner } = getOwnerAndAddress(hre.network);

  try {
    const signer = await hre.ethers.getSigner(contractOwner as string);
    const NexusVoyagers = await hre.ethers.getContractAt(
      "NexusVoyagers",
      contractAddress as string
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
task("uri:set")
  .setDescription("Set contract BASE_URI")
  .addParam("uri")
  .setAction(
    async (taskArgs: { uri: string }, hre: HardhatRuntimeEnvironment) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        try {
          await connectedContract.setBaseURI(taskArgs.uri);
          console.log(
            `Changing base URI from '${await connectedContract.BASE_URI()}' to '${
              taskArgs.uri
            }'`
          );
        } catch (error) {
          console.error("Error!", error);
        }
      }
    }
  );

task("uri:get")
  .setDescription("Get contract BASE_URI")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current BASE_URI: '${await connectedContract.BASE_URI()}'`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

task("boarding:set")
  .setDescription("Enable/disable boarding phase")
  .addParam("enabled")
  .setAction(
    async (taskArgs: { enabled: string }, hre: HardhatRuntimeEnvironment) => {
      const flag = parseBoolean(taskArgs.enabled);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null && flag != null) {
        try {
          await connectedContract.toggleGeneralBoarding(flag);

          console.log(
            `Changing boarding status from '${await connectedContract.generalBoarding()}' to '${
              taskArgs.enabled
            }'`
          );
        } catch (error) {
          console.error("Error!", error);
        }
      }
    }
  );

task("boarding:get")
  .setDescription("Get boarding status")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current boarding status: '${await connectedContract.generalBoarding()}'`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

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
      const tokensToGift = BigNumber.from(taskArgs.tokens);

      if (connectedContract != null) {
        try {
          await connectedContract.giftToken(
            hre.ethers.utils.getAddress(taskArgs.address),
            tokensToGift
          );

          console.log(
            `Sending '${taskArgs.tokens}' token(s) to '${taskArgs.address}'`
          );
        } catch (error) {
          console.log(error);
        }
      }
    }
  );

task("preboarding:set")
  .setDescription("Enable/disable preboarding phase")
  .addParam("enabled")
  .setAction(
    async (taskArgs: { enabled: string }, hre: HardhatRuntimeEnvironment) => {
      const flag = parseBoolean(taskArgs.enabled);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null && flag != null) {
        try {
          await connectedContract.togglePreboarding(flag);

          console.log(
            `Changing preboarding status from '${await connectedContract.preboarding()}' to '${
              taskArgs.enabled
            }'`
          );
        } catch (error) {
          console.error("Error!", error);
        }
      }
    }
  );

task("preboarding:get")
  .setDescription("Get preboarding status")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current preboarding status: '${await connectedContract.preboarding()}'`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

task("limit:set")
  .setDescription("Set per wallet token limit")
  .addParam("limit")
  .setAction(
    async (taskArgs: { limit: string }, hre: HardhatRuntimeEnvironment) => {
      const walletLimit = BigNumber.from(taskArgs.limit);
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        try {
          await connectedContract.setPerWalletLimit(walletLimit);

          console.log(
            `Changing wallet limit from '${await connectedContract.MAX_TOKEN_PER_WALLET()}' to '${walletLimit}'`
          );
        } catch (error) {
          console.log("Error!", error);
        }
      }
    }
  );

task("limit:get")
  .setDescription("Get per wallet token limit")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current wallet limit: '${await connectedContract.MAX_TOKEN_PER_WALLET()}'`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

task("withdrawal:set")
  .setDescription("Set withdrawal address")
  .addParam("address")
  .setAction(
    async (taskArgs: { address: string }, hre: HardhatRuntimeEnvironment) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        try {
          await connectedContract.setWithdrawalAddress(taskArgs.address);

          console.log(
            `Changing withdrawal address from '${await connectedContract.withdrawalAddress()}' to '${hre.ethers.utils.getAddress(
              taskArgs.address
            )}'`
          );
        } catch (error) {
          console.error("Error!", error);
        }
      }
    }
  );

task("withdrawal:get")
  .setDescription("Get current withdrawal address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current withdrawl address: '${await connectedContract.withdrawalAddress()}'`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

task("price:get")
  .setDescription("Displays current sale & presale prices")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const connectedContract = await getConnectedContract(hre);

    if (connectedContract != null) {
      try {
        console.log(
          `Current presale price: ${await connectedContract.FOUNDING_CREW_MINT_PRICE()} wei`
        );
        console.log(
          `Current sale price: ${await connectedContract.CREW_MINT_PRICE()} wei`
        );
      } catch (error) {
        console.error("Error!", error);
      }
    }
  });

task("price:set")
  .addParam("price")
  .addParam("phase")
  .setDescription("Sets sale or presale price(s)")
  .setAction(
    async (
      taskArgs: {
        price: string;
        phase: "presale" | "general";
      },
      hre: HardhatRuntimeEnvironment
    ) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        try {
          console.log(
            `Setting ${taskArgs.phase} price to '${taskArgs.price}' wei`
          );

          if (taskArgs.phase === "general") {
            await connectedContract.setSalePrice(
              BigNumber.from(taskArgs.price)
            );
          } else {
            await connectedContract.setPresalePrice(
              BigNumber.from(taskArgs.price)
            );
          }
        } catch (error) {
          console.error("Error!", error);
        }
      }
    }
  );

task("mint")
  .addParam("price")
  .addParam("phase")
  .setDescription("Mint presale or general sale token")
  .setAction(
    async (
      taskArgs: {
        price: string;
        phase: "presale" | "general";
      },
      hre: HardhatRuntimeEnvironment
    ) => {
      const connectedContract = await getConnectedContract(hre);

      if (connectedContract != null) {
        try {
          console.log("Minting token");

          if (taskArgs.phase === "general") {
            const txn = await connectedContract.mint(1, {
              value: taskArgs.price,
            });

            console.log(txn);
          } else {
            const txn = await connectedContract.preMint(1, {
              value: taskArgs.price,
            });

            console.log(txn);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  );

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    // mainnet: {
    //   url: process.env.MAINNET_URL,
    //   accounts: {},
    // },
    goerli: {
      url: process.env.GOERLI_URL ? (process.env.GOERLI_URL as string) : "",
      accounts: process.env.GOERLI_PRIVATE_KEY
        ? [process.env.GOERLI_PRIVATE_KEY as string]
        : [],
    },
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
      ? process.env.COINMARKETCAP_API_KEY
      : "",
    token: "ETH",
    showTimeSpent: true,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.MAINNET_ETHERSCAN_API_KEY
        ? process.env.MAINNET_ETHERSCAN_API_KEY
        : "",
      goerli: process.env.GOERLI_ETHERSCAN_API_KEY
        ? process.env.GOERLI_ETHERSCAN_API_KEY
        : "",
    },
  },
};

export default config;
