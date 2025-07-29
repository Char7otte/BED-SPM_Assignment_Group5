// Maps the API's icons to the ones from https://erikflowers.github.io/weather-icons/
        

        const apiUrl = "http://localhost:3000";
        function getToken() {
            const token = localStorage.getItem('authToken');
            console.log("Token from localStorage:", token); // Debugging
            return token ? token : null;
        }

const UserToken = getToken();

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
        window.location.href = "/login.html";
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

async function getReadAlerts() {
    try {
        const response = await fetch(`${apiUrl}/readstatus`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Fetched unread alerts:", data); // Debugging
        return data; // ✅ THIS LINE IS IMPORTANT
    } catch (error) {
        console.error('Error fetching unread alerts:', error);
        return null; // return null to safely handle failure
    }
}

async function alerts() {
    


    let alertDown = document.getElementsByClassName('alert-down')[0];
    
    
    // Extract alert IDs from readData and store in a list
    const readAlertIds = [];
    if (readData && Array.isArray(readData)) {
        for (const alert of readData) {
            if (alert.alertid) {
                readAlertIds.push(alert.alertid);
            }
        }
    }
    console.log("Read Alert IDs:", readAlertIds); // Debugging


}

alerts();

