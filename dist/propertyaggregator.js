import express from 'express';
import axios from 'axios';
const app = express();
const PORT = 8000;
const fetchDOBData = async (address) => {
    const url = `https://mainnet-api.explorer.nervos.org/api/v2/nft/transfers?page=1&page_size=2147483646&to=${address}`;
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
        },
        timeout: 30000 // Increase timeout to 30 seconds
    };
    try {
        const response = await axios(url, options);
        return response.data;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
const fetchAddressData = async (address) => {
    const url = `https://mainnet-api.explorer.nervos.org/api/v1/addresses/${address}?page=1&page_size=2147483646`;
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
        },
        timeout: 30000 // Increase timeout to 30 seconds
    };
    try {
        const response = await axios(url, options);
        return response.data;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
app.get('/', async (req, res) => {
    const ckbAddress = req.query.ckbaddress;
    if (!ckbAddress) {
        return res.status(400).send({ error: 'ckbaddress query parameter is required' });
    }
    try {
        const data = await fetchAddressData(ckbAddress);
        const DOBdata = await fetchDOBData(ckbAddress);
        const udtAccounts = data.data[0]?.attributes?.udt_accounts || [];
        const dobAccounts = DOBdata.data || [];
        const filteredSudtAccounts = udtAccounts.filter((udt) => udt.udt_type === 'sudt');
        const filterbitAccounts = udtAccounts.filter((udt) => udt.symbol === '.bit');
        const filteredDOBAccounts = dobAccounts.filter((dob) => dob.to === dob.item.owner && dob.item.standard === 'spore' && dob.item.cell.status === 'live' && dob.from !== dob.to);
        res.json({ propertyAggregator: filterbitAccounts, filteredSudtAccounts, filteredDOBAccounts });
    }
    catch (error) {
        console.error('Error:', error);
        if (error.code === 'ETIMEDOUT') {
            res.status(504).send({ error: 'Request timed out' });
        }
        else {
            res.status(500).send({ error: 'Failed to fetch data' });
        }
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
