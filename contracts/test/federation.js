const {
  address,
  encodeParameters,
  setup,
  advanceBlocks,
  mineBlock,
  setNextBlockTimestamp,
  makeProposal,
} = require("./utils");
const { expect } = require("chai");

describe("Federation", function () {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Propose", function () {
    it("Should revert if federation does not have representation in external dao", async function () {
      const { n1, n2 } = await setup();
      const tx = n1.federation.propose(n2.delegate.address, 1);
      await expect(tx).to.be.revertedWith("delegate does not have external dao representation");
    });

    it("Should revert if external proposal does not exist", async function () {
      const { n1, n2 } = await setup();
      const [owner] = await ethers.getSigners();

      // transfer n2 representation to federation
      await n2.token.transferFrom(owner.address, n1.federation.address, 0);
      await mineBlock();

      const tx = n1.federation.propose(n2.delegate.address, 1);
      await expect(tx).to.be.revertedWith("external proposal has already ended or does not exist");
    });

    it("Should allow proposals to be created with the proper settings and be successful end to end", async function () {
      const { n1, n2 } = await setup();
      const [owner, eDAOMember] = await ethers.getSigners();

      // delegate n2 representation to federation
      await n2.token.delegate(n1.federation.address);

      // create external proposal under another edao user
      await n2.token.connect(eDAOMember).mint();
      await mineBlock();

      const targets = [n2.token.address];
      const values = ["0"];
      const signatures = ["balanceOf(address)"];
      const callDatas = [encodeParameters(["address"], [owner.address])];

      await n2.delegate.connect(eDAOMember).propose(targets, values, signatures, callDatas, "check owner balance");

      // create a federatation prop against external proposal
      const ePropID = await n2.delegate.latestProposalIds(eDAOMember.address);
      const tx = await n1.federation.propose(n2.delegate.address, ePropID);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock("latest");

      const createdEvent = receipt.events.find((e) => e.event === "ProposalCreated");
      expect(createdEvent.args.id).to.equal(ethers.BigNumber.from("1"));
      expect(createdEvent.args.eDAO).to.equal(n2.delegate.address);
      expect(createdEvent.args.ePropID).to.equal(ethers.BigNumber.from(ePropID));
      expect(createdEvent.args.startBlock).to.equal(block.number);
      expect(createdEvent.args.quorumVotes).to.equal(ethers.BigNumber.from("0"));

      // federation propID should be 1
      const castVote = n1.federation.castVote(1, 1, "seems cool");
      await expect(castVote).not.to.be.reverted;

      const tx2 = n1.federation.execute(1);
      await expect(tx2).to.be.revertedWith("proposal can only be executed if it is within the execution window");

      // advance into execution window (end block of federation proposal is inherited from external proposal)
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindow();
      await advanceBlocks(fProp.endBlock - execWindow);

      // execute prop
      const exec = n1.federation.execute(1);
      await expect(exec).not.to.be.reverted;

      // check external dao proposal has 5 votes for it (owner minted 5 and then delegated to federation)
      let eprop = await n2.delegate.proposals(ePropID);
      expect(eprop.forVotes).to.equal(ethers.BigNumber.from("5"));

      // mine some blocks so we can queue and execute the external proposal since it should have passed quorum
      await advanceBlocks(execWindow);
      await n2.delegate.connect(owner).queue(ePropID);

      eprop = await n2.delegate.proposals(ePropID);
      await setNextBlockTimestamp(eprop.eta.toNumber(), false);
      await n2.delegate.execute(ePropID);

      // check that the external dao proposal is in executed state
      eprop = await n2.delegate.proposals(ePropID);
      expect(eprop.executed).to.be.true;
    });
  });

  describe("Proposal States", function () {
    const states = ["Active", "Expired", "Executed", "Vetoed"];

    it("Should revert if proposal not found", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);
      await expect(n1.federation.state(5)).to.be.revertedWith("proposal not found");
    });

    it("Should be in active state after creating a proposal", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);
      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Active");
    });

    it("Should be expired by running out of time", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      // travel to end block
      await advanceBlocks(20000);

      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Expired");
    });

    it("Is vetoed", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      await n1.federation.veto(1);

      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Vetoed");
    });

    it("Is executed", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindow();
      await advanceBlocks(fProp.endBlock - execWindow);

      let state = await n1.federation.state(1);
      expect(states[state]).to.equal("Active");

      // execute prop
      const exec = n1.federation.execute(1);
      await expect(exec).not.to.be.reverted;

      state = await n1.federation.state(1);
      expect(states[state]).to.equal("Executed");
    });

    it("Cannot execute if expired", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const block = await ethers.provider.getBlock("latest");
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindow();
      await advanceBlocks(fProp.endBlock - execWindow - block.number);

      let state = await n1.federation.state(1);
      expect(states[state]).to.equal("Active");

      await advanceBlocks(execWindow);

      // execute prop
      const exec = n1.federation.execute(1);
      await expect(exec).to.be.reverted;

      state = await n1.federation.state(1);
      expect(states[state]).to.equal("Expired");
    });

    it("Should revert execution if vetoed", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const block = await ethers.provider.getBlock("latest");
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindow();
      await advanceBlocks(fProp.endBlock - execWindow - block.number);

      let state = await n1.federation.state(1);
      expect(states[state]).to.equal("Active");

      await expect(n1.federation.veto(1)).not.to.be.reverted;

      // execute prop
      const exec = n1.federation.execute(1);
      await expect(exec).to.be.revertedWith("proposal can only be executed if it is active");

      state = await n1.federation.state(1);
      expect(states[state]).to.equal("Vetoed");
    });
  });

  describe("Proposal Results", function () {
    const results = ["For", "Against", "Abstain", "Undecided"];

    it("Should revert on unknown prop ids", async function () {
      const { n1, n2 } = await setup();
      const tx = n1.federation.result(1);
      await expect(tx).to.be.revertedWith("invalid proposal id");
    });

    it("Is undecided with no votes", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");
    });

    it("Is undecided if the proposal has not reached quorum", async function () {
      const [, , s1, s2] = await ethers.getSigners();
      const { n1, n2 } = await setup();

      for (let i = 0; i < 100; i++) {
        await n1.token.connect(s1).mint();
      }

      n1.token.connect(s2).mint();
      await mineBlock();

      await makeProposal(n1, n2);

      await n1.federation.connect(s2).castVote(1, 1, "");

      let result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");

      // owner has 5 votes which exceed quorum
      await n1.federation.castVote(1, 1, "");

      result = await n1.federation.result(1);
      expect(results[result]).to.equal("For");
    });

    it("Is undecided with votes equal votes", async function () {
      const [, , s1, s2, s3] = await ethers.getSigners();
      const { n1, n2 } = await setup();

      // voters
      await n1.token.connect(s1).mint();
      await n1.token.connect(s2).mint();
      await n1.token.connect(s3).mint();
      await mineBlock();

      await makeProposal(n1, n2);

      // cast 1 for, 1 against votes
      await n1.federation.connect(s1).castVote(1, 1, "");
      await n1.federation.connect(s2).castVote(1, 0, "");

      let result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");

      const vote = n1.federation.connect(s2).castVote(1, 0, "");
      await expect(vote).to.be.revertedWith("voter already voted");

      // cast abstain vote
      await n1.federation.connect(s3).castVote(1, 2, "");

      result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");
    });

    it("Abstain", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      await n1.federation.castVote(1, 2, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Abstain");
    });

    it("For", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      await n1.federation.castVote(1, 1, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("For");
    });

    it("Against", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      await n1.federation.castVote(1, 0, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Against");
    });
  });

  describe("Proposal Voting", function () {
    it("Should revert if member votes more than once", async function () {
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);
      await expect(n1.federation.castVote(1, 0, "")).not.to.be.reverted;
      await expect(n1.federation.castVote(1, 0, "")).to.be.revertedWith("voter already voted");
    });

    it("Voter should be included in proposal receipts", async function () {
      const [owner] = await ethers.getSigners();
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2);

      let r = await n1.federation.getReceipt(1, owner.address);
      expect(r.hasVoted).to.be.false;

      await expect(n1.federation.castVote(1, 1, "")).not.to.be.reverted;
      r = await n1.federation.getReceipt(1, owner.address);
      expect(r.hasVoted).to.be.true;

      const prop = await n1.federation.proposals(1);
      expect(r.votes).to.equal(prop.forVotes);
      expect(prop.forVotes).to.be.equal(ethers.BigNumber.from("5"));
    });
  });

  describe("Proposal Vetoing", function () {
    it("Sets parameters correctly", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner.address);
      await makeProposal(n1, n2);
      await mineBlock();

      const v = await n1.federation.vetoer();
      expect(v).to.equal(owner.address);

      await expect(n1.federation.connect(anon).veto(1)).to.be.revertedWith("caller not vetoer");

      await n1.federation._setVetoer(anon.address);
      await expect(n1.federation.connect(anon).veto(1)).not.to.be.reverted;
    });

    it("Rejects setting a new vetoer when sender is not vetoer", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner.address);

      await expect(n1.federation.connect(anon)._setVetoer(anon.address)).to.be.revertedWith("vetoer only");
    });

    it("Only vetoer can veto", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner.address);
      await makeProposal(n1, n2);
      await expect(n1.federation.connect(anon).veto(1)).to.be.revertedWith("caller not vetoer");
      await expect(n1.federation.veto(1)).not.to.be.reverted;
    });

    it("Correctly burns veto power", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner.address);
      await makeProposal(n1, n2);

      await expect(n1.federation.connect(anon)._burnVetoPower()).to.be.revertedWith("vetoer only");
      await expect(n1.federation._burnVetoPower()).not.to.be.reverted;
      expect(await n1.federation.vetoer()).to.equal(address(0));
      await expect(n1.federation.veto(1)).to.be.revertedWith("veto power burned");
    });

    describe("Handles vetoing properly for each proposal state", function () {
      const states = ["Active", "Expired", "Executed", "Vetoed"];

      it("Should revert if proposal not found", async function () {
        const { n1, n2 } = await setup();
        await expect(n1.federation.veto(1)).to.be.reverted;
      });

      it("Active", async function () {
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2);
        let state = await n1.federation.state(1);
        expect(states[state]).to.equal("Active");

        await expect(n1.federation.veto(1)).not.to.be.reverted;
        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Vetoed");
      });

      it("Executed", async function () {
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2);

        const castVote = n1.federation.castVote(1, 1, "");
        await expect(castVote).not.to.be.reverted;

        const fProp = await n1.federation.proposals(1);
        const execWindow = await n1.federation.execWindow();
        await advanceBlocks(fProp.endBlock - execWindow);

        let state = await n1.federation.state(1);
        expect(states[state]).to.equal("Active");

        // execute prop
        const exec = n1.federation.execute(1);
        await expect(exec).not.to.be.reverted;

        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Executed");

        await expect(n1.federation.veto(1)).to.be.revertedWith("cannot veto executed proposal");
      });

      it("Expired", async function () {
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2);

        const fProp = await n1.federation.proposals(1);
        await advanceBlocks(fProp.endBlock);

        let state = await n1.federation.state(1);
        expect(states[state]).to.equal("Expired");

        // attempt veto
        const v = n1.federation.veto(1);
        await expect(v).not.to.be.reverted;
        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Vetoed");
      });

      it("Vetoed", async function () {
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2);
        let state = await n1.federation.state(1);
        expect(states[state]).to.equal("Active");

        await expect(n1.federation.veto(1)).not.to.be.reverted;
        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Vetoed");

        await expect(n1.federation.veto(1)).not.to.be.reverted;
        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Vetoed");
      });
    });
  });
});
