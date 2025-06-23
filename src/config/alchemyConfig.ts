// import { createConfig, cookieStorage } from "@account-kit/react";
// import { QueryClient } from "@tanstack/react-query";
// import { alchemy, sepolia } from "@account-kit/infra";

// export const alchemyConfig = createConfig(
//   {
//     // alchemy config
//     transport: alchemy({ apiKey: "3ikeEabvFP273EAo4rQ9JIek1manaxdt" }), // TODO: add your Alchemy API key - setup your app and embedded account config in the alchemy dashboard (https://dashboard.alchemy.com/accounts)
//     chain: sepolia, // TODO: specify your preferred chain here and update imports from @account-kit/infra
//     ssr: true, // Defers hydration of the account state to the client after the initial mount solving any inconsistencies between server and client state (read more here: https://accountkit.alchemy.com/react/ssr)
//     storage: cookieStorage, // persist the account state using cookies (read more here: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state)
//     enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
//     // optional config to override default session manager config
//     sessionConfig: {
//       expirationTimeMs: 1000 * 60 * 60, // 60 minutes (default is 15 min)
//     },
//   },
//   {
//     // authentication ui config - your customizations here
//     auth: {
//       sections: [
//         [
//           { type: "email" }
//         ],
//         [
//           // { type: "passkey" },
//           { type: "social", authProviderId: "google", mode: "popup" },
//           { type: "social", authProviderId: "facebook", mode: "popup" },
//         ],
//         [
//           {
//             type: "external_wallets",
//             walletConnect: { projectId: "4d64bb10aea0ca389a3713d24fb0fabe" },
//           },
//         ],
//       ],
//       addPasskeyOnSignup: true,
//       //   showSignInText: true,
//     },
//   }
// );

// export const queryClient = new QueryClient();

import { AlchemyAccountsUIConfig, cookieStorage, createConfig } from "@account-kit/react";
import { polygonAmoy, alchemy } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

const config: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
        {
          type: "social",
          authProviderId: "auth0",
          mode: "popup",
          auth0Connection: "twitter",
          displayName: "Twitter",
          logoUrl: "/images/twitter.svg",
          logoUrlDark: "/images/twitter-dark.svg",
          scope: "openid profile",
        },
      ],
      [
        {
          type: "external_wallets",
          walletConnect: { projectId: "your-project-id" },
        },
      ],
    ],
    addPasskeyOnSignup: false,
  },
};

export const alchemyConfig = createConfig(
  {
    // alchemy config
    transport: alchemy({ apiKey: "3ikeEabvFP273EAo4rQ9JIek1manaxdt" }), // TODO: add your Alchemy API key - setup your app and embedded account config in the alchemy dashboard (https://dashboard.alchemy.com/accounts)
    chain: polygonAmoy, // TODO: specify your preferred chain here and update imports from @account-kit/infra
    ssr: true, // Defers hydration of the account state to the client after the initial mount solving any inconsistencies between server and client state (read more here: https://accountkit.alchemy.com/react/ssr)
    storage: cookieStorage, // persist the account state using cookies (read more here: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state)
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    // optional config to override default session manager config
    sessionConfig: {
      expirationTimeMs:  1000 * 60 * 60 * 24 * 7 // week in seconds , // 7 days,

    },
    policyId: "3f009126-a65f-46b9-9191-74ac1970f22e", // TODO: add your policy ID if you have one
  },
  config
);

export const queryClient = new QueryClient();
