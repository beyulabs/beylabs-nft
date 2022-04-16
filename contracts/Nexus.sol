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

contract NexusProject is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    // ---> Seating
    uint256 public constant MAX_CREW_SIZE = 10000;

    // ---> Ticket prices
    uint256 public constant PREBOARDING_PRICE = 0.03 ether;
    uint256 public constant CREW_MINT_PRICE = 0.05 ether;
    uint256 public constant FOUNDING_CAPTAIN_MINT_PRICE = 0.07 ether;
    uint256 public constant CAPTAIN_MINT_PRICE = 0.08 ether;

    // ---> Boarding phases
    bool public preboarding = false;
    bool public generalBoarding = false;

    constructor() ERC721("Nexus Project", "NXS") {
        currentTokenId.increment();
    }

    // ---> Modifiers
    modifier crewSpotsAvailable() {
        require(
                currentTokenId <= MAX_CREW_SIZE,
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

    modifier canEnlistEarly(uint256 numToMint, string jobTitle) {
        if (jobTitle == 'captain') {
            require(
                    msg.value == numToMint * FOUNDING_CAPTAIN_MINT_PRICE,
                    "Not enough ETH!"
            );
            _;
        } else {
            require(
                    msg.value == numToMint * PREBOARDING_PRICE,
                    "Not enough ETH!"
            );
            _;
        }
    }

    modifier eligibleToEnlist(uint256 numToMint, string jobTitle) {
        if (jobTitle == 'captain') {
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

    // ---> Mint
    function preMint(uint256 numToMint, string jobTitle)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isPreboardingOpen
        canEnlistEarly(numToMint, jobTitle)
    {
        for (uint i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current())
            currentTokenId.increment();
        }
    }

    function mint(uint256 numToMint, string jobTitle)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isGeneralBoardingOpen
        eligibleToEnlist(numToMint, jobTitle)
    {
        for (uint i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current())
            currentTokenId.increment();
        }
    }

    // ---> Admin
    function togglePreboarding(bool isPreboardingOpen) external onlyOwner {
        preboarding = isPreboardingOpen;
    }

    function toggleGeneralBoarding(bool isGeneralBoardingOpen) external onlyOwner {
        generalBoarding = isGeneralBoardingOpen;
    }

    function withdrawFunds() external ownlyOwner {
        uint256 contractBalance = address(this).balance;
        payable(msg.sender).transfer(contractBalance);

    }
}
