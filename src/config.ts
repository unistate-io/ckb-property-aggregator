// config.ts
export const CONFIG = {
  PORT: 3000,
  ALLOWED_ORIGINS: ["https://mobit.app", "http://localhost:3000"],
  API_ENDPOINTS: {
    MAINNET_EXPLORER: "https://mainnet-api.explorer.nervos.org/api",
    DOB_DECODE: process.env.dob_decode!,
    BIT_INDEXER: process.env.bit_indexer!,
    BIT_DECODE: process.env.bit_decode!,
  },
} as const;
