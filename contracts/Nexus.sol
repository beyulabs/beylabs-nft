//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/* ======================
 ▐ ▄ ▄▄▄ .▐▄• ▄ ▄• ▄▌.▄▄ ·
•█▌▐█▀▄.▀· █▌█▌▪█▪██▌▐█ ▀.
▐█▐▐▌▐▀▀▪▄ ·██· █▌▐█▌▄▀▀▀█▄
██▐█▌▐█▄▄▌▪▐█·█▌▐█▄█▌▐█▄▪▐█
▀▀ █▪ ▀▀▀ •▀▀ ▀▀ ▀▀▀  ▀▀▀▀
====================== */

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Nexus is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    // ~~~ ====> Seating
    uint256 public MAX_FOUNDING_CREW_SIZE;
    uint256 public MAX_CREW_SIZE;
    uint256 public MAX_TOKEN_PER_WALLET;

    // ~~~ ====> Ticket prices
    uint256 public constant FOUNDING_CREW_MINT_PRICE = 0.04 ether;
    uint256 public constant CREW_MINT_PRICE = 0.05 ether;
    uint256 public constant FOUNDING_CAPTAIN_MINT_PRICE = 0.07 ether;
    uint256 public constant CAPTAIN_MINT_PRICE = 0.08 ether;

    // ~~~ ====> Boarding phases
    bool public preboarding = false;
    bool public generalBoarding = false;

    // ~~~ ====> Boarding qualifications
    bytes32 public preboardingMerkleRoot;

    address public withdrawlAddress;
    mapping(address => uint256) addressMintCounts;

    constructor(
        uint256 maxFoundingCrewSize,
        uint256 maxCrewSize,
        uint256 maxTokensPerWallet
    ) ERC721("Nexus Project", "NXS") {
        MAX_FOUNDING_CREW_SIZE = maxFoundingCrewSize;
        MAX_CREW_SIZE = maxCrewSize;
        MAX_TOKEN_PER_WALLET = maxTokensPerWallet;

        currentTokenId.increment();
    }

    // ~~~ ====> Modifiers
    modifier crewSpotsAvailable() {
        require(
                currentTokenId.current() <= MAX_CREW_SIZE,
                "There are no more spots available on this expedition."
        );
        _;
    }

    modifier isPreboardingOpen() {
        require(preboarding, "We aren't boarding yet, space sailor!");
        _;
    }

    modifier isGeneralBoardingOpen {
        require(generalBoarding, "General boarding starts soon!");
        _;
    }

    modifier canEnlistEarly(uint256 numToMint, string calldata jobTitle) {
        if (
            keccak256(abi.encodePacked(jobTitle)) == keccak256(abi.encodePacked("captain"))
        ) {
            require(
                    msg.value == numToMint * FOUNDING_CAPTAIN_MINT_PRICE,
                    "Not enough ETH!"
            );
            _;
        } else {
            require(
                    msg.value == numToMint * FOUNDING_CREW_MINT_PRICE,
                    "Not enough ETH!"
            );
            _;
        }
    }

    modifier eligibleToEnlist(uint256 numToMint, string calldata jobTitle) {
        if (
            keccak256(abi.encodePacked(jobTitle)) == keccak256(abi.encodePacked("captain"))
        ) {
            require(
                    msg.value == numToMint * CAPTAIN_MINT_PRICE,
                    "Not enough ETH!"
            );
            _;
        } else {
            require(
                    msg.value == numToMint * CREW_MINT_PRICE,
                    "Not enough ETH!"
            );
            _;
        }
    }

    modifier doesNotExceedLimit(address _address, uint256 numToMint) {
        uint256 currentCount = addressMintCounts[_address];

        require(
                currentCount + numToMint <= MAX_TOKEN_PER_WALLET,
                "Above to per-wallet token limit"
        );
        _;
    }

    // ~~~ ====> Mint
    function preMint(uint256 numToMint, string calldata jobTitle)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isPreboardingOpen
        canEnlistEarly(numToMint, jobTitle)
        doesNotExceedLimit(msg.sender, numToMint)
    {
        for (uint i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current());
            addressMintCounts[msg.sender] += 1;
            currentTokenId.increment();
        }
    }

    function mint(uint256 numToMint, string calldata jobTitle)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isGeneralBoardingOpen
        eligibleToEnlist(numToMint, jobTitle)
        doesNotExceedLimit(msg.sender, numToMint)
    {
        for (uint i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current());
            addressMintCounts[msg.sender] += 1;
            currentTokenId.increment();
        }
    }

    // ~~~ ====> Admin
    function togglePreboarding(bool _isPreboardingOpen)
        external
        onlyOwner
    {
        preboarding = _isPreboardingOpen;
    }

    function toggleGeneralBoarding(bool _isGeneralBoardingOpen)
        external
        onlyOwner
    {
        generalBoarding = _isGeneralBoardingOpen;
    }

    function awardCaptainsLicense(address recipient, uint256 numToAward)
        external
        onlyOwner
    {
        for (uint i = 0; i < numToAward; i++) {
            _safeMint(recipient, currentTokenId.current());
            currentTokenId.increment();
        }
    }

    function setWithdrawlAddress(address _address)
        external
        onlyOwner
    {
        withdrawlAddress = _address;
    }

    function withdrawFunds()
        external
        onlyOwner
    {
        uint256 contractBalance = address(this).balance;
        payable(msg.sender).transfer(contractBalance);

    }
}
