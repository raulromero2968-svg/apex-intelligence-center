// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Apex Founding Member Soulbound NFT
 *
 * A non-transferable ERC-721 token that grants Pro subscription access for life.
 * Minted via Coinbase Paymaster (gasless) on Base mainnet.
 *
 * Architecture: 13_LAUNCH_06
 * Paymaster Integration: 13_LAUNCH_05
 *
 * Features:
 * - Non-transferable (Soulbound) after minting
 * - Cap of 1,000 Founding Members
 * - 1 NFT per wallet address
 * - Metadata includes join date and trust score boost
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ApexSoulbound is ERC721, Ownable {
    using Counters for Counters.Counter;

    // Token counter
    Counters.Counter private _tokenIds;

    // Constants
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant LAUNCH_DATE = 1735689600; // January 1, 2026 00:00:00 UTC
    string private _baseTokenURI;

    // Mapping to track if wallet has minted
    mapping(address => bool) public hasMinted;

    // Mapping to track mint date
    mapping(uint256 => uint256) public mintDate;

    // Events
    event FoundingMemberMinted(address indexed to, uint256 indexed tokenId, uint256 mintDate);

    constructor(string memory baseURI) ERC721("Apex Founding Member", "APEX") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /**
     * Mint a Founding Member NFT
     * Can only be called once per wallet
     * Maximum 1,000 total supply
     */
    function mint(address to) public returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "ApexSoulbound: Max supply reached");
        require(!hasMinted[to], "ApexSoulbound: Address has already minted");
        require(to != address(0), "ApexSoulbound: Cannot mint to zero address");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);

        hasMinted[to] = true;
        mintDate[newTokenId] = block.timestamp;

        emit FoundingMemberMinted(to, newTokenId, block.timestamp);

        return newTokenId;
    }

    /**
     * Override transfer function to make token Soulbound - non-transferable
     * Allow minting (from == address(0)) and burning (to == address(0))
     * Block all other transfers
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        // Block transfers if both from and to are non-zero (Soulbound - non-transferable)
        require(from == address(0) || to == address(0), "ApexSoulbound: Token is non-transferable (Soulbound)");

        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * Get total minted count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * Check if an address is a Founding Member
     */
    function isFoundingMember(address account) public view returns (bool) {
        return hasMinted[account];
    }

    /**
     * Get mint date for a token
     */
    function getMintDate(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "ApexSoulbound: Token does not exist");
        return mintDate[tokenId];
    }

    /**
     * Set base URI for metadata (owner only)
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * Override supportsInterface to include ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
