// SPDX-License-Identifier: BSD-3-Clause

/// @title Test implementation of a contract that can be used to bid and cast a Delegate bid

pragma solidity ^0.8.17;

interface IDelegateBid {
    function createBid(address dao, uint256 propId, uint8 support, string calldata reason) external payable;
    function castExternalVote(address dao, uint256 propId) external;
}

contract AtomicBidAndCast {
    function bidAndCast(address delegateBid, address dao, uint256 propId, uint8 support) external payable {
        IDelegateBid(delegateBid).createBid{value: msg.value}(dao, propId, support, "");
        IDelegateBid(delegateBid).castExternalVote(dao, propId);
    }
}
