import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { getOwnerAndAddress } from "../hardhat.config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const hre = require("hardhat");

dotenv.config();

async function main(hre: HardhatRuntimeEnvironment) {
  const { contractAddress, contractOwner } = getOwnerAndAddress(hre.network);
  const NexusVoyagers = await ethers.getContractFactory("NexusVoyagers");

  const contract = await NexusVoyagers.deploy(100, 10, "ipfs://xyz");
  await contract.deployed();

  await contract.transferOwnership(contractOwner);

  console.log("NexusVoyagers deployed to:", contract.address);
  console.log("NexusVoyager contract owned by:", await contract.owner());
}

main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
