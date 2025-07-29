let viewMode = "day"; // default mode
const calendar = document.getElementById("calendar");
const selectedDateEl = document.getElementById("selected-date");
const appointmentList = document.getElementById("appointment-list");
const monthlyList = document.getElementById("monthly-list");
const modal = document.getElementById("modal");
let selectedDate = null;
let appointments = {};


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
if (token) {
    const decoded = decodeJwtPayload(token);
    console.log(decoded);
    if (decoded.role === "A") {
        window.location.href = "/adminindex"; // Redirect admin
    }
}

const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();

for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement("div");
    dayBox.className = "day";
    dayBox.innerText = i;

    const dateKey = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    dayBox.onclick = () => openDate(dateKey);
    if (appointments[dateKey]) {
    const dot = document.createElement("div");
    dot.className = "appointment-dot";
    dayBox.appendChild(dot);
    }

    calendar.appendChild(dayBox);
}

// Initialize calendar on page load
function initializeCalendar() {
    // Load all appointments for the logged in user
    fetch("/med-appointments")
    .then(res => res.json())
    .then(data => {
        console.log("Fetched appointments:", data);
        // Add detailed logging for each appointment
        data.forEach((appt, index) => {
            console.log(`Appointment ${index}:`, {
                id: appt.id,
                date: appt.date,
                title: appt.title,
                startTime: appt.startTime,
                endTime: appt.endTime,
                startTimeType: typeof appt.startTime,
                endTimeType: typeof appt.endTime,
                doctor: appt.doctor,
                location: appt.location,
                notes: appt.notes
            });
        });
        
        // Group appointments by date
        appointments = {};
        data.forEach(appt => {
            const dateKey = appt.date;
            if (!appointments[dateKey]) {
                appointments[dateKey] = [];
            }
            appointments[dateKey].push(appt);
        });

        // Render calendar with appointment dots
        renderCalendar();
        
        // Show today's appointments by default
        const todayKey = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        if (appointments[todayKey] && appointments[todayKey].length > 0) {
            openDate(todayKey);
        }
    })
    .catch(err => {
        console.error("Error loading appointments:", err);
        // Still render calendar even if appointments fail to load
        renderCalendar();
    });
}

function openDate(dateKey) {
    viewMode = "day";
    selectedDate = dateKey;
    selectedDateEl.innerText = dateKey;

    monthlyList.style.display = "none"; // Hide monthly list when viewing daily appointments
    appointmentList.style.display = "block"; // Show appointment list
    document.getElementById("month-summary-label").innerText = "";

    // Check if we already have appointments for this date
    if (appointments[dateKey]) {
        displayDailyAppointments(dateKey);
    } else {
        // READ appointments for specific date
        // Only fetch if we don't have data for this date
        fetch(`/med-appointments/${dateKey}`)
        .then(res => res.json())
        .then(data => {
            appointments[dateKey] = data;
            displayDailyAppointments(dateKey);
        })
        .catch(err => {
            console.error("Error fetching appointments:", err);
            appointments[dateKey] = [];
            displayDailyAppointments(dateKey);
        });
    }
}

function displayDailyAppointments(dateKey) {
    const dailyAppointments = appointments[dateKey] || [];
    appointmentList.innerHTML = ""; // Clear previous appointments

    // Sort appointments by earliest start time
    dailyAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime));

    document.querySelector(".modal-content h3").innerText = 
    editingIndex !== null ? "Edit Appointment" : `New Appointment for ${selectedDate}`;

    dailyAppointments.forEach((appt, index) => {
        if (!appt.status || appt.status === "Scheduled") {
            const now = new Date();
            const startTime = appt.startTime || '00:00:00';
            const endTime = appt.endTime || '23:59:59';
            const start = new Date(`${dateKey}T${startTime}`);
            const end = new Date(`${dateKey}T${endTime}`);

            if (now > end) appt.status = "Missed";
            else if (now >= start && now <= end) appt.status = "Ongoing";
        }

        const li = document.createElement("li");
        li.className = `appointment-item ${getStatusClass(appt.status)}`;
        li.innerHTML = `
            ${appt.date} <br>
            <strong>${appt.title}</strong> <br>
            Time: ${formatTimeForDisplay(appt.startTime)} - ${formatTimeForDisplay(appt.endTime)} <br>
            Doctor: ${appt.doctor} <br>
            Location: ${appt.location} <br>
            Notes: ${appt.notes} <br>
            <button onclick="editAppointment(${index})">Edit</button> 
            <button onclick="deleteAppointment(${index})">Delete</button> <br><br>`; 
        appointmentList.appendChild(li);
    });
    // modal.style.display = "flex";  // Add new appointment when user clicks on the date
}

