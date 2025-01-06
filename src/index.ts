import { CONFIG } from "./config";
import { CorsMiddleware } from "./middleware/cors";
import { ExplorerService } from "./services/explorer";
import { BitService } from "./services/bit";
import { DOBService } from "./services/dob";

Bun.serve({
  port: CONFIG.PORT,
  idleTimeout: 60,
  async fetch(req) {
    try {
      CorsMiddleware.check(req);
      const origin = req.headers.get("origin");
      console.debug("Request origin:", origin);

      if (req.method === "OPTIONS") {
        return createResponse(null, 200, { origin });
      }

      const url = new URL(req.url);
      const ckbAddress = url.searchParams.get("ckbaddress");
      const bitdomain = url.searchParams.get("bitdomain");

      if (!ckbAddress && !bitdomain) {
        return createResponse(
          { error: "ckbaddress or bitdomain query parameter is required" },
          400,
          { origin },
        );
      }

      const data = await processRequest(ckbAddress, bitdomain);
      return createResponse(data, 200, { origin });
    } catch (error: any) {
      console.error("Server error:", error);

      const status = error.message === "CORS policy violation" ? 403 : 500;
      const errorMessage =
        error.message === "CORS policy violation"
          ? "CORS policy violation"
          : "Internal server error";

      return createResponse({ error: errorMessage }, status, {
        origin: req.headers.get("origin") || "*",
      });
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

  const [addressDataResult, DOBdataResult] = await Promise.allSettled([
    ExplorerService.fetchAddressData(ckbAddress!),
    ExplorerService.fetchDOBData(ckbAddress!),
  ]);

  logRejectedPromises(addressDataResult, DOBdataResult);

  const addressData =
    addressDataResult.status === "fulfilled" ? addressDataResult.value : null;
  const DOBdata =
    DOBdataResult.status === "fulfilled" ? DOBdataResult.value : null;

  const udtAccounts = addressData?.data[0]?.attributes?.udt_accounts || [];
  const dobAccounts = DOBdata?.data || [];

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

  const response = {
    bitAccounts: parsedBitAccounts,
    xAccounts: filteredXudtAccounts,
    dobAccounts: parsedDOBAccounts,
    errors: {
      addressDataError:
        addressDataResult.status === "rejected"
          ? addressDataResult.reason.message
          : null,
      DOBdataError:
        DOBdataResult.status === "rejected"
          ? DOBdataResult.reason.message
          : null,
    },
  };

  cleanupResponseErrors(response);

  return response;
}

function createResponse(
  body: any,
  status: number,
  options: { origin: string | null },
) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": options.origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const response = new Response(body ? JSON.stringify(body) : null, {
    status,
    headers,
  });

  console.debug("Response headers:", response.headers);
  return response;
}

function logRejectedPromises(...promises: PromiseSettledResult<any>[]) {
  promises.forEach((promise) => {
    if (promise.status === "rejected") {
      console.error("Error fetching data:", promise.reason);
    }
  });
}

function cleanupResponseErrors(response: any) {
  Object.keys(response.errors).forEach((key) => {
    if (response.errors[key] === null) {
      delete response.errors[key];
    }
  });

  if (Object.keys(response.errors).length === 0) {
    delete response.errors;
  }
}

console.log(`Server is running on http://localhost:${CONFIG.PORT}`);
