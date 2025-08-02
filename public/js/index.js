// Maps the API's icons to the ones from https://erikflowers.github.io/weather-icons/
        

const apiUrl = "http://localhost:3000";
   
function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
}

function isTokenExpired(token) {
    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
}

const token = localStorage.getItem('token');
console.log("Token from localStorage:", token);
if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirect to login
}
// Check for token in cookies if not found in localStorage
if (!localStorage.getItem('token')) {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) {
        localStorage.setItem('token', decodeURIComponent(match[1]));
    } else {
        window.location.href = "/login";
    }
}


        document.addEventListener('DOMContentLoaded', function() {
            // Initialize any JavaScript functionality here
            console.log("Index page loaded successfully.");
            weather();
        });

        async function fetchWeather() {
    try {
        const response = await fetch(`${apiUrl}/forecast`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debugging
        return data; // ✅ THIS LINE IS IMPORTANT
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null; // return null to safely handle failure
    }
}

async function weather() {
            // Maps the API's icons to the ones from https://erikflowers.github.io/weather-icons/
            var weatherIconsMap = {
                "01d": "wi-day-sunny",
                "01n": "wi-night-clear",
                "02d": "wi-day-cloudy",
                "02n": "wi-night-cloudy",
                "03d": "wi-cloud",
                "03n": "wi-cloud",
                "04d": "wi-cloudy",
                "04n": "wi-cloudy",
                "09d": "wi-showers",
                "09n": "wi-showers",
                "10d": "wi-day-hail",
                "10n": "wi-night-hail",
                "11d": "wi-thunderstorm",
                "11n": "wi-thunderstorm",
                "13d": "wi-snow",
                "13n": "wi-snow",
                "50d": "wi-fog",
                "50n": "wi-fog"
                };

            const data = await fetchWeather();

            let weatherNorth = document.getElementsByClassName('weather-north')[0];
            let weatherSouth = document.getElementsByClassName('weather-south')[0];
            let weatherEast = document.getElementsByClassName('weather-east')[0];
            let weatherWest = document.getElementsByClassName('weather-west')[0];

            weatherNorth.innerText = `North: ${data.area.north.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherSouth.innerText = `South: ${data.area.south.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherEast.innerText = `East: ${data.area.east.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherWest.innerText = `West: ${data.area.west.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            

        function getWeatherIconHtml(iconCode) {
            console.log("Icon code:", iconCode); // Debugging
            description = iconCode.toLowerCase();
            if (description.includes("sunny")) return "01d";
            if (description.includes("clear")) return "01d";
            if (description.includes("cloudy")) return description.includes("partly") ? "02d" : "03d";
            if (description.includes("showers")) return "09d";
            if (description.includes("rain")) return "10d";
            if (description.includes("thunderstorm")) return "11d";
            if (description.includes("snow")) return "13d";
            if (description.includes("fog")) return "50d";
            return "02d"; // default partly cloudy

           
        }

        if (data && data.area) {
            document.getElementsByClassName('weather-icon-north')[0].innerHTML = `<i class="wi forecast-icon ${weatherIconsMap[getWeatherIconHtml(data.area.north)]}"></i>`;
            document.getElementsByClassName('weather-icon-south')[0].innerHTML = `<i class="wi forecast-icon ${weatherIconsMap[getWeatherIconHtml(data.area.south)]}"></i>`;
            document.getElementsByClassName('weather-icon-east')[0].innerHTML = `<i class="wi forecast-icon ${weatherIconsMap[getWeatherIconHtml(data.area.east)]}"></i>`;
            document.getElementsByClassName('weather-icon-west')[0].innerHTML = `<i class="wi forecast-icon ${weatherIconsMap[getWeatherIconHtml(data.area.west)]}"></i>`;

            weatherNorth.innerText = `North: ${data.area.north.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherSouth.innerText = `South: ${data.area.south.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherEast.innerText = `East: ${data.area.east.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
            weatherWest.innerText = `West: ${data.area.west.replace(/\s*\(night\)|\s*\(day\)/gi, '')}`;
        }

        document.getElementsByClassName('weather-up')[0].innerText = `${data.date}  High: ${data.temperature.high}°C  Low: ${data.temperature.low}°C`;

    }

    async function fetchAlerts() {
        try {
            const response = await fetch(`${apiUrl}/alerts`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log("Fetched alerts:", data); // Debugging
            return data; // ✅ THIS LINE IS IMPORTANT
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return null; // return null to safely handle failure
        }
    }

async function fetchReadAlerts(userId) {
    try {
        const response = await fetch(`${apiUrl}/alerts/readstatus/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const unreadAlerts = await response.json();
        console.log("Fetched unread alerts:", unreadAlerts); // Debugging
        return unreadAlerts; // ✅ fixed
    } catch (error) {
        console.error("Error fetching unread alerts:", error);
        return [];
    }
}

async function alerts() {
    
    const userId = decodeJwtPayload(token).id;
    const readData = await fetchReadAlerts(userId);
    const data = await fetchAlerts();
    let list = [];
    console.log("Read alerts data:", readData); // Debugging
    for (const alert of readData) {
        list.push(alert.AlertID);
    }
    console.log("Read alerts list:", list); // Debugging

    let alertDown = document.getElementsByClassName('alert-down')[0];
    alertDown.innerHTML = ''; // Clear previous alerts

    if (data && Array.isArray(data)) {
        // Filter out alerts whose AlertID is in the list
        const filteredAlerts = data.filter(alert => !list.includes(alert.AlertID));
        // Show top 3 alerts
        const topAlerts = filteredAlerts.slice(0, 3);
        topAlerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert-item';
            // Set alert class based on severity
            let severityClass = 'alert-info';
            if (alert.Severity) {
                switch (alert.Severity.toLowerCase()) {
                    case 'high':
                        severityClass = '🚨';
                        break;
                    case 'medium':
                        severityClass = '🟡';
                        break;
                    case 'low':
                        severityClass = '🟢';
                        break;
                    case 'info':
                        severityClass = 'ℹ️';
                        break;
                    default:
                        severityClass = 'alert-secondary'; // Default class if severity is unknown
                }
            }
            alertDiv.classList.add();
            alertDiv.setAttribute('role', 'alert');
            alertDiv.innerHTML = `
                <div class="alert" id="hover" role="alert" style="cursor:pointer; text-align:left; height: 100%;" onclick="window.location.href='/alertdetail?id=${alert.AlertID}'">
                    ${severityClass} <strong>${alert.Title || 'No title available'}</strong><br>
                    ${alert.Message || 'No message available'}
                </div>
            `;
            alertDown.appendChild(alertDiv);
            console.log("Alert added:", alert.Message, severityClass); // Debugging
        });

    }

}

alerts();





