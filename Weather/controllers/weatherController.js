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

        console.log(forecast);
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




// {
//     "code": 0,
//     "data": {
//         "records": [
//             {
//                 "date": "2025-07-25",
//                 "updatedTimestamp": "2025-07-25T14:50:54+08:00",
//                 "general": {
//                     "temperature": {
//                         "low": 25,
//                         "high": 33,
//                         "unit": "Degrees Celsius"
//                     },
//                     "relativeHumidity": {
//                         "low": 50,
//                         "high": 95,
//                         "unit": "Percentage"
//                     },
//                     "forecast": {
//                         "code": "TL",
//                         "text": "Thundery Showers"
//                     },
//                     "validPeriod": {
//                         "start": "2025-07-25T12:00:00+08:00",
//                         "end": "2025-07-26T12:00:00+08:00",
//                         "text": "12 PM 25 Jul to 12 PM 26 Jul"
//                     },
//                     "wind": {
//                         "speed": {
//                             "low": 10,
//                             "high": 15
//                         },
//                         "direction": "SSE"
//                     }
//                 },
//                 "periods": [
//                     {
//                         "timePeriod": {
//                             "start": "2025-07-25T12:00:00+08:00",
//                             "end": "2025-07-25T18:00:00+08:00",
//                             "text": "Midday to 6 pm 25 Jul"
//                         },
//                         "regions": {
//                             "west": {
//                                 "code": "TL",
//                                 "text": "Thundery Showers"
//                             },
//                             "east": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "central": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "south": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "north": {
//                                 "code": "TL",
//                                 "text": "Thundery Showers"
//                             }
//                         }
//                     },
//                     {
//                         "timePeriod": {
//                             "start": "2025-07-25T18:00:00+08:00",
//                             "end": "2025-07-26T06:00:00+08:00",
//                             "text": "6 pm 25 Jul to 6 am 26 Jul"
//                         },
//                         "regions": {
//                             "west": {
//                                 "code": "PN",
//                                 "text": "Partly Cloudy (Night)"
//                             },
//                             "east": {
//                                 "code": "PN",
//                                 "text": "Partly Cloudy (Night)"
//                             },
//                             "central": {
//                                 "code": "PN",
//                                 "text": "Partly Cloudy (Night)"
//                             },
//                             "south": {
//                                 "code": "PN",
//                                 "text": "Partly Cloudy (Night)"
//                             },
//                             "north": {
//                                 "code": "PN",
//                                 "text": "Partly Cloudy (Night)"
//                             }
//                         }
//                     },
//                     {
//                         "timePeriod": {
//                             "start": "2025-07-26T06:00:00+08:00",
//                             "end": "2025-07-26T12:00:00+08:00",
//                             "text": "6 am to Midday 26 Jul"
//                         },
//                         "regions": {
//                             "west": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "east": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "central": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "south": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             },
//                             "north": {
//                                 "code": "PC",
//                                 "text": "Partly Cloudy (Day)"
//                             }
//                         }
//                     }
//                 ],
//                 "timestamp": "2025-07-25T14:43:00+08:00"
//             }
//         ]
//     },
//     "errorMsg": ""
// }