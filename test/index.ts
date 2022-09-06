import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("NexusVoyagers", function () {
  before(async function () {
    this.NexusVoyagers = await ethers.getContractFactory("NexusVoyagers");
  });

  beforeEach(async function () {
    this.nexus = await this.NexusVoyagers.deploy(
      ethers.utils.parseUnits("70000000000000000", "wei"),
      ethers.utils.parseUnits("90000000000000000", "wei"),
      10000,
      3,
      "ipfs://xyz"
    );
    await this.nexus.deployed();
  });

  it("contract state reflects initial arguments after deployment", async function () {
    const preMintPrice = await this.nexus.FOUNDING_CREW_MINT_PRICE();
    const mintPrice = await this.nexus.CREW_MINT_PRICE();
    const maxPerWallet = await this.nexus.MAX_TOKEN_PER_WALLET();
    const crewSize = await this.nexus.MAX_CREW_SIZE();
    const baseURI = await this.nexus.BASE_URI();

    expect(preMintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(preMintPrice)).to.be.equal("0.07");

    expect(mintPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(mintPrice)).to.be.equal("0.09");

    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(maxPerWallet, 0)).to.be.equal("3");

    expect(crewSize).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(crewSize, 0)).to.be.equal("10000");

    expect(baseURI).to.be.equal("ipfs://xyz");
  });

  it("allows toggling on/off of pre-sale", async function () {
    let preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(false);

    await this.nexus.togglePreboarding(true);
    preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    await this.nexus.togglePreboarding(false);
    preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(false);
  });

  it("allows toggle on/off of general sale", async function () {
    let generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(false);

    await this.nexus.togglePreboarding(true);
    generalBoarding = await this.nexus.preboarding();
    expect(generalBoarding).to.be.equal(true);

    await this.nexus.togglePreboarding(false);
    generalBoarding = await this.nexus.preboarding();
    expect(generalBoarding).to.be.equal(false);
  });

  it("returns proper royalty information", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await this.nexus.toggleGeneralBoarding(true);

    await this.nexus.connect(addr1).mint(1, {
      value: ethers.utils.parseEther("0.09"),
    });

    const royaltyInfo = await this.nexus.royaltyInfo(
      BigNumber.from("1"),
      BigNumber.from("1000000000000000000")
    );

    expect(royaltyInfo[0]).to.be.equal(this.nexus.address);
    expect(
      ethers.utils.formatEther(BigNumber.from(royaltyInfo[1]))
    ).to.be.equal("0.07");
  });

  it("pre-mint function enforces isPreboardingOpen modifier", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await expectRevert.unspecified(
      this.nexus.connect(addr1).preMint(1),
      "Not boarding yet, space sailor!"
    );
  });

  it("pre-mint succeeds when isPreboardingOpen is true", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await this.nexus.togglePreboarding(true);
    const preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    const mintTxn = await this.nexus.connect(addr1).preMint(1, {
      value: ethers.utils.parseEther("0.07"),
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.07"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);
  });

  it("mint enforces isGeneralBoardingOpen modifier", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await expectRevert.unspecified(
      this.nexus.connect(addr2).mint(1),
      "General boarding starts soon!"
    );
  });

  it("mint succeeds when isGeneralBoardingOpen is true", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.nexus.toggleGeneralBoarding(true);

    const generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    const mintTxn = await this.nexus.connect(addr2).mint(1, {
      value: ethers.utils.parseEther("0.09"),
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.09"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);
  });

  it("enforce the per-wallet token limit", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.nexus.toggleGeneralBoarding(true);

    const generalBoarding = await this.nexus.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    const mintTxn = await this.nexus.connect(addr2).mint(2, {
      value: ethers.utils.parseEther("0.18"),
    });

    expect(mintTxn.value).to.be.equal(ethers.utils.parseEther("0.18"));
    expect(mintTxn.to).to.be.equal(this.nexus.address);

    await expectRevert.unspecified(
      this.nexus.connect(addr2).mint(2, {
        value: ethers.utils.parseEther("0.18"),
      }),
      "Above the per-wallet token limit"
    );
  });

  it("owner can withdraw funds", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    await this.nexus.setWithdrawalAddress(addr3.address);

    await this.nexus.toggleGeneralBoarding(true);
    const generalboarding = await this.nexus.generalBoarding();
    expect(generalboarding).to.be.equal(true);

    const minttxn = await this.nexus.connect(addr2).mint(2, {
      value: ethers.utils.parseEther("0.18"),
    });

    expect(minttxn.value).to.be.equal(ethers.utils.parseEther("0.18"));
    expect(minttxn.to).to.be.equal(this.nexus.address);

    const withdrawTxn = await this.nexus.withdrawFunds();

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

  it("owner can gift tokens", async function () {
    const [owner, addr1] = await ethers.getSigners();

    const txn = await this.nexus.giftToken(addr1.address, 1000);
    expect(txn.to).to.be.equal(this.nexus.address);
    expect(txn.from).to.be.equal(owner.address);
    expect(txn.has).to.not.be.equal(null);
    expect(txn.confirmations).to.be.above(0);
  });

  it("non-owner cannot gift tokens", async function () {
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
    const contract = await ethers.getContractFactory("NexusVoyagers");
    const nexusNFT = await contract.deploy(
      ethers.utils.parseUnits("70000000000000000"),
      ethers.utils.parseUnits("90000000000000000"),
      10,
      20,
      "ipfs://xyz"
    );

    await nexusNFT.deployed();
    await nexusNFT.toggleGeneralBoarding(true);

    const generalBoarding = await nexusNFT.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    const [owner, addr1, addr2] = await ethers.getSigners();

    const nineTxn = await nexusNFT.connect(addr1).mint(10, {
      value: ethers.utils.parseEther("0.9"),
    });
    expect(nineTxn.value).to.be.equal(ethers.utils.parseEther("0.9"));
    expect(nineTxn.to).to.be.equal(nexusNFT.address);
    expect(nineTxn.confirmations).to.be.above(0);

    await expectRevert.unspecified(
      this.nexus.connect(addr2).mint(1, {
        value: ethers.utils.parseEther("0.09"),
      }),
      "Not enough passes left!"
    );
  });

  it("can update per-wallet token limit", async function () {
    let maxPerWallet = await this.nexus.MAX_TOKEN_PER_WALLET();
    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(maxPerWallet, 0)).to.be.equal("3");

    await this.nexus.setPerWalletLimit(10);

    maxPerWallet = await this.nexus.MAX_TOKEN_PER_WALLET();
    expect(maxPerWallet).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatUnits(maxPerWallet, 0)).to.be.equal("10");
  });

  it("returns proper tokenURI before/after update", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await this.nexus.toggleGeneralBoarding(true);

    const goodTxn = await this.nexus.connect(addr1).mint(1, {
      value: ethers.utils.parseEther("0.09"),
    });

    expect(goodTxn.to).to.be.equal(this.nexus.address);
    expect(goodTxn.confirmations).to.be.above(0);
    expect(await this.nexus.balanceOf(addr1.address)).to.equal(1);
    expect(await this.nexus.tokenURI(1)).to.equal("ipfs://xyz/1.json");

    await this.nexus.setBaseURI("ipfs://abc");

    expect(await this.nexus.tokenURI(1)).to.equal("ipfs://abc/1.json");
  });

  it("owner can update presale price", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const currentPrice = await this.nexus.FOUNDING_CREW_MINT_PRICE();
    console.log(currentPrice);

    expect(currentPrice).to.be.instanceOf(BigNumber);
    expect(currentPrice).to.be.equal(ethers.utils.parseEther("0.07"));

    const txn = await this.nexus
      .connect(owner)
      .setPresalePrice(ethers.utils.parseUnits("50000000000000000", "wei"));

    expect(txn.to).to.be.equal(this.nexus.address);
    expect(txn.confirmations).to.be.above(0);
    expect(await this.nexus.FOUNDING_CREW_MINT_PRICE()).to.equal(
      ethers.utils.parseEther("0.05")
    );
  });

  it("owner can update sale price", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const currentPrice = await this.nexus.CREW_MINT_PRICE();

    expect(currentPrice).to.be.instanceOf(BigNumber);
    expect(currentPrice).to.be.equal(
      ethers.utils.parseUnits("90000000000000000", "wei")
    );

    const txn = await this.nexus
      .connect(owner)
      .setSalePrice(ethers.utils.parseEther("0.02"));

    expect(txn.to).to.be.equal(this.nexus.address);
    expect(txn.confirmations).to.be.above(0);
    expect(await this.nexus.CREW_MINT_PRICE()).to.equal(
      ethers.utils.parseEther("0.02")
    );
  });

  it("non-owner cannot update presale price", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const currentPrice = await this.nexus.FOUNDING_CREW_MINT_PRICE();

    expect(currentPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(currentPrice)).to.be.equal("0.07");

    await expectRevert.unspecified(
      await this.nexus
        .connect(addr1)
        .setSalePrice(ethers.utils.parseUnits("1000000000000000000", "wei")),
      "Ownable: caller is not the owner"
    );
  });

  it("non-owner cannot update sale price", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const currentPrice = await this.nexus.CREW_MINT_PRICE();

    expect(currentPrice).to.be.instanceOf(BigNumber);
    expect(ethers.utils.formatEther(currentPrice)).to.be.equal("0.09");

    await expectRevert.unspecified(
      await this.nexus
        .connect(addr1)
        .setSalePrice(ethers.utils.parseUnits("1000000000000000000", "wei")),
      "Ownable: caller is not the owner"
    );
  });
});
