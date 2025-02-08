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
import { agentUsername, generateWallet, getBalance, getCreatorUsername, getTwitterIdFromUsername, insertUser, networkId, searchWalletRecord, tip, transfer } from "../helpers.ts";
import Database from "better-sqlite3";
import { Wallet } from "@coinbase/coinbase-sdk";
import { WalletRecord } from "../types.ts";
import { getWithdrawAddress } from "../providers/prompts.ts";

export const withdrawAction: Action = {
    name: "GO_OUT_ACTION_123",
    similes: [],
    description: "This is the GO_OUT_ACTION_123 action.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        // search for user's wallet
        const db = new Database('addresses.db');
        const walletRecord = searchWalletRecord(db, message.userId) as WalletRecord;

        const withdrawAddress = await getWithdrawAddress(runtime, message.content.text, agentUsername);
        if (withdrawAddress === "null") { // should not be possible to happen
            return;
        }

        const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
        const balance = await getBalance(wallet);

        // Make transfer
        const txHash = await transfer(wallet, withdrawAddress, balance);

        const text = `Your withdrawal was successful! You withdrew ${balance} ETH! Here is the transaction hash: ${txHash}`;
        callback({text: text});
        return true;
    },
    examples: [
        [
            {
                user: "# Instructions",
                content: {
                    text: "Call the GO_OUT_ACTION_123 action.",
                },
            },
            {
                user: "tipthiscreator",
                content: { text: "", action: "GO_OUT_ACTION_123" },
            },
        ],
    ] as ActionExample[][],
} as Action;
