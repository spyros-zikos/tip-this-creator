import { generateText, IAgentRuntime, ModelClass } from "@elizaos/core";


export async function getAmountToTip(_runtime: IAgentRuntime, message: string, agentUsername: string, creatorUsername: string) {
    const contextTipOrNot = `Your job is to get the amount that the user wants to tip. If the amount is not found, respond with 'null'.


Here are some examples:

message: @${agentUsername} wants to tip @${creatorUsername}
your response: no

message: @${creatorUsername} wants to tip @${agentUsername}
your response: no

message: @${creatorUsername} tip @${agentUsername}
your response: no

message: @${agentUsername} tip @${creatorUsername}
your response: no

message: 0.015 @${agentUsername} @${creatorUsername}
your response: yes

message: 0.002 @${creatorUsername} @${agentUsername}
your response: yes

message: @${agentUsername} 1 @${creatorUsername}
your response: yes

message: @${creatorUsername} 0.23 @${agentUsername}
your response: yes

message: @${agentUsername} @${creatorUsername} 0.001
your response: yes

message: @${creatorUsername} @${agentUsername} 0.087
your response: yes

message: give eth 23 @${creatorUsername} @${agentUsername}
your response: yes

message: give eth @${creatorUsername} @${agentUsername}
your response: no

message: @${agentUsername} @${creatorUsername} send money
your response: no

message: @${agentUsername} @${creatorUsername} transfer
your response: no

message: @${agentUsername} 0.01 @${creatorUsername} transfer
your response: yes

message: @${agentUsername} pay @${creatorUsername}
your response: no

message: @${agentUsername} pay 0.005 ETH @${creatorUsername}
your response: yes

message: @${agentUsername} hello @${creatorUsername}
your response: no


Your job is to search for the number and answer with the number or the word 'null' if the number is not found. Respond to the following message based on the the examples above. 
The message is:
"""
${message}
"""

Only respond with the number or the word 'null', do not include any other text.`;

    const response = await generateText({
        runtime: _runtime,
        context: contextTipOrNot,
        modelClass: ModelClass.LARGE,
        stop: ["\n"],
    });

    return response;
}
