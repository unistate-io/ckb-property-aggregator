import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 8000;

const allowedOrigins = ['https://mobit.app', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

const fetchDOBData = async (address: string) => {
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
  } catch (error: any) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const fetchAddressData = async (address: string) => {
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
  } catch (error: any) {
    console.error('Fetch error:', error);
    throw error;
  }
};

app.get('/', async (req, res) => {
  const ckbAddress = req.query.ckbaddress as string;
  if (!ckbAddress) {
    return res.status(400).send({ error: 'ckbaddress query parameter is required' });
  }

  try {
    const data = await fetchAddressData(ckbAddress);
    const DOBdata = await fetchDOBData(ckbAddress);
    const udtAccounts = data.data[0]?.attributes?.udt_accounts || [];
    const dobAccounts = DOBdata.data || [];
    const filteredSudtAccounts = udtAccounts.filter((udt: any) => udt.udt_type === 'sudt');
    const filterbitAccounts = udtAccounts.filter((udt: any) => udt.symbol === '.bit');
    const filteredDOBAccounts = dobAccounts.filter((dob: any) => dob.to === dob.item.owner && dob.item.standard === 'spore' && dob.item.cell.status === 'live' && dob.from !== dob.to);

    res.json({ bitAccounts: filterbitAccounts, sudtAccounts: filteredSudtAccounts, dobAccounts: filteredDOBAccounts });
  } catch (error: any) {
    console.error('Error:', error);
    if (error.code === 'ETIMEDOUT') {
      res.status(504).send({ error: 'Request timed out' });
    } else {
      res.status(500).send({ error: 'Failed to fetch data' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
