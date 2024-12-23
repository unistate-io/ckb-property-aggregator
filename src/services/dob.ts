// services/dob.ts
import { Spores, DOBDecodeResponse, ExplorerNFTTransfer } from "../types";
import { CONFIG } from "../config";

export class DOBService {
  static async parseDOBData(dobData: ExplorerNFTTransfer[]): Promise<Spores[]> {
    const processedArgs = new Set<string>();
    const processedData: Spores[] = [];

    for (const account of dobData) {
      const args = this.normalizeArgs(account.item.type_script.args);

      if (processedArgs.has(args)) continue;
      processedArgs.add(args);

      try {
        const result = await this.decodeDOB(args);
        if (result.error) continue;

        processedData.push(this.createSporeObject(account, result));
      } catch (error) {
        console.error("DOB parsing error:", error);
      }
    }

    return processedData;
  }

  private static normalizeArgs(args: string): string {
    return args.startsWith("0x") ? args.slice(2) : args;
  }

  private static async decodeDOB(args: string): Promise<DOBDecodeResponse> {
    const response = await fetch(CONFIG.API_ENDPOINTS.DOB_DECODE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        method: "dob_decode",
        params: [args],
      }),
    });

    return response.json();
  }

  private static createSporeObject(
    account: ExplorerNFTTransfer,
    result: DOBDecodeResponse,
  ): Spores {
    return {
      id: account.item.token_id,
      content: result.result,
      cluster_id: account.id.toString(),
      is_burned: account.item.cell.status !== "live",
      owner_address: account.item.owner,
      content_type: account.item.standard,
      created_at: account.item.created_at,
      updated_at: account.item.updated_at,
    };
  }
}
