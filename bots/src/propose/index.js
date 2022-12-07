const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require("defender-relay-client/lib/ethers");
const DelegateABI = require("../../abi/multitokenDelegate.json");

// **NOTE** set to your federation delegate address
const DELEGATE_ADDRESS = "0xf23815d7ddc73d5cf34671f373d427414dc39dc9";

exports.handler = async function (event) {
  const payload = event.request.body;
  const matchReasons = payload.matchReasons;

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });

  console.log(JSON.stringify(event, null, "  "));

  const fedContract = new ethers.Contract(DELEGATE_ADDRESS, DelegateABI, signer);
  for (let i = 0; i < matchReasons.length; i++) {
    const matchReason = matchReasons[i];
    const { address: eDAO, args, params } = matchReason;

    try {
      console.log(`proposed DAO: ${eDAO} PropID: ${args[0]}`, `params: ${params}`);
      await fedContract.propose(eDAO, args[0]);
    } catch (ex) {
      console.log(`error propose: ${ex}\nmatchReason: ${matchReason}`);
    }
  }
};

// to run locally uncomment the following code
// ===========================================
// if (require.main === module) {
//   // example sentinel invocation
//   // ref: https://docs.openzeppelin.com/defender/sentinel#autotask
//   const exampleEvent = {
//     blockHash: "0xab..123",
//     matchReasons: [
//       {
//         type: "event",
//         address: "0x123..abc",
//         signature: "...",
//         condition: "value > 5",
//         args: ["5"],
//         params: { id: "5" },
//       },
//     ],
//     matchedAddresses: ["0x000..000"],
//     sentinel: {
//       id: "44a7d5...31df5",
//       name: "Sentinel Name",
//       addresses: ["0x000..000"],
//       confirmBlocks: 0,
//     },
//     value: "0x16345785D8A0000",
//   };

//   const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;

//   exports
//     .handler({ apiKey, apiSecret, request: { body: exampleEvent } })
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }
