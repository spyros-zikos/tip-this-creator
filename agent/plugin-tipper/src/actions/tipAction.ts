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
import { PrivyClient } from '@privy-io/server-auth';


export const tipAction: Action = {
    name: "TIP",
    similes: ["TIP_CREATOR", "TIP_THIS_CREATOR", "TIP_CREATOR_NOW", "SEND_ETH_TO_CREATOR", "SEND_ETH"],
    description:
        "User tips a content creator by transfer ETH from the user's wallet address to the creator's.",
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
        const address = "sdf"
        const text = `Your wallet address is ${address}. Fund it now to get started!`;
        callback({text: text});

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


        return true;
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
