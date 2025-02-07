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
import { agentUsername, generateWallet, getBalance, getCreatorUsername, getTwitterIdFromUsername, insertUser, networkId, searchWalletRecord, tip } from "../helpers.ts";
import Database from "better-sqlite3";
import { Wallet } from "@coinbase/coinbase-sdk";
import { WalletRecord } from "../types.ts";

export const tipAction: Action = {
    name: "FREQUENT_ACTION_123",
    similes: [],
    description: "This is the FREQUENT_ACTION_123 action.",
        // "User tips a content creator by transfer ETH from the user's wallet address to the creator's address.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // const state: UserState = await getUserState(db, _message.userId);
        
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        // const defaultTipAmount = "0.00036"; // ~ $1
        const defaultTipAmount = "1e-6"; // for testing

        const creatorUsername = getCreatorUsername(message.content.text);

        const creatorTwitterId = await getTwitterIdFromUsername(creatorUsername);
        const creatorUserId = stringToUuid(creatorTwitterId);
        console.log(creatorTwitterId);
        console.log(creatorUserId);

        // search for creators's wallet, if it doesn't exist, create one and store it
        const db = new Database('addresses.db');
        let creatorWallet = searchWalletRecord(db, creatorUserId);
        let address, walletId, seed;
        if (creatorWallet === "null") {
            [address, walletId, seed] = await generateWallet();
            insertUser(db, message.userId, creatorUsername, address, walletId, seed);
        } else {
            address = (creatorWallet as WalletRecord).address;
            console.log("Existing user address: ", address);
            // TODO: could update wallet username
            // const twitterId = await getTwitterIdFromUsername('testthechar22'); //testing
            // const userId = stringToUuid(twitterId);
        }

        // Get user's wallet
        const walletRecord = searchWalletRecord(db, message.userId) as WalletRecord;
        const userWallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});

        // Get tip amount
        let amountToTip = await getAmountToTip(runtime, message.content.text, agentUsername, creatorUsername);
        console.log("amountToTip: ", amountToTip);

        const balance = await getBalance(userWallet);
        if (amountToTip === "null")
            amountToTip = defaultTipAmount;
        if (balance < parseFloat(amountToTip))
            amountToTip = balance.toString();

        // Make smart contract transaction
        const txHash = await tip(userWallet, address, parseFloat(amountToTip));

        const text = `Your tip was sent successfully to @${creatorUsername}! Here is the transaction hash: ${txHash}`;
        callback({text: text});
        return true;


        // const context = `
        // Extract the search term from the user's message. The message is:
        // ${message.content.text}

        // Only respond with the search term. Do not include any other text.`;

        // const searchTerm = await generateText({
        //     runtime: runtime,
        //     context: context,
        //     modelClass: ModelClass.SMALL,
        //     stop: ["\n"],
        // })

    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "(Invalid)",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "" },
            },
        ],
    ] as ActionExample[][],
} as Action;
