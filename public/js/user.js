

const apiurl = "http://localhost:3000"; // Replace with your API URL

const tempTokenU = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkEiLCJ1c2VybmFtZSI6ImFkbWluMSIsImlhdCI6MTc1MjQxMDEzNiwiZXhwIjoxNzUyNDEzNzM2fQ.OGsEBC251jrZsWX095cbxOeAi_oBmTB7PGQKi_T0X1g';
const tempTokenA = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6IlUiLCJ1c2VybmFtZSI6InVzZXIyIiwiaWF0IjoxNzUyNTAxNDAyLCJleHAiOjE3NTI1MDUwMDJ9.qsWefU3PEbJiRX5_v_v230TIqCJ0vHxAuFrL-nvJ4b0'
const token = tempTokenA; // Use your actual token source in production

function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("User JS loaded");
    const pathname = window.location.pathname;

    if (pathname.endsWith("usermanage.html")) {
        displayAllUserDetails();
    }
    else if (pathname.endsWith("useradmin.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get("id");
        if (userId) {
            displayUserDetails();
        } else {
           displayCreateUserForm();
        }
    }
});

async function displayAllUserDetails() {
    const decoded = decodeJwtPayload(token);
    const role = decoded.role;
    console.log("User role:", role);

    if (role !== 'A') {
        alert("You do not have permission to view this page.");
        // window.location.href = "index.html";
        return;
    }

    try {
        const allUsers = await getAllUsers();

        if (!Array.isArray(allUsers)) {
            console.error("Expected array of users, but got:", allUsers);
            return;
        }

        const container = document.getElementById("userDetails");
        container.innerHTML = "";

        allUsers.forEach(user => {
            const roleMap = { A: "Admin", U: "User", V: "Volunteer" };
            const roleName = roleMap[user.role] || user.role;

            const userDiv = document.createElement("div");
            userDiv.className = "user";
            userDiv.innerHTML = `
                <p>Username: ${user.username}</p>
                <p>Phone Number: ${user.phone_number}</p>
                <p>Role: ${roleName}</p>
                <p>User ID: ${user.user_id}</p>
                <button onclick="deleteUser(${user.user_id})">Delete User</button>
                <button onclick="updateUser(${user.user_id})">Update User</button>
            `;
            container.appendChild(userDiv);
        });
         const addBtn = document.createElement("button");
        addBtn.textContent = "Add User";
        addBtn.style.height = "100px";
        addBtn.style.width = "100%";
        addBtn.style.fontSize = "1.5em";
        addBtn.style.marginBottom = "20px";
        addBtn.onclick = function () {
            window.location.href = "google.com";
        };
        container.prepend(addBtn);
    } catch (err) {
        console.error("Failed to load users:", err);
        document.getElementById("userDetails").innerHTML = `<p style="color:red;">Error loading users: ${err.message}</p>`;
    }
}

function updateUser(userId) {
    alert("Redirecting to user update page..." + userId);
    window.location.href = `useradmin.html?id=${userId}`;
}

async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const response = await fetch(`${apiurl}/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            }
        });

        if (!response.ok) throw new Error("Failed to delete user");

        alert("User deleted successfully");
        displayAllUserDetails();
    } catch (err) {
        console.error("Error deleting user:", err);
        alert("Error deleting user: " + err.message);
    }
}

async function getAllUsers() {
    const response = await fetch(`${apiurl}/users`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }

    const data = await response.json();
    return data.users || data;
}

async function displayUserDetails() {
    const decoded = decodeJwtPayload(token);
    const role = decoded.role;

    // Optional: allow both Admin and Volunteer
    if (role !== 'A') {
        alert("Only Admins can access this page.");
        // window.location.href = "index.html";
       
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (!userId) {
        document.getElementById("userDetails").innerHTML = `<p style="color:red;">No user ID provided</p>`;
        return;
    }

    try {
        const user = await getUserById(userId);
        if (!user) {
            document.getElementById("userDetails").innerHTML = "<p>User not found</p>";
            
        }

        document.getElementById("userDetails").innerHTML = `
            <form id="updateUserForm">
                <input type="hidden" name="id" value="${user.user_id}">
                <label>Username: <input type="text" name="username" value="${user.username}" required></label><br>
                <label>Phone Number: <input type="text" name="phone_number" value="${user.phone_number}" required></label><br>
                <label>Password: <input type="password" name="password" value="" placeholder="Leave blank to keep unchanged"></label><br>
                <label>Age: <input type="number" name="age" value="${user.age}" required></label><br>
                <button type="submit">Update User</button>
            </form>
        `;

        // document.getElementById("updateUserForm").addEventListener("submit", async function (e) {
        //     e.preventDefault();

        //     const formData = new FormData(this);
        //     const updatedUser = {
        //         username: formData.get("username"),
        //         phone_number: formData.get("phone_number"),
        //         age: parseInt(formData.get("age")),
        //     };

        //     const password = formData.get("password");
        //     if (password && password.trim() !== "") {
        //         updatedUser.password = password;
        //     }

        //     try {
        //         const response = await fetch(`${apiurl}/users/${userId}`, {
        //             method: "PUT",
        //             headers: {
        //                 "Content-Type": "application/json",
        //                 "Authorization": token
        //             },
        //             body: JSON.stringify(updatedUser)
        //         });

        //         if (!response.ok) throw new Error("Update failed");

        //         alert("User updated successfully");
        //         window.location.href = "usermanage.html"; // Go back after update
        //     } catch (err) {
        //         alert("Error updating user: " + err.message);
        //     }
        // });

    } catch (err) {
        console.error("Error fetching user details:", err);
        document.getElementById("userDetails").innerHTML = `<p style="color:red;">Error loading user details: ${err.message}</p>`;
    }
}

async function getUserById(userId) {
    const response = await fetch(`${apiurl}/users/${userId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }

    const data = await response.json();
    return data.user || data;
}


function displayCreateUserForm() {
    
    const formHtml = `
        <form id="createUserForm">
            <label>Username: <input type="text" name="username" required></label><br>
            <label>Phone Number: <input type="text" name="phone_number" required></label><br>
            <label>Password: <input type="password" name="password" required></label><br>
            <label>Age: <input type="number" name="age" required></label><br>
            <label>Gender: 
                <select name="gender" required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </label><br>
            <label>Role: 
                <select name="role" required>
                    <option value="A">Admin</option>
                    <option value="U">User</option>
                    <option value="V">Volunteer</option>
                </select>
            </label><br>
            
            <button type="submit">Create User</button>
        </form>
    `;

    document.getElementById("userDetails").innerHTML = formHtml;

    document.getElementById("userDetails").addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const newUser = {
            username: formData.get("username"),
            phone_number: formData.get("phone_number"),
            password: formData.get("password"),
            age: parseInt(formData.get("age")),
            gender: formData.get("gender"),
            role: formData.get("role")
        };
        console.log("Creating user with data:", newUser);

        try {
            const response = await fetch(`${apiurl}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify(newUser)
            });

            if (!response.ok) throw new Error("Failed to create user");

            alert("User created successfully");
            window.location.href = "usermanage.html";
        } catch (err) {
            alert("Error creating user: " + err.message);
        }
    });
}