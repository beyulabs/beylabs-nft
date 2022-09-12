//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/* ======================
 ▐ ▄ ▄▄▄ .▐▄• ▄ ▄• ▄▌.▄▄ ·      ▌ ▐·       ▄· ▄▌ ▄▄▄·  ▄▄ • ▄▄▄ .▄▄▄  .▄▄ ·
•█▌▐█▀▄.▀· █▌█▌▪█▪██▌▐█ ▀.     ▪█·█▌▪     ▐█▪██▌▐█ ▀█ ▐█ ▀ ▪▀▄.▀·▀▄ █·▐█ ▀.
▐█▐▐▌▐▀▀▪▄ ·██· █▌▐█▌▄▀▀▀█▄    ▐█▐█• ▄█▀▄ ▐█▌▐█▪▄█▀▀█ ▄█ ▀█▄▐▀▀▪▄▐▀▀▄ ▄▀▀▀█▄
██▐█▌▐█▄▄▌▪▐█·█▌▐█▄█▌▐█▄▪▐█     ███ ▐█▌.▐▌ ▐█▀·.▐█ ▪▐▌▐█▄▪▐█▐█▄▄▌▐█•█▌▐█▄▪▐█
▀▀ █▪ ▀▀▀ •▀▀ ▀▀ ▀▀▀  ▀▀▀▀     . ▀   ▀█▄▀▪  ▀ •  ▀  ▀ ·▀▀▀▀  ▀▀▀ .▀  ▀ ▀▀▀▀
====================== */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Nexus Voyagers
 * @author Ryan Harris
 */

contract NexusVoyagers is ERC721URIStorage, IERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    // ~~~ ====> Seating
    uint256 public MAX_CREW_SIZE;
    uint256 public MAX_TOKEN_PER_WALLET;
    string public BASE_URI;

    // ~~~ ====> Ticket prices (in wei)
    uint256 public FOUNDING_CREW_MINT_PRICE;
    uint256 public CREW_MINT_PRICE;

    // ~~~ ====> Boarding phases
    bool public preboarding = false;
    bool public generalBoarding = false;

    // ~~~ ====> Admin
    address public withdrawalAddress;
    mapping(address => uint256) private addressMintCounts;

    constructor(
        uint256 _presalePrice,
        uint256 _salePrice,
        uint256 _maxCrewSize,
        uint256 _maxTokensPerWallet,
        string memory _baseURI
    ) ERC721("Nexus Voyagers", "VOYAGER") {
        MAX_CREW_SIZE = _maxCrewSize;
        MAX_TOKEN_PER_WALLET = _maxTokensPerWallet;
        BASE_URI = _baseURI;
        FOUNDING_CREW_MINT_PRICE = _presalePrice;
        CREW_MINT_PRICE = _salePrice;

        currentTokenId.increment();
    }

    // ~~~ ====> Modifiers
    /**
     * @dev Ensures there are tokens left to mint
     */
    modifier crewSpotsAvailable(uint256 numToMint) {
        require(
            (currentTokenId.current() - 1) + numToMint <= MAX_CREW_SIZE,
            "Not enough passes left!"
        );
        _;
    }

    /**
     * @dev Checks preboarding is open
     */
    modifier isPreboardingOpen() {
        require(preboarding, "Not boarding yet, space sailor!");
        _;
    }

    /**
     * @dev Checks general boarding is open
     */
    modifier isGeneralBoardingOpen() {
        require(generalBoarding, "General boarding starts soon!");
        _;
    }

    /**
     * @dev Checks for the correct amount of ETH
     */
    modifier eligibleForBoarding(uint256 numToMint) {
        require(msg.value == numToMint * CREW_MINT_PRICE, "Not enough ETH!");
        _;
    }

    /**
     * @dev Checks for the correct amount of ETH
     */
    modifier eligibleForPreboarding(uint256 numToMint) {
        require(
            msg.value == numToMint * FOUNDING_CREW_MINT_PRICE,
            "Not enough ETH!"
        );
        _;
    }

    /**
     * @dev Enforces per-wallet token limit
     */
    modifier doesNotExceedWalletLimit(address _address, uint256 numToMint) {
        uint256 currentCount = addressMintCounts[_address];

        require(
            currentCount + numToMint <= MAX_TOKEN_PER_WALLET,
            "Above the per-wallet token limit"
        );
        _;
    }

    // ~~~ ====> Mint
    /**
     * @dev Mints tokens for presale token holders or address
     */
    function preMint(uint256 numToMint)
        public
        payable
        nonReentrant
        isPreboardingOpen
        crewSpotsAvailable(numToMint)
        eligibleForPreboarding(numToMint)
        doesNotExceedWalletLimit(msg.sender, numToMint)
    {
        for (uint256 i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current());
            addressMintCounts[msg.sender] += 1;

            currentTokenId.increment();
        }
    }

    /**
     * @dev Mints token during public mint
     */
    function mint(uint256 numToMint)
        public
        payable
        nonReentrant
        isGeneralBoardingOpen
        eligibleForBoarding(numToMint)
        crewSpotsAvailable(numToMint)
        doesNotExceedWalletLimit(msg.sender, numToMint)
    {
        for (uint256 i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current());
            addressMintCounts[msg.sender] += 1;

            currentTokenId.increment();
        }
    }

    // ~~~ ====> Admin
    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Nonexistent token!");

        return
            string(
                abi.encodePacked(BASE_URI, "/", tokenId.toString(), ".json")
            );
    }

    /**
     * @param _price Cost to mint token during presale
     */
    function setPresalePrice(uint256 _price) external onlyOwner {
        FOUNDING_CREW_MINT_PRICE = _price;
    }

    /**
     * @param _price Cost to mint token during general sale
     */
    function setSalePrice(uint256 _price) external onlyOwner {
        CREW_MINT_PRICE = _price;
    }

    /**
     * @param _isPreboardingOpen Enables preMint
     */
    function togglePreboarding(bool _isPreboardingOpen) external onlyOwner {
        preboarding = _isPreboardingOpen;
    }

    /**
     * @param _isGeneralBoardingOpen Enables mint
     */
    function toggleGeneralBoarding(bool _isGeneralBoardingOpen)
        external
        onlyOwner
    {
        generalBoarding = _isGeneralBoardingOpen;
    }

    /**
     * @param newLimit The amount of tokens a given address can mit
     */
    function setPerWalletLimit(uint256 newLimit) external onlyOwner {
        MAX_TOKEN_PER_WALLET = newLimit;
    }

    /**
     * @param recipient The address receiving the token(s)
     * @param numToAward The number of tokens to gift
     */
    function giftToken(address recipient, uint256 numToAward)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < numToAward; i++) {
            _safeMint(recipient, currentTokenId.current());
            currentTokenId.increment();
        }
    }

    /**
     * @param _address The address contract funds are withdrawn to
     */
    function setWithdrawalAddress(address _address) external onlyOwner {
        withdrawalAddress = _address;
    }

    /**
     * @dev Transfers funds from contract to owner contract
     */
    function withdrawFunds() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        payable(withdrawalAddress).transfer(contractBalance);
    }

    /**
     * @param _baseURI The base URI used for each token's metadata
     * @dev Transfers funds from contract to owner contract
     */
    function setBaseURI(string calldata _baseURI) external onlyOwner {
        BASE_URI = _baseURI;
    }

    /**
     * @dev Unenforced royalty definition (https://eips.ethereum.org/EIPS/eip-2981)
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Nonexistent token!");

        return (address(this), SafeMath.div(SafeMath.mul(salePrice, 7), 100));
    }
}
