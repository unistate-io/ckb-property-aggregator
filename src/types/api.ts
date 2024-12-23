// types/api.ts
export interface ExplorerNFTTransfer {
  to: string;
  from: string;
  id: string;
  item: {
    token_id: string;
    owner: string;
    standard: string;
    cell: {
      status: string;
    };
    type_script: {
      args: string;
    };
    created_at: string;
    updated_at: string;
  };
}

export interface ExplorerNFTResponse {
  data: ExplorerNFTTransfer[];
}

export interface UDTAccount {
  symbol: string;
  udt_type: string;
  udt_icon_file?: string;
  // 添加其他必要的字段
}

export interface AddressAttributes {
  address_hash: string;
  udt_accounts: UDTAccount[];
  // 添加其他必要的字段
}

export interface AddressData {
  id: string;
  type: string;
  attributes: AddressAttributes;
}

export interface ExplorerAddressResponse {
  data: AddressData[];
}

export interface BitAccountInfo {
  account: string;
  // 添加其他必要的字段
}

export interface BitAccountRecord {
  key: string;
  label: string;
  value: string;
  ttl: number;
}

export interface BitAccountRecordsResponse {
  jsonrpc: string;
  id: number;
  result: {
    records: BitAccountRecord[];
  };
}

export interface BitAccountInfoResponse {
  jsonrpc: string;
  id: number;
  result: BitAccountInfo;
}

export interface DOBDecodeResponse {
  jsonrpc: string;
  id: number;
  result: string;
  error?: {
    code: number;
    message: string;
  };
}

export interface BitDecodeResponse {
  [key: string]: string;
}
