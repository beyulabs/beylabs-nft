//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/* ======================
 ▐ ▄ ▄▄▄ .▐▄• ▄ ▄• ▄▌.▄▄ ·
•█▌▐█▀▄.▀· █▌█▌▪█▪██▌▐█ ▀.
▐█▐▐▌▐▀▀▪▄ ·██· █▌▐█▌▄▀▀▀█▄
██▐█▌▐█▄▄▌▪▐█·█▌▐█▄█▌▐█▄▪▐█
▀▀ █▪ ▀▀▀ •▀▀ ▀▀ ▀▀▀  ▀▀▀▀
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
 * @title Nexus Project
 * @author Ryan Harris
 */

contract Nexus is ERC721URIStorage, IERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    // ~~~ ====> Seating
    uint256 public MAX_FOUNDING_CREW_SIZE;
    uint256 public MAX_CREW_SIZE;
    uint256 public MAX_TOKEN_PER_WALLET;
    string public BASE_URI;

    // ~~~ ====> Ticket prices
    uint256 public constant FOUNDING_CREW_MINT_PRICE = 0.07 ether;
    uint256 public constant CREW_MINT_PRICE = 0.09 ether;

    // ~~~ ====> Boarding phases
    bool public preboarding = false;
    bool public generalBoarding = false;

    // ~~~ ====> Boarding qualifications
    bytes32 public presaleMerkleRoot;

    // ~~~ ====> Admin
    address public withdrawalAddress;
    mapping(address => uint256) private addressMintCounts;

    constructor(
        uint256 maxFoundingCrewSize,
        uint256 maxCrewSize,
        uint256 maxTokensPerWallet,
        bytes32 _presaleMerkleRoot,
        string memory _baseURI
    ) ERC721("Nexus Project", "NXS") {
        MAX_FOUNDING_CREW_SIZE = maxFoundingCrewSize;
        MAX_CREW_SIZE = maxCrewSize;
        MAX_TOKEN_PER_WALLET = maxTokensPerWallet;
        BASE_URI = _baseURI;
        presaleMerkleRoot = _presaleMerkleRoot;

        currentTokenId.increment();
    }

    // ~~~ ====> Modifiers
    modifier crewSpotsAvailable() {
        require(currentTokenId.current() <= MAX_CREW_SIZE, "No more spots!");
        _;
    }

    modifier isPreboardingOpen() {
        require(preboarding, "Not boarding yet, space sailor!");
        _;
    }

    modifier isGeneralBoardingOpen() {
        require(generalBoarding, "General boarding starts soon!");
        _;
    }

    modifier canEnlistEarly(
        uint256 numToMint,
        address _address,
        bytes32[] calldata merkleProof
    ) {
        require(
            msg.value == numToMint * FOUNDING_CREW_MINT_PRICE,
            "Not enough ETH!"
        );
        require(
            MerkleProof.verify(
                merkleProof,
                presaleMerkleRoot,
                keccak256(abi.encodePacked(_address))
            ),
            "Not on the preboarding list!"
        );
        _;
    }

    modifier eligibleToEnlist(uint256 numToMint) {
        require(msg.value == numToMint * CREW_MINT_PRICE, "Not enough ETH!");
        _;
    }

    modifier doesNotExceedLimit(address _address, uint256 numToMint) {
        uint256 currentCount = addressMintCounts[_address];

        require(
            currentCount + numToMint <= MAX_TOKEN_PER_WALLET,
            "Above the per-wallet token limit"
        );
        _;
    }

    // ~~~ ====> Mint
    function preMint(uint256 numToMint, bytes32[] calldata merkleProof)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isPreboardingOpen
        canEnlistEarly(numToMint, msg.sender, merkleProof)
        doesNotExceedLimit(msg.sender, numToMint)
    {
        for (uint256 i = 0; i < numToMint; i++) {
            _safeMint(msg.sender, currentTokenId.current());
            addressMintCounts[msg.sender] += 1;

            currentTokenId.increment();
        }
    }

    function mint(uint256 numToMint)
        public
        payable
        nonReentrant
        crewSpotsAvailable
        isGeneralBoardingOpen
        eligibleToEnlist(numToMint)
        doesNotExceedLimit(msg.sender, numToMint)
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
     * @param merkleRoot The root of the pre-sale merkle tree
     */
    function setPresaleMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        presaleMerkleRoot = merkleRoot;
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
