// services/bit.ts
import {
  BitList,
  BitAccountInfoResponse,
  BitAccountRecordsResponse,
  BitDecodeResponse,
} from "../types";
import { CONFIG } from "../config";
import * as bitparse from "../bitparse";
import { unpackToRawSporeData } from "@spore-sdk/core";
import type { BytesLike } from "../bytify";

export class BitService {
  static async fetchBitDetails(bitdomain: string) {
    const [infoResponse, recordsResponse] = await Promise.all([
      this.fetchAccountInfo(bitdomain),
      this.fetchAccountRecords(bitdomain),
    ]);

    return {
      ...infoResponse,
      records: recordsResponse,
    };
  }

  static async parseBitData(
    bitaccount: any[],
    ckbAddress: string,
  ): Promise<BitList> {
    const response = await fetch(CONFIG.API_ENDPOINTS.BIT_DECODE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses: [ckbAddress] }),
    });

    const data = (await response.json()) as BitDecodeResponse;
    if (!data || Object.keys(data).length === 0) {
      return { domainlist: [], bondingdomain: "" };
    }

    const [key, value] = [Object.keys(data)[0], data[Object.keys(data)[0]]];

    const domainlist = bitaccount.map((account) => {
      const rawdata: BytesLike = unpackToRawSporeData(
        account.udt_icon_file,
      ).content;
      return bitparse._parseDidDataFromSporeContent(rawdata).account;
    });

    return {
      domainlist,
      bondingdomain: value || "",
    };
  }

  private static async fetchAccountInfo(
    bitdomain: string,
  ): Promise<BitAccountInfoResponse> {
    return this.makeRequest("das_accountInfo", { account: bitdomain });
  }

  private static async fetchAccountRecords(
    bitdomain: string,
  ): Promise<BitAccountRecordsResponse> {
    return this.makeRequest("das_accountRecordsV2", { account: bitdomain });
  }

  private static async makeRequest<T>(method: string, params: any): Promise<T> {
    const response = await fetch(CONFIG.API_ENDPOINTS.BIT_INDEXER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params: [params],
      }),
    });

    return response.json();
  }
}
