// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow cross-origin requests from your mobile app

const TDMU_API = 'https://dkmh.tdmu.edu.vn/api';

// Relay endpoint
app.post('/api/get-calendar', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing accessToken' });
  }
  

  try {
    // Step 1: Login to TDMU
    const loginResp = await axios.post(`${TDMU_API}/auth/login`, {
      username: 'user@gw',
      password: 'ya29',
      grant_type: 'password',
    });

    const tdmuAccessToken = loginResp.data.access_token;

    // Step 2: Get semester list
    const semesterResp = await axios.get(`${TDMU_API}/sch/w-locdshockytkbuser`, {
      headers: {
        Authorization: `Bearer ${tdmuAccessToken}`,
      },
    });

    const currentSemester = semesterResp.data[0];

    // Step 3: Get calendar data
    const calendarResp = await axios.post(
      `${TDMU_API}/sch/w-locdstkbtuanusertheohocky`,
      {
        filter: {
          hoc_ky: currentSemester.id,
          ten_hoc_ky: '',
        },
        additional: {
          paging: {
            limit: 100,
            page: 1,
          },
          ordering: [
            {
              name: null,
              order_type: null,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tdmuAccessToken}`,
        },
      }
    );

    return res.json(calendarResp.data);
  } catch (err) {
    console.error('Backend Error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to get calendar' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
