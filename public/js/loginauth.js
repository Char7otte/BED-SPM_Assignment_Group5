const apiurl = "http://localhost:3000";
const token = localStorage.getItem("jwtToken");
if (token) {
    // Optionally, check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp > now) {
        window.location.href = "/index.html"; // Redirect to home page if token is valid
    }
}
document.getElementById("logbtn").addEventListener("click", login);
document.getElementById("regbtn").addEventListener("click", register);

function login() {
    const username = document.getElementById("logname").value.trim();
    const password = document.getElementById("logpass").value.trim();
    console.log(username, password);

    fetch(`${apiurl}/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text(); // try to get error text
            throw new Error(errorText || `HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        
        if (data.success || data.token) {
        // ✅ Login successful
        alert(data.message);  // or "Login successful"
        localStorage.setItem("token","Bearer " + data.token);  // optional
        window.location.href = "/homepage";
    } else {
        console.log(data);
        // ❌ Login failed - bad credentials or other issue
        document.getElementById("status1").innerText = "Wrong username or password"; 
    }

    })
    .catch(error => {
        console.error("Error during login:", error.message);
        document.getElementById("status1").innerText = "Wrong username or password"; // Display error message
    });
}
async function displayJWT() {
    const token = localStorage.getItem("token");
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("JWT Payload:", payload);
        console.log("User ID:", payload.id);
        console.log("Username:", payload.username); 
    }
}

async function register() {
    const username = document.getElementById("regname").value.trim();
    const phone_number = document.getElementById("regnum").value.trim();
    const password = document.getElementById("regpass").value.trim();
    const gender = document.getElementById("reggender").value.trim();
    const age = document.getElementById("regage").value.trim();
    console.log(username, phone_number, password, gender, age);

    const response = await fetch(`${apiurl}/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, phone_number, password, gender, age })
    });

    const data = await response.json();
    if (data.success || data.message === 'User created successfully') {
        console.log("Registration successful:", data);
        if (data.token) {
            localStorage.setItem("token", "Bearer " + data.token); // Store token if available
        }else {
            alert("no token found");
        }
        
        window.location.href = "/homepage"; // Redirect to dashboard or home page
    } else {
        if (data.message == 'Username already exists') {
            document.getElementById("status").innerText = "Registration failed: " + "Username already exists";
        } else {
            document.getElementById("status").innerText = "Registration failed: " + data.message;
        }
        
        document.getElementById("status").style.color = "#d67272ff"; // Set text color to red
        console.error("Registration failed:", data.message);
        
    }
}
