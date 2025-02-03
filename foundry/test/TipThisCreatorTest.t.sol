// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TipThisCreator} from "../src/TipThisCreator.sol";
import {DeployTipThisCreator} from "../script/DeployTipThisCreator.s.sol";
import {Test, console2} from "forge-std/Test.sol";

contract TipThisCreatorTest is Test {
    TipThisCreator public tipperContract;
    address tipper = makeAddr("tipper");
    address creator = makeAddr("creator");
    address owner = vm.envAddress("DEPLOYER_ADDRESS");

    uint256 public constant TIP = 1e18;
    uint256 public constant FEE = 1e17;

    function setUp() public {
        DeployTipThisCreator deployer = new DeployTipThisCreator();
        tipperContract = deployer.run();
        vm.deal(tipper, TIP);
    }

    function testTipAndWithdraw() public {
        // Arrange, Act, Assert
        vm.prank(tipper);
        tipperContract.tip{value: TIP}(creator);
        uint256 feeAmount = TIP*FEE/1e18;

        assert(tipper.balance == 0);
        assert(address(tipperContract).balance == feeAmount);
        assert(creator.balance == TIP-feeAmount);

        assert(owner.balance == 0);
        vm.prank(owner);
        tipperContract.withdraw();
        assert(owner.balance == feeAmount);
        assert(address(tipperContract).balance == 0);
    }


}