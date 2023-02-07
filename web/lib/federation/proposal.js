import { parseDescription } from "./parsing";

const SECS_PER_BLOCK = 12;

class Proposal {
  constructor(networkAddress, currentBlock, eProp, fProp) {
    const body = parseDescription(eProp?.description);
    this.title = body.title || "";
    this.description = body.desc || "";
    this.proposer = fProp?.proposer || "";
    this.eDAOKey = networkAddress.key || "";
    this.eDAO = networkAddress.dao || "";

    if (!eProp.builderDAO) {
      this.id = fProp?.id.toNumber() || 0;
      this.eID = eProp?.id.toNumber() || 0;
      this.eta = eProp?.eta.toNumber() || 0;
      this.startBlock = fProp?.startBlock.toNumber() || 0;
      this.endBlock = fProp?.endBlock.toNumber() || 0;
      this.externalEndBlock = eProp?.endBlock.toNumber() || 0;

      // estimate external end timestamp based on the endblock
      const currTimeSecs = new Date().getTime() / 1000;
      this.externalEndTimestamp =
        Math.trunc((currentBlock.toNumber() - eProp?.endBlock.toNumber()) * 12 + currTimeSecs) || 0;

      this.builderDAO = false;
    } else {
      this.id = fProp?.id.toNumber() || 0;
      this.eID = eProp?.id;
      this.eta = 0;
      this.startBlock = fProp?.startBlock.toNumber() || 0;
      this.endBlock = fProp?.endBlock.toNumber() || 0;
      this.externalEndBlock = 0;
      this.externalEndTimestamp = eProp?.voteEnd || 0;
      this.externalStartTimestamp = eProp?.voteStart || 0;
      this.builderDAO = true;
    }

    this.startTimestamp = fProp?.startTimestamp?.toNumber() || 0;
    this.endTimestamp = fProp?.endTimestamp?.toNumber() || 0;
    this.eProposer = eProp?.proposer || "";
    this.quorumVotes = fProp?.quorumVotes.toNumber() || 0;
    this.forVotes = fProp?.forVotes.toNumber() || 0;
    this.againstVotes = fProp?.againstVotes.toNumber() || 0;
    this.abstainVotes = fProp?.abstainVotes.toNumber() || 0;
    this.canceled = eProp.canceled || false;
    this.vetoed = fProp?.vetoed || false;
    this.executed = fProp?.executed || false;
    this.votes = this.forVotes + this.againstVotes + this.abstainVotes;
    this.proposed = fProp?.id ? true : false;
  }

  update(fProp) {
    this.quorumVotes = fProp?.quorumVotes.toNumber() || 0;
    this.forVotes = fProp?.forVotes.toNumber() || 0;
    this.againstVotes = fProp?.againstVotes.toNumber() || 0;
    this.abstainVotes = fProp?.abstainVotes.toNumber() || 0;
    this.vetoed = fProp?.vetoed || false;
    this.executed = fProp?.executed || false;
    this.votes = this.forVotes + this.againstVotes + this.abstainVotes;
    this.proposed = fProp?.id ? true : false;
    this.proposer = fProp?.proposer || "";
    this.endBlock = fProp?.endBlock.toNumber() || 0;
    this.startBlock = fProp?.startBlock.toNumber() || 0;
    this.startTimestamp = fProp?.startTimestamp?.toNumber() || 0;
    this.endTimestamp = fProp?.endTimestamp?.toNumber() || 0;
    return this;
  }
}

export default Proposal;
