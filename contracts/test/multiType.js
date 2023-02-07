const {
  address,
  encodeParameters,
  setupMultiTypeNetwork: setup,
  advanceBlocks,
  mineBlock,
  setNextBlockTimestamp,
  makeProposalMultiType: makeProposal,
  deployBuilderDAO,
} = require("./utils");
const { expect } = require("chai");
const weights = [1, 1];

describe("Federation Multi-Type", function () {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Propose", function () {
    it("Should revert if external proposal does not exist", async function () {
      const { n1, n2 } = await setup(null, weights);
      const [owner] = await ethers.getSigners();

      // transfer n2 representation to federation
      await n2.token.transferFrom(owner.address, n1.federation.address, 0);
      await mineBlock();

      const tx = n1.federation.propose(n2.delegate.address, ethers.utils.formatBytes32String("1"), 0);
      await expect(tx).to.be.revertedWith("external proposal has already ended or does not exist");
    });

    it("Should allow proposals to be created with the proper settings and be successful end to end", async function () {
      const { n1, n2 } = await setup(null, weights);
      const [owner, eDAOMember] = await ethers.getSigners();

      // delegate n2 representation to federation
      await n2.token.delegate(n1.federation.address);

      // create external proposal under another edao user
      await n2.token.connect(eDAOMember)["mint()"]();
      await mineBlock();

      const targets = [n2.token.address];
      const values = ["0"];
      const signatures = ["balanceOf(address)"];
      const callDatas = [encodeParameters(["address"], [owner.address])];

      await n2.delegate.connect(eDAOMember).propose(targets, values, signatures, callDatas, "check owner balance");

      // create a federatation prop against external proposal
      const ePropID = await n2.delegate.latestProposalIds(eDAOMember.address);
      const ePropIDBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(ePropID.toNumber()), 32);
      const tx = await n1.federation.propose(n2.delegate.address, ePropIDBytes, 0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock("latest");

      const createdEvent = receipt.events.find((e) => e.event === "MultiTypeProposalCreated");
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
      await mineBlock();

      const dupeProp = n1.federation.propose(n2.delegate.address, ePropIDBytes, 0);
      await expect(dupeProp).to.be.revertedWith("proposal already proposed");

      // advance into execution window (end block of federation proposal is inherited from external proposal)
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindowBlocks();
      await advanceBlocks(fProp.endBlock - execWindow);

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
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);
      await expect(n1.federation.state(5)).to.be.revertedWith("proposal not found");
    });

    it("Should be in active state after creating a proposal", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);
      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Active");
    });

    it("Should be expired by running out of time", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      // travel to end block
      await advanceBlocks(20000);

      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Expired");
    });

    it("Is vetoed", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      await n1.federation.veto(1);

      const state = await n1.federation.state(1);
      expect(states[state]).to.equal("Vetoed");
    });

    it("Is executed", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindowBlocks();
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
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const block = await ethers.provider.getBlock("latest");
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindowBlocks();
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
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      const castVote = n1.federation.castVote(1, 1, "");
      await expect(castVote).not.to.be.reverted;

      const block = await ethers.provider.getBlock("latest");
      const fProp = await n1.federation.proposals(1);
      const execWindow = await n1.federation.execWindowBlocks();
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
      const { n1, n2 } = await setup(null, weights);
      const tx = n1.federation.result(1);
      await expect(tx).to.be.revertedWith("invalid proposal id");
    });

    it("Is undecided with no votes", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");
    });

    it("Is undecided if the proposal has not reached quorum", async function () {
      const [, , s1, s2] = await ethers.getSigners();
      const { n1, n2 } = await setup(null, weights);

      for (let i = 0; i < 100; i++) {
        await n1.token.connect(s1)["mint()"]();
      }

      n1.token.connect(s2)["mint()"]();
      await mineBlock();

      await makeProposal(n1, n2, false, 0);

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
      const { n1, n2 } = await setup(null, weights);

      // voters
      await n1.token.connect(s1)["mint()"]();
      await n1.token.connect(s2)["mint()"]();
      await n1.token.connect(s3)["mint()"]();
      await mineBlock();

      await makeProposal(n1, n2, false, 0);

      // cast 1 for, 1 against votes
      await n1.federation.connect(s1).castVote(1, 1, "");
      await n1.federation.connect(s2).castVote(1, 0, "");

      let result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");

      const vote = n1.federation.connect(s2).castVote(1, 0, "");
      await expect(vote).to.be.revertedWith("already voted");

      // cast abstain vote
      await n1.federation.connect(s3).castVote(1, 2, "");

      result = await n1.federation.result(1);
      expect(results[result]).to.equal("Undecided");
    });

    it("Abstain", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      await n1.federation.castVote(1, 2, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Abstain");
    });

    it("For", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      await n1.federation.castVote(1, 1, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("For");
    });

    it("Against", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      await n1.federation.castVote(1, 0, "");

      const result = await n1.federation.result(1);
      expect(results[result]).to.equal("Against");
    });
  });

  describe("Proposal Voting", function () {
    it("Should revert if member votes more than once", async function () {
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);
      await expect(n1.federation.castVote(1, 0, "")).not.to.be.reverted;
      await expect(n1.federation.castVote(1, 0, "")).to.be.revertedWith("already voted");
    });

    it("Voter should be included in proposal receipts", async function () {
      const [owner] = await ethers.getSigners();
      const { n1, n2 } = await setup(null, weights);
      await makeProposal(n1, n2, false, 0);

      let r = await n1.federation.getReceipt(1, owner.address);
      expect(r.hasVoted).to.be.false;

      await expect(n1.federation.castVote(1, 1, "")).not.to.be.reverted;
      r = await n1.federation.getReceipt(1, owner.address);
      expect(r.hasVoted).to.be.true;

      const t1 = await n1.federation.nounishTokens(0);
      const weight = t1.weight;

      const prop = await n1.federation.proposals(1);

      expect(r.votes).to.equal(prop.forVotes);
      expect(prop.forVotes).to.be.equal(ethers.BigNumber.from("5") * weight);
    });
  });

  describe("Proposal Vetoing", function () {
    it("Sets parameters correctly", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner, weights);
      await makeProposal(n1, n2, false, 0);
      await mineBlock();

      const v = await n1.federation.vetoer();
      expect(v).to.equal(owner.address);

      await expect(n1.federation.connect(anon).veto(1)).to.be.revertedWith("caller not vetoer");

      await n1.federation._setVetoer(anon.address);
      await expect(n1.federation.connect(anon).veto(1)).not.to.be.reverted;
    });

    it("Rejects setting a new vetoer when sender is not vetoer", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner, weights);

      await expect(n1.federation.connect(anon)._setVetoer(anon.address)).to.be.revertedWith("vetoer only");
    });

    it("Only vetoer can veto", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner, weights);
      await makeProposal(n1, n2, false, 0);
      await expect(n1.federation.connect(anon).veto(1)).to.be.revertedWith("caller not vetoer");
      await expect(n1.federation.veto(1)).not.to.be.reverted;
    });

    it("Correctly burns veto power", async function () {
      const [owner, anon] = await ethers.getSigners();
      const { n1, n2 } = await setup(owner, weights);
      await makeProposal(n1, n2, false, 0);

      await expect(n1.federation.connect(anon)._burnVetoPower()).to.be.revertedWith("vetoer only");
      await expect(n1.federation._burnVetoPower()).not.to.be.reverted;
      expect(await n1.federation.vetoer()).to.equal(address(0));
      await expect(n1.federation.veto(1)).to.be.revertedWith("veto power burned");
    });

    describe("Handles vetoing properly for each proposal state", function () {
      const states = ["Active", "Expired", "Executed", "Vetoed"];

      it("Should revert if proposal not found", async function () {
        const { n1, n2 } = await setup(null, weights);
        await expect(n1.federation.veto(1)).to.be.reverted;
      });

      it("Active", async function () {
        const { n1, n2 } = await setup(null, weights);
        await makeProposal(n1, n2, false, 0);
        let state = await n1.federation.state(1);
        expect(states[state]).to.equal("Active");

        await expect(n1.federation.veto(1)).not.to.be.reverted;
        state = await n1.federation.state(1);
        expect(states[state]).to.equal("Vetoed");
      });

      it("Executed", async function () {
        const { n1, n2 } = await setup(null, weights);
        await makeProposal(n1, n2, false, 0);

        const castVote = n1.federation.castVote(1, 1, "");
        await expect(castVote).not.to.be.reverted;

        const fProp = await n1.federation.proposals(1);
        const execWindow = await n1.federation.execWindowBlocks();
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
        const { n1, n2 } = await setup(null, weights);
        await makeProposal(n1, n2, false, 0);

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
        const { n1, n2 } = await setup(null, weights);
        await makeProposal(n1, n2, false, 0);
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

  describe("Quorum", function () {
    describe("Proposal Quorum", function () {
      it("Should properly set delegate prop quorum based on quorumBPS accurately", async function () {
        const [owner] = await ethers.getSigners();
        const { n1, n2 } = await setup(null, weights);

        // mint a couple more tokens to increase total supply
        for (let i = 0; i < 20; i++) {
          await n1.token["mint()"]();
          await n2.token["mint()"]();
        }

        await makeProposal(n1, n2, false, 0);
        await advanceBlocks(10);

        const f1Supply = await n1.token.totalSupply();
        const quorum = await n1.federation.quorumBPS();

        const expectedQuorum = f1Supply.mul(quorum).div(10000);
        const fProp = await n1.federation.proposals(1);

        expect(fProp.quorumVotes).to.equal(expectedQuorum);
      });
    });

    describe("Admin", function () {
      it("Should allow vetoer to set new quorumBPS", async function () {
        const [_, vetoer] = await ethers.getSigners();
        const { n1, n2 } = await setup(vetoer, weights);

        await expect(n1.federation.connect(vetoer)._setQuorumBPS(1000)).not.to.be.reverted;
        await expect(n1.federation._setQuorumBPS(1000)).to.be.reverted;
      });
    });
  });

  describe("Multi-Token", function () {
    describe("Admin", function () {
      it("Vetoer can set tokens and weights", async function () {
        const [sig, vetoer] = await ethers.getSigners();

        const weights = [2, 1];
        const { n1, n2 } = await setup(vetoer, weights);
        const tokens = [n1.token.address, n2.token.address];

        await expect(n1.federation.connect(vetoer)._setNounishTokens(tokens, weights, [true, false], [1, 0])).not.to.be
          .reverted;
        await expect(n1.federation._setNounishTokens(tokens, weights, [true, false], [1, 0])).to.be.reverted;
      });

      it("Vetoer can set approvedSigner for ERC1271 sigs", async function () {
        const [owner, vetoer, rando] = await ethers.getSigners();

        const weights = [1, 1];
        const { n1 } = await setup(vetoer, weights);

        await expect(n1.federation.connect(vetoer)._setApprovedSigner(owner.address)).not.to.be.reverted;
        await expect(n1.federation.connect(rando)._setApprovedSigner(address(0))).to.be.reverted;
        await expect(n1.federation._setApprovedSigner(rando.address)).to.not.be.reverted;
        await expect(n1.federation.connect(rando)._setApprovedSigner(owner.address)).to.not.be.reverted;

        const dataToSign = { msg: "hello world" };
        const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataToSign));
        const dataHashBin = ethers.utils.arrayify(dataHash);

        const hash = ethers.utils.hashMessage(dataHashBin);
        const sig = await owner.signMessage(dataHashBin);

        expect(await n1.federation.isValidSignature(hash, sig)).to.equal("0x1626ba7e");
      });
    });

    describe("Proposals", function () {
      it("only vetoer or submitter can set submitter", async function () {
        const [owner, na, , rando] = await ethers.getSigners();
        const { n1, n2 } = await setup(null, weights);

        await expect(n2.federation.connect(rando)._setApprovedSubmitter(owner.address)).to.be.revertedWith(
          "vetoer or submitter only"
        );

        await expect(n2.federation._setApprovedSubmitter(rando.address)).to.not.be.reverted;

        await expect(n2.federation.connect(na)._setApprovedSubmitter(owner.address)).to.be.reverted;

        await expect(n2.federation.connect(rando)._setApprovedSubmitter(owner.address)).to.not.be.reverted;
      });

      it("should allow submitting a prop by the approved submitter", async function () {
        const [owner, , , rando] = await ethers.getSigners();
        const { n1, n2 } = await setup(null, weights);

        const targets = [n2.token.address];
        const values = ["0"];
        const signatures = ["balanceOf(address)"];
        const callDatas = [encodeParameters(["address"], [owner.address])];

        await n1.token.transferFrom(owner.address, n2.federation.address, 0);

        await n2.federation._setApprovedSubmitter(owner.address);

        await expect(
          n2.federation
            .connect(owner)
            .submitProp(targets, values, signatures, callDatas, "check owner balance", n1.delegate.address, 1)
        ).to.not.be.reverted;

        // ensure only the approved submitter can submit
        await expect(
          n2.federation
            .connect(rando)
            .submitProp(targets, values, signatures, callDatas, "check owner balance", n1.delegate.address, 1)
        ).to.be.revertedWith("submitter only");
      });

      it("should allow making a proposal from only one token in multi-token list (second)", async function () {
        const [owner, , , rando] = await ethers.getSigners();
        const { n1, n2, n3 } = await setup(null, weights);

        // open proposal with only second token in wallet
        const owned = await n2.token.balanceOf(owner.address);
        for (let i = 0; i < owned.toNumber(); i++) {
          // always operate on the first token in owner index
          const id = await n2.token.tokenOfOwnerByIndex(owner.address, 0);
          await n2.token.transferFrom(owner.address, rando.address, id);
        }

        await makeProposal(n1, n3, false, 0);
      });

      it("should allow voting with multiple tokens", async function () {
        const [owner, , , rando] = await ethers.getSigners();
        const { n1, n2, n3 } = await setup(null, weights);

        await n1.federation._setNounishTokens([n1.token.address, n2.token.address], [1, 1], [false, false], [1, 0]);

        // get owner tokens and send them to rando address
        // so that owner only owns 1 token side
        const owned = await n1.token.balanceOf(owner.address);
        const n2Balance = await n2.token.balanceOf(owner.address);

        const ts = await n1.token.totalSupply();
        for (let i = 0; i < ts.toNumber(); i++) {
          // always operate on the first token in owner index
          const ownerOf = await n1.token.ownerOf(i);
          if (ownerOf === owner.address) {
            await n1.token.transferFrom(owner.address, rando.address, i);
          }
        }

        await makeProposal(n1, n3, false, 0);

        // ensure that we can vote on Federation with both tokens
        const t1 = await n1.federation.nounishTokens(0);
        const t2 = await n1.federation.nounishTokens(1);

        const weightn1 = t1.weight;
        const weightn2 = t2.weight;

        // owner only has n2 tokens. let's get their balance and ensure
        // votes cast == balance * weight
        await n1.federation.castVote(1, 1, "");

        const receipt = await n1.federation.getReceipt(1, owner.address);
        expect(receipt.votes).to.equal(n2Balance.mul(weightn2));
        expect(receipt.hasVoted).to.be.true;
        expect(receipt.support).to.equal(ethers.BigNumber.from("1"));

        // ensure that rando (which has token with more weight) can vote accordingly
        await n1.federation.connect(rando).castVote(1, 2, "");

        const receiptRando = await n1.federation.getReceipt(1, rando.address);
        expect(receiptRando.votes).to.equal(n2Balance.mul(weightn1));
        expect(receiptRando.hasVoted).to.be.true;
        expect(receiptRando.support).to.equal(ethers.BigNumber.from("2"));
      });

      it("should allow voting with multiple tokens and weights from a single caller", async function () {
        const [owner] = await ethers.getSigners();
        const { n1, n2, n3 } = await setup(null, weights);

        const n1Balance = await n1.token.balanceOf(owner.address);
        const n2Balance = await n2.token.balanceOf(owner.address);

        await makeProposal(n1, n3, false, 0);

        const t1 = await n1.federation.nounishTokens(0);
        const t2 = await n1.federation.nounishTokens(1);

        const weightn1 = t1.weight;
        const weightn2 = t2.weight;

        const wb1 = n1Balance.mul(weightn1);
        const wb2 = n2Balance.mul(weightn2);

        await n1.federation.castVote(1, 1, "");

        const receipt = await n1.federation.getReceipt(1, owner.address);
        expect(receipt.votes).to.equal(wb1.add(wb2));
        expect(receipt.hasVoted).to.be.true;
      });
    });

    describe("BuilderDAO", function () {
      it("should allow setting exec window", async function () {
        const { n1 } = await setup(null, weights);

        await n1.federation._setExecWindow(10, 120);
        const blocks = await n1.federation.execWindowBlocks();
        const secs = await n1.federation.execWindowSecs();

        expect(blocks.toNumber()).to.equal(10);
        expect(secs.toNumber()).to.equal(120);
      });

      it("should work end-to-end", async function () {
        const { n1, n2 } = await setup(null, weights);
        const [owner, eDAOMember, fedUser] = await ethers.getSigners();

        // delegate representation to federation
        await n1.token.delegate(n1.federation.address);

        const balance = await n1.token.balanceOf(owner.address);

        // create external proposal under another edao user
        await n1.token.connect(eDAOMember)["mint()"]();

        for (let i = 0; i < 5; i++) {
          await n1.token.connect(fedUser)["mint()"]();
        }
        await mineBlock();

        const targets = [n1.token.address];
        const values = ["0"];
        let ABI = ["function balanceOf(address account)"];
        let iface = new ethers.utils.Interface(ABI);
        const callDatas = [iface.encodeFunctionData("balanceOf", [owner.address])];

        const builderProposeTx = await n1.delegate
          .connect(eDAOMember)
          .propose(targets, values, callDatas, "check owner balance");

        const builderTxReceipt = await builderProposeTx.wait();
        const propCreatedEvent = builderTxReceipt.events.find((e) => e.event === "ProposalCreated");
        const ePropId = propCreatedEvent.args.proposalId;
        const builderProp = await n1.delegate.getProposal(ePropId);

        const tx = await n1.federation.connect(eDAOMember).propose(n1.delegate.address, ePropId, 1);
        const receipt = await tx.wait();
        const createdEvent = receipt.events.find((e) => e.event === "MultiTypeProposalCreated");

        let fedProp = await n1.federation.proposals(1);

        expect(createdEvent.args.id).to.equal(ethers.BigNumber.from("1"));
        expect(createdEvent.args.eDAO).to.equal(n1.delegate.address);
        expect(createdEvent.args.ePropID).to.equal(ePropId);
        expect(createdEvent.args.startBlock).to.equal(fedProp.startBlock);
        expect(createdEvent.args.startTimestamp).to.equal(fedProp.startTimestamp);
        expect(createdEvent.args.endBlock).to.equal(fedProp.endBlock);
        expect(createdEvent.args.endTimestamp).to.equal(builderProp.voteEnd);
        expect(createdEvent.args.quorumVotes).to.equal(ethers.BigNumber.from("0"));

        // federation propID should be 1
        const bFed = await n1.token.getPastVotes(fedUser.address, createdEvent.args.startTimestamp - 1);
        const castVote = n1.federation.connect(fedUser).castVote(1, 1, "seems cool");
        await expect(castVote).not.to.be.reverted;

        fedProp = await n1.federation.proposals(1);

        expect(fedProp.forVotes.toNumber()).to.equal(bFed.toNumber() * weights[0]);

        const tx2 = n1.federation.execute(1);
        await expect(tx2).to.be.revertedWith("proposal can only be executed if it is within the execution window");
        await mineBlock();

        const dupeProp = n1.federation.connect(eDAOMember).propose(n1.delegate.address, ePropId, 0);
        await expect(dupeProp).to.be.revertedWith("proposal already proposed");

        // advance into execution window (end block of federation proposal is inherited from external proposal)
        await setNextBlockTimestamp(builderProp.voteEnd - 120, true);

        const exec = n1.federation.execute(1);
        await expect(exec).not.to.be.reverted;

        // check external dao proposal has 5 votes for it (owner minted 5 and then delegated to federation)
        let eprop = await n1.delegate.getProposal(ePropId);
        expect(eprop.forVotes).to.equal(balance);

        // mine some blocks so we can queue and execute the external proposal since it should have passed quorum
        await setNextBlockTimestamp(builderProp.voteEnd, true);
        await advanceBlocks(30);
        await n1.delegate.connect(owner).queue(ePropId);

        block = await ethers.provider.getBlock("latest");

        await n1.delegate.execute(
          propCreatedEvent.args.targets,
          ["0"],
          propCreatedEvent.args.calldatas,
          propCreatedEvent.args.descriptionHash,
          eDAOMember.address
        );

        // check that the external dao proposal is in executed state
        eprop = await n1.delegate.getProposal(ePropId);
        expect(eprop.executed).to.be.true;
      });

      it("should allow submitting a prop", async function () {
        const [owner, , , rando] = await ethers.getSigners();
        const { n1, n2 } = await setup(null, weights);

        const targets = [n1.token.address];
        const values = ["0"];
        const signatures = ["balanceOf(address)"];
        const callDatas = [encodeParameters(["address"], [owner.address])];

        await n1.token.transferFrom(owner.address, n1.federation.address, 0);
        await n1.federation._setApprovedSubmitter(owner.address);

        await expect(
          n1.federation.submitProp(
            targets,
            values,
            signatures,
            callDatas,
            "check owner balance",
            n1.delegate.address,
            1
          )
        ).to.not.be.reverted;

        // ensure only the approved submitter can submit
        await expect(
          n1.federation
            .connect(rando)
            .submitProp(targets, values, signatures, callDatas, "check owner balance", n1.delegate.address, 1)
        ).to.be.revertedWith("submitter only");
      });
    });

    describe("SingleToken", function () {
      it("should work w/ single token configuration", async function () {
        const [owner] = await ethers.getSigners();

        const nounish = await deployBuilderDAO(owner);
        const nounishTwo = await deployBuilderDAO(owner);

        const Delegate = await ethers.getContractFactory("DelegateMultiType");

        const fDelegate = await Delegate.deploy(owner.address, 2500, 30000, 0);
        const fDelegateTwo = await Delegate.deploy(owner.address, 2500, 30000, 0);

        await fDelegate._setNounishTokens([nounish.token.address], [1], [false], [1]);
        await fDelegateTwo._setNounishTokens([nounishTwo.token.address], [1], [false], [1]);

        nounish.federation = fDelegate;
        nounishTwo.federation = fDelegateTwo;

        await advanceBlocks(20);

        const balance = await nounish.token.balanceOf(owner.address);

        await makeProposal(nounish, nounishTwo, false, 1);
        await nounish.federation.castVote(1, 1, "");

        const receipt = await nounish.federation.getReceipt(1, owner.address);

        expect(receipt.votes).to.equal(balance);
        expect(receipt.hasVoted).to.be.true;

        const fProp = await nounish.federation.proposals(1);
        const execWindow = await nounish.federation.execWindowSecs();

        // advance into execution window
        const ets = fProp.endTimestamp - execWindow;
        await setNextBlockTimestamp(ets, true);
        await advanceBlocks(30);

        // execute prop
        const exec = nounish.federation.execute(1);
        await expect(exec).not.to.be.reverted;
      });
    });
  });
});
