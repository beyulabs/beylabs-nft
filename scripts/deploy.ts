import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const NexusVoyagers = await ethers.getContractFactory("NexusVoyagers");
  const contract = await NexusVoyagers.deploy(100, 10, "ipfs://xyz");

  await contract.deployed();
  await contract.transferOwnership(
    process.env.HARDHAT_CONTRACT_OWNER as string
  );

  console.log("NexusVoyagers deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
