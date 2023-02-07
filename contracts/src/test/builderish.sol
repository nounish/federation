// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ERC721Votes} from "../external/builder/lib/token/ERC721Votes.sol";

contract BuilderishToken is ERC721Votes {
    uint256 public i;

    constructor() public {
        __ERC721_init("Builderish", "BISH");
    }

    function mint() external {
        _mint(msg.sender, i);
        i++;
    }
}
