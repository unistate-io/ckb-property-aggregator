// config.ts
export const CONFIG = {
  PORT: 3000,
  ALLOWED_ORIGINS: ["https://mobit.app", "http://localhost:3000"],
  API_ENDPOINTS: {
    MAINNET_EXPLORER: "https://mainnet-api.explorer.nervos.org/api",
    DOB_DECODE: "https://dob-decoder.rgbpp.io/",
    BIT_INDEXER: "https://indexer-v1.did.id",
    BIT_DECODE: "https://mainnet-api.explorer.nervos.org/api/v2/das_accounts",
  },
} as const;
