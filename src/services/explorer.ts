// services/explorer.ts
import { CONFIG } from "../config";
import { ExplorerNFTResponse, ExplorerAddressResponse } from "../types";

export class ExplorerService {
  private static async fetch<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async fetchDOBData(address: string): Promise<ExplorerNFTResponse> {
    const url = `${CONFIG.API_ENDPOINTS.MAINNET_EXPLORER}/v2/nft/transfers?page=1&page_size=2147483646&to=${address}`;
    return this.fetch<ExplorerNFTResponse>(url);
  }

  static async fetchAddressData(
    address: string,
  ): Promise<ExplorerAddressResponse> {
    const url = `${CONFIG.API_ENDPOINTS.MAINNET_EXPLORER}/v1/addresses/${address}?page=1&page_size=2147483646`;
    return this.fetch<ExplorerAddressResponse>(url);
  }
}
