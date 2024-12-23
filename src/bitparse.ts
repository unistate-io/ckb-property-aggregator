import { BytesLike, bytify } from "./bytify";

export interface OutPoint {
  tx_hash: string;
  index: number;
}

export interface BitDetails {
  account: string;
  account_alias: string;
  account_id_hex: string;
  next_account_id_hex: string;
  create_at_unix: number;
  expired_at_unix: number;
  status: number;
  das_lock_arg_hex: string;
  owner_algorithm_id: number;
  owner_sub_aid: number;
  owner_key: string;
  manager_algorithm_id: number;
  manager_sub_aid: number;
  manager_key: string;
  enable_sub_account: number;
  display_name: string;
}

export interface Data {
  out_point: OutPoint;
  account_info: BitDetails;
}

interface ApiResponse {
  err_no: number;
  err_msg: string;
  data: Data;
}

const PREFIX_SIZE = 1;
const VER_SIZE = 1;
const WITNESS_HASH_SIZE = 20;
const EXPIRE_AT_SIZE = 8;

const byteToHex: string[] = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}

function toHex(buf: Uint8Array) {
  const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

  for (let i = 0; i < buf.length; ++i) hexOctets.push(byteToHex[buf[i]]);

  return hexOctets.join("");
}

export interface DidData {
  account: string;
  expireAt: number;
  witnessHash: string;
}

export function _parseDidDataFromSporeContent(content: BytesLike): DidData {
  const uint8Array = bytify(content);
  const data = uint8Array.buffer;
  const account = new TextDecoder("utf-8").decode(
    new Uint8Array(
      data.slice(PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE + EXPIRE_AT_SIZE),
    ),
  );
  const expireAt =
    parseInt(
      new DataView(
        data,
        PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE,
        EXPIRE_AT_SIZE,
      )
        .getBigUint64(0, true)
        .toString(10),
    ) * 1000;
  const witnessHash = toHex(
    uint8Array.slice(
      PREFIX_SIZE + VER_SIZE,
      PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE,
    ),
  );

  return {
    account,
    expireAt,
    witnessHash,
  };
}
