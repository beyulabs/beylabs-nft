import { ethers } from "hardhat";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider();

  const Nexus = await ethers.getContractFactory("Nexus");
  const nexus = await Nexus.deploy(
    1000,
    10000,
    3,
    "0xec93bec032a92132cc254874d5d38d4cb1f5c2104b364ec45622bbb89835a6eb",
    "ipfs://xyz"
  );

  await nexus.deployed();

  console.log("Nexus deployed to:", nexus.address);
  console.log("Nexus balances", await provider.getBalance(nexus.address));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