function displayAllAppointments() {
    monthlyList.innerHTML = "";
    
    if (!appointments || Object.keys(appointments).length === 0) {
        const noAppointmentsLi = document.createElement("li");
        noAppointmentsLi.className = "no-results";
        noAppointmentsLi.innerHTML = `<em>No appointments found</em>`;
        monthlyList.appendChild(noAppointmentsLi);
        return;
    }
    
    // Flatten all appointments with their dates
    let allAppointments = [];
    Object.keys(appointments).forEach(dateKey => {
        appointments[dateKey].forEach(appt => {
            allAppointments.push({ date: dateKey, ...appt });
        });
    });
    
    // Sort all appointments by date and time
    allAppointments.sort((a, b) => {
        if (a.date === b.date) {
            const timeA = a.startTime || '00:00:00';
            const timeB = b.startTime || '00:00:00';
            return timeA.localeCompare(timeB);
        }
        return a.date.localeCompare(b.date);
    });
    
    // Group appointments by date
    const appointmentsByDate = {};
    allAppointments.forEach(appt => {
        if (!appointmentsByDate[appt.date]) {
            appointmentsByDate[appt.date] = [];
        }
        appointmentsByDate[appt.date].push(appt);
    });
    
    // Display appointments grouped by date with headers
    Object.keys(appointmentsByDate).sort().forEach(dateKey => {
        // Add date header
        const dateHeader = document.createElement("li");
        dateHeader.className = "date-header";
        const dateObj = new Date(dateKey);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        dateHeader.innerHTML = `<h4>${dayName}, ${formattedDate}</h4>`;
        monthlyList.appendChild(dateHeader);
        
        // Add appointments for this date
        appointmentsByDate[dateKey].forEach(appt => {
            // Update status if needed
            if (!appt.status || appt.status === "Scheduled") {
                const now = new Date();
                const startTime = appt.startTime || '00:00:00';
                const endTime = appt.endTime || '23:59:59';
                const start = new Date(`${appt.date}T${startTime}`);
                const end = new Date(`${appt.date}T${endTime}`);

                if (now > end) appt.status = "Missed";
                else if (now >= start && now <= end) appt.status = "Ongoing";
            }
            
            const li = document.createElement("li");
            li.className = `appointment-item ${getStatusClass(appt.status)}`;
            li.innerHTML = `
                <div class="appointment-details">
                    <strong>${appt.title}</strong> <br>
                    Time: ${formatTimeForDisplay(appt.startTime)} - ${formatTimeForDisplay(appt.endTime)} <br>
                    Doctor: ${appt.doctor} <br>
                    Location: ${appt.location} <br>
                    ${appt.notes ? `Notes: ${appt.notes} <br>` : ''}
                    Status: <span class="status-badge ${getStatusClass(appt.status)}">${appt.status}</span> <br>
                    <div class="appointment-actions">
                        <button onclick="editAppointmentById('${appt.id}', '${appt.date}')">Edit</button> 
                        <button onclick="deleteAppointmentById('${appt.id}', '${appt.date}')">Delete</button>
                    </div>
                </div>`;
            monthlyList.appendChild(li);
        });
    });
}

function editAppointmentById(appointmentId, dateKey) {
    // Find the appointment in the appointments object
    const dayAppointments = appointments[dateKey];
    if (!dayAppointments) {
        alert("Error: Cannot find appointments for this date");
        return;
    }
    
    const index = dayAppointments.findIndex(appt => appt.id == appointmentId);
    if (index === -1) {
        alert("Error: Cannot find appointment");
        return;
    }
    
    // Set the selected date and edit the appointment
    selectedDate = dateKey;
    selectedDateEl.innerText = selectedDate;
    editAppointment(index);
}

function deleteAppointmentById(appointmentId, dateKey) {
    // Find the appointment in the appointments object
    const dayAppointments = appointments[dateKey];
    if (!dayAppointments) {
        alert("Error: Cannot find appointments for this date");
        return;
    }
    
    const index = dayAppointments.findIndex(appt => appt.id == appointmentId);
    if (index === -1) {
        alert("Error: Cannot find appointment");
        return;
    }
        
    // Set the selected date and delete the appointment
    selectedDate = dateKey;
    selectedDateEl.innerText = selectedDate;
    deleteAppointment(index);
}

function closeModal() {
    modal.style.display = "none";
}

let editingIndex = null;

function openNewAppointment() {
    if (!selectedDate) {
        // Default to today's date if no date is selected
        const today = new Date();
        selectedDate = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        selectedDateEl.innerText = selectedDate;
    }

    // Reset form values
    document.getElementById("appointment-date").value = "";
    document.getElementById("title").value = "";
    document.getElementById("doctor").value = "";
    document.getElementById("start-time").value = "";
    document.getElementById("end-time").value = "";
    document.getElementById("location").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("status").value = "Scheduled";
    editingIndex = null;

    // Update modal title
    document.querySelector(".modal-content h3").innerText = `New Appointment for ${selectedDate}`;

    modal.style.display = "flex";
}

let originalDate = null;
function editAppointment(index) {
    // Check if we have appointments for the selected date
    if (!appointments[selectedDate] || !appointments[selectedDate][index]) {
        alert("Error: Cannot find appointment to edit");
        return;
    }
    
    const appt = appointments[selectedDate][index];
    document.getElementById("appointment-date").value = formatDateForInput(appt.date);
    document.getElementById("title").value = appt.title;
    document.getElementById("doctor").value = appt.doctor;
    document.getElementById("start-time").value = formatTimeForInput(appt.startTime);
    document.getElementById("end-time").value = formatTimeForInput(appt.endTime);
    document.getElementById("location").value = appt.location;
    document.getElementById("notes").value = appt.notes;
    document.getElementById("status").value = appt.status || "Scheduled"; // Default to Scheduled if no status

    editingIndex = index;
    originalDate = selectedDate; // Store the original date for later comparison

    document.querySelector(".modal-content h3").innerText = "Edit Appointment";
    modal.style.display = "flex";
}

function saveAppointment() {
    // Get form values
    const date = document.getElementById("appointment-date").value;
    const title = document.getElementById("title").value;
    const doctor = document.getElementById("doctor").value;
    const startTimeRaw = document.getElementById("start-time").value;
    const endTimeRaw = document.getElementById("end-time").value;
    const location = document.getElementById("location").value;
    const notes = document.getElementById("notes").value;
    const status = document.getElementById("status").value;

    // Process time values
    const start_time = formatTimeForDatabase(startTimeRaw);
    const end_time = formatTimeForDatabase(endTimeRaw);

    // Validate required fields
    if (!date || !title || !doctor || !location) {
        alert("Please fill in all required fields (Date, Title, Doctor, Location)");
        return;
    }

    // Validate times - don't allow default times
    if (!startTimeRaw || !endTimeRaw) {
        alert("Please provide both start time and end time");
        return;
    }

    // Check if date is in the past ONLY for NEW appointments
    if (editingIndex === null) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (selectedDate < today) {
            alert("Cannot schedule appointments in the past");
            return;
        }
    }

    // Validate times if both are provided
    if (start_time && end_time) {
        const timeValidation = validateAppointmentTimes(start_time, end_time);
        if (!timeValidation.isValid) {
            alert(timeValidation.message);
            return;
        }
    }

    // Create appointment data with correct property names
    const appointmentData = { 
        date, 
        title, 
        doctor, 
        start_time,
        end_time,
        location, 
        notes 
    };

    if (editingIndex !== null) {
        // UPDATE existing appointment
        const appointmentId = appointments[originalDate][editingIndex].id;
        
        console.log("Updating appointment ID:", appointmentId);
        
        fetch(`/med-appointments/${appointmentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentData)
        })
        .then(res => {
            console.log("Update response status:", res.status);
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(`HTTP error! status: ${res.status} - ${text}`);
                });
            }
            return res.json();
        })
        .then(updatedAppt => {
            console.log("Updated appointment received:", updatedAppt);
            
            // Update local data
            if (originalDate !== date) {
                // Move appointment to new date
                appointments[originalDate].splice(editingIndex, 1);
                if (!appointments[date]) appointments[date] = [];
                appointments[date].push(updatedAppt);
            } else {
                // Update on same date
                appointments[date][editingIndex] = updatedAppt;
            }
            
            selectedDate = date;
            selectedDateEl.innerText = selectedDate;
            
            const [year, month] = date.split("-").map(Number);
            currentYear = year;
            currentMonth = month - 1;
            
            renderCalendar();
            highlightDay(date);
            
            // Refresh the appropriate view
            if (viewMode === "all") {
                renderAllAppointments();
            } else {
                openDate(date);
            }
            
            closeModal();
            
            editingIndex = null;
            originalDate = null;
        })
        .catch(err => {
            console.error("Error updating appointment:", err);
            alert(`Failed to update appointment: ${err.message}`);
        });
    } else {
        // CREATE new appointment
        console.log("Creating new appointment");
        
        fetch("/med-appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentData)
        })
        .then(res => {
            console.log("Create response status:", res.status);
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(`HTTP error! status: ${res.status} - ${text}`);
                });
            }
            return res.json();
        })
        .then(newAppt => {
            console.log("New appointment received:", newAppt);
            
            // Update local data
            if (!appointments[date]) appointments[date] = [];
            appointments[date].push(newAppt);
            
            selectedDate = date;
            selectedDateEl.innerText = selectedDate;
            
            const [year, month] = date.split("-").map(Number);
            currentYear = year;
            currentMonth = month - 1;
            
            renderCalendar();
            highlightDay(date);
            openDate(date);
            closeModal();
        })
        .catch(err => {
            console.error("Error creating appointment:", err);
            alert(`Failed to create appointment: ${err.message}`);
        });
    }
}

function deleteAppointment(index) {
    // Check if we have appointments for the selected date
    if (!appointments[selectedDate] || !appointments[selectedDate][index]) {
        alert("Error: Cannot find appointment to delete");
        return;
    }

    const appointment = appointments[selectedDate][index];
    const appointmentId = appointment.id;
    
    if (confirm("Are you sure you want to delete this appointment?")) {
        fetch(`/med-appointments/${appointmentId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(res => {
            if (res.ok) {
                // Remove from local data
                appointments[selectedDate].splice(index, 1);
                
                // Refresh the view
                renderCalendar();
                if (viewMode === "all") {
                    renderAllAppointments();
                } else {
                    openDate(selectedDate);
                }
            } else {
                throw new Error("Failed to delete appointment");
            }
        })
        .catch(err => {
            console.error("Error deleting appointment:", err);
            alert("Failed to delete appointment. Please try again.");
        });
    }
}

let currentYear = today.getFullYear();
let currentMonth = today.getMonth(); // 0-indexed: Jan = 0, Jul = 6

function renderCalendar() {
    calendar.innerHTML = "";

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });
    document.getElementById("current-month").innerText = `${monthName} ${currentYear}`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dayBox = document.createElement("div");
        dayBox.className = "day";
        dayBox.innerText = i;

        const dateKey = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        dayBox.onclick = () => {
            selectedDate = dateKey; // where dateKey = "YYYY-MM-DD"
            selectedDateEl.innerText = selectedDate;
            openDate(selectedDate); // show appointments for that day
        };

        // Check if there is at least 1 appointment for this date before adding a dot
        if (appointments[dateKey] && appointments[dateKey].length > 0) {
            const dot = document.createElement("div");
            dot.className = "appointment-dot";
            dayBox.appendChild(dot);
        }

        calendar.appendChild(dayBox);
        dayBox.dataset.date = dateKey;
    }
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
    renderMonthlyAppointments();
}

function renderMonthlyAppointments() {
    const label = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" });
    document.getElementById("month-summary-label").innerText = label;

    monthlyList.innerHTML = "";

    Object.keys(appointments).forEach(dateKey => {
        const [year, month] = dateKey.split("-");
        if (parseInt(year) === currentYear && parseInt(month) === currentMonth + 1) {
            appointments[dateKey].forEach(appt => {
                const li = document.createElement("li");
                li.innerText = `${dateKey}: ${formatTimeForDisplay(appt.startTime)}-${formatTimeForDisplay(appt.endTime)} ${appt.title} (${appt.doctor})`;
                monthlyList.appendChild(li);
            });
        }
    });
}

function renderAllAppointments() {
    viewMode = "all";
    document.getElementById("month-summary-label").innerText = "All Appointments";
    monthlyList.style.display = "block"; // Show monthly list
    appointmentList.style.display = "none"; // Hide appointment list

    // READ all appointments
    fetch("/med-appointments")
    .then(res => res.json())
    .then(data => {
        // Group appointments by date
        appointments = {};
        data.forEach(appt => {
            const dateKey = appt.date;
            if (!appointments[dateKey]) {
                appointments[dateKey] = [];
            }
            appointments[dateKey].push(appt);
        });

        displayAllAppointments();
        renderCalendar(); // Update calendar with dots
    })
    .catch(err => {
        console.error("Error fetching all appointments:", err);
        alert("Failed to load appointments. Please try again.");
    });
}

function highlightDay(dateKey) {
    const allDays = document.querySelectorAll(".day");
    allDays.forEach(dayBox => {
        if (dayBox.dataset.date === dateKey) {
            dayBox.classList.add("flash-effect");
            setTimeout(() => dayBox.classList.remove("flash-effect"), 1000);
        }
    });
}

function getStatusClass(status) {
    return {
        "Scheduled": "status-scheduled",
        "Ongoing": "status-ongoing",
        "Attended": "status-attended",
        "Missed": "status-missed",
        "Cancelled": "status-cancelled"
    }[status] || "status-scheduled";
}

function searchAppointments() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase().trim();
    
    if (!searchTerm) {
        // If search is empty, show all appointments
        renderAllAppointments();
        return;
    }

    viewMode = "search";
    document.getElementById("month-summary-label").innerText = `Search Results for "${searchTerm}"`;
    monthlyList.style.display = "block";
    appointmentList.style.display = "none";

    // Clear the monthly list
    monthlyList.innerHTML = "";
    
    let searchResults = [];
    let hasResults = false;

    // Search through all appointments
    Object.keys(appointments).forEach(dateKey => {
        appointments[dateKey].forEach(appt => {
            // Search in multiple fields
            const searchableText = [
                appt.date,
                appt.title,
                appt.doctor,
                appt.location,
                appt.notes,
                formatTimeForDisplay(appt.startTime),
                formatTimeForDisplay(appt.endTime)
            ].join(' ').toLowerCase();

            if (searchableText.includes(searchTerm)) {
                searchResults.push({ date: dateKey, ...appt });
                hasResults = true;
            }
        });
    });

    if (!hasResults) {
        const noResultsLi = document.createElement("li");
        noResultsLi.className = "no-results";
        noResultsLi.innerHTML = `<em>No appointments found matching "${searchTerm}"</em>`;
        monthlyList.appendChild(noResultsLi);
        return;
    }

    // Sort results by date and time
    searchResults.sort((a, b) => {
        if (a.date === b.date) {
            const timeA = a.startTime || '00:00:00';
            const timeB = b.startTime || '00:00:00';
            return timeA.localeCompare(timeB);
        }
        return a.date.localeCompare(b.date);
    });

    // Display search results
    searchResults.forEach((appt) => {
        // Update status if needed
        if (!appt.status || appt.status === "Scheduled") {
            const now = new Date();
            const startTime = appt.startTime || '00:00:00';
            const endTime = appt.endTime || '23:59:59';
            const start = new Date(`${appt.date}T${startTime}`);
            const end = new Date(`${appt.date}T${endTime}`);

            if (now > end) appt.status = "Missed";
            else if (now >= start && now <= end) appt.status = "Ongoing";
        }

        const li = document.createElement("li");
        li.className = `appointment-item ${getStatusClass(appt.status)}`;
        li.innerHTML = `
            ${appt.date} <br>
            <strong>${appt.title}</strong> <br>
            Time: ${formatTimeForDisplay(appt.startTime)} - ${formatTimeForDisplay(appt.endTime)} <br>
            Doctor: ${appt.doctor} <br>
            Location: ${appt.location} <br>
            Notes: ${appt.notes} <br>
            <button onclick="editAppointmentById('${appt.id}', '${appt.date}')">Edit</button> 
            <button onclick="deleteAppointmentById('${appt.id}', '${appt.date}')">Delete</button> <br><br>`;
        monthlyList.appendChild(li);
    });
}

function clearSearch() {
    document.getElementById("search-input").value = "";
    renderAllAppointments();
}

// Add month/year view functionality
function viewAppointmentsByMonth() {
    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");
    
    if (!monthSelect || !yearSelect) {
        console.error("Month or year select elements not found");
        return;
    }
    
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    
    // Update current month and year
    currentMonth = selectedMonth;
    currentYear = selectedYear;
    
    viewMode = "monthly";
    document.getElementById("month-summary-label").innerText = 
        `${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })} Appointments`;
    
    monthlyList.style.display = "block";
    appointmentList.style.display = "none";
    
    // Clear the monthly list
    monthlyList.innerHTML = "";
    
    let monthlyAppointments = [];
    let hasAppointments = false;
    
    // Find all appointments for the selected month and year
    Object.keys(appointments).forEach(dateKey => {
        const [year, month] = dateKey.split("-").map(Number);
        if (year === selectedYear && month === selectedMonth + 1) {
            appointments[dateKey].forEach(appt => {
                monthlyAppointments.push({ date: dateKey, ...appt });
                hasAppointments = true;
            });
        }
    });
    
    if (!hasAppointments) {
        const noAppointmentsLi = document.createElement("li");
        noAppointmentsLi.className = "no-results";
        noAppointmentsLi.innerHTML = `<em>No appointments found for ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })}</em>`;
        monthlyList.appendChild(noAppointmentsLi);
        
        // Update calendar to show the selected month
        renderCalendar();
        return;
    }
    
    // Sort appointments by date and time
    monthlyAppointments.sort((a, b) => {
        if (a.date === b.date) {
            const timeA = a.startTime || '00:00:00';
            const timeB = b.startTime || '00:00:00';
            return timeA.localeCompare(timeB);
        }
        return a.date.localeCompare(b.date);
    });
    
    // Group appointments by date for better display
    const appointmentsByDate = {};
    monthlyAppointments.forEach(appt => {
        if (!appointmentsByDate[appt.date]) {
            appointmentsByDate[appt.date] = [];
        }
        appointmentsByDate[appt.date].push(appt);
    });
    
    // Display appointments grouped by date
    Object.keys(appointmentsByDate).sort().forEach(dateKey => {
        // Add date header
        const dateHeader = document.createElement("li");
        dateHeader.className = "date-header";
        const dateObj = new Date(dateKey);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        dateHeader.innerHTML = `<h4>${dayName}, ${dateKey}</h4>`;
        monthlyList.appendChild(dateHeader);
        
        // Add appointments for this date
        appointmentsByDate[dateKey].forEach(appt => {
            // Update status if needed
            if (!appt.status || appt.status === "Scheduled") {
                const now = new Date();
                const startTime = appt.startTime || '00:00:00';
                const endTime = appt.endTime || '23:59:59';
                const start = new Date(`${appt.date}T${startTime}`);
                const end = new Date(`${appt.date}T${endTime}`);

                if (now > end) appt.status = "Missed";
                else if (now >= start && now <= end) appt.status = "Ongoing";
            }
            
            const li = document.createElement("li");
            li.className = `appointment-item ${getStatusClass(appt.status)}`;
            li.innerHTML = `
                <div class="appointment-details">
                    <strong>${appt.title}</strong> <br>
                    Time: ${formatTimeForDisplay(appt.startTime)} - ${formatTimeForDisplay(appt.endTime)} <br>
                    Doctor: ${appt.doctor} <br>
                    Location: ${appt.location} <br>
                    ${appt.notes ? `Notes: ${appt.notes} <br>` : ''}
                    Status: <span class="status-badge ${getStatusClass(appt.status)}">${appt.status}</span> <br>
                    <div class="appointment-actions">
                        <button onclick="editAppointmentById('${appt.id}', '${appt.date}')">Edit</button> 
                        <button onclick="deleteAppointmentById('${appt.id}', '${appt.date}')">Delete</button>
                    </div>
                </div>`;
            monthlyList.appendChild(li);
        });
    });
    
    // Update calendar to show the selected month
    renderCalendar();
}

