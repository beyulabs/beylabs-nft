import { ethers } from "hardhat";

async function main() {
  const NexusVoyagers = await ethers.getContractFactory("NexusVoyagers");
  const contract = await NexusVoyagers.deploy(100, 10, "ipfs://xyz");

  await contract.deployed();

  console.log("NexusVoyagers deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
