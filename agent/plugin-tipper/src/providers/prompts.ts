import { generateText, IAgentRuntime, ModelClass } from "@elizaos/core";


export async function getUserWantsToTip(_runtime: IAgentRuntime, message: string, agentUsername: string, creatorUsername: string) {
    const contextTipOrNot = `Your job is to answer 'yes' or 'no' depending on whether the user wants to tip or not.


Here are some examples:

message: @${agentUsername} @${creatorUsername}
your response: yes

message: @${creatorUsername} @${agentUsername}
your response: yes

message: @${agentUsername} wants to tip @${creatorUsername}
your response: yes

message: @${creatorUsername} wants to tip @${agentUsername}
your response: yes

message: @${creatorUsername} tip @${agentUsername}
your response: yes

message: @${agentUsername} tip @${creatorUsername}
your response: yes

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

message: give eth @${creatorUsername} @${agentUsername}
your response: yes

message: @${agentUsername} @${creatorUsername} send money
your response: yes

message: @${agentUsername} @${creatorUsername} transfer
your response: yes

message: @${agentUsername} 0.01 @${creatorUsername} transfer
your response: yes

message: @${agentUsername} pay @${creatorUsername}
your response: yes

message: @${agentUsername} pay 0.005 ETH @${creatorUsername}
your response: yes

message: @${agentUsername} hello @${creatorUsername}
your response: no

message: that's what I was talking about @${agentUsername} @${creatorUsername}
your response: no

message: @${agentUsername} @${creatorUsername} I am not sure about that
your response: no

message: @${creatorUsername} but it could be anything @${agentUsername}
your response: no

message: thank you for the tip @${agentUsername} @${creatorUsername}
your response: no

message: @${creatorUsername} tipping is fun @${agentUsername}
your response: no

message: @${agentUsername} tipping is fun @${creatorUsername}
your response: no

message: @${agentUsername} this is good. @${creatorUsername}
your response: no

message: @${creatorUsername} @${agentUsername} And the thing with crypto and tips is that they are great.
your response: no

message: users that tip are the best @${creatorUsername} @${agentUsername}
your response: no

Your job is to answer 'yes' or 'no' to the following message based on the the examples above. 
The message is:
"""
${message}
"""

Only respond with 'yes' or 'no', do not include any other text.`;

    const response = await generateText({
        runtime: _runtime,
        context: contextTipOrNot,
        modelClass: ModelClass.LARGE,
        stop: ["\n"],
    });

    return response;
}

