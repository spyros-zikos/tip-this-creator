import { Plugin } from "@elizaos/core";
import { tipAction } from "./actions/tipAction.js";
import { addressProvider } from "./providers/addressProvider.ts";
import { noneAction } from "./actions/none.ts";
// import { continueAction } from "./actions/continue.ts";
// import { ignoreAction } from "./actions/ignore.ts";
// import { timeProvider } from "./providers/time.ts";

// export * as actions from "./actions";
// export * as providers from "./providers";

export const tipperPlugin: Plugin = {
    name: "tipper",
    description: "Agent that tips creators",
    actions: [tipAction, noneAction],
    evaluators: [],
    providers: [addressProvider],
};
export default tipperPlugin;
