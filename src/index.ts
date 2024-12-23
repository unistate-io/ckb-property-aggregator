// server.ts
import { CONFIG } from "./config";
import { CorsMiddleware } from "./middleware/cors";
import { ExplorerService } from "./services/explorer";
import { BitService } from "./services/bit";
import { DOBService } from "./services/dob";

Bun.serve({
  port: CONFIG.PORT,
  async fetch(req) {
    try {
      CorsMiddleware.check(req);
      const origin = req.headers.get("origin");

      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: CorsMiddleware.getHeaders(origin),
        });
      }

      const url = new URL(req.url);
      const ckbAddress = url.searchParams.get("ckbaddress");
      const bitdomain = url.searchParams.get("bitdomain");

      if (!ckbAddress && !bitdomain) {
        return new Response(
          JSON.stringify({
            error: "ckbaddress or bitdomain query parameter is required",
          }),
          {
            status: 400,
            headers: new Headers({
              "Content-Type": "application/json",
              ...CorsMiddleware.getHeaders(origin),
            }),
          },
        );
      }

      const data = await processRequest(ckbAddress, bitdomain);

      return new Response(JSON.stringify(data), {
        headers: new Headers({
          "Content-Type": "application/json",
          ...CorsMiddleware.getHeaders(origin),
        }),
      });
    } catch (error: any) {
      console.error("Server error:", error);

      return new Response(
        JSON.stringify({
          error:
            error.message === "CORS policy violation"
              ? "CORS policy violation"
              : "Internal server error",
        }),
        {
          status: error.message === "CORS policy violation" ? 403 : 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
});

async function processRequest(
  ckbAddress: string | null,
  bitdomain: string | null,
) {
  if (bitdomain) {
    return BitService.fetchBitDetails(bitdomain);
  }

  const [addressData, DOBdata] = await Promise.all([
    ExplorerService.fetchAddressData(ckbAddress!),
    ExplorerService.fetchDOBData(ckbAddress!),
  ]);

  const udtAccounts = addressData.data[0]?.attributes?.udt_accounts || [];
  const dobAccounts = DOBdata.data || [];

  const filteredXudtAccounts = udtAccounts.filter(
    (udt: any) => udt.udt_type === "xudt",
  );

  const filterbitAccounts = udtAccounts.filter(
    (udt: any) => udt.symbol === ".bit",
  );

  const filteredDOBAccounts = dobAccounts.filter(
    (dob: any) =>
      dob.to === dob.item.owner &&
      dob.item.standard === "spore" &&
      dob.item.cell.status === "live" &&
      dob.from !== dob.to,
  );

  const [parsedDOBAccounts, parsedBitAccounts] = await Promise.all([
    DOBService.parseDOBData(filteredDOBAccounts),
    BitService.parseBitData(filterbitAccounts, ckbAddress!),
  ]);

  return {
    bitAccounts: parsedBitAccounts,
    xAccounts: filteredXudtAccounts,
    dobAccounts: parsedDOBAccounts,
  };
}

console.log(`Server is running on http://localhost:${CONFIG.PORT}`);
