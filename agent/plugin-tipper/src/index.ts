import { Plugin } from "@elizaos/core";
import { assignAddressAction } from "./actions/assignAddress.js";
import { addressProvider } from "./providers/getAddress.ts";
// import { continueAction } from "./actions/continue.ts";
// import { ignoreAction } from "./actions/ignore.ts";
// import { noneAction } from "./actions/none.ts";
// import { timeProvider } from "./providers/time.ts";

// export * as actions from "./actions";
// export * as providers from "./providers";

export const tipperPlugin: Plugin = {
    name: "tipper",
    description: "Agent that tips creators",
    // actions: [assignAddressAction],
    evaluators: [],
    providers: [addressProvider],
};
export default tipperPlugin;
