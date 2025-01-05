// server.ts
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

  const [addressDataResult, DOBdataResult] = await Promise.allSettled([
    ExplorerService.fetchAddressData(ckbAddress!),
    ExplorerService.fetchDOBData(ckbAddress!),
  ]);

  // 打印错误信息到服务器控制台
  if (addressDataResult.status === "rejected") {
    console.error("Error fetching address data:", addressDataResult.reason);
  }
  if (DOBdataResult.status === "rejected") {
    console.error("Error fetching DOB data:", DOBdataResult.reason);
  }

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

  // 构建响应对象
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

  // 移除 errors 中值为 null 的属性
  Object.keys(response.errors).forEach((key) => {
    if (response.errors[key] === null) {
      delete response.errors[key];
    }
  });

  // 如果 errors 对象为空，则移除整个 errors 字段
  if (Object.keys(response.errors).length === 0) {
    delete response.errors;
  }

  return response;
}

console.log(`Server is running on http://localhost:${CONFIG.PORT}`);
