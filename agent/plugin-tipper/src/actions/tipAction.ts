import { composeContext, elizaLogger, generateText } from "@elizaos/core";
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

import { getAmountToTip } from "./prompts";

export const tipAction: Action = {
    name: "FREQUENT_ACTION_123",
    similes: [],
    description:
        "User tips a content creator by transfer ETH from the user's wallet address to the creator's address.",
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
        
        const amountToTip = await getAmountToTip(runtime, message.content.text, "elizaos", "sdf");

        const creatorUsername = "sdf"
        const txHash = "sdf"
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
                    text: "tip this creator",
                },
            },
            {
                user: "{{user2}}",
                content: { text: "sure!", action: "TIP" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "hi",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Thanks for the tip!",
                    action: "TIP"
                },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "Whatever",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Thank you for the tip!",
                    action: "TIP",
                },
            },
        ],

    ] as ActionExample[][],
} as Action;
