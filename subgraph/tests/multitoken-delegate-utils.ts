import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  NewExecWindow,
  NewQuorumBPS,
  NewVetoer,
  ProposalCreated,
  ProposalExecuted,
  ProposalVetoed,
  TokensChanged,
  VoteCast
} from "../generated/multitokenDelegate/multitokenDelegate"

export function createNewExecWindowEvent(
  oldExecWindow: BigInt,
  newExecWindow: BigInt
): NewExecWindow {
  let newExecWindowEvent = changetype<NewExecWindow>(newMockEvent())

  newExecWindowEvent.parameters = new Array()

  newExecWindowEvent.parameters.push(
    new ethereum.EventParam(
      "oldExecWindow",
      ethereum.Value.fromUnsignedBigInt(oldExecWindow)
    )
  )
  newExecWindowEvent.parameters.push(
    new ethereum.EventParam(
      "newExecWindow",
      ethereum.Value.fromUnsignedBigInt(newExecWindow)
    )
  )

  return newExecWindowEvent
}

export function createNewQuorumBPSEvent(
  oldQuorumBPS: BigInt,
  newQuorumBPS: BigInt
): NewQuorumBPS {
  let newQuorumBpsEvent = changetype<NewQuorumBPS>(newMockEvent())

  newQuorumBpsEvent.parameters = new Array()

  newQuorumBpsEvent.parameters.push(
    new ethereum.EventParam(
      "oldQuorumBPS",
      ethereum.Value.fromUnsignedBigInt(oldQuorumBPS)
    )
  )
  newQuorumBpsEvent.parameters.push(
    new ethereum.EventParam(
      "newQuorumBPS",
      ethereum.Value.fromUnsignedBigInt(newQuorumBPS)
    )
  )

  return newQuorumBpsEvent
}

export function createNewVetoerEvent(
  oldVetoer: Address,
  newVetoer: Address
): NewVetoer {
  let newVetoerEvent = changetype<NewVetoer>(newMockEvent())

  newVetoerEvent.parameters = new Array()

  newVetoerEvent.parameters.push(
    new ethereum.EventParam("oldVetoer", ethereum.Value.fromAddress(oldVetoer))
  )
  newVetoerEvent.parameters.push(
    new ethereum.EventParam("newVetoer", ethereum.Value.fromAddress(newVetoer))
  )

  return newVetoerEvent
}

export function createProposalCreatedEvent(
  id: BigInt,
  proposer: Address,
  eDAO: Address,
  ePropID: BigInt,
  startBlock: BigInt,
  endBlock: BigInt,
  quorumVotes: BigInt
): ProposalCreated {
  let proposalCreatedEvent = changetype<ProposalCreated>(newMockEvent())

  proposalCreatedEvent.parameters = new Array()

  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("eDAO", ethereum.Value.fromAddress(eDAO))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "ePropID",
      ethereum.Value.fromUnsignedBigInt(ePropID)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "startBlock",
      ethereum.Value.fromUnsignedBigInt(startBlock)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "endBlock",
      ethereum.Value.fromUnsignedBigInt(endBlock)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "quorumVotes",
      ethereum.Value.fromUnsignedBigInt(quorumVotes)
    )
  )

  return proposalCreatedEvent
}

export function createProposalExecutedEvent(id: BigInt): ProposalExecuted {
  let proposalExecutedEvent = changetype<ProposalExecuted>(newMockEvent())

  proposalExecutedEvent.parameters = new Array()

  proposalExecutedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return proposalExecutedEvent
}

export function createProposalVetoedEvent(id: BigInt): ProposalVetoed {
  let proposalVetoedEvent = changetype<ProposalVetoed>(newMockEvent())

  proposalVetoedEvent.parameters = new Array()

  proposalVetoedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return proposalVetoedEvent
}

export function createTokensChangedEvent(
  newTokens: Array<Address>,
  weights: Array<BigInt>,
  useERC721Balance: Array<boolean>
): TokensChanged {
  let tokensChangedEvent = changetype<TokensChanged>(newMockEvent())

  tokensChangedEvent.parameters = new Array()

  tokensChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newTokens",
      ethereum.Value.fromAddressArray(newTokens)
    )
  )
  tokensChangedEvent.parameters.push(
    new ethereum.EventParam(
      "weights",
      ethereum.Value.fromUnsignedBigIntArray(weights)
    )
  )
  tokensChangedEvent.parameters.push(
    new ethereum.EventParam(
      "useERC721Balance",
      ethereum.Value.fromBooleanArray(useERC721Balance)
    )
  )

  return tokensChangedEvent
}

export function createVoteCastEvent(
  voter: Address,
  proposalId: BigInt,
  support: i32,
  votes: BigInt,
  reason: string
): VoteCast {
  let voteCastEvent = changetype<VoteCast>(newMockEvent())

  voteCastEvent.parameters = new Array()

  voteCastEvent.parameters.push(
    new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromUnsignedBigInt(proposalId)
    )
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam(
      "support",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(support))
    )
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("votes", ethereum.Value.fromUnsignedBigInt(votes))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return voteCastEvent
}
