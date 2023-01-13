const promptjs = require("prompt");

task("deployBid", "deploys a new federation bid contract")
  .addParam("t", "baseTip in ETH", "0", types.string)
  .addOptionalParam("m", "minBid in ETH", "0", types.string)
  .addOptionalParam("i", "minBidIncrement Percent", 5, types.int)
  .addOptionalParam("w", "exec window in blocks (default 150 - 30min)", 150, types.int)
  .setAction(async (args, { ethers, config }) => {
    let gasPrice = await ethers.provider.getGasPrice();
    const gasInGwei = Math.round(Number(ethers.utils.formatUnits(gasPrice, "gwei")));

    promptjs.start();
    const result = await promptjs.get([
      {
        properties: {
          gasPrice: {
            type: "integer",
            required: true,
            description: "Enter a gas price (gwei)",
            default: gasInGwei,
          },
        },
      },
    ]);

    const tipInETH = ethers.utils.parseEther(`${args.t}`);
    const minBidInETH = ethers.utils.parseEther(`${args.m}`);

    const deployArgs = [args.w, tipInETH, minBidInETH, args.i];

    gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");

    const factory = await ethers.getContractFactory("DelegateBid");
    const deploymentGas = await factory.signer.estimateGas(
      factory.getDeployTransaction(...(deployArgs.map((a) => (typeof a === "function" ? a() : a)) ?? []), {
        gasPrice,
      })
    );

    const [deployer] = await ethers.getSigners();
    const deploymentCost = deploymentGas.mul(gasPrice);
    console.log(`Deploy from: ${deployer.address}\nCost: ${ethers.utils.formatUnits(deploymentCost, "ether")} ETH`);

    const confirmResult = await promptjs.get([
      {
        properties: {
          confirm: {
            pattern: /^(DEPLOY|EXIT)$/,
            description: 'Type "DEPLOY" to confirm or "EXIT" to exit.',
          },
        },
      },
    ]);

    if (confirmResult.operation === "EXIT") {
      console.log("Exiting...");
      return;
    }

    console.log(`Deploying Federation...`);

    const deployedContract = await factory.deploy(
      ...(deployArgs.map((a) => (typeof a === "function" ? a() : a)) ?? []),
      {
        gasPrice,
      }
    );

    await deployedContract.deployed();

    console.log(`Delegate deployed to ${deployedContract.address}`);
  });