export async function getWithdrawOrAddressOrGiveawayOrChat(_runtime: IAgentRuntime, message: string, agentUsername: string) {
    const contextChooseAction = `Your job is to get the action that the user wants to do. You should respond with 'withdraw', 'address', 'giveaway', or 'chat'.
Respond with: 'withdraw' if the user wants to withdraw their funds, 'address' if the user wants to get their address or their balance, 'giveaway' if the user wants to give away money or do a giveaway, or 'chat' if the user just wants to chat.


Here are some examples:

message: @${agentUsername} wants to tip
your response: chat

message: wants to tip @${agentUsername}
your response: chat

message: @${agentUsername} withdraw
your response: withdraw

message: take money @${agentUsername}
your response: withdraw

message: receive money @${agentUsername}
your response: withdraw

message: @${agentUsername} get eth
your response: withdraw

message: @${agentUsername} give me funds
your response: withdraw

message: 0xB756697c63de1E165B7D80771457bB6c36Ee1e74 @${agentUsername}
your response: withdraw

message: @${agentUsername} 0xC0a17a816fCA41e1879fD46B6F0d5559CE5bf1b0
your response: withdraw

message: @${agentUsername} hey 0x65d77d50E3cEee827A0f52EcD9e0f16422d54e48
your response: withdraw

message: could you help me take my money? 0xd7CF69703a433A0F7A9df66Aa6CAE02adeB424F3 @${agentUsername}
your response: withdraw

message: give eth @${agentUsername} well 0xC3431f171f50465503d10814Ac888424ca7118fF whatever
your response: withdraw

message: @${agentUsername} send me money
your response: withdraw

message: @${agentUsername} send money
your response: chat


message: @${agentUsername} get address
your response: address

message: @${agentUsername} get balance
your response: address

message: @${agentUsername} how much eth do I have
your response: address

message: @${agentUsername} how much money in wallet
your response: address

message: does my address have funds@${agentUsername}
your response: address

message: what is my wallet @${agentUsername}
your response: address

message: give me address @${agentUsername}
your response: address

message: address @${agentUsername}
your response: address

message: @${agentUsername} wallet
your response: address

message: @${agentUsername} my wallet is very cool
your response: chat

message: I already have an address @${agentUsername}. dont worry
your response: chat


message: @${agentUsername} giveaway
your response: giveaway

message: @${agentUsername} GIVE IT AWAY !!!!
your response: giveaway

message: GIVEAWAYYYYY @${agentUsername}
your response: giveaway

message: @${agentUsername} GIVEAWAY
your response: giveaway

message: giveaway @${agentUsername} pay
your response: giveaway

message: @${agentUsername} lottery
your response: giveaway

message: do lottery @${agentUsername}
your response: giveaway

message: @${agentUsername} give away some eth
your response: giveaway

message: choose winner @${agentUsername}
your response: giveaway

message: @${agentUsername} pick winner
your response: giveaway

message: get giveaway @${agentUsername}
your response: giveaway

message: @${agentUsername} make giveaway
your response: giveaway

message: nice giveaway! @${agentUsername}
your response: chat

message: thank you for the giveaway! @${agentUsername}
your response: chat

message: @${agentUsername} i am the winner! 
your response: chat

message: @${agentUsername} the day today is not good 
your response: chat

message: thank you for your time @${agentUsername}. and have a nice day
your response: chat

message: what is that? @${agentUsername}. uh?
your response: chat


Your job is to search for the number and answer with the number or the word 'null' if the number is not found. Respond to the following message based on the the examples above. 
The message is:
"""
${message}
"""

Get the action that the user wants to do. You should respond with 'withdraw', 'address', 'giveaway', or 'chat'.
Only respond with one of the words 'withdraw', 'address', 'giveaway', or 'chat', do not include any other text.`;

    const response = await generateText({
        runtime: _runtime,
        context: contextChooseAction,
        modelClass: ModelClass.LARGE,
        stop: ["\n"],
    });

    return response;
}

export async function getWithdrawAddress(_runtime: IAgentRuntime, message: string, agentUsername: string) {
    const contextWithdrawAddress = `Your job is to get the address that the user wants to withdraw to. You should respond with either the address or 'null' if the address is not found. The address starts with 0x and has 40 hexadecial digits like 0xC3431f171f50465503d10814Ac888424ca7118fF.


Here are some examples:

message: @${agentUsername} withdraw
your response: null

message: take money @${agentUsername}
your response: null

message: receive money @${agentUsername}
your response: null

message: @${agentUsername} get eth
your response: null

message: @${agentUsername} give me funds
your response: null

message: 0xB756697c63de1E165B7D80771457bB6c36Ee1e74 @${agentUsername}
your response: 0xB756697c63de1E165B7D80771457bB6c36Ee1e74

message: @${agentUsername} 0xC0a17a816fCA41e1879fD46B6F0d5559CE5bf1b0
your response: 0xC0a17a816fCA41e1879fD46B6F0d5559CE5bf1b0

message: @${agentUsername} hey 0x65d77d50E3cEee827A0f52EcD9e0f16422d54e48
your response: 0x65d77d50E3cEee827A0f52EcD9e0f16422d54e48

message: could you help me take my money? 0xd7CF69703a433A0F7A9df66Aa6CAE02adeB424F3 @${agentUsername}
your response: 0xd7CF69703a433A0F7A9df66Aa6CAE02adeB424F3

message: give eth @${agentUsername} well 0xC3431f171f50465503d10814Ac888424ca7118fF whatever
your response: 0xC3431f171f50465503d10814Ac888424ca7118fF

message: @${agentUsername} send me money
your response: null

message: @${agentUsername} send money
your response: null

message: @${agentUsername} get address
your response: null

message: @${agentUsername} get balance
your response: null


Your job is to reply with the user's address or the word 'null' if the address is not found. Respond to the following message based on the the examples above. 
The message is:
"""
${message}
"""

Only respond with the address or the word 'null', do not include any other text.`;

    const response = await generateText({
        runtime: _runtime,
        context: contextWithdrawAddress,
        modelClass: ModelClass.LARGE,
        stop: ["\n"],
    });

    return response;
}
