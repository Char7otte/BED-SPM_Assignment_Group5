const axios = require('axios');

// Replace this with your actual API key/endpoint
const apiKey = 'twenty-four-hr-forecast';
const apiUrl = `https://api-open.data.gov.sg/v2/real-time/api/${apiKey}`;

// 1. Return raw data from the external API (for testing or fallback use)
async function fetchExternalData(req, res) {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = response.data;
    res.json(data);

  } catch (error) {
    console.error('Error fetching external data:', error.message);
    res.status(500).json({ message: 'Error calling external API' });
  }
}

// 2. Reusable function to extract forecast details
async function getForecastData() {
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const records = response.data?.data?.records;

        if (!Array.isArray(records) || records.length === 0) {
            throw new Error("No forecast records found.");
        }

        const record = records[0];

        const forecast = {
            date: record.date,
            temperature: {
                low: record.general.temperature.low,
                high: record.general.temperature.high,
                unit: record.general.temperature.unit
            },
            area: {
                east: record.periods[0].regions.east.text,
                west: record.periods[0].regions.west.text,
                north: record.periods[0].regions.north.text,
                south: record.periods[0].regions.south.text
            }
        };

       
        return forecast;

    } catch (error) {
        console.error("Failed to get forecast:", error.message);
        return null;
    }
}


// 3. Endpoint to return the filtered/processed forecast
async function sendForecastData(req, res) {
  const forecast = await getForecastData();

  if (!forecast) {
    return res.status(500).json({ message: 'Unable to get forecast data' });
  }

  res.json(forecast);
}

module.exports = {
  fetchExternalData,
  getForecastData,
  sendForecastData
};
