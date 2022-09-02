// SPDX-License-Identifier: BSD-3-Clause

/// @title Test implementation of a Nounish NFT

import {ERC721} from '../external/nouns/erc721/ERC721.sol';
import {ERC721Checkpointable} from "../external/nouns/erc721/ERC721Checkpointable.sol";

pragma solidity ^0.8.16;

contract NounishToken is ERC721Checkpointable {
    uint256 i;

    constructor() ERC721("Nounish", "NOUNISH") public { }

    function mint() external {
        _mint(address(this), msg.sender, i++);       
    }
}