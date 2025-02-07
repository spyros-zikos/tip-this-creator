import { Plugin } from "@elizaos/core";
import { addressProvider } from "./providers/addressProvider.ts";
import { tipAction } from "./actions/tipAction.js";
import { noneAction } from "./actions/none.ts";
import { continueAction } from "./actions/continue.js";
// import { ignoreAction } from "./actions/ignore.ts";
// import { timeProvider } from "./providers/time.ts";

// export * as actions from "./actions";
// export * as providers from "./providers";

export const tipperPlugin: Plugin = {
    name: "tipper",
    description: "Agent that tips creators",
    actions: [tipAction, noneAction, continueAction],
    evaluators: [],
    providers: [addressProvider],
};
export default tipperPlugin;
