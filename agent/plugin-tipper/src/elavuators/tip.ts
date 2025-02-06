// import { composeContext } from "@elizaos/core";
// import { generateObjectArray } from "@elizaos/core";
// import { MemoryManager } from "@elizaos/core";
// import {
//     type ActionExample,
//     type IAgentRuntime,
//     type Memory,
//     ModelClass,
//     type Evaluator,
// } from "@elizaos/core";


// async function handler(runtime: IAgentRuntime, message: Memory) {
//     try {
//         const cacheKey = getCacheKey(runtime, message.userId);
//         const cachedData = await runtime.cacheManager.get<UserData>(cacheKey) || { ...emptyUserData };

//         const extractionTemplate = `
//         Analyze the following conversation to extract personal information.
//         Only extract information when it is explicitly and clearly stated by the user about themselves.

//         Conversation:
//         ${message.content.text}

//         Return a JSON object containing only the fields where information was clearly found:
//         {
//             "name": "extracted full name if stated",
//             "location": "extracted current residence if stated",
//             "occupation": "extracted current occupation if stated"
//         }

//         Only include fields where information is explicitly stated and current.
//         Omit fields if information is unclear, hypothetical, or about others.
//         `;

//         const extractedInfo = await generateObject({
//             runtime,
//             context: extractionTemplate,
//             modelClass: ModelClass.SMALL,
//         });
//         let dataUpdated = false;

//         // Update only undefined fields with new information
//         for (const field of ['name', 'location', 'occupation'] as const) {
//             if (extractedInfo[field] && cachedData[field] === undefined) {
//                 cachedData[field] = extractedInfo[field];
//                 dataUpdated = true;
//             }
//         }

//         if (dataUpdated) {
//             cachedData.lastUpdated = Date.now();
//             await runtime.cacheManager.set(cacheKey, cachedData, {
//                 expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 1 week cache
//             });

//             if (isDataComplete(cachedData)) {
//                 elizaLogger.success('User data collection completed:', cachedData);
//             }
//         }

//     catch (error) {
//         elizaLogger.error('Error in userDataEvaluator handler:', error);
//     }
    
//     return true;
// }

// export const factEvaluator: Evaluator = {
//     name: "TIP",
//     similes: [
//         "SEND_ETH_TO_CREATOR",
//         "TIP_CREATOR",
//         "TIP_THIS_CREATOR",
//     ],
//     validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
//         try {
//             const cacheKey = getCacheKey(runtime, message.userId);
//             const cachedData = await runtime.cacheManager.get<UserData>(cacheKey) || { ...emptyUserData };
//             return !isDataComplete(cachedData);
//         } catch (error) {
//             elizaLogger.error('Error in userDataEvaluator validate:', error);
//             return false;
//         }
//     },
//     description:
//         "Extract factual information about the people in the conversation, the current events in the world, and anything else that might be important to remember.",
//     handler,
//     examples: [
//         {
//             context: `Actors in the scene:
// {{user1}}: Programmer and moderator of the local story club.
// {{user2}}: New member of the club. Likes to write and read.

// Facts about the actors:
// None`,
//             messages: [
//                 {
//                     user: "{{user1}}",
//                     content: { text: "So where are you from" },
//                 },
//                 {
//                     user: "{{user2}}",
//                     content: { text: "I'm from the city" },
//                 },
//                 {
//                     user: "{{user1}}",
//                     content: { text: "Which city?" },
//                 },
//                 {
//                     user: "{{user2}}",
//                     content: { text: "Oakland" },
//                 },
//                 {
//                     user: "{{user1}}",
//                     content: {
//                         text: "Oh, I've never been there, but I know it's in California",
//                     },
//                 },
//             ] as ActionExample[],
//             outcome: `{ "claim": "{{user2}} is from Oakland", "type": "fact", "in_bio": false, "already_known": false },`,
//         },
//         {
//             context: `Actors in the scene:
// {{user1}}: Athelete and cyclist. Worked out every day for a year to prepare for a marathon.
// {{user2}}: Likes to go to the beach and shop.

// Facts about the actors:
// {{user1}} and {{user2}} are talking about the marathon
// {{user1}} and {{user2}} have just started dating`,
//             messages: [
//                 {
//                     user: "{{user1}}",
//                     content: {
//                         text: "I finally completed the marathon this year!",
//                     },
//                 },
//                 {
//                     user: "{{user2}}",
//                     content: { text: "Wow! How long did it take?" },
//                 },
//                 {
//                     user: "{{user1}}",
//                     content: { text: "A little over three hours." },
//                 },
//                 {
//                     user: "{{user1}}",
//                     content: { text: "I'm so proud of myself." },
//                 },
//             ] as ActionExample[],
//             outcome: `Claims:
// json\`\`\`
// [
//   { "claim": "Alex just completed a marathon in just under 4 hours.", "type": "fact", "in_bio": false, "already_known": false },
//   { "claim": "Alex worked out 2 hours a day at the gym for a year.", "type": "fact", "in_bio": true, "already_known": false },
//   { "claim": "Alex is really proud of himself.", "type": "opinion", "in_bio": false, "already_known": false }
// ]
// \`\`\`
// `,
//         },
//         {
//             context: `Actors in the scene:
// {{user1}}: Likes to play poker and go to the park. Friends with Eva.
// {{user2}}: Also likes to play poker. Likes to write and read.

// Facts about the actors:
// Mike and Eva won a regional poker tournament about six months ago
// Mike is married to Alex
// Eva studied Philosophy before switching to Computer Science`,
//             messages: [
//                 {
//                     user: "{{user1}}",
//                     content: {
//                         text: "Remember when we won the regional poker tournament last spring",
//                     },
//                 },
//                 {
//                     user: "{{user2}}",
//                     content: {
//                         text: "That was one of the best days of my life",
//                     },
//                 },
//                 {
//                     user: "{{user1}}",
//                     content: {
//                         text: "It really put our poker club on the map",
//                     },
//                 },
//             ] as ActionExample[],
//             outcome: `Claims:
// json\`\`\`
// [
//   { "claim": "Mike and Eva won the regional poker tournament last spring", "type": "fact", "in_bio": false, "already_known": true },
//   { "claim": "Winning the regional poker tournament put the poker club on the map", "type": "opinion", "in_bio": false, "already_known": false }
// ]
// \`\`\``,
//         },
//     ],
// };