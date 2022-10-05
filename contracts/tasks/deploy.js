const { address } = require("../test/utils");
const promptjs = require("prompt");

task("deploy", "deploys a new federation contract")
  .addParam("t", "governance token")
  .addParam("d", "dao logic address (not treasury)")
  .addOptionalParam("v", "vetoer", address(0), types.string)
  .addOptionalParam("w", "exec window in blocks (default 2500)", 2500, types.int)
  .setAction(async (args, { ethers, config }) => {
    if (!ethers.utils.isAddress(args.v)) {
      console.log("Vetoer address is not valid");
      return;
    }

    if (!ethers.utils.isAddress(args.t) && args.t !== address(0)) {
      console.log("Governance token address is not valid");
      return;
    }

    if (!ethers.utils.isAddress(args.d) && args.d !== address(0)) {
      console.log("DAO address is not valid");
      return;
    }

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

    const deployArgs = [args.v, args.t, args.d, args.w];
    gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");

    const factory = await ethers.getContractFactory("Delegate");
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
