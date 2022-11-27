import {
  NewExecWindow as NewExecWindowEvent,
  NewQuorumBPS as NewQuorumBPSEvent,
  NewVetoer as NewVetoerEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalVetoed as ProposalVetoedEvent,
  TokensChanged as TokensChangedEvent,
  VoteCast as VoteCastEvent
} from "../generated/multitokenDelegate/multitokenDelegate"

import {
  NewExecWindow,
  NewQuorumBPS,
  NewVetoer,
  TokensChanged,
  Vote,
  Proposal,
} from "../generated/schema"

import {
  getOrCreateProposal,
  getOrCreateVote,
} from "./utils/helpers"

import {
  STATUS_ACTIVE,
  STATUS_EXECUTED,
  STATUS_VETOED,
  BIGINT_ZERO,
} from './utils/constants';
import { Address } from "@graphprotocol/graph-ts";

export function handleNewExecWindow(event: NewExecWindowEvent): void {
  let entity = new NewExecWindow(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.oldExecWindow = event.params.oldExecWindow
  entity.newExecWindow = event.params.newExecWindow

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewQuorumBPS(event: NewQuorumBPSEvent): void {
  let entity = new NewQuorumBPS(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.oldQuorumBPS = event.params.oldQuorumBPS
  entity.newQuorumBPS = event.params.newQuorumBPS

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewVetoer(event: NewVetoerEvent): void {
  let entity = new NewVetoer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.oldVetoer = event.params.oldVetoer
  entity.newVetoer = event.params.newVetoer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let proposal = getOrCreateProposal(event.params.id.toString())
  proposal.proposer = event.params.proposer
  proposal.eDAO = event.params.eDAO
  proposal.eID = event.params.ePropID
  proposal.quorumVotes = event.params.quorumVotes
  proposal.startBlock = event.params.startBlock
  proposal.endBlock = event.params.endBlock
  proposal.executed = false
  proposal.vetoed = false
  proposal.status = STATUS_ACTIVE
  proposal.forVotes = BIGINT_ZERO
  proposal.againstVotes = BIGINT_ZERO
  proposal.abstainVotes = BIGINT_ZERO
  proposal.save()  
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let proposal = getOrCreateProposal(event.params.id.toString())
  proposal.executed = true
  proposal.status = STATUS_EXECUTED
  proposal.save()
}

export function handleProposalVetoed(event: ProposalVetoedEvent): void {
  let proposal = getOrCreateProposal(event.params.id.toString())
  proposal.vetoed = true
  proposal.status = STATUS_VETOED
  proposal.save()
}

export function handleTokensChanged(event: TokensChangedEvent): void {
  let entity = new TokensChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  let tokens = new Array<string>(event.params.newTokens.length)
  for (let i = 0; i < event.params.newTokens.length; i++) {
    tokens[i] = event.params.newTokens[i].toString()
  }

  entity.newTokens = tokens
  entity.weights = event.params.weights
  entity.useERC721Balance = event.params.useERC721Balance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let proposal = getOrCreateProposal(event.params.proposalId.toString())
  let voteId = event.params.voter
    .toHexString()
    .concat('-')
    .concat(event.params.proposalId.toString())

  let vote = getOrCreateVote(voteId)

  vote.proposal = proposal.id
  vote.voter = event.params.voter
  vote.votesRaw = event.params.votes
  vote.votes = event.params.votes
  vote.support = event.params.support == 1
  vote.supportDetailed = event.params.support
  vote.blockNumber = event.block.number

  if (event.params.reason != '') {
    vote.reason = event.params.reason
  }

  vote.save()

  // add votes to proposal
  if (event.params.support == 0) {
    proposal.againstVotes = proposal.againstVotes.plus(event.params.votes)
  } else if (event.params.support == 1) {
    proposal.forVotes = proposal.forVotes.plus(event.params.votes)
  } else if (event.params.support == 2) {
    proposal.abstainVotes = proposal.abstainVotes.plus(event.params.votes)
  }

  proposal.save()
}
