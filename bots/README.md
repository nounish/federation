# Openzeppelin Defender Setup

Thix package contains OpenZeppelin autotasks that are used to automate propose and execution functionality
for Federation.

## Getting Started

Head to https://defender.openzeppelin.com and sign up for an account.

## Create relayer

Relayers for OpenZeppelin Defender are "wallets" that will submit transactions on behalf of our bots. You can create a relayer by clicking on the "Relay" tab on the left hand side of the UI and follow the creation instructions.

If you would like to automate proposal submission the address provided by your relayer must be delegated at least one NFT.

## Create Autotasks

Configure each autotask to reference your Federation contract. Open `./src/exec/index.js` and `./src/propose/index.js` and replace the value of `DELEGATE_ADDRESS` with the address of your Federation contract.

You can then build the bots in this repo with:

- `npm i`
- `npm run build`

Code for each Autotask will be located in the `./dist` folder.

### Exec Autotask

Create a new `schedule` Autotask in OpenZeppelin Defender. Ensure that the relayer you created earlier is
selected and paste the code from `./dist/exec.js` into the code editor in the Autotask UI.

Set the `schedule` to run at a reasonable interval depending on your configured Federation execution window. i.e. every
90 minutes.

### Propose Autotask

Create a new `webhook` Autotask in OpenZeppelin Defender. Ensure that the relayer you created earlier is
selected and paste the code from `./dist/propose.js` into the code editor in the Autotask UI.

#### Create sentinel to monitor external DAO addresses and invoke the Propose Autotask

For your propose autotask to be executed whenever a new external DAO proposal is submitted, you need to create a sentinel that monitors the external DAO's governance contract. You can do this by clicking on the "Sentinel" tab on the left hand side of the UI and follow the creation instructions.
