"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._parseDidDataFromSporeContent = void 0;
const bytify_1 = require("./bytify");
const core_1 = require("@spore-sdk/core");
const PREFIX_SIZE = 1;
const VER_SIZE = 1;
const WITNESS_HASH_SIZE = 20;
const EXPIRE_AT_SIZE = 8;
const byteToHex = [];
for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}
function toHex(buf) {
    const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()
    for (let i = 0; i < buf.length; ++i)
        hexOctets.push(byteToHex[buf[i]]);
    return hexOctets.join("");
}
/**
 * Internal use only.
 * @private
 *
 */
function _parseDidDataFromSporeContent(content) {
    const uint8Array = (0, bytify_1.bytify)(content);
    const data = uint8Array.buffer;
    const account = new TextDecoder("utf-8").decode(data.slice(PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE + EXPIRE_AT_SIZE));
    const expireAt = parseInt(new DataView(data, PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE, EXPIRE_AT_SIZE)
        .getBigUint64(0, true)
        .toString(10)) * 1000;
    const witnessHash = toHex(uint8Array.slice(PREFIX_SIZE + VER_SIZE, PREFIX_SIZE + VER_SIZE + WITNESS_HASH_SIZE));
    return {
        account,
        expireAt,
        witnessHash,
    };
}
exports._parseDidDataFromSporeContent = _parseDidDataFromSporeContent;
const inter = (0, core_1.unpackToRawSporeData)(`0x6400000010000000140000004000000000000000280000000001b33e31e5b6085b23c542081743d36fec5bfc4744e46a6868000000006d6f626974782e62697420000000cff856f49d7a01d48c6a167b5f1bf974d31c375548eea3cf63145a233929f938`).content;
const ans = _parseDidDataFromSporeContent(inter);
console.log(`ans.account`, ans.account, `ans.expireAt`, ans.expireAt, `ans.witnessHash`, ans.witnessHash);
