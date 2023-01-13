const {
  address,
  encodeParameters,
  setupBid: setup,
  advanceBlocks,
  mineBlock,
  setNextBlockTimestamp,
  makeProposal,
} = require("./utils");

const { expect } = require("chai");

describe("Federation Delegate Bid", function () {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Bid", function () {
    it("Should revert if external proposal does not exist", async function () {
      const { n1, n2 } = await setup(null);
      const tx = n1.federation.createBid(n2.delegate.address, 1, 1, "", { value: ethers.utils.parseEther("1.0") });
      await expect(tx).to.be.reverted;
    });

    it("e2e proposals", async function () {
      const { n1, n2 } = await setup(null);
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
      const tx = await n1.federation.createBid(n2.delegate.address, ePropID, 1, "", {
        value: ethers.utils.parseEther("1.0"),
      });
      const receipt = await tx.wait();

      const bidPlacedEvent = receipt.events.find((e) => e.event === "BidPlaced");
      expect(bidPlacedEvent.args.dao).to.equal(n2.delegate.address);
      expect(bidPlacedEvent.args.propId).to.equal(ePropID);
      expect(bidPlacedEvent.args.support).to.equal(ethers.BigNumber.from("1"));
      expect(bidPlacedEvent.args.amount).to.equal(ethers.utils.parseEther("1.0"));
      expect(bidPlacedEvent.args.bidder).to.equal(owner.address);
      expect(bidPlacedEvent.args.reason).to.equal("");

      const tx2 = n1.federation.castExternalVote(n2.delegate.address, ePropID);
      await expect(tx2).to.be.reverted;
      await mineBlock();

      // advance into execution window (end block of federation proposal is inherited from external proposal)
      const fBid = await n1.federation.bids(n2.delegate.address, ePropID);
      const execWindow = await n1.federation.castWindow();
      await advanceBlocks(fBid.endBlock - execWindow);

      // execute prop
      const exec = n1.federation.castExternalVote(n2.delegate.address, ePropID);
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

  describe("Create Bid", function () {
    it("Ensure min inc is set on subsequent bids", async function () {
      const [owner] = await ethers.getSigners();
      const { n1, n2 } = await setup(null);
      await makeProposal(n1, n2, true);

      await expect(
        n1.federation.createBid(n2.delegate.address, 1, 1, "", {
          value: ethers.utils.parseEther("1.0"),
        })
      ).not.to.be.reverted;

      await expect(
        n1.federation.createBid(n2.delegate.address, 1, 1, "", {
          value: ethers.utils.parseEther("1.0"),
        })
      ).to.be.revertedWith("Must send more than last bid by minBidIncrementPercentage amount");

      const minInc = await n1.federation.minBidIncrementPercentage();
      const inc = ethers.utils.parseEther("1.0").mul(minInc).div(100);

      // vote for
      const bidTx = await n1.federation.createBid(n2.delegate.address, 1, 1, "", {
        value: ethers.utils.parseEther("1.0").add(inc),
      });

      const bidReceipt = await bidTx.wait();

      const eProp = await n2.delegate.proposals(1);

      const bidBlockNumber = bidReceipt.blockNumber;
      const bid = await n1.federation.bids(n2.delegate.address, 1);
      expect(bid.bidder).to.equal(owner.address);
      expect(bid.support).to.equal(1); // for
      expect(bid.txBlock).to.equal(bidBlockNumber);
      expect(bid.endBlock).to.equal(eProp.endBlock);
      expect(bid.amount).to.equal(ethers.utils.parseEther("1.0").add(inc));
    });

    it("Last bidder should be refunded if one upped", async function () {
      const [_, bidderA, bidderB] = await ethers.getSigners();
      const { n1, n2 } = await setup(null);
      await makeProposal(n1, n2, true);

      const minBid = await n1.federation.minBid();
      await expect(
        n1.federation.connect(bidderA).createBid(n2.delegate.address, 1, 1, "", {
          value: minBid,
        })
      ).to.not.be.reverted;

      const balanceAfterBid = await bidderA.getBalance();

      await expect(
        n1.federation.connect(bidderB).createBid(n2.delegate.address, 1, 1, "", {
          value: minBid.mul(2),
        })
      ).to.not.be.reverted;

      const balanceAfterRefund = await bidderA.getBalance();
      expect(balanceAfterBid.add(minBid)).to.equal(balanceAfterRefund);
    });
  });

  describe("Refunding", function () {
    it("Correctly refunds last bidder when external prop vetoed", async function () {
      const [_, bidderA] = await ethers.getSigners();
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2, true);

      const minBid = await n1.federation.minBid();

      await expect(
        n1.federation.connect(bidderA).createBid(n2.delegate.address, 1, 1, "", {
          value: minBid,
        })
      ).to.not.be.reverted;

      // reverts if proposal is active
      await expect(n1.federation.connect(bidderA).claimRefund(n2.delegate.address, 1)).to.be.revertedWith(
        "Refund cannot be claimed"
      );

      const balanceAfter = await bidderA.getBalance();

      await n2.delegate.veto(1);

      // ensure reverts if not bidderA
      await expect(n1.federation.claimRefund(n2.delegate.address, 1)).to.be.revertedWith(
        "Only the bidder can claim their refund"
      );

      const claimTx = await n1.federation.connect(bidderA).claimRefund(n2.delegate.address, 1);
      const claimReceipt = await claimTx.wait();

      // make sure bidder was refunded
      const balanceAfterLargerBid = await bidderA.getBalance();
      expect(balanceAfter.add(minBid)).to.equal(
        balanceAfterLargerBid.add(claimReceipt.gasUsed.mul(claimReceipt.effectiveGasPrice))
      );

      // should revert if already refunded
      await expect(n1.federation.connect(bidderA).claimRefund(n2.delegate.address, 1)).to.be.revertedWith(
        "Bid already refunded"
      );
    });

    it("Rejects refunds if a vote was already cast", async function () {
      const [owner, bidderA] = await ethers.getSigners();
      const { n1, n2 } = await setup();
      await makeProposal(n1, n2, true);

      const minBid = await n1.federation.minBid();

      await expect(
        n1.federation.connect(bidderA).createBid(n2.delegate.address, 1, 1, "", {
          value: minBid,
        })
      ).to.not.be.reverted;

      // advance into execution window (end block of federation proposal is inherited from external proposal)
      const fBid = await n1.federation.bids(n2.delegate.address, 1);
      const execWindow = await n1.federation.castWindow();
      await advanceBlocks(fBid.endBlock - execWindow);

      // execute prop
      await n1.federation.castExternalVote(n2.delegate.address, 1);

      // should revert if already executed
      await expect(n1.federation.connect(bidderA).claimRefund(n2.delegate.address, 1)).to.be.revertedWith(
        "Vote already cast"
      );
    });

    describe("Vote Casting", function () {
      it("Should refund gas/executer tip and distribute bid to the beneficiary", async function () {
        const [owner, bidderA, executer, beneficiary] = await ethers.getSigners();
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2, true);

        await n1.federation.setBeneficiary(beneficiary.address);

        const minBid = await n1.federation.minBid();
        await expect(
          n1.federation.createBid(n2.delegate.address, 1, 1, "", {
            value: minBid,
          })
        ).to.not.be.reverted;

        // advance into cast window
        const fBid = await n1.federation.bids(n2.delegate.address, 1);
        const execWindow = await n1.federation.castWindow();
        await advanceBlocks(fBid.endBlock - execWindow);
        const receivedTip = await n1.federation.baseTip();

        const executerPreBalance = await executer.getBalance();
        const beneficiaryPreBalance = await beneficiary.getBalance();

        const exec = await n1.federation.connect(executer).castExternalVote(n2.delegate.address, 1);
        const receipt = await exec.wait();

        const executerPostBalance = await executer.getBalance();

        const refundEvent = receipt.events.find((e) => e.event === "VoteCastRefundAndDistribute");
        const refundAmount = refundEvent.args.refundAmount;

        const restBid = fBid.amount.sub(receivedTip).sub(refundAmount);
        const beneficiaryBalance = await beneficiary.getBalance();
        expect(beneficiaryBalance).to.equal(beneficiaryPreBalance.add(restBid));

        // ensure that executer received tip
        expect(executerPostBalance).to.equal(
          executerPreBalance.add(receivedTip).sub(receipt.gasUsed.mul(receipt.effectiveGasPrice)).add(refundAmount)
        );
      });

      it("Cannot be cast if voting is closed on the external prop", async function () {
        const [owner, bidderA] = await ethers.getSigners();
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2, true);

        await mineBlock();

        // should revert if no bid made
        await expect(n1.federation.castExternalVote(n2.delegate.address, 1)).to.be.revertedWith(
          "Bid not offered for this proposal"
        );

        const minBid = await n1.federation.minBid();
        await expect(
          n1.federation.connect(bidderA).createBid(n2.delegate.address, 1, 1, "", {
            value: minBid,
          })
        ).to.not.be.reverted;

        // should revert if not in window
        await expect(n1.federation.castExternalVote(n2.delegate.address, 1)).to.be.revertedWith(
          "Vote can only be cast during the proposal execution window"
        );

        // advance into cast window
        const fBid = await n1.federation.bids(n2.delegate.address, 1);
        const execWindow = await n1.federation.castWindow();
        await advanceBlocks(fBid.endBlock - execWindow);

        await n2.delegate.veto(1);

        await expect(n1.federation.castExternalVote(n2.delegate.address, 1)).to.be.revertedWith(
          "Voting is closed for this proposal"
        );
      });

      it("Cannot be bid and cast in the same block", async function () {
        const [owner, bidderA] = await ethers.getSigners();
        const { n1, n2 } = await setup();
        await makeProposal(n1, n2, true);

        const minBid = await n1.federation.minBid();
        await expect(
          n1.federation.connect(bidderA).createBid(n2.delegate.address, 1, 1, "", {
            value: minBid,
          })
        ).to.not.be.reverted;

        // try to snipe auction in one tx
        const AtomicFactory = await ethers.getContractFactory("AtomicBidAndCast");
        const Atomic = await AtomicFactory.deploy();

        // advance into cast window
        const fBid = await n1.federation.bids(n2.delegate.address, 1);
        const execWindow = await n1.federation.castWindow();
        await advanceBlocks(fBid.endBlock - execWindow);

        await expect(
          Atomic.bidAndCast(n1.federation.address, n2.delegate.address, 1, 1, {
            value: ethers.utils.parseEther("1.0"),
          })
        ).to.be.revertedWith("Vote cannot be cast in the same block the bid was made");

        await mineBlock();

        await n1.federation.castExternalVote(n2.delegate.address, 1);
      });
    });

    describe("Misc", function () {
      describe("Admin", function () {
        it("Owner can set approvedSigner for ERC1271 sigs", async function () {
          const [owner, userA, rando] = await ethers.getSigners();

          const { n1 } = await setup();

          await expect(n1.federation.setApprovedSigner(owner.address)).not.to.be.reverted;
          await expect(n1.federation.connect(rando).setApprovedSigner(address(0))).to.be.reverted;
          await expect(n1.federation.setApprovedSigner(rando.address)).to.not.be.reverted;

          const dataToSign = { msg: "hello world" };
          const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataToSign));
          const dataHashBin = ethers.utils.arrayify(dataHash);

          const hash = ethers.utils.hashMessage(dataHashBin);
          const sig = await rando.signMessage(dataHashBin);

          expect(await n1.federation.isValidSignature(hash, sig)).to.equal("0x1626ba7e");
        });

        it("Owner can set beneficiary", async function () {
          const [owner, na, rando] = await ethers.getSigners();
          const { n1, n2 } = await setup();

          await expect(n1.federation.connect(rando).setBeneficiary(na.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
          );

          await expect(n1.federation.setBeneficiary(na.address)).to.not.be.reverted;

          await expect(n1.federation.setBeneficiary(owner.address)).to.not.be.reverted;

          await expect(n1.federation.connect(na).setBeneficiary(owner.address)).to.be.reverted;
        });
      });

      describe("Prop Submitter", function () {
        it("Only owner can set submitter", async function () {
          const [owner, na, , rando] = await ethers.getSigners();
          const { n1, n2 } = await setup();

          await expect(n2.federation.connect(rando).setApprovedSubmitter(owner.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
          );

          await expect(n2.federation.setApprovedSubmitter(rando.address)).to.not.be.reverted;

          await expect(n2.federation.connect(na).setApprovedSubmitter(owner.address)).to.be.reverted;
        });

        it("Should allow submitting a prop by the approved submitter", async function () {
          const [owner, , , rando] = await ethers.getSigners();
          const { n1, n2 } = await setup();

          const targets = [n2.token.address];
          const values = ["0"];
          const signatures = ["balanceOf(address)"];
          const callDatas = [encodeParameters(["address"], [owner.address])];

          await n1.token.transferFrom(owner.address, n2.federation.address, 0);

          await n2.federation.setApprovedSubmitter(owner.address);

          await expect(
            n2.federation.submitProp(targets, values, signatures, callDatas, "check owner balance", n1.delegate.address)
          ).to.not.be.reverted;

          // ensure only the approved submitter can submit
          await expect(
            n2.federation
              .connect(rando)
              .submitProp(targets, values, signatures, callDatas, "check owner balance", n1.delegate.address)
          ).to.be.revertedWith("Submitter only");
        });
      });
    });
  });
});
