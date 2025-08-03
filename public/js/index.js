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
if(decodeJwtPayload(token).role === 'A') {
    window.location.href = "/admin"; 
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any JavaScript functionality here
    console.log("Index page loaded successfully.");
    weather();
    showUpcomingAppointments();
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

        // If rainy, update .xtra-info and remind to bring umbrella
        const isRainy = ["showers", "rain", "thunderstorm"].some(rain =>
            [data.area.north, data.area.south, data.area.east, data.area.west].join(' ').toLowerCase().includes(rain)
        );
        const isSunny = ["sunny", "clear"].some(sun =>
            [data.area.north, data.area.south, data.area.east, data.area.west].join(' ').toLowerCase().includes(sun)
        );
        if (isRainy) {
            const xtraInfo = document.getElementsByClassName('xtra-info')[0];
            if (xtraInfo) {
            xtraInfo.innerText = "Remember to bring an umbrella! ☔️";
            }
        } else if (isSunny) {
            const xtraInfo = document.getElementsByClassName('xtra-info')[0];
            if (xtraInfo) {
                xtraInfo.innerText = "It's a sunny day! Enjoy the weather! ☀️";
            }
        }
        else {
            const xtraInfo = document.getElementsByClassName('xtra-info')[0];
            if (xtraInfo) {
                const messages = [
                    "Such a weather isn't it? 🌤️, go for a walk!",
                    "Perfect time for a stroll outside! 🚶‍♂️",
                    "Enjoy the fresh air today! 🌳",
                    "Maybe read a book by the window? 📖",
                    "Take a moment to relax and unwind! 😌",
                    "Call a friend and catch up! 📞",
                    "Try a new recipe today! 🍲",
                    "Listen to your favorite music! 🎶",
                    "Do some gentle stretching exercises! 🧘‍♂️",
                    "Write in your journal or diary! 📝",
                    "Watch a classic movie! 🎬",
                    "Try a puzzle or brain game! 🧩",
                    "Enjoy a cup of tea or coffee! ☕",
                    "Take a nap and recharge! 😴",
                    "Look at old photos and reminisce! 🖼️",
                    "Do some gardening or water your plants! 🌱",
                    "Practice deep breathing for relaxation! 🌬️",
                    "Sketch or draw something! 🎨",
                    "Feed the birds outside! 🐦",
                    "Plan your week ahead! 📅",
                    "Drink plenty of water to stay hydrated! 💧",
                    "Drink a bo ohw o wo er to stay hydrated! 💧",
                ];
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                xtraInfo.innerText = randomMsg;
            }
        }

    }

    async function fetchAlerts() {
        try {
            const response = await fetch(`${apiUrl}/alerts`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
           
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
        
        return unreadAlerts; 
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
    let list2 = [];
    
    for (const alert of readData) {
        
        list.push(alert.AlertID);

    }
    let filtered = data.filter(alert => 
    alert.AlertID !== null &&
    alert.AlertID !== undefined &&
    alert.status !== 'Deleted'
    );
    
    

    let alertDown = document.getElementsByClassName('alert-down')[0];
    alertDown.innerHTML = ''; // Clear previous alerts

    if (data && Array.isArray(filtered) && filtered.length > 0) {
        // Filter out alerts whose AlertID is in the list
        const filteredAlerts = filtered.filter(alert => !list.includes(alert.AlertID));
        // Show top 3 alerts
        const topAlerts = filteredAlerts.slice(0, 3);
        topAlerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert-item';
            // Set alert class based on severity
            let severityClass = 'alert-info';
            let borderColor = 'blue';
            if (alert.Severity) {
                switch (alert.Severity.toLowerCase()) {
                    case 'high':
                        severityClass = '🚨';
                        borderColor = 'pink';
                        break;
                    case 'medium':
                        severityClass = '🟡';
                        borderColor = 'yellow';
                        break;
                    case 'low':
                        severityClass = '🟢';
                        borderColor = 'green';
                        break;
                    case 'info':
                        severityClass = 'ℹ️';
                        borderColor = 'blue';
                        break;
                    default:
                        severityClass = 'alert-secondary'; // Default class if severity is unknown
                        borderColor = 'gray';
                        
                }
            }
            alertDiv.classList.add();
            alertDiv.setAttribute('role', 'alert');
            alertDiv.innerHTML = `
                <div class="alert alert-info" id="hover" role="alert" style="cursor:pointer; text-align:left; height: 100%; " onclick="window.location.href='/alertdetail?id=${alert.AlertID}'">
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


 function updateTime() {
            const now = new Date();
            console.log("here");
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', options);
        }
        setInterval(updateTime, 1000);
        updateTime();


function formatDateFancy(dateString) {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
}


async function fetchAllAppointments() {
    try {
        const response = await fetch(`${apiUrl}/med-appointments`, {
            headers: { Authorization: localStorage.getItem('token') }
        });
        if (!response.ok) throw new Error('Failed to fetch appointments');
        return await response.json();
    } catch (err) {
        console.error('Error fetching appointments:', err);
        return [];
    }
}

async function showUpcomingAppointments() {
    const listEl = document.getElementById('upcoming-appointments-list');
    if (!listEl) return;
    listEl.innerHTML = '<li>Loading...</li>';
    const appointments = await fetchAllAppointments();
    listEl.innerHTML = '';
    if (!appointments.length) {
        listEl.innerHTML = '<li>No upcoming appointments.</li>';
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = [];
    // If appointments is an array
    if (Array.isArray(appointments)) {
        appointments.forEach(appt => {
            const apptDateObj = new Date(appt.date);
            apptDateObj.setHours(0, 0, 0, 0);
            if (apptDateObj >= today) upcoming.push(appt);
        });
    } else {
        // If appointments is an object
        Object.keys(appointments).forEach(dateKey => {
            appointments[dateKey].forEach(appt => {
                const apptDateObj = new Date(appt.date);
                apptDateObj.setHours(0, 0, 0, 0);
                if (apptDateObj >= today) upcoming.push(appt);
            });
        });
    }
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!upcoming.length) {
        listEl.innerHTML = '<li>No upcoming appointments.</li>';
        return;
    }
    upcoming.slice(0, 2).forEach(appt => {
        const li = document.createElement('li');
        li.className = 'upcoming-appointment-card'; // Add a class for styling
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; text-align: left;">
                    <strong>${formatDateFancy(appt.date)}</strong><br>    
                    <strong>${appt.title || 'No title'}</strong><br>               
                    ${appt.doctor ? `<span>Doctor: ${appt.doctor}</span><br>` : ''}
                    ${appt.location ? `<span>Location: ${appt.location}</span><br>` : ''}
                </div>
                <div style="flex: 0 0 120px; text-align: right;">
                    <span>
                        ${appt.startTime ? appt.startTime.substring(0,5) : 'N/A'}
                        ${appt.endTime ? ' - ' + appt.endTime.substring(0,5) : ''}
                    </span>
                </div>
            </div>
        `;
        listEl.appendChild(li);
    });
}