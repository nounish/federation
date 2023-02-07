// SPDX-License-Identifier: BSD-3-Clause

/// @title Federation Multi-Type Delegate

import "@openzeppelin/contracts/utils/Strings.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {NounsTokenLike, NounsDAOStorageV1} from "../external/nouns/governance/NounsDAOInterfaces.sol";
import {ERC721Votes as BuilderToken} from "../external/builder/lib/token/ERC721Votes.sol";
import {IGovernor as IBuilderGovernor, GovernorTypesV1} from "../external/builder/governance/governor/IGovernor.sol";
import {Refundable} from "./refundable.sol";
import "../federation.sol";

pragma solidity ^0.8.17;

contract DelegateMultiType is DelegateEvents, IERC1271, Refundable {
    /// @notice The name of this contract
    string public constant name = "federation multi-type delegate";

    /// @notice The address of the vetoer
    address public vetoer;

    /// @notice The total number of delegate actions proposed
    uint256 public proposalCount;

    /// @notice The window in seconds that a proposal which has met quorum can be executed
    uint256 public execWindowSecs;

    /// @notice The window in blocks that a proposal which has met quorum can be executed
    uint256 public execWindowBlocks;

    /// @notice The default quorum for all proposals
    uint256 public quorumBPS;

    /// @notice The official record of all delegate actions ever proposed
    mapping(uint256 => MTDelegateAction) public proposals;

    /// @notice The latest proposal for each proposer
    mapping(address => uint256) public latestProposalIds;

    /// @notice A mapping of valid tokens providing representation in the DAO
    mapping(uint256 => MultiToken) public nounishTokens;

    /// @notice Size of the nounishTokens list
    uint256 public nounishTokensSize;

    /// @notice The address of an account approved to sign messages on behalf of this contract
    address public approvedSigner;

    /// @notice The address of an account approved to submit proposals using the delegated representation
    /// held by this smart contract
    address public approvedSubmitter;

    /// @notice Emitted when a voter cast a vote requesting a gas refund.
    event RefundableVote(address indexed voter, uint256 refundAmount, bool refundSent);

    /// @notice Emitted when a federation proposal is created
    event MultiTypeProposalCreated(
        uint256 id,
        address proposer,
        address indexed eDAO,
        bytes32 indexed ePropID,
        uint256 startBlock,
        uint256 startTimestamp,
        uint256 endBlock,
        uint256 endTimestamp,
        uint256 quorumVotes
    );

    /// @notice Emitted when exec window is changed
    event NewMultiTypeExecWindow(uint256 oldBlocks, uint256 oldSecs, uint256 newBlocks, uint256 newSecs);

    // GovernorType of the external DAO for each proposal (classic nouns or builder dao instance)
    enum GovernorType {
        Nouns,
        Builder
    }

    /// @notice Meta represents external proposal metadata
    struct Meta {
        /// @notice Implementation of external DAO proposal reference is for
        address dao;
        /// @notice Id of the external proposal reference in the external DAO
        bytes32 propId;
        /// @notice The governor type of the external DAO
        GovernorType govType;
    }

    /// @notice A delegate action is the structure for how the Federation delegate should
    /// vote on an external proposal.
    struct MTDelegateAction {
        /// @notice Unique id for looking up a proposal
        uint256 id;
        /// @notice Creator of the proposal
        address proposer;
        /// @notice The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed at the time of proposal creation. *DIFFERS from GovernerBravo
        uint256 quorumVotes;
        /// @notice The block at which voting begins: holders must delegate their votes prior to this block
        uint256 startBlock;
        /// @notice The timestamp at which voting begins: holders must delegate their votes prior to this block
        uint256 startTimestamp;
        /// @notice The block at which voting ends: votes must be cast prior to this block
        uint256 endBlock;
        /// @notice The timestamp at which voting ends for builder daos: votes must be cast prior to this timestamp
        uint256 endTimestamp;
        /// @notice Current number of votes in favor of this proposal
        uint256 forVotes;
        /// @notice Current number of votes in opposition to this proposal
        uint256 againstVotes;
        /// @notice Current number of votes for abstaining for this proposal
        uint256 abstainVotes;
        /// @notice Flag marking whether the proposal has been vetoed
        bool vetoed;
        /// @notice Flag marking whether the proposal has been executed
        bool executed;
        /// @notice Meta is external proposal metadata
        Meta meta;
        /// @notice Receipts of ballots for the entire set of voters
        mapping(address => Receipt) receipts;
    }

    /**
     * @param _vetoer The address that can manage this contract and veto props
     * @param _execWindowBlocks The window in blocks that a proposal which has met quorum can be executed
     * @param _execWindowSecs Seconds of the exec window
     * @param _quorumBPS Quorum BPS for proposals
     */
    constructor(address _vetoer, uint256 _execWindowBlocks, uint256 _execWindowSecs, uint256 _quorumBPS) {
        execWindowBlocks = _execWindowBlocks;
        execWindowSecs = _execWindowSecs;
        vetoer = _vetoer;
        quorumBPS = _quorumBPS;
    }

    /**
     * @notice Function used to propose a new proposal. Sender must have delegates above the proposal threshold
     * @param eDAO Target address of the external DAO executor
     * @param ePropID The ID of the proposal on the external DAO
     * @return Proposal id of internal delegate action
     */
    function propose(address eDAO, bytes32 ePropID, GovernorType govType) public returns (uint256) {
        require(
            _multiTokenVotes(msg.sender, block.number - 1, block.timestamp - 1) > 0,
            "representation required to start a vote"
        );

        require(address(eDAO) != address(0), "external DAO address is not valid");
        require(!_alreadyProposed(address(eDAO), ePropID), "proposal already proposed");

        // check when external proposal ends
        uint256 votingEndTimestampOrBlock;
        try this._getExternalPropEnd(eDAO, ePropID, govType) returns (uint256 endBlock) {
            votingEndTimestampOrBlock = endBlock;
        } catch (bytes memory) {
            revert("invalid proposal id");
        }

        if (govType == GovernorType.Nouns) {
            require(votingEndTimestampOrBlock > block.number, "external proposal has already ended or does not exist");
        } else if (govType == GovernorType.Builder) {
            require(
                votingEndTimestampOrBlock > block.timestamp, "external proposal has already ended or does not exist"
            );
        } else {
            revert("invalid governor type");
        }

        proposalCount++;
        MTDelegateAction storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.meta.propId = ePropID;
        newProposal.meta.dao = address(eDAO);
        newProposal.proposer = msg.sender;
        newProposal.quorumVotes = bps2Uint(quorumBPS, _multiTokenSupply());

        /// @notice immediately open proposal for voting
        newProposal.startBlock = block.number;
        newProposal.startTimestamp = block.timestamp;

        // builder dao proposals end by timestamp
        if (govType == GovernorType.Nouns) {
            newProposal.endBlock = votingEndTimestampOrBlock;
        }

        newProposal.endTimestamp = votingEndTimestampOrBlock;
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.abstainVotes = 0;
        newProposal.executed = false;
        newProposal.vetoed = false;
        newProposal.meta.govType = govType;

        latestProposalIds[newProposal.proposer] = newProposal.id;

        emit MultiTypeProposalCreated(
            newProposal.id,
            msg.sender,
            newProposal.meta.dao,
            newProposal.meta.propId,
            newProposal.startBlock,
            newProposal.startTimestamp,
            newProposal.endBlock,
            newProposal.endTimestamp,
            newProposal.quorumVotes
            );

        return newProposal.id;
    }

    /**
     * @notice Executes a proposal if it has met quorum
     * @param proposalId The id of the proposal to execute
     * @dev This function ensures that the proposal has reached quorum through a result check
     */
    function execute(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Active, "proposal can only be executed if it is active");

        ProposalResult r = result(proposalId);
        require(r != ProposalResult.Undecided, "proposal result cannot be undecided");

        MTDelegateAction storage proposal = proposals[proposalId];
        require(!proposal.executed, "vote already cast");

        proposal.executed = true;

        if (proposal.meta.govType == GovernorType.Nouns) {
            require(
                block.number >= proposal.endBlock - execWindowBlocks,
                "proposal can only be executed if it is within the execution window"
            );
        } else if (proposal.meta.govType == GovernorType.Builder) {
            require(
                block.timestamp >= proposal.endTimestamp - execWindowSecs,
                "proposal can only be executed if it is within the execution window"
            );
        }

        if (proposal.meta.govType == GovernorType.Nouns) {
            INounsDAOGovernanceV2 eDAO = INounsDAOGovernanceV2(proposal.meta.dao);
            if (r == ProposalResult.For) {
                eDAO.castRefundableVote(uint256(proposal.meta.propId), 1);
            } else if (r == ProposalResult.Against) {
                eDAO.castRefundableVote(uint256(proposal.meta.propId), 0);
            } else if (r == ProposalResult.Abstain) {
                eDAO.castRefundableVote(uint256(proposal.meta.propId), 2);
            }
        } else if (proposal.meta.govType == GovernorType.Builder) {
            IBuilderGovernor eDAO = IBuilderGovernor(proposal.meta.dao);
            if (r == ProposalResult.For) {
                eDAO.castVote(proposal.meta.propId, 1);
            } else if (r == ProposalResult.Against) {
                eDAO.castVote(proposal.meta.propId, 0);
            } else if (r == ProposalResult.Abstain) {
                eDAO.castVote(proposal.meta.propId, 2);
            }
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Vetoes a proposal only if sender is the vetoer and the proposal has not been executed.
     * @param proposalId The id of the proposal to veto
     */
    function veto(uint256 proposalId) external {
        require(vetoer != address(0), "veto power burned");
        require(msg.sender == vetoer, "caller not vetoer");
        require(state(proposalId) != ProposalState.Executed, "cannot veto executed proposal");

        MTDelegateAction storage proposal = proposals[proposalId];
        proposal.vetoed = true;

        emit ProposalVetoed(proposalId);
    }

    /**
     * @notice Cast a vote for a proposal with an optional reason
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     * @dev Reentrancy is defended against at the `receipt.hasVoted == false` require statement.
     */
    function castVote(uint256 proposalId, uint8 support, string calldata reason) external {
        uint256 startGas = gasleft();

        require(state(proposalId) == ProposalState.Active, "voting is closed");
        require(support <= 2, "invalid vote type");

        MTDelegateAction storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];
        require(receipt.hasVoted == false, "already voted");

        uint96 votes = _multiTokenVotes(msg.sender, proposal.startBlock, proposal.startTimestamp);
        require(votes > 0, "caller does not have votes");

        if (support == 0) {
            proposal.againstVotes = proposal.againstVotes + votes;
        } else if (support == 1) {
            proposal.forVotes = proposal.forVotes + votes;
        } else if (support == 2) {
            proposal.abstainVotes = proposal.abstainVotes + votes;
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        emit VoteCast(msg.sender, proposalId, support, votes, reason);

        if (votes > 0) {
            _refundGas(startGas);
        }
    }

    function _refundGas(uint256 startGas) internal {
        unchecked {
            uint256 balance = address(this).balance;
            if (balance == 0) {
                return;
            }
            uint256 basefee = min(block.basefee, MAX_REFUND_BASE_FEE);
            uint256 gasPrice = min(tx.gasprice, basefee + MAX_REFUND_PRIORITY_FEE);
            uint256 gasUsed = min(startGas - gasleft() + REFUND_BASE_GAS, MAX_REFUND_GAS_USED);
            uint256 refundAmount = min(gasPrice * gasUsed, balance);
            (bool refundSent,) = tx.origin.call{value: refundAmount}("");
            emit RefundableVote(tx.origin, refundAmount, refundSent);
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @notice Gets the receipt for a voter on a given proposal
     * @param proposalId the id of proposal
     * @param voter The address of the voter
     * @return The voting receipt
     */

    function getReceipt(uint256 proposalId, address voter) external view returns (Receipt memory) {
        return proposals[proposalId].receipts[voter];
    }

    /**
     * @notice Gets the state of a proposal
     * @param proposalId The id of the proposal
     * @return Proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalCount >= proposalId, "proposal not found");

        MTDelegateAction storage proposal = proposals[proposalId];

        if (proposal.vetoed) {
            return ProposalState.Vetoed;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (proposal.meta.govType == GovernorType.Nouns && block.number > proposal.endBlock) {
            return ProposalState.Expired;
        } else if (proposal.meta.govType == GovernorType.Builder && block.timestamp > proposal.endTimestamp) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Active;
        }
    }

    /**
     * @notice Gets the result of a proposal
     * @param proposalId The id of the proposal
     * @return Proposal result
     */
    function result(uint256 proposalId) public view returns (ProposalResult) {
        require(proposalCount >= proposalId, "invalid proposal id");

        MTDelegateAction storage proposal = proposals[proposalId];

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes < proposal.quorumVotes) {
            return ProposalResult.Undecided;
        }

        if ((proposal.abstainVotes > proposal.forVotes) && (proposal.abstainVotes > proposal.againstVotes)) {
            return ProposalResult.Abstain;
        }

        if (proposal.againstVotes > proposal.forVotes) {
            return ProposalResult.Against;
        }

        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalResult.For;
        }

        return ProposalResult.Undecided;
    }

    /**
     * @notice Changes quorum BPS for a proposal
     * @dev function for updating quorumBPS
     */
    function _setQuorumBPS(uint256 _quorumBPS) external {
        require(msg.sender == vetoer, "vetoer only");

        emit NewQuorumBPS(quorumBPS, _quorumBPS);

        quorumBPS = _quorumBPS;
    }

    /**
     * @notice Changes proposal exec window
     * @dev function for updating the exec window of a proposal
     */
    function _setExecWindow(uint256 _blocks, uint256 _secs) external {
        require(msg.sender == vetoer, "vetoer only");

        emit NewMultiTypeExecWindow(execWindowBlocks, execWindowSecs, _blocks, _secs);

        execWindowBlocks = _blocks;
        execWindowSecs = _secs;
    }

    /**
     * @notice Burns veto priviledges
     * @dev Vetoer function destroying veto power forever
     */
    function _burnVetoPower() external {
        require(msg.sender == vetoer, "vetoer only");
        _setVetoer(address(0));
    }

    /**
     * @notice Changes vetoer address
     * @dev Vetoer function for updating vetoer address
     */
    function _setVetoer(address newVetoer) public {
        require(msg.sender == vetoer, "vetoer only");

        emit NewVetoer(vetoer, newVetoer);

        vetoer = newVetoer;
    }

    /// @notice Structure of MultiToken data
    struct MultiToken {
        /// @notice use erc721 balance for caller when calculating vote representation
        bool useERC721Balance;
        /// @notice the address of the NounishToken
        address token;
        /// @notice voting weight given to token
        uint256 weight;
        /// @notice whether this is a classic nounish or builder dao token
        GovernorType govType;
    }

    /**
     * @notice Sets tokens to be used for governing this delegate
     */
    function _setNounishTokens(
        address[] calldata _nounishTokens,
        uint256[] calldata _weights,
        bool[] calldata _useERC721Balance,
        GovernorType[] calldata _govTypes
    ) external {
        require(msg.sender == vetoer, "vetoer only");

        emit TokensChanged(_nounishTokens, _weights, _useERC721Balance);

        for (uint256 i = 0; i < _nounishTokens.length; i += 1) {
            MultiToken storage mt = nounishTokens[i];
            mt.token = _nounishTokens[i];
            mt.weight = _weights[i];
            mt.useERC721Balance = _useERC721Balance[i];
            mt.govType = _govTypes[i];
        }

        nounishTokensSize = _nounishTokens.length;
    }

    /**
     * @notice Sets approved submitter for proposals
     */
    function _setApprovedSubmitter(address _submitter) external {
        require(msg.sender == vetoer || msg.sender == approvedSubmitter, "vetoer or submitter only");

        emit SubmitterChanged(approvedSubmitter, _submitter);

        approvedSubmitter = _submitter;
    }

    /**
     * @notice Allows an approved submitter to submit a proposal against an external DAO
     */
    function submitProp(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description,
        address eDAO,
        GovernorType govType
    ) external returns (bytes32) {
        require(msg.sender == approvedSubmitter, "submitter only");

        bytes32 propID;
        if (govType == GovernorType.Nouns) {
            propID = bytes32(INounsDAOGovernanceV2(eDAO).propose(targets, values, signatures, calldatas, description));
        } else if (govType == GovernorType.Builder) {
            propID = IBuilderGovernor(eDAO).propose(targets, values, calldatas, description);
        } else {
            revert("invalid governor type");
        }

        return propID;
    }

    /**
     * @notice Sets approved signer for ERC1271 signatures
     */
    function _setApprovedSigner(address _signer) external {
        require(msg.sender == vetoer || msg.sender == approvedSigner, "vetoer or signer only");

        emit SignerChanged(approvedSigner, _signer);

        approvedSigner = _signer;
    }

    /**
     * @notice Helper function to sum all votes w/ weights for given sender
     */
    function _multiTokenVotes(address sender, uint256 blockNumber, uint256 timestamp) public view returns (uint96) {
        uint96 votes = 0;

        for (uint256 i = 0; i < nounishTokensSize; i += 1) {
            MultiToken memory mt = nounishTokens[i];
            GovernorType govType = mt.govType;

            if (mt.useERC721Balance) {
                votes += uint96(IERC721(mt.token).balanceOf(sender) * mt.weight);
            } else {
                if (govType == GovernorType.Nouns) {
                    votes += NounsTokenLike(mt.token).getPriorVotes(sender, blockNumber) * uint96(mt.weight);
                } else if (govType == GovernorType.Builder) {
                    votes += uint96(BuilderToken(mt.token).getPastVotes(sender, timestamp)) * uint96(mt.weight);
                }
            }
        }

        return votes;
    }

    /**
     * @notice Helper function to sum total supply of tokens set for this delegate
     */
    function _multiTokenSupply() public view returns (uint256) {
        uint256 supply = 0;

        for (uint256 i = 0; i < nounishTokensSize; i += 1) {
            supply += NounsTokenLike(nounishTokens[i].token).totalSupply();
        }

        return supply;
    }

    /**
     * @notice Helper function that parses and end block or timestamp from external proposals depending on
     * the given governor type (builder or nouns).
     */
    function _getExternalPropEnd(address eDAO, bytes32 ePropID, GovernorType govType) public view returns (uint256) {
        if (govType == GovernorType.Nouns) {
            (,,,,,, uint256 ePropEndBlock,,,,,,) = NounsDAOStorageV1(eDAO).proposals(uint256(ePropID));
            return ePropEndBlock;
        } else if (govType == GovernorType.Builder) {
            GovernorTypesV1.Proposal memory prop = IBuilderGovernor(eDAO).getProposal(ePropID);
            return uint256(prop.voteEnd);
        }

        return 0;
    }

    /**
     * @notice Helper function that determines if an external proposal has already been opened
     * for vote
     */
    function _alreadyProposed(address eDAO, bytes32 ePropID) public view returns (bool) {
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].meta.dao == eDAO && proposals[i].meta.propId == ePropID) {
                return true;
            }
        }

        return false;
    }

    bytes4 constant IERC1271_MAGIC_VALUE = 0x1626ba7e;

    /**
     * @dev Implement IERC1271 handles EOA and smart contract signature verification
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue) {
        require(approvedSigner != address(0), "approvedSigner not set");

        if (SignatureChecker.isValidSignatureNow(approvedSigner, hash, signature)) {
            magicValue = IERC1271_MAGIC_VALUE;
        }
    }

    /**
     * @dev Helper function for converting bps
     */
    function bps2Uint(uint256 bps, uint256 number) internal pure returns (uint256) {
        return (number * bps) / 10000;
    }

    receive() external payable {}
}
