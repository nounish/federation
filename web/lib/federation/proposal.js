import { ethers } from "ethers";
import { parseDescription } from "./parsing";

class Proposal {
  constructor(networkAddress, eProp, fProp) {
    this.id = fProp?.id.toNumber() || 0;
    const body = parseDescription(eProp?.description);
    this.title = body.title || "";
    this.description = body.desc || "";
    this.proposer = fProp?.proposer || "";
    this.eDAOKey = networkAddress.key || "";
    this.eDAO = networkAddress.dao || "";
    this.eID = eProp?.id.toNumber() || 0;
    this.eProposer = eProp?.proposer || "";
    this.eta = eProp?.eta.toNumber() || 0;
    this.quorumVotes = fProp?.quorumVotes.toNumber() || 0;
    this.startBlock = fProp?.startBlock.toNumber() || 0;
    this.endBlock = fProp?.endBlock.toNumber() || 0;
    this.externalEndBlock = eProp?.endBlock.toNumber() || 0;
    this.forVotes = fProp?.forVotes.toNumber() || 0;
    this.againstVotes = fProp?.againstVotes.toNumber() || 0;
    this.abstainVotes = fProp?.abstainVotes.toNumber() || 0;
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
    return this;
  }
}

export default Proposal;
