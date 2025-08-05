const express = require("express");
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { use } = require("react");
const e = require("express");
//roles restriction will be handled in the middlewareconst jwt = require('jsonwebtoken');

async function getAllUsers(req, res) {
    try {
        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserById(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

//Deemed unnecessary, call from userModel instead
// async function getUserByIDBoolean(req, res) {
//     try {
//         const userID = req.params.userID;
//         const user = await userModel.getUserById(userID);
//         console.log(user);
//         if (!user) return false;
//         return true;
//     } catch (err) {
//         console.error("Error fetching user:", err);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// }

async function getUserByUsername(req, res) {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: "Invalid username" });
    }

    try {
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createUser(req, res) {

    const { username, phone_number, password, age, gender, status = 'active' } = req.body;
    

    if (!username || !phone_number || !password || !age || !gender) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {

        // Create the user
        await userModel.createUser({ username, phone_number, password, age, gender, status });

        // Get user info
        const user = await userModel.getUserByUsername(username);

        // Generate JWT
        const token = jwt.sign(
            { id: user.user_id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '3600s' }
        );

        

        // Set cookie before sending the final response
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3 * 60 * 60 * 1000 // 3 hours
        });

        // ✅ Send only one response
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            token: token
        });

    } catch (err) {
        console.error("Error creating user:", err);

        if (err.message && err.message.includes('Violation of UNIQUE KEY')) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        return res.status(500).json({ message: 'Internal server error' });

    }
}


async function updateUser(req, res) {
    console.log("Update user data:", req.body);
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const { username, phone_number, password, age, gender, status, role } = req.body;

    try {
        if (!password) {
            // If password is not provided, do not update it
            await userModel.updateUser(userId, { username, phone_number, age, gender, status, role });
        } else {
            await userModel.updateUser(userId, { username, phone_number, password, age, gender, status, role });
        }
        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteUser(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        await userModel.deleteReadStatusByid(userId);
    } catch (err) {
        console.error("Error deleting read status:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

    try {
        await userModel.deleteUser(userId);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserRolesById(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        const roles = await userModel.getUserRolesById(userId);
        if (!roles) {
            return res.status(404).json({ message: "User roles not found" });
        }
        res.status(200).json(roles);
    } catch (err) {
        console.error("Error fetching user roles:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}
async function loginUser(req, res) {
    
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required",
        });
    }

    try {
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isPasswordValid = await userModel.verifyPassword(password, user.password);
        

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.user_id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: "3600s" });

        // ✅ SUCCESS response with token
        res.cookie("token", token, {
            // secure: true in production
            maxAge: 3 * 60 * 60 * 1000, // 3 hours
        })
            .status(200)
            .json({
                success: true,
                message: "Login successful",
                token: token, // still optional to return in body
            });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

async function changePassword(req, res) {
    const userId = parseInt(req.params.id);
    console.log("Changing password for user ID:", userId);
    const { newPassword } = req.body;
    console.log("New password:", newPassword);
    if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log("Hashed password:", hashedPassword);
        await userModel.changePassword(userId, hashedPassword);
        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function searchUserByUsernameNid(req, res) {
    const { username, id } = req.body;
    

    if (!username && !id) {
        return res.status(400).json({ message: "Username or ID is required" });
    }
    try {
        const users = await userModel.searchUserByUsernameNid(username, id);
        if (users == null) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json(users);
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

function logoutUser(req, res) {
    res.clearCookie("token");
    res.setHeader("Authorization", "");
    console.log("User logged out");
    res.status(200).json({ message: "Logged out successfully" });
}

module.exports = {
    getAllUsers,
    getUserById,
    // getUserByIDBoolean,
    getUserByUsername,
    getUserRolesById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    changePassword,
    searchUserByUsernameNid,
    logoutUser,
};
