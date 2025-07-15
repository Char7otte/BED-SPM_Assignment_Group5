// const dbConfig = require("../dbConfig");

const sql = require("mssql");

const path = require("path");
const dbConfig = require(path.join(__dirname, "..", "..", "dbConfig.js"));
const bcrypt = require("bcrypt");

// Functions
//1. Get all users - used for user management
//2. Get user by ID - used for user management
//3. Get user by username - used for login functionality
//4. Create user - used for user registration
//5. Update user - used for user management
//6. Delete user - used for user management
//7. Get user roles by ID - used for authorization checks
//8. Verify password - used for login functionality


async function getAllUsers() {
    let conn; 
    try {
        conn = await sql.connect(dbConfig);
        const result = await conn.request().query("SELECT * FROM Users");
        return result.recordset;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getUserById(id) {
    let conn; 
    try {
        conn = await sql.connect(dbConfig);
        const query = "SELECT user_id, username, phone_number, password, joined_date, age FROM Users WHERE user_id = @id";
        const result = await conn.request()
            .input("id", sql.Int, id)
            .query(query);
        return result.recordset[0];
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }

}

async function getUserByUsername(username) {
    let conn;
    try {
        conn = await sql.connect(dbConfig);
        const query = "SELECT user_id, username, phone_number, password, joined_date, age, role FROM Users WHERE username = @username";
        const result = await conn.request()
            .input("username", sql.NVarChar, username)
            .query(query);
        return result.recordset[0];
    } catch (error) {
        console.error("Error fetching user by username:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function createUser(user) {
    let conn;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt); // Hash the password

        conn = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Users (username, phone_number, password, joined_date, age, gender)
            VALUES (@username, @phone_number, @password, @joined_date, @age, @gender)
        `;
        await conn.request()
            .input("username", sql.NVarChar, user.username)
            .input("phone_number", sql.NVarChar, user.phone_number)
            .input("password", sql.NVarChar, hashedPassword) // Use hashed password
            .input("joined_date", sql.Date, new Date().toISOString()) // Use current date
            .input("age", sql.Int, user.age)
            .input("gender", sql.NVarChar, user.gender)
            .query(query);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function updateUser(id, user) {
    let conn;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt); // Hash the password

        conn = await sql.connect(dbConfig);
        const query = `
            UPDATE Users
            SET username = @username,
                phone_number = @phone_number,
                password = @password,
                age = @age,
                gender = @gender
            WHERE user_id = @id
        `;
        await conn.request()
            .input("username", sql.NVarChar, user.username)
            .input("phone_number", sql.NVarChar, user.phone_number)
            .input("password", sql.NVarChar, hashedPassword)
            .input("age", sql.Int, user.age)
            .input("gender", sql.NVarChar, user.gender)
            .input("id", sql.Int, id)
            .query(query);
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function deleteReadStatusByid(id) {
    let conn;
    try {
        conn = await sql.connect(dbConfig);
        const query = "DELETE FROM ReadStatus WHERE user_id = @id";
        await conn.request()
            .input("id", sql.Int, id)
            .query(query);
    } catch (error) {
        console.error("Error deleting read status:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function deleteUser(id) {
    let conn;
    
    try {
        conn = await sql.connect(dbConfig);
        const query = "DELETE FROM Users WHERE user_id = @id";
        await conn.request()
            .input("id", sql.Int, id)
            .query(query);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getUserRolesById(id) {
    let conn;
    try {
        conn = await sql.connect(dbConfig);
        const query = "SELECT role FROM Users WHERE user_id = @id";
        const result = await conn.request()
            .input("id", sql.Int, id)
            .query(query);
        return result.recordset[0] ? result.recordset[0].role : null;
    } catch (error) {
        console.error("Error fetching user roles by ID:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
    
}

async function changePassword(id, newPassword) {
    let conn;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the new password

        conn = await sql.connect(dbConfig);
        const query = "UPDATE Users SET password = @password WHERE user_id = @id";
        await conn.request()
            .input("password", sql.NVarChar, hashedPassword) // Use hashed password
            .input("id", sql.Int, id)
            .query(query);
    } catch (error) {
        console.error("Error changing password:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}





async function verifyPassword (plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByUsername,
    getUserRolesById,
    createUser,
    updateUser,
    deleteUser,
    verifyPassword,
    changePassword,
    deleteReadStatusByid,
};


// SQL Table Creation Script
// -- User table
// CREATE TABLE [Users] (
//     user_id INT PRIMARY KEY IDENTITY(1,1),
//     username NVARCHAR(100) NOT NULL,
//     phone_number NVARCHAR(15) NOT NULL,
//     password NVARCHAR(255) NOT NULL,
//     joined_date DATE NOT NULL DEFAULT GETDATE(),
//     age INT NOT NULL,
//     gender NVARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
//     role CHAR(1) NOT NULL DEFAULT 'U'
//         CONSTRAINT chk_user_role CHECK (role IN ('A', 'U', 'V')) -- A = Admin, U = User, V = Volunteer
// );