"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const bitparse = __importStar(require("./bitparse"));
const core_1 = require("@spore-sdk/core");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 8000;
const allowedOrigins = ["https://mobit.app", "http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = "The CORS policy for this site does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
}));
const fetchDOBData = async (address) => {
    const url = `https://mainnet-api.explorer.nervos.org/api/v2/nft/transfers?page=1&page_size=2147483646&to=${address}`;
    const options = {
        method: "GET",
        headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        },
        timeout: 30000, // Increase timeout to 30 seconds
    };
    try {
        const response = await (0, axios_1.default)(url, options);
        return response.data;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
const fetchAddressData = async (address) => {
    const url = `https://mainnet-api.explorer.nervos.org/api/v1/addresses/${address}?page=1&page_size=2147483646`;
    const options = {
        method: "GET",
        headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        },
        timeout: 30000, // Increase timeout to 30 seconds
    };
    try {
        const response = await (0, axios_1.default)(url, options);
        return response.data;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
const parsedDOBData = async (dobData) => {
    const processedArgs = new Set();
    const processedData = [];
    for (let i = 0; i < dobData.length; i++) {
        let account = dobData[i];
        let args = account.item.type_script.args;
        if (args.startsWith("0x")) {
            args = args.slice(2);
        }
        if (processedArgs.has(args)) {
            continue;
        }
        processedArgs.add(args);
        const data = {
            id: 2,
            jsonrpc: "2.0",
            method: "dob_decode",
            params: [args],
        };
        try {
            const DOB_DECODE_URL = process.env.dob_decode;
            const res = await fetch(DOB_DECODE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.error) {
                continue;
            }
            const spores = {
                id: account.item.token_id,
                content: result,
                cluster_id: account.id.toString(),
                is_burned: account.item.cell.status !== "live",
                owner_address: account.item.owner,
                content_type: account.item.standard,
                created_at: account.item.created_at,
                updated_at: account.item.updated_at,
            };
            //console.log(`spores`, spores);
            processedData.push(spores);
        }
        catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
    return processedData;
};
const fetchSpecifiedBitResponse = async (response) => {
    const BITINDEXER = process.env.bit_indexer;
    const url = BITINDEXER;
    let ckbaddress;
    let bitaccount;
    if (!(!response || Object.keys(response).length === 0)) {
        ckbaddress = Object.keys(response)[0];
        bitaccount = response[ckbaddress];
    }
    else {
        return {};
    }
    const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "das_accountRecordsV2",
        params: [{ account: bitaccount }],
    };
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        return result;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
const parsedBitData = async (bitaccount, ckbAddress) => {
    const BITDECODE = process.env.bit_decode;
    const url = BITDECODE;
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        data: {
            addresses: [ckbAddress],
        },
        timeout: 30000,
    };
    try {
        const response = await (0, axios_1.default)(url, options);
        if (!response.data || Object.keys(response.data).length === 0) {
            return {};
        }
        const key = Object.keys(response.data)[0];
        const value = response.data[key];
        const overviewbit = {
            domainlist: [],
            bondingdomain: "",
        };
        for (let i = 0; i < bitaccount.length; i++) {
            let account = bitaccount[i];
            let args = account.udt_icon_file;
            const rawdata = (0, core_1.unpackToRawSporeData)(args).content;
            const bitdomain = bitparse._parseDidDataFromSporeContent(rawdata).account;
            overviewbit.domainlist.push(bitdomain);
        }
        if (value !== "") {
            overviewbit.bondingdomain = value;
        }
        return overviewbit;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
const fetchBitDetails = async (bitdomain) => {
    const BITINDEXER = process.env.bit_indexer;
    const url = BITINDEXER;
    const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "das_accountInfo",
        params: [{ account: bitdomain }],
    };
    const recordsdata = {
        jsonrpc: "2.0",
        id: 1,
        method: "das_accountRecordsV2",
        params: [{ account: bitdomain }],
    };
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const records = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(recordsdata),
        });
        const result = await res.json();
        const recordsresult = await records.json();
        result.records = recordsresult;
        return result;
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
app.get("/", async (req, res) => {
    const ckbAddress = req.query.ckbaddress;
    const bitdomain = req.query.bitdomain;
    if (!ckbAddress && !bitdomain) {
        return res
            .status(400)
            .send({ error: "ckbaddress or bitdomain query parameter is required" });
    }
    try {
        if (bitdomain) {
            const bitdetails = await fetchBitDetails(bitdomain);
            return res.json(bitdetails);
        }
        const data = await fetchAddressData(ckbAddress);
        const DOBdata = await fetchDOBData(ckbAddress);
        const udtAccounts = data.data[0]?.attributes?.udt_accounts || [];
        const dobAccounts = DOBdata.data || [];
        const filteredXudtAccounts = udtAccounts.filter((udt) => udt.udt_type === "xudt");
        const filterbitAccounts = udtAccounts.filter((udt) => udt.symbol === ".bit");
        const filteredDOBAccounts = dobAccounts.filter((dob) => dob.to === dob.item.owner &&
            dob.item.standard === "spore" &&
            dob.item.cell.status === "live" &&
            dob.from !== dob.to);
        const parsedDOBAccounts = await parsedDOBData(filteredDOBAccounts);
        const parsedBitAccounts = await parsedBitData(filterbitAccounts, ckbAddress);
        res.json({
            bitAccounts: parsedBitAccounts, //overview
            xAccounts: filteredXudtAccounts,
            dobAccounts: parsedDOBAccounts,
        });
    }
    catch (error) {
        console.error("Error:", error);
        if (error.code === "ETIMEDOUT") {
            res.status(504).send({ error: "Request timed out" });
        }
        else {
            res.status(500).send({ error: "Failed to fetch data" });
        }
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
