import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

describe("Nexus", function () {
  it("properly deploys", async function () {
    const Nexus = await ethers.getContractFactory("Nexus");
    const nexus = await Nexus.deploy(
        1000,
        10000,
        5,
        "ipfs://xyz/"
    );
    await nexus.deployed();

    const preMintPrice = await nexus.FOUNDING_CREW_MINT_PRICE();
    const mintPrice = await nexus.CREW_MINT_PRICE();
    const maxPerWallet = await nexus.MAX_CREW_SIZE();
    const baseURI = await nexus.BASE_URI();

    expect(preMintPrice).to.be.instanceOf(BigNumber);
    expect(mintPrice).to.be.instanceOf(BigNumber);
    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(baseURI).to.be.equal("ipfs://xyz/");
  });
});
