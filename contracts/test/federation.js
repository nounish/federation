const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Federation", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDelegateFixture() {
    const [owner, nounishToken] = await ethers.getSigners();

    const Delegate = await ethers.getContractFactory("Delegate");
    const delegate = await Delegate.deploy(nounishToken.address, owner.address, 2500);

    return { delegate, owner };
  }

  describe("Deployment", function () {
    it("Should deploy without error", async function () {
      await loadFixture(deployDelegateFixture);
    });
  });

  describe("Internal Governance", function () {});

  describe("External Governance", function () {});
});
