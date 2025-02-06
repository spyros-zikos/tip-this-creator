import { generateText, IAgentRuntime, Memory, MemoryManager, ModelClass, Provider, State } from "@elizaos/core";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';


Coinbase.configure({ apiKeyName: process.env.CDP_API_KEY_NAME, privateKey: process.env.CDP_PRIVATE_KEY })
const networkId = Coinbase.networks.EthereumSepolia

interface WalletRecord {
    id?: number;
    userId: string; // twitter id
    username: string; // twitter handle
    address: string;
    walletId: string;
    seed: string;
}

enum UserState {
    hasNothing,
    hasAddress,
    hasBalance
}

const generateWallet = async () => {
    const wallet = await Wallet.create({networkId: networkId});
    const defaultAddress = await wallet.getDefaultAddress();
    const address = defaultAddress.toString().split("'")[1];
    const walletId = wallet.getId();
    const seed = wallet.export().seed;
    return [address, walletId, seed];
}

const getBalance = async (walletRecord: WalletRecord) => {
    const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
    const balance = await wallet.getBalance(Coinbase.assets.Eth);
    const balanceAdjustedForGas = parseFloat(balance.toString()) - 0.00005; // ~ $0.15 for gas
    if (balanceAdjustedForGas > 0) {
        return balanceAdjustedForGas;
    }
    return 0;
}

const searchWalletRecord = (db: Database, userId: string) => {
    // Prepare statements for reuse
    const findUser = db.prepare('SELECT * FROM address WHERE userId = ?');
    
    // Search for user by username
    const existingUser = findUser.get(userId) as WalletRecord | undefined;
    
    if (!existingUser) {
        // User doesn't exist, return null
        return "null";
    } else {
        // User exists, return the record
        return existingUser; // TODO: may cause problems because it returns different types
    }
}

const insertUser = (db: Database, userId: string, username: string, address: string, walletId: string, seed: string) => {
    const insertUser = db.prepare('INSERT INTO address (userId, username, address, walletId, seed) VALUES (?, ?, ?, ?, ?)');
    const result = insertUser.run(userId, username, address, walletId, seed);
    console.log('New user created:', {id: result.lastInsertRowid, userId, username, address, walletId, seed});
}

async function getUserState(db: Database, userId: string) {
    const walletRecord = searchWalletRecord(db, userId);
    if (walletRecord === "null") {
        return UserState.hasNothing;
    }
    const balance = await getBalance(walletRecord);
    if (balance > 0) {
        return UserState.hasBalance;
    }
    return UserState.hasAddress;
}

