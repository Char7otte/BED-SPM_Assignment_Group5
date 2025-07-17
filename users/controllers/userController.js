const express = require('express');
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt'); 
const router = express.Router();
const jwt = require('jsonwebtoken');
const { use } = require('react');
const e = require('express');
//roles restriction will be handled in the middlewareconst jwt = require('jsonwebtoken');

 


async function getAllUsers(req, res) {
    try {
        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getUserById(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getUserByUsername(req, res) {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: 'Invalid username' });
    }

    try {
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createUser(req, res) {
    const { username, phone_number, password, age, gender, status = 'active' } = req.body;
    if (!username || !phone_number || !password || !age || !gender) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await userModel.createUser({ username, phone_number, password, age, gender, status  });
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.log('Error creating user:', err);
        if (err.message && err.message.includes('Violation of UNIQUE KEY')) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        else {
            console.error('Error creating user:', err);
            res.status(500).json({ message: 'Internal server error'});
        }
    }
}

async function updateUser(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { username, phone_number, password, age, gender } = req.body;
    if (!username || !phone_number || !password || !age || !gender) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await userModel.updateUser(userId, { username, phone_number, password, age, gender });
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteUser(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        await userModel.deleteReadStatusByid(userId);
    } catch (err) {
        console.error('Error deleting read status:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }

    try {
        await userModel.deleteUser(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getUserRolesById(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const roles = await userModel.getUserRolesById(userId);
        if (!roles) {
            return res.status(404).json({ message: 'User roles not found' });
        }
        res.status(200).json(roles);
    } catch (err) {
        console.error('Error fetching user roles:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}
async function loginUser(req, res) {
    console.log("Login attempt:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    try {
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await userModel.verifyPassword(password, user.password);
        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.user_id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '3600s' }
        );

        // ✅ SUCCESS response with token
        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token
        });

    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

async function changePassword(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.changePassword(userId, hashedPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}



module.exports = {
    getAllUsers,
    getUserById,
    getUserByUsername,
    getUserRolesById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    changePassword,
};
