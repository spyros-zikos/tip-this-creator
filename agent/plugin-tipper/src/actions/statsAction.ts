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
import { gql, request } from 'graphql-request';

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

        // Get user's adress
        const walletRecord = searchWalletRecord(db, message.userId) as WalletRecord;
        const address = walletRecord.address;

        /*//////////////////////////////////////////////////////////////
                                   TIPS SENT
        //////////////////////////////////////////////////////////////*/
        const query = gql`{
            tips(
                where: {
                    tipper: "${address}"
                }
            ) {
                amount
            }
        }`;
        const url = 'https://api.studio.thegraph.com/query/103564/tipthiscreator-basemainnet/version/latest';
        
        const response: any = await request(url, query);
        const data = await response;
        const tipsList = data.tips;
        const amounts = tipsList.map((tip: any) => tip["amount"]);
        console.log("Number of tips sent: ", tipsList.length);
        console.log("Amounts: ", amounts);
        let tipsSentText = "";
        if (amounts.length === 0) {
            tipsSentText += `- You have not tipped anyone yet!
`;
            // tipsText += `- Unfortunately, no one tipped you in the past week :(
// `;
        } else {
            let totalAmount = 0;
            for (let i = 0; i < amounts.length; i++) {
                totalAmount += parseInt(amounts[i]);
            }
            tipsSentText += `- You've tipped ${amounts.length} times for a total of ${totalAmount/parseFloat("1e18")} ETH!
`;
        }

        /*//////////////////////////////////////////////////////////////
                                 TIPS RECEIVED
        //////////////////////////////////////////////////////////////*/

        const query2 = gql`{
            tips(
                where: {
                    creator: "${address}"
                }
            ) {
                amount
            }
        }`;
        
        const response2: any = await request(url, query2);
        const data2 = await response2;
        const tipsList2 = data2.tips;
        const amounts2 = tipsList2.map((tip: any) => tip["amount"]);
        console.log("Number of tips received: ", tipsList2.length);
        console.log("Amounts: ", amounts2);
        let tipsReceivedText = "";
        if (amounts2.length === 0) {
            tipsReceivedText += `- Unfortunately, no one has tipped you yet :(
`;
        } else {
            let totalAmount = 0;
            for (let i = 0; i < amounts2.length; i++) {
                totalAmount += parseInt(amounts2[i]);
            }
            tipsReceivedText += `- You've been tipped ${amounts2.length} times for a total of ${totalAmount/parseFloat("1e18")} ETH!
`;
        }

        // MORE STATS

        const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
        const balance = await getBalance(wallet);

        const text = tipsSentText + tipsReceivedText + `- The creator you have tipped the most is ... (Coming Soon)
- The user that has tipped you the most is ... (Coming Soon)
- Your balance is: ${balance} ETH!`;

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
