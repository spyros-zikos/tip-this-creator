import { composeContext, elizaLogger, generateText, stringToUuid } from "@elizaos/core";
import { generateMessageResponse, generateTrueOrFalse } from "@elizaos/core";
import { booleanFooter, messageCompletionFooter } from "@elizaos/core";
import {
    Action,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";

import { getAmountToTip } from "./prompts.ts";
import { agentUsername, generateWallet, getBalance, getCreatorUsername, getDB, getTwitterIdFromUsername, insertUser, networkId, searchWalletRecord, tip, transfer } from "../helpers.ts";
import Database from "better-sqlite3";
import { Wallet } from "@coinbase/coinbase-sdk";
import { WalletRecord } from "../types.ts";
import { getWithdrawAddress } from "../providers/prompts.ts";

export const statsAction: Action = {
    name: "STATISTICS",
    similes: ["STATS", "GET_STATS", "GET_STATISTICS", "GENERATE_STATISTICS"],
    description: "Get statistics about the tipper.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const db = getDB();
        const creatorWalletRecord = searchWalletRecord(db, message.userId);
        if (creatorWalletRecord === "null") {
            return false;
        }
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const db = new Database('addresses.db');

        // search for user's wallet by address
        const walletRecord = searchWalletRecord(db, message.userId) as WalletRecord;

        const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
        const balance = await getBalance(wallet);

        const text = "sdf";
        // const text = `Your giveaway was successful! User with address ${winnerAddress} won ${balance} ETH! Here is the transaction hash: ${txHash}`;
        callback({text: text});
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me some statistics",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "STATISTICS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show statistics",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "STATISTICS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "let me see the stats",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "STATISTICS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "hello bro. do you have any statistics?",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "STATISTICS" },
            },
        ],
    ] as ActionExample[][],
} as Action;