async function getUserWantsToTip(_runtime: IAgentRuntime, message: string, agentUsername: string, creatorUsername: string) {
    const contextTipOrNot = `Your job is to answer 'yes' or 'no' depending on whether the user wants to tip or not.


Here are some examples:

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


async function getAmountToTip(_runtime: IAgentRuntime, message: string, agentUsername: string, creatorUsername: string) {
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

async function getWithdrawOrAddressOrGiveawayOrChat(_runtime: IAgentRuntime, message: string, agentUsername: string) {
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


async function getWithdrawAddress(_runtime: IAgentRuntime, message: string, agentUsername: string) {
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



/**
 * A user can send the following types of requests:
 * - empty message (the TipThisCreator tag is the first tag):
 *      new address, address message, normal reply
 * - message starting with @username and includes the the agent tag
 * If the user doesn't have an address, generate one and store it in the database. Also print 'address' message.
 * If the user does have an address, search for an action to call.
 */
const addressProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        if (_message.agentId == _message.userId) {
            return "null";
        }
        
        const userId = _message.userId;
        const message = _message.content.text;
        const agentUsername = "tipthiscreator";
        console.log("userId: ", userId);
        console.log("message: ", message);

        const numberOfMentions = message.split('@').length - 1;

        // Find handles
        const lastHandle = _message.content.text.split("@").at(-1).split(" ")[0];
        let secondLastHandle = "";
        if (numberOfMentions === 2) {
            secondLastHandle = _message.content.text.split("@").at(-2).split(" ")[0];
        }

        // If 2 handles, find creator username
        let creatorUsername = "";
        if (numberOfMentions === 2) {
            creatorUsername = (lastHandle === agentUsername) ? secondLastHandle : lastHandle;
        }

        // Set up database and table
        const db = new Database('addresses.db')
        db.exec(`
            CREATE TABLE IF NOT EXISTS address (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                username TEXT NOT NULL,
                address TEXT NOT NULL,
                walletId TEXT NOT NULL,
                seed TEXT NOT NULL
            )
        `);

        // const shouldAlwaysRespond = "You should always respond to user's messages.\n";
        const state: UserState = await getUserState(db, _message.userId);

        // If address is null, create address and print 'address' message
        if (state == UserState.hasNothing) {
            console.log("wallet will be created!!!!!!!!!!!!!!!!!!");
            const newWallet = await generateWallet();
            const [address, walletId, seed] = newWallet;
            console.log("wallet created!!!!!!!!!!!!!!!!!!");
            insertUser(db, userId, _message.userId, address, walletId, seed);
            db.close();
            return "Tell the user that their address is: " + address + " and to fund it with ETH.";
        } else if (state == UserState.hasAddress) {
            db.close();
            const wallet = searchWalletRecord(db, userId);
            console.log('User found:', wallet);
            return "Tell the user that their address is: " + (wallet as WalletRecord).address + " and to fund it with ETH.";
        } else { // choose action to call. user has an address with balance > 0
            db.close();
            let response = "";

            /*//////////////////////////////////////////////////////////////
                                        TIP
            //////////////////////////////////////////////////////////////*/
            if (numberOfMentions === 2) {
                // Check if they want to tip
                const userWantsToTip = await getUserWantsToTip(_runtime, message, agentUsername, creatorUsername);
                console.log("userWantsToTip: ", userWantsToTip);
                
                if (userWantsToTip === "yes") {
                    const amount = await getAmountToTip(_runtime, message, agentUsername, creatorUsername);
                    console.log("amount: ", amount);
                    if (amount === "null") {
                        return "";
                    }
                    const wallet = searchWalletRecord(db, userId);
                    return "INSTRUCTION: Call the FREQUENT_ACTION_123 action now!!!";
                } else {
                    return "";
                }

            } else if (numberOfMentions === 1) {
                const withdrawOrAddressOrGiveawayOrChat = await getWithdrawOrAddressOrGiveawayOrChat(_runtime, message, agentUsername);

                if (withdrawOrAddressOrGiveawayOrChat === "withdraw") {
                /*//////////////////////////////////////////////////////////////
                                        WITHDRAW
                //////////////////////////////////////////////////////////////*/
                    // get address
                    const withdrawAddress = await getWithdrawAddress(_runtime, message, agentUsername);
                    if (withdrawAddress === "null") {
                        return "INSTRUCTION: Tell the user to provide their withdraw address.";
                    }
                    return "INSTRUCTION: Call the LEAVE_ACTION_123 action now!!!";
                
                } else if (withdrawOrAddressOrGiveawayOrChat === "address") {
                /*//////////////////////////////////////////////////////////////
                                        GET ADDRESS
                //////////////////////////////////////////////////////////////*/
                    const wallet = searchWalletRecord(db, userId);
                    const address = (wallet as WalletRecord).address;
                    const balance = await getBalance(wallet as WalletRecord);
                    return "INSTRUCTION: Tell the user that their address is: " + address + " and their balance is " + balance + " ETH.";
                } else if (withdrawOrAddressOrGiveawayOrChat === "giveaway") {
                /*//////////////////////////////////////////////////////////////
                                        GIVEAWAY
                //////////////////////////////////////////////////////////////*/
                    return "INSTRUCTION: Call the BIG_ACTION_123 action now!!!";
                } else {
                    return "";
                }

            } else { // numberOfMentions > 2
                return "";
            }
            
            let wallet = searchWalletRecord(db, userId);
            const address = (wallet as WalletRecord).address;
            const callAction = "INSTRUCTIONS: Call the 'TIP' action now!!!";
            return callAction+"If the user asks for their address, then and ONLY then tell them that it is" + address + ".";
            return response;
        }


        // const name = _state.senderName;
        // console.log("ADDRESS: ", address);
        // console.log("NAME: ", name, "!!!!");
        // // return "Include in your response the following text: '" + name + "'s address is: " + address + "'.";
        // return name + "'s address is: " + address;
        
        //==========================================

        // interface UserData {
        //     senderAddress: string;
        //     balance: number;
        // }

        // let response = "User Information Status:\n\n"
        // const emptyUserData = {
        //     senderAddress: "",
        //     balance: 0
        // };

        // const getCacheKey = (runtime: IAgentRuntime, userId: string): string => {
        //     return `${runtime.character.name}/${userId}/data`;
        // };

        // const getMissingFields = () => {
            
        // }

        // const cacheKey = getCacheKey(_runtime, _message.userId);
        // const cachedData = await _runtime.cacheManager.get(cacheKey) || { ...emptyUserData };
        
        // const knownFields = Object.entries(cachedData)
        //     .filter(([key, value]) => value !== undefined)
        //     .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);

        // if (knownFields.length > 0) {
        //     response += "Current Information:\n";
        //     response += knownFields.map(field => `✔ ${field}`).join("\n");
        // }
    },
};
export { addressProvider };
