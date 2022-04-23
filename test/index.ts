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
    const maxPerWallet = await nexus.MAX_TOKEN_PER_WALLET();

    const foundingCrewSize = await nexus.MAX_FOUNDING_CREW_SIZE();
    const crewSize = await nexus.MAX_CREW_SIZE();

    const baseURI = await nexus.BASE_URI();

    expect(preMintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(preMintPrice)).to.be.equal("0.07");

    expect(mintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(mintPrice)).to.be.equal("0.09");

    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(maxPerWallet, 0)).to.be.equal("5");

    expect(foundingCrewSize).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(foundingCrewSize, 0)).to.be.equal("1000");

    expect(crewSize).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(crewSize, 0)).to.be.equal("10000");

    expect(baseURI).to.be.equal("ipfs://xyz/");
  });

  it("toggles preboarding", async function () {
    const Nexus = await ethers.getContractFactory("Nexus");
    const nexus = await Nexus.deploy(
        1000,
        10000,
        5,
        "ipfs://xyz/"
    );
    await nexus.deployed();

    let preboarding = await nexus.preboarding();
    expect(preboarding).to.be.equal(false);

    let togglePreboardingTxn = await nexus.togglePreboarding(true);
    preboarding = await nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    togglePreboardingTxn = await nexus.togglePreboarding(false);
    preboarding = await nexus.preboarding();
    expect(preboarding).to.be.equal(false);
  });

  it("toggles boarding", async function () {
    const Nexus = await ethers.getContractFactory("Nexus");
    const nexus = await Nexus.deploy(
        1000,
        10000,
        5,
        "ipfs://xyz/"
    );
    await nexus.deployed();

    let generalBoarding = await nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(false);

    let toggleBoardingTxn = await nexus.togglePreboarding(true);
    generalBoarding = await nexus.preboarding();
    expect(generalBoarding).to.be.equal(true);

    toggleBoardingTxn = await nexus.togglePreboarding(false);
    generalBoarding = await nexus.preboarding();
    expect(generalBoarding).to.be.equal(false);
  });

  it("provides proper royalty info", async function () {
    const Nexus = await ethers.getContractFactory("Nexus");
    const nexus = await Nexus.deploy(
        1000,
        10000,
        5,
        "ipfs://xyz/"
    );
    await nexus.deployed();

    const contractAddress = nexus.address;

    let royaltyInfo = await nexus.royaltyInfo(
        BigNumber.from("1"),
        BigNumber.from("1000000000000000000")
    );

    expect(royaltyInfo[0]).to.be.equal(contractAddress);
    console.log(royaltyInfo);
  });
});
