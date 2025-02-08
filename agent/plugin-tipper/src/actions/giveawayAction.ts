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
import { gql, request } from 'graphql-request';

import { getAmountToTip } from "./prompts.ts";
import { agentUsername, generateWallet, getBalance, getCreatorUsername, getTwitterIdFromUsername, insertUser, networkId, searchWalletRecord, tip, transfer } from "../helpers.ts";
import Database from "better-sqlite3";
import { Wallet } from "@coinbase/coinbase-sdk";
import { WalletRecord } from "../types.ts";
import { getWithdrawAddress } from "../providers/prompts.ts";

export const giveawayAction: Action = {
    name: "BIG_ACTION_123",
    similes: [],
    description: "This is the BIG_ACTION_123 action.",
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
        const db = new Database('addresses.db');

        // Get creator's (user) adress
        const creatorWalletRecord = searchWalletRecord(db, message.userId) as WalletRecord;
        const creatorAddress = creatorWalletRecord.address;

        // Calculate last week's timestamp
        const secondsInAWeek = 604800;
        const timestampNow = Math.floor(Date.now() / 1000);
        const timestampWeekAgo = timestampNow - secondsInAWeek;
        // Make graphQL query to get users that have tipped the creator in the past week
        // Will count multiple tips from the same user as different tips
        const query = gql`{
            tips(
                where: {
                    creator: "${creatorAddress}"
                    blockTimestamp_gt: "${timestampWeekAgo}"
                }
            ) {
                tipper
            }
        }`;
        const url = 'https://api.studio.thegraph.com/query/103564/tipthiscreator-basemainnet/version/latest';
        
        const response: any = await request(url, query);
        const data = await response;
        const tipsList = data.tips;
        const tippers = tipsList.map((tip: any) => tip["tipper"]);
        console.log(tipsList.length);
        console.log(tippers);
        if (tippers.length === 0) {
            callback({text: "Unfortunately, no one tipped you in the past week :("});
            return true;
        }
        // Get winner
        const winnerIndex = Math.floor(Math.random() * tippers.length);
        const winnerAddress = tippers[winnerIndex];
        console.log("winner index: ", winnerIndex);
        console.log("winner: ", winnerAddress);

        // search for user's wallet
        const walletRecord = searchWalletRecord(db, message.userId) as WalletRecord;

        const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
        const balance = await getBalance(wallet);

        // Make transfer
        const txHash = await transfer(wallet, winnerAddress, balance);

        const text = `Hooray! User with address ${winnerAddress} won ${balance} ETH! Here is the transaction hash: ${txHash}`;
        callback({text: text});
        return true;
    },
    examples: [
        [
            {
                user: "# Instructions",
                content: {
                    text: "Call the BIG_ACTION_123 action.",
                },
            },
            {
                user: "tipthiscreator",
                content: { text: "", action: "BIG_ACTION_123" },
            },
        ],
    ] as ActionExample[][],
} as Action;
