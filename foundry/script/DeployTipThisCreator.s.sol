// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {TipThisCreator} from "../src/TipThisCreator.sol";

contract DeployTipThisCreator is Script {
    function run() external returns(TipThisCreator) {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        TipThisCreator tipperContract = new TipThisCreator();
        vm.stopBroadcast();
        return tipperContract;
    }
}