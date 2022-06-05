import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const { expectRevert } = require("@openzeppelin/test-helpers");

const { MerkleTree } = require("merkletreejs");
const { keccak256 } = ethers.utils;

describe("Nexus", function () {
  before(async function () {
    this.Nexus = await ethers.getContractFactory("Nexus");

    this.tokenTypes = [
      "architect",
      "captain",
      "explorer",
      "journalist",
      "mechanic",
      "merchant",
    ];

    const [owner, addr1] = await ethers.getSigners();

    this.presaleAddresses = [owner.address, addr1.address];

    this.leaves = this.presaleAddresses.map((x: string) => keccak256(x));
    this.tree = new MerkleTree(this.leaves, keccak256, { sort: true });
    this.presaleMerkleRoot = this.tree.getHexRoot();
  });

  beforeEach(async function () {
    this.nexus = await this.Nexus.deploy(
      1000,
      10000,
      3,
      this.presaleMerkleRoot,
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
    const [owner, addr1] = await ethers.getSigners();
    const proof = this.tree.getHexProof(keccak256(addr1.address));

    await expectRevert.unspecified(
      this.nexus.connect(addr1).preMint(1, proof, "mechanic"),
      "Not boarding yet, space sailor!"
    );
  });

  it("pre-mint succeeds when isPreboardingOpen is true", async function () {
    const [owner, addr1] = await ethers.getSigners();

    await this.nexus.togglePreboarding(true);
    const preboarding = await this.nexus.preboarding();
    expect(preboarding).to.be.equal(true);

    const goodMerkleProof = this.tree.getHexProof(keccak256(addr1.address));

    const mintTxn = await this.nexus
      .connect(addr1)
      .preMint(1, goodMerkleProof, "mechanic", {
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
    const contract = await ethers.getContractFactory("Nexus");

    const nexusNFT = await contract.deploy(
      1,
      10,
      20,
      this.presaleMerkleRoot,
      "ipfs://xyz/"
    );

    await nexusNFT.deployed();
    await nexusNFT.toggleGeneralBoarding(true);

    const generalBoarding = await nexusNFT.generalBoarding();
    expect(generalBoarding).to.be.equal(true);

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const nineTxn = await nexusNFT.connect(addr1).mint(9, {
      value: ethers.utils.parseEther("0.81"),
    });
    expect(nineTxn.value).to.be.equal(ethers.utils.parseEther("0.81"));
    expect(nineTxn.to).to.be.equal(nexusNFT.address);
    expect(nineTxn.confirmations).to.be.above(0);

    const tenTxn = await nexusNFT.connect(addr2).mint(10, {
      value: ethers.utils.parseEther("0.9"),
    });
    expect(tenTxn.value).to.be.equal(ethers.utils.parseEther("0.9"));
    expect(tenTxn.to).to.be.equal(nexusNFT.address);
    expect(tenTxn.confirmations).to.be.above(0);

    await expectRevert.unspecified(
      this.nexus.connect(addr3).mint(11, {
        value: ethers.utils.parseEther("0.99"),
      }),
      "No more spots!"
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

  it("enforces merkle check for preMint", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const badMerkleProof = this.tree.getHexProof(keccak256(addr2.address));
    const goodMerkleProof = this.tree.getHexProof(keccak256(addr1.address));

    await this.nexus.togglePreboarding(true);

    await expectRevert.unspecified(
      this.nexus.connect(addr2).preMint(1, badMerkleProof, "mechanic", {
        value: ethers.utils.parseEther("0.07"),
      }),
      "Not on the preboarding list!"
    );

    const goodTxn = await this.nexus
      .connect(addr1)
      .preMint(1, goodMerkleProof, "mechanic", {
        value: ethers.utils.parseEther("0.07"),
      });

    expect(goodTxn.to).to.be.equal(this.nexus.address);
    expect(goodTxn.has).to.not.be.equal(null);
    expect(goodTxn.confirmations).to.be.above(0);
  });

  it("only accepts known types", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const preMintProof = this.tree.getHexProof(keccak256(addr1.address));

    await this.nexus.togglePreboarding(true);
    await this.nexus.setPerWalletLimit(10);

    // Accepts proper types during preMint

    this.tokenTypes.forEach(async (character: string) => {
      const txn = await this.nexus
        .connect(addr1)
        .preMint(1, preMintProof, character, {
          value: ethers.utils.parseEther("0.07"),
        });
      expect(txn.to).to.be.equal(this.nexus.address);
      expect(txn.confirmations).to.be.above(0);
    });

    // Rejects unknown types during preMint
    await expectRevert.unspecified(
      this.nexus.connect(addr1).preMint(1, preMintProof, "some character", {
        value: ethers.utils.parseEther("0.07"),
      }),
      "Unknown character!"
    );

    for (let index = 1; index <= this.tokenTypes.length; index++) {
      const type = await this.nexus.tokenTypeMapping(index);

      switch (index) {
        case 1:
          expect(type).to.be.equal("architect");
          break;
        case 2:
          expect(type).to.be.equal("captain");
          break;
        case 3:
          expect(type).to.be.equal("explorer");
          break;
        case 4:
          expect(type).to.be.equal("journalist");
          break;
        case 5:
          expect(type).to.be.equal("mechanic");
          break;
        case 6:
          expect(type).to.be.equal("merchant");
          break;
      }
    }
  });
});
