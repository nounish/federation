// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IManager, Manager} from "../external/builder/manager/Manager.sol";
import {IToken, Token} from "../external/builder/token/Token.sol";
import {IAuction, Auction} from "../external/builder/auction/Auction.sol";
import {MetadataRenderer} from "../external/builder/token/metadata/MetadataRenderer.sol";
import {IGovernor, Governor} from "../external/builder/governance/governor/Governor.sol";
import {ITreasury, Treasury} from "../external/builder/governance/treasury/Treasury.sol";
import {MetadataRenderer} from "../external/builder/token/metadata/MetadataRenderer.sol";
import {MetadataRendererTypesV1} from "../external/builder/token/metadata/types/MetadataRendererTypesV1.sol";
import {ERC1967Proxy} from "../external/builder/lib/proxy/ERC1967Proxy.sol";

contract BuilderDeploy {
    using Strings for uint256;

    event Deployed(address token, address metadata, address treasury, address governor);

    function run(address owner) external {
        // Deploy root manager implementation + proxy
        address managerImpl0 = address(new Manager(address(0), address(0), address(0), address(0), address(0)));

        Manager manager = Manager(
            address(new ERC1967Proxy(managerImpl0, abi.encodeWithSignature("initialize(address)", address(this))))
        );

        // Deploy token implementation
        address tokenImpl = address(new Token(address(manager)));

        // Deploy metadata renderer implementation
        address metadataRendererImpl = address(new MetadataRenderer(address(manager)));

        // Deploy auction house implementation
        address auctionImpl = address(new Auction(address(manager), address(this)));

        // Deploy treasury implementation
        address treasuryImpl = address(new Treasury(address(manager)));

        // Deploy governor implementation
        address governorImpl = address(new Governor(address(manager)));

        address managerImpl =
            address(new Manager(tokenImpl, metadataRendererImpl, auctionImpl, treasuryImpl, governorImpl));

        manager.upgradeTo(managerImpl);

        IManager.FounderParams[] memory _founderParams = new IManager.FounderParams[](1);
        _founderParams[0] = IManager.FounderParams({wallet: owner, ownershipPct: 1, vestExpiry: 0});

        IManager.AuctionParams memory _auctionParams = IManager.AuctionParams({reservePrice: 0, duration: 1000});

        bytes memory tokenStr = abi.encode(
            "Mock Token",
            "MOCK",
            "This is a mock token",
            "ipfs://Qmew7TdyGnj6YRUjQR68sUJN3239MYXRD8uxowxF6rGK8j",
            "https://nouns.build",
            "http://localhost:5000/render"
        );

        IManager.TokenParams memory _tokenParams = IManager.TokenParams({initStrings: tokenStr});

        IManager.GovParams memory _govParams = IManager.GovParams({
            timelockDelay: 1 seconds,
            votingDelay: 30 minutes,
            votingPeriod: 3 days,
            proposalThresholdBps: 50,
            quorumThresholdBps: 1000,
            vetoer: owner
        });

        (address _token, address _metadata,, address _treasury, address _governor) =
            manager.deploy(_founderParams, _tokenParams, _auctionParams, _govParams);

        emit Deployed(_token, _metadata, _treasury, _governor);
    }
}
