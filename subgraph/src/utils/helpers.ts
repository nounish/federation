import {
  Proposal,
  Vote,
} from '../../generated/schema';

export function getOrCreateVote(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false,
): Vote {
  let vote = Vote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new Vote(id);

    if (save) {
      vote.save();
    }
  }

  return vote as Vote;
}

export function getOrCreateProposal(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false,
): Proposal {
  let proposal = Proposal.load(id);

  if (proposal == null && createIfNotFound) {
    proposal = new Proposal(id);
    if (save) {
      proposal.save();
    }
  }

  return proposal as Proposal;
}