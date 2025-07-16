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
    console.log("Login button clicked");

    const username = document.getElementById("logname").value;
    const password = document.getElementById("logpass").value;
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
        localStorage.setItem("token", data.token);  // optional
        window.location.href = "/dashboard";
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
    console.log("Register button clicked");
    const username = document.getElementById("regname").value;
    const phone_number = document.getElementById("regnum").value;
    const password = document.getElementById("regpass").value;
    const gender = document.getElementById("reggender").value;
    const age = document.getElementById("regage").value;
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
        document.getElementById("status").value = "Registration successful!";
        window.location.href = "/dashboard"; // Redirect to dashboard or home page
    } else {
        document.getElementById("status").value = "Registration failed: " + data.message;
        console.error("Registration failed:", data.message);
        
    }
}