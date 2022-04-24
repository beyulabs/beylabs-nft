import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Nexus", function () {
  before(async function () {
    this.Nexus = await ethers.getContractFactory("Nexus");
  });

  beforeEach(async function () {
    this.nexus = await this.Nexus.deploy(
        1000,
        10000,
        3,
        "ipfs://xyz/"
    );
    await this.nexus.deployed();
  });

  it("contract state reflects initial arguments after deployment", async function () {
    const preMintPrice = await this.nexus.FOUNDING_CREW_MINT_PRICE();
    const mintPrice = await this.nexus.CREW_MINT_PRICE();
    const maxPerWallet = await this.nexus.MAX_TOKEN_PER_WALLET();

    const foundingCrewSize = await this.nexus.MAX_FOUNDING_CREW_SIZE();
    const crewSize = await this.nexus.MAX_CREW_SIZE();

    const baseURI = await this.nexus.BASE_URI();

    expect(preMintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(preMintPrice)).to.be.equal("0.07");

    expect(mintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(mintPrice)).to.be.equal("0.09");

    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(maxPerWallet, 0)).to.be.equal("3");

    expect(foundingCrewSize).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(foundingCrewSize, 0)).to.be.equal("1000");

    expect(crewSize).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(crewSize, 0)).to.be.equal("10000");

    expect(baseURI).to.be.equal("ipfs://xyz/");
  });

  it("allows toggling on/off of pre-sale", async function () {
    let preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(false);

    let togglePreboardingTxn = await this.nexus.togglePreboarding(true);
    preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    togglePreboardingTxn = await this.nexus.togglePreboarding(false);
    preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(false);
  });

  it("allows toggle on/off of general sale", async function () {
    let generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(false);

    let toggleBoardingTxn = await this.nexus.togglePreboarding(true);
    generalBoarding = await this.nexus.preboarding();
    expect(generalBoarding).to.be.equal(true);

    toggleBoardingTxn = await this.nexus.togglePreboarding(false);
    generalBoarding = await this.nexus.preboarding();
    expect(generalBoarding).to.be.equal(false);
  });

  it("returns proper royalty information", async function () {
    const contractAddress = this.nexus.address;

    const royaltyInfo = await this.nexus.royaltyInfo(
      BigNumber.from("1"),
      BigNumber.from("1000000000000000000")
    );

    expect(royaltyInfo[0]).to.be.equal(contractAddress);
    expect(
        ethers.utils.formatEther(BigNumber.from(royaltyInfo[1]))
    ).to.be.equal("0.07");
  });

  it("pre-mint function enforces isPreboardingOpen modifier", async function () {
    await expectRevert.unspecified(
      this.nexus.preMint(1, "engineer"),
      "We aren't boarding yet, space sailor!"
    );
  });

  it("pre-mint succeeds when isPreboardingOpen is true", async function () {
    await this.nexus.togglePreboarding(true);

    const preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    const mintTxn = await this.nexus.preMint(1, "engineer", {
      value: ethers.utils.parseEther("0.07")
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.07"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);
  });

  it("mint enforces isGeneralBoardingOpen modifier", async function () {
    await expectRevert.unspecified(
      this.nexus.mint(1, "engineer"),
      "General boarding starts soon!"
    );
  });

  it("mint succeeds when isGeneralBoardingOpen is true", async function () {
    await this.nexus.toggleGeneralBoarding(true);

    const generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    const mintTxn = await this.nexus.mint(1, "engineer", {
      value: ethers.utils.parseEther("0.09")
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.09"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);
  });

  it("enforce the per-wallet token limit", async function () {
    await this.nexus.toggleGeneralBoarding(true);

    const generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    let mintTxn = await this.nexus.mint(2, "engineer", {
      value: ethers.utils.parseEther("0.18")
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.18"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);

    await expectRevert.unspecified(
      this.nexus.mint(2, "engineer", {
        value: ethers.utils.parseEther("0.18")
      }),
      "Above the per-wallet token limit"
    );
  });

  it("owner can withdraw funds", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await this.nexus.toggleGeneralBoarding(true);
    const generalboarding = await this.nexus.generalBoarding();
    expect(generalboarding).to.be.equal(true);

    let minttxn = await this.nexus.mint(2, "engineer", {
      value: ethers.utils.parseEther("0.18")
    });

    expect(minttxn.value).to.be.equal(ethers.utils.parseEther("0.18"));
    expect(minttxn.to).to.be.equal(this.nexus.address);

    const withdrawTxn = await this.nexus.connect(owner).withdrawFunds();

    expect(withdrawTxn.to).to.be.equal(this.nexus.address);
    expect(withdrawTxn.from).to.be.equal(owner.address);
    expect(withdrawTxn.has).to.not.be.equal(null);
    expect(withdrawTxn.confirmations).to.be.above(0);
  });

  it("non-owner can not withdraw funds", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await expectRevert.unspecified(
      this.nexus.connect(addr1).withdrawFunds(),
      "Ownable: caller is not the owner"
    );
  });

  it("owner can set the withdrawl address", async function () {
    const [owner, addr1] = await ethers.getSigners();

    const txn = await this.nexus.setWithdrawalAddress(addr1.address);
    expect(txn.to).to.be.equal(this.nexus.address);
    expect(txn.has).to.not.be.equal(null);
    expect(txn.confirmations).to.be.above(0);
  });

  it("non-owner can not set the withdrawl address", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await expectRevert.unspecified(
      this.nexus.connect(addr1).setWithdrawalAddress(addr2.address),
      "Ownable: caller is not the owner"
    );

  });

  it("owner can set the baseURI", async function () {
    const [owner, addr1] = await ethers.getSigners();

    const txn = await this.nexus.setBaseURI("ipfs://abcd-xyz");
    expect(txn.to).to.be.equal(this.nexus.address);
    expect(txn.has).to.not.be.equal(null);
    expect(txn.confirmations).to.be.above(0);
  });

  it("non-owner can not set the baseURI", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await expectRevert.unspecified(
      this.nexus.connect(addr1).setBaseURI("ipfs://abcd-xyz"),
      "Ownable: caller is not the owner"
    );

  });

  it("enforces token supply limit", async function () {
    const Nexus = await ethers.getContractFactory("Nexus");
    const nexus = await this.Nexus.deploy(
        0,
        10,
        100,
        "ipfs://xyz/"
    );
    await nexus.deployed();

    await nexus.toggleGeneralBoarding(true);

    const generalBoarding = await nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    let mintTxn = await nexus.mint(10, "engineer", {
      value: ethers.utils.parseEther("0.9")
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.9"));
    expect(mintTxn.to).to.be.equal(nexus.address);

    await expectRevert.unspecified(
      nexus.mint(2, "engineer", {
        value: ethers.utils.parseEther("0.18")
      }),
      "There are no more spots available on this expedition."
    );
  });
});