function initializeMonthYearSelectors() {
    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");
    
    if (!monthSelect || !yearSelect) {
        return;
    }
    
    // Populate month dropdown
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    monthSelect.innerHTML = "";
    months.forEach((month, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = month;
        if (index === currentMonth) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });
    
    // Populate year dropdown (current year ± 5 years)
    yearSelect.innerHTML = "";
    const currentYearValue = new Date().getFullYear();
    for (let year = currentYearValue - 5; year <= currentYearValue + 5; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Add event listeners
    monthSelect.addEventListener('change', viewAppointmentsByMonth);
    yearSelect.addEventListener('change', viewAppointmentsByMonth);
}

function quickNavigateToMonth(monthOffset) {
    let newMonth = currentMonth + monthOffset;
    let newYear = currentYear;
    
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    
    // Update the selectors
    document.getElementById("month-select").value = newMonth;
    document.getElementById("year-select").value = newYear;
    
    // Trigger the view update
    viewAppointmentsByMonth();
}

// Add event listener for search input
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    
    // Add real-time validation
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    
    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('change', validateTimesRealtime);
        endTimeInput.addEventListener('change', validateTimesRealtime);
    }

    // Add search functionality
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        // Search on Enter key press
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAppointments();
            }
        });
    }
    
    // Initialize month/year selectors
    initializeMonthYearSelectors();
});

////////////// Helper functions for formatting //////////////
function formatDateForInput(dateString) {
    // Convert YYYY-MM-DD to format suitable for HTML date input
    if (!dateString) return '';
    return dateString; // Already in correct format
}

function formatTimeForInput(timeString) {
    // Handle null, undefined, or empty time strings
    if (!timeString || timeString === null || timeString === 'null' || timeString === undefined) {
        return ''; // Return empty string for HTML input
    }
    
    // Convert HH:MM:SS to HH:MM for HTML time input
    if (typeof timeString === 'string' && timeString.length >= 5) {
        return timeString.substring(0, 5); // Takes first 5 characters (HH:MM)
    }
    
    return ''; // Return empty if format is unexpected
}

function formatTimeForDatabase(timeString) {
    // Handle empty, null, or undefined
    if (!timeString || timeString.trim() === '') {
        return '00:00:00'; // Return default time instead of null
    }
    
    // Clean the input
    const cleanTime = timeString.trim();
    
    // If already in HH:MM:SS format, validate it
    if (/^\d{2}:\d{2}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes, seconds] = cleanTime.split(':').map(Number);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
            return cleanTime;
        }
    }
    
    // Convert HH:MM to HH:MM:SS
    if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        const [hours, minutes] = cleanTime.split(':').map(Number);
        
        // Validate time values
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            const paddedHours = hours.toString().padStart(2, '0');
            const paddedMinutes = minutes.toString().padStart(2, '0');
            return `${paddedHours}:${paddedMinutes}:00`;
        }
    }
    
    // If invalid format, return default time
    console.error("Invalid time format, using default:", timeString);
    return '00:00:00';
}

// Add a display function to safely show times
function formatTimeForDisplay(timeString) {
    if (!timeString || timeString === null || timeString === 'null' || timeString === undefined) {
        return 'No time specified';
    }
    
    if (typeof timeString === 'string' && timeString.length >= 5) {
        return timeString.substring(0, 5); // Show as HH:MM
    }
    
    return 'Invalid time';
}

function validateAppointmentTimes(startTime, endTime) {
    // If either time is empty or null, skip validation
    if (!startTime || !endTime || startTime === '00:00:00' || endTime === '00:00:00') {
        return { isValid: true, message: '' };
    }

    // Convert times to comparable format (minutes since midnight)
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
        return { 
            isValid: false, 
            message: 'End time must be after start time' 
        };
    }

    return { isValid: true, message: '' };
}

// Helper function to convert HH:MM time to minutes
function timeToMinutes(timeString) {
    if (!timeString) return 0;
    
    // Handle both HH:MM:SS and HH:MM formats
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    
    return hours * 60 + minutes;
}

// Helper function to convert minutes back to HH:MM format
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function validateTimesRealtime() {
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    
    // Remove any existing error styling
    startTimeInput.classList.remove("invalid-time");
    endTimeInput.classList.remove("invalid-time");
    
    // Remove any existing error messages
    const existingError = document.getElementById("time-validation-error");
    if (existingError) {
        existingError.remove();
    }
    
    if (startTime && endTime) {
        const validation = validateAppointmentTimes(startTime, endTime);
        if (!validation.isValid) {
            // Add error styling
            startTimeInput.classList.add("invalid-time");
            endTimeInput.classList.add("invalid-time");
            
            // Add error message
            const errorDiv = document.createElement("div");
            errorDiv.id = "time-validation-error";
            errorDiv.className = "time-validation-error";
            errorDiv.textContent = validation.message;
            
            // Insert error message after the end time input
            endTimeInput.parentNode.insertBefore(errorDiv, endTimeInput.nextSibling);
        }
    }
}