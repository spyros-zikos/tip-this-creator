// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Transfer money from users to creators
 * @author Spyros
 * @notice This contract receives ETH from users, keeps a fee and sends the rest to the creator.
 * @dev When the transfer happens the contract emits an event.
 */
contract TipThisCreator is ReentrancyGuard, Ownable {
    uint256 private s_fee = 1e17; // 10%
    mapping(address => uint256) private s_tipperToAmount;
    mapping(address => uint256) private s_creatorToAmount;
    mapping(address tipper => address[] creators) private s_tipperToCreators;
    mapping(address creator => address[] tippers) private s_creatorToTippers;

    event Tip(address indexed tipper, address indexed creator, uint256 indexed amount);

    error TipThisCreator__InvalidTipAmount(uint256 amount);
    error TipThisCreator__TransferFailed(address from, address to, uint256 value);

    constructor() ReentrancyGuard() Ownable(msg.sender) {}

    function tip(address creator) external payable nonReentrant {
        require(msg.value > 0, "Tip must be greater than 0");
        uint256 tipFee = msg.value * s_fee / 1e18;
        uint256 tipAfterFee = msg.value - tipFee;
        s_tipperToAmount[msg.sender] += tipAfterFee;
        s_creatorToAmount[creator] += tipAfterFee;
        // send ETH to the creator
        (bool sent,) = payable(creator).call{value: tipAfterFee}("");
        if (!sent) revert TipThisCreator__TransferFailed(msg.sender, creator, tipAfterFee);
        emit Tip(msg.sender, creator, tipAfterFee);
    }

    function withdraw() external nonReentrant onlyOwner {
        // send ETH to the owner from contract's balance
        uint256 balance = address(this).balance;
        require(balance > 0, "Contract is empty");
        payable(msg.sender).transfer(balance);
    }

    function setFee(uint256 fee) external onlyOwner {
        s_fee = fee;
    }

    // Getters

    function getFee() public view returns (uint256) {
        return s_fee;
    }

    function getAmountFromTipper(address tipper) public view returns (uint256) {
        return s_tipperToAmount[tipper];
    }

    function getAmountFromCreator(address creator) public view returns (uint256) {
        return s_creatorToAmount[creator];
    }

    function getCreatorsFromTipper(address tipper) public view returns (address[] memory) {
        return s_tipperToCreators[tipper];
    }

    function getTippersFromCreator(address creator) public view returns (address[] memory) {
        return s_creatorToTippers[creator];
    }
}
