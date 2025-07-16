const sql = require("mssql");
const path = require("path");
const dbConfig = require(path.join(__dirname, "..", "..", "dbConfig.js"));
//const dbConfig = require("../dbConfig.js");



async function getAllAlerts() {
  console.log("Fetching all alerts from the database...");
    let conn;
    try {
        conn = await sql.connect(dbConfig);
        const result = await conn.request().query("SELECT * FROM Alert ORDER BY Date DESC");
        return result.recordset;
    } catch (error) {
        console.error("Error fetching all alerts:", error);
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

async function getAlertById(id) {
  let conn; // ✅ declare conn outside the try block
  try {
    conn = await sql.connect(dbConfig);

    const query = "SELECT AlertID, Title, Category, Message, Severity FROM Alert WHERE AlertID = @id";
    const request = conn.request();
    request.input("id", sql.Int, id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Alert not found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error fetching alert by ID:", error);
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


// async function getAllAlertsbycategory(category) {
//   try {
//     let conn = await sql.connect(dbConfig);
//     let result = await conn.request()
//       .input("category", sql.NVarChar, category)
//       .query("SELECT * FROM Alerts WHERE category = @category");
//     return result.recordset;
//   } catch (error) {
//     console.error("Error fetching alerts by category:", error);
//     throw error;
//   } finally {
//     if (conn) {
//       try {
//         await conn.close();
//       } catch (err) {
//         console.error("Error closing connection:", err);
//       }
//     }
//   }
// }


async function createAlert(alertData) {
  let conn;
  console.log("modelCreating alert:", alertData);
  
  try {
    conn = await sql.connect(dbConfig);

    // Validate input
    if (!alertData || !alertData.Title || !alertData.Category || !alertData.Message || !alertData.Severity) {
      throw new Error("Invalid alert data. Title, Category, Message, and Severity are required.");
    }

    // INSERT with OUTPUT
    const query = `
      INSERT INTO Alert (Title, Category, Message, Severity)
      OUTPUT INSERTED.*
      VALUES (@Title, @Category, @Message, @Severity)
    `;

    const request = conn.request()
      .input("Title", sql.NVarChar, alertData.Title)
      .input("Category", sql.NVarChar, alertData.Category)
      .input("Message", sql.NVarChar, alertData.Message)
      .input("Severity", sql.NVarChar, alertData.Severity);

    const result = await request.query(query);

    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("Failed to create alert.");
    }

    return {
      message: "Alert created successfully",
      alert: result.recordset[0], // includes AlertID, Title, Category, etc.
    };

  } catch (error) {
    console.error("Error creating alert:", error);
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

async function updateAlert(id, alertData) {
  let conn;
  try {
    conn = await sql.connect(dbConfig);

    // Validate input
    if (!alertData || !alertData.Title || !alertData.Category || !alertData.Message || !alertData.Severity) {
      throw new Error("Invalid alert data. Title, Category, Message, and Severity are required.");
    }

    const query = `
      UPDATE Alert
      SET Title = @Title, Category = @Category, Message = @Message, Severity = @Severity
      WHERE AlertID = @id
    `;

    const request = conn.request()
      .input("id", sql.Int, id)
      .input("Title", sql.NVarChar, alertData.Title)
      .input("Category", sql.NVarChar, alertData.Category)
      .input("Message", sql.NVarChar, alertData.Message)
      .input("Severity", sql.NVarChar, alertData.Severity);

    const result = await request.query(query);

    return result.rowsAffected[0] > 0; // Returns true if update was successful

  } catch (error) {
    console.error("Error updating alert:", error);
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

async function deleteAlert(id) {
  console.log("Deleting alert with ID:", id);
  let conn;
  try {
    conn = await sql.connect(dbConfig);
    let result = await conn.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Alert WHERE AlertID = @id");
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Error deleting alert:", error);
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

async function updateAlertStatus(id){
  console.log("Updating alert status with ID:", id);
  let conn;
  try {
    conn = await sql.connect(dbConfig);
    const query = "UPDATE ReadStatus SET ReadStatus = 1 WHERE AlertID = @id";
    const request = conn.request().input("id", sql.Int, id);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0; // Returns true if update was successful
  } catch (error) {
    console.error("Error updating alert status:", error);
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
async function getUnreadAlerts(userId) {
  let conn;
  try {
    conn = await sql.connect(dbConfig);
    const query = `
      SELECT a.AlertID, a.Title, a.Category, a.Message, a.Date, a.Severity
      FROM Alert a
      JOIN ReadStatus rs ON a.AlertID = rs.AlertID
      WHERE rs.user_id = @userId AND rs.ReadStatus = 0
    `;
    const request = conn.request()
      .input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching unread alerts:", error);
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
    const query = "DELETE FROM ReadStatus WHERE AlertID = @id";
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

async function searchAlerts(title, category) {
  let conn;
  try {
    conn = await sql.connect(dbConfig);
    let query = "SELECT * FROM Alert WHERE 1=1";
    const request = conn.request();

    if (title) {
      query += " AND Title LIKE @title";
      request.input("title", sql.NVarChar, `%${title}%`);
    }
    if (category) {
      query += " AND Category = @category";
      request.input("category", sql.NVarChar, category);
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error searching alerts:", error);
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

module.exports = {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  updateAlertStatus,
  getUnreadAlerts,
  searchAlerts,
  deleteReadStatusByid,
};



// -- Alert table
// CREATE TABLE Alert (
//     AlertID INT PRIMARY KEY IDENTITY(1,1),
//     Title VARCHAR(255) NOT NULL,
//   Category VARCHAR(50),
//     Message VARCHAR(500),
//     Date DATETIME NOT NULL DEFAULT GETDATE(),
//     Severity VARCHAR(50)
// );

// -- ReadStatus table
// CREATE TABLE ReadStatus (
//     user_id INT NOT NULL,
//     AlertID INT NOT NULL,
//     ReadStatus BIT NOT NULL,  -- 1 = Read, 0 = Unread
//     PRIMARY KEY (user_id, AlertID),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id),
//     FOREIGN KEY (AlertID) REFERENCES Alert(AlertID)
// );