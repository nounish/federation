task("new-wallet", "creates a new wallet").setAction(async (args, { ethers }) => {
  const wallet = ethers.Wallet.createRandom();
  console.log("address:", wallet.address);
  console.log("mnemonic:", wallet.mnemonic.phrase);
  console.log("privateKey:", wallet.privateKey);
});
