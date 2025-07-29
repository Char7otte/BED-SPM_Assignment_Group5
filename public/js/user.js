
const apiurl = "http://localhost:3000";
console.log("user.js loaded");
// Check for token and redirect to login if missing or expired
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

document.addEventListener("DOMContentLoaded", () => {
    
    const path = window.location.pathname;

    if (path.startsWith("/users/updatedetail/")) {
        const userId = path.split("/").pop();
        handleEditUser(userId);
    }
    else if (path === "/user") {
        displayOptions();
    }
});

function displayOptions() {
    const container = document.getElementById("main-container") || document.body;
    container.innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div>
                        <div class="card-body">
                            <h5 class="card-title text-center mb-4">Options</h5>
                            <div class="d-flex justify-content-center gap-3 mb-4">
                                <a href="#" class="btn btn-success btn-custom btn-lg" onclick="handleManageUser()">Manage User</a>
                                <a href="#" class="btn btn-success btn-custom btn-lg" onclick="handleManageAdmin()">Manage Admin / Volunteer</a>
                            </div>
                            <div class="d-flex justify-content-center ">
                                <input type="text" id="searchInput" class="form-control btn-noradius w-50 me-2" placeholder="Search user by name or ID">
                                <button class="btn btn-outline-primary btn-noradius" onclick="handleSearchUser()">Search User</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleManageUser() {
    const token = localStorage.getItem('token');
    const user = decodeJwtPayload(token);

    const mainContainer = document.getElementById("main-container") || document.body;
    getAllUsers()
        .then(users => {
            const filteredUsers = users.filter(u => u.role === 'U' && u.status !== 'deleted');

            mainContainer.innerHTML = `
                <div class="container mt-5 shadow" style="background: #fff; padding: 20px; border-radius: 0px; width: 100%;">
                    <h2 class="text-center mb-4">User Management</h2>
                    <table class="table" style="background: #f8f9fa; border-collapse: collapse; width: 100%;">
                        <thead>
                            <tr style="border: none; margin: 0; padding: 10px;">
                                <th style="border: none;">ID</th>
                                <th style="border: none;">Name</th>
                                <th style="border: none;">Phone</th>
                                <th style="border: none;">Role</th>
                                <th style="border: none;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredUsers.map(u => `
                                <tr style="border: none;">
                                    <td style="border: none;">${u.user_id}</td>
                                    <td style="border: none;">${u.username}</td>
                                    <td style="border: none;">${u.phone_number}</td>
                                    <td style="border: none;">${u.role === 'U' ? 'User' : u.role}</td>
                                    <td style="border: none;">
                                        <button class="btn btn-primary btn-noradius" onclick="handleEditUserlink(${u.user_id})">Edit</button>
                                        <button class="btn btn-danger btn-noradius" onclick="handleDeleteUser(${u.user_id})">Delete</button>
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;    })
        .catch(error => {
            console.error("Error fetching users:", error);
            mainContainer.innerHTML = `<div class="alert alert-danger">Error fetching users. Please try again later.</div>`;
        });
}

function handleManageAdmin(userId) {
    const token = localStorage.getItem('token');
    const user = decodeJwtPayload(token);

    const mainContainer = document.getElementById("main-container") || document.body;
    getAllUsers()
        .then(users => {
            const filteredUsers = users.filter(u => (u.role === 'A' || u.role === 'V')&& u.status !== 'deleted');
            mainContainer.innerHTML = `
                <div class="container mt-5 shadow" style="background: #fff; padding: 20px; border-radius: 0px; width: 100%;">
                    <h2 class="text-center mb-4">Admin / Volunteer Management</h2>
                    <table class="table" style="background: #f8f9fa; border-collapse: collapse; width: 100%;">
                        <thead>
                            <tr style="border: none; margin: 0; padding: 10px;">
                                <th style="border: none;">ID</th>
                                <th style="border: none;">Name</th>
                                <th style="border: none;">Phone</th>
                                <th style="border: none;">Role</th>
                                <th style="border: none;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users
                                .filter(u => u.role === 'A' || u.role === 'V')
                                .map(u => `
                                    <tr style="border: none;">
                                        <td style="border: none;">${u.user_id}</td>
                                        <td style="border: none;">${u.username}</td>
                                        <td style="border: none;">${u.phone_number}</td>
                                        <td style="border: none;">${u.role === 'A' ? 'Admin' : u.role === 'V' ? 'Volunteer' : u.role}</td>
                                        <td style="border: none;">
                                            <button class="btn btn-primary btn-noradius"  onclick="handleEditUserlink(${u.user_id})">Edit</button>
                                            <button class="btn btn-danger btn-noradius" onclick="handleDeleteUser(${u.user_id})">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            `;    })
        .catch(error => {
            console.error("Error fetching users:", error);
            mainContainer.innerHTML = `<div class="alert alert-danger">Error fetching users. Please try again later.</div>`;
        });

}
async function getAllUsers() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${apiurl}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const users = await response.json();
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

async function handleDeleteUser(userId) {
    const token = localStorage.getItem('token');
    const confirmed = confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${apiurl}/users/delete/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        alert("User deleted successfully");
        displayOptions(); // Refresh the user list
    } catch (error) {
        console.error('Error deleting user:', error);
        alert("Error deleting user. Please try again later.");
    }
}

function handleEditUserlink(id){
    href = `/users/updatedetail/${id}`;
    window.location.href = href;
}

function handleEditUser(userId) {
    const token = localStorage.getItem('token');
    const user = decodeJwtPayload(token);
    getSingleUser(userId)
        .then(user => {
            if (!user) return;

            const mainContainer = document.getElementById("editUserForm") || document.body;
            mainContainer.innerHTML = `
               
                <input type="hidden" name="user_id" value="${userId}">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" name="username" value="${user.username}" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" placeholder="Enter new password (leave blank to keep unchanged)">
                </div>
                <div class="mb-3">
                    <label for="phone_number" class="form-label">Phone Number</label>
                    <input type="text" class="form-control" id="phone_number" name="phone_number" value="${user.phone_number}" required>
                </div>

                <div class="mb-3">
                    <label for="age" class="form-label">Age</label>
                    <input type="number" class="form-control" id="age" name="age" value="${user.age || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="gender" class="form-label">Gender</label>
                    <select class="form-select" id="gender" name="gender">
                        <option value="Male" ${user.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${user.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${user.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="role" class="form-label">Role</label>
                    <select class="form-select" id="role" name="role">
                        <option value="U">User</option>
                        <option value="A">Admin</option>
                        <option value="V">Volunteer</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="status" class="form-label">Status</label>
                    <select class="form-select" id="status" name="status">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="deleted" ${user.status === 'deleted' ? 'selected' : ''}>Deleted</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-noradius">Update User</button>
    `;});

    document.getElementById("editUserForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
            phone_number: document.getElementById("phone_number").value,
            gender: document.getElementById("gender").value,
            age: document.getElementById("age").value,
            role: document.getElementById("role").value,
            status: document.getElementById("status").value
        };
        
        if (!data.password) {
            delete data.password; // Don't send password if left blank
        }
        console.log("User data to update:", data);
        try {
            const response = await fetch(`${apiurl}/users/updatedetail/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': token
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            alert("User updated successfully");
            displayOptions(); // Refresh UI
        } catch (error) {
            console.error('Error updating user:', error);
            alert("Error updating user. Please try again later.");
        }
    });
}



async function getSingleUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiurl}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}


async function handleSearchUser() {
    const searchInput = document.getElementById("searchInput").value.trim();
    if (!searchInput) {
        alert("Please enter a username or ID to search.");
        return;
    }
    
    const token = localStorage.getItem('token');
    let idcon;

   try {
        idcon = parseInt(searchInput);
   } catch (error) {
       idcon = null;
       
   }
   if (isNaN(idcon)) {
        if(searchInput.length < 3) {
        alert("Please enter a min 3 char username or a valid ID");
        return;
        }
    }
   

    data = {
        username: searchInput,
        id: idcon
    };

    try {
        const response = await fetch(`${apiurl}/users/search/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token
            },
            body: JSON.stringify(data)
        });
        // if (!response.ok) {
        //     throw new Error('Network response was not ok');
        // }
        const users = await response.json();
        if (users.message) {
            console.log(null);
            alert("No users found with the given username or ID.");
        }else {
            handleDisplaySearchResults(users);
        }
        
    } catch (error) {
        console.error('Error searching users:', error);
        alert("Error searching users. Please try again later.");
    }
}

function handleDisplaySearchResults(users) {
    const mainContainer = document.getElementById("main-container") || document.body;
    // Ensure users is always an array, even if a single user object is returned
    const userList = Array.isArray(users) ? users : [users];

    mainContainer.innerHTML = `
        <div class="container mt-5 shadow" style="background: #fff; padding: 20px; border-radius: 0px; width: 100%;">
            <h2 class="text-center mb-4">Search Results</h2>
            <table class="table" style="background: #f8f9fa; border-collapse: collapse; width: 100%;">
                <thead>
                    <tr style="border: none; margin: 0; padding: 10px;">
                        <th style="border: none;">ID</th>
                        <th style="border: none;">Name</th>
                        <th style="border: none;">Phone</th>
                        <th style="border: none;">Role</th>
                        <th style="border: none;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${userList.map(u => `
                        <tr style="border: none;">
                            <td style="border: none;">${u.user_id}</td>
                            <td style="border: none;">${u.username}</td>
                            <td style="border: none;">${u.phone_number}</td>
                            <td style="border: none;">${u.role === 'U' ? 'User' : u.role === 'A' ? 'Admin' : u.role === 'V' ? 'Volunteer' : u.role}</td>
                            <td style="border: none;">
                                <button class="btn btn-primary btn-noradius" onclick="handleEditUserlink(${u.user_id})">Edit</button>
                                <button class="btn btn-danger btn-noradius" onclick="handleDeleteUser(${u.user_id})">Delete</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}


