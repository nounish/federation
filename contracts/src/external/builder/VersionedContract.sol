// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

abstract contract VersionedContract {
    function contractVersion() external pure returns (string memory) {
        return "1.2.0";
    }
}
