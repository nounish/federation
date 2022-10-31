const { address } = require("../test/utils");
const promptjs = require("prompt");

task("deployMultiToken", "deploys a new federation multi-token delegate contract")
  .addOptionalParam("qbps", "quorumBPS", 0, types.int)
  .addOptionalParam("w", "exec window in blocks (default 2500)", 2500, types.int)
  .addVariadicPositionalParam("tokensAndWeights")
  .setAction(async (args, { ethers, config }) => {
    let gasPrice = await ethers.provider.getGasPrice();
    const gasInGwei = Math.round(Number(ethers.utils.formatUnits(gasPrice, "gwei")));

    const tokens = [];
    const weights = [];
    let fallback = [];

    if (args.tokensAndWeights.length % 2 === 0) {
      const len = args.tokensAndWeights.length;
      for (let i = 0; i < len / 3; i++) {
        tokens.push(args.tokensAndWeights.shift());
        weights.push(args.tokensAndWeights.shift());
        fallback.push(args.tokensAndWeights.shift());
      }

      fallback = fallback.map((f) => f === "true");
      console.log({ tokens, weights, fallback });
    } else {
      console.log(
        "Tokens must be passed with corresponding weight after all flags. i.e. `npx hardhat deployMultiToken --qbps 500 <token-addy> 2 false <token-addy> 1 true`"
      );
      return;
    }

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

    const [deployer] = await ethers.getSigners();
    const deployArgs = [deployer.address, args.w, args.qbps];
    gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");

    const factory = await ethers.getContractFactory("DelegateMultiToken");
    const deploymentGas = await factory.signer.estimateGas(
      factory.getDeployTransaction(...(deployArgs.map((a) => (typeof a === "function" ? a() : a)) ?? []), {
        gasPrice,
      })
    );

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

    console.log(`Deploying Federation MultiToken Delegate...`);

    const deployedContract = await factory.deploy(
      ...(deployArgs.map((a) => (typeof a === "function" ? a() : a)) ?? []),
      {
        gasPrice,
      }
    );

    await deployedContract.deployed();

    await deployedContract._setNounishTokens(tokens, weights, fallback);

    console.log(`MultiToken Delegate deployed to ${deployedContract.address}`);
  });
