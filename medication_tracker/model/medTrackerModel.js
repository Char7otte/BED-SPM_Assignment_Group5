const sql = require("mssql");
const dbConfig = require("../../dbConfig");

async function getMedicationById(medicationId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = ` 
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken
            FROM Medications
            WHERE medication_id = @medicationId AND user_id = @userId
        `;
        const request = connection.request();
        request.input("medicationId", sql.Int, medicationId);
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return null; // Medication not found
        }

        return result.recordset[0];
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getAllMedicationByUser(userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken
            FROM Medications
            WHERE user_id = @userId
        `;
        const request = connection.request();
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);
        return result.recordset; // Return all medications for the user
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getDailyMedicationByUser(userId) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);

        const currentDate = new Date().toISOString().split('T')[0];

        const updateQuery = `
            UPDATE Medications 
            SET medication_date = @currentDate, updated_at = GETDATE()
            WHERE user_id = @userId
              AND is_taken = 0
              AND @currentDate BETWEEN prescription_startdate AND prescription_enddate
              AND medication_date < @currentDate
        `;

        const updateRequest = connection.request();
        updateRequest.input("userId", sql.Int, userId);
        updateRequest.input("currentDate", sql.Date, currentDate);
        const updateResult = await updateRequest.query(updateQuery);

        const getQuery = `
            SELECT M.medication_id, M.medication_name, M.medication_date, M.medication_time, M.medication_dosage, M.medication_quantity, M.medication_notes, M.medication_reminders, M.prescription_startdate, M.prescription_enddate, M.is_taken
            FROM Medications M
            WHERE M.user_id = @userId AND M.medication_date = @currentDate
            ORDER BY medication_time ASC
        `;  

        const getRequest = connection.request();
        getRequest.input("userId", sql.Int, userId);
        getRequest.input("currentDate", sql.Date, currentDate);
        const result = await getRequest.query(getQuery);
        
        return {
            date: currentDate,
            medications: result.recordset,
        }
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getCurrentWeekRange() {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return {
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0]
        }
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getWeeklyMedicationByUser(userId, startDate = null, endDate = null) {
    let connection; 
    try {
        if (!startDate || !endDate) {
            const range = await getCurrentWeekRange();
            startDate = range.startDate;
            endDate = range.endDate;
        }
        else {
            startDate = new Date(startDate).toISOString().split('T')[0];
            endDate = new Date(endDate).toISOString().split('T')[0];
        }

        connection = await sql.connect(dbConfig);
        const query = `
            SELECT M.medication_id, M.medication_name, M.medication_date, M.medication_time, M.medication_dosage, M.medication_quantity, M.medication_notes, M.medication_reminders, M.prescription_startdate, M.prescription_enddate, M.is_taken
            FROM Medications M
            WHERE M.user_id = @userId AND M.medication_date BETWEEN @startDate AND @endDate
            ORDER BY M.medication_date, M.medication_time
        `;

        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("startDate", sql.Date, startDate);
        request.input("endDate", sql.Date, endDate);

        const result = await request.query(query);
        return result.recordset;
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function createMedication(medicationData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Medications 
            (user_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken)
            OUTPUT INSERTED.*
            VALUES 
            (@userId, @medicationName, @medicationDate, @medicationTime, @medicationDosage, @medicationQuantity, @medicationNotes, @medicationReminders, @prescriptionStartDate, @prescriptionEndDate, @isTaken)
        `;
        const request = connection.request();
        request.input("userId", sql.Int, medicationData.user_id);
        request.input("medicationName", sql.NVarChar, medicationData.medication_name);
        request.input("medicationDate", sql.Date, medicationData.medication_date);
        request.input("medicationTime", sql.VarChar, medicationData.medication_time);
        request.input("medicationDosage", sql.NVarChar, medicationData.medication_dosage);
        request.input("medicationQuantity", sql.NVarChar, medicationData.medication_quantity);
        request.input("medicationNotes", sql.NVarChar, medicationData.medication_notes);
        request.input("medicationReminders", sql.Bit, medicationData.medication_reminders);
        request.input("prescriptionStartDate", sql.Date, medicationData.prescription_startdate);
        request.input("prescriptionEndDate", sql.Date, medicationData.prescription_enddate);
        request.input("isTaken", sql.Bit, medicationData.is_taken);

        const result = await request.query(query);
    
        if (result.recordset.length === 0) {
            throw new Error("Medication creation failed, no rows inserted.");
        }

        return result.recordset[0];
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function updateMedication(medicationId, medicationData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Medications
            SET medication_name = @medicationName,
                medication_date = @medicationDate,
                medication_time = @medicationTime,
                medication_dosage = @medicationDosage,
                medication_quantity = @medicationQuantity,
                medication_notes = @medicationNotes,
                medication_reminders = @medicationReminders,
                prescription_startdate = @prescriptionStartDate,
                prescription_enddate = @prescriptionEndDate,
                is_taken = @isTaken,
                updated_at = GETDATE()
            WHERE medication_id = @medicationId AND user_id = @userId
        `;
        const request = connection.request();
        request.input("medicationId", sql.Int, medicationId);
        request.input("userId", sql.Int, medicationData.userId);
        request.input("medicationName", sql.NVarChar, medicationData.medicationName);
        request.input("medicationDate", sql.Date, medicationData.medicationDate);
        request.input("medicationTime", sql.VarChar, medicationData.medicationTime);
        request.input("medicationDosage", sql.NVarChar, medicationData.medicationDosage);
        request.input("medicationQuantity", sql.NVarChar, medicationData.medicationQuantity);
        request.input("medicationNotes", sql.NVarChar, medicationData.medicationNotes);
        request.input("medicationReminders", sql.Bit, medicationData.medicationReminders);
        request.input("prescriptionStartDate", sql.Date, medicationData.prescriptionStartDate);
        request.input("prescriptionEndDate", sql.Date, medicationData.prescriptionEndDate);
        request.input("isTaken", sql.Bit, medicationData.isTaken);

        const result = await request.query(query);
        if (result.rowsAffected[0] === 0) {
            return null;
        }
        return { medicationId, ...medicationData };
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function deleteMedication(medicationId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM Medications 
            WHERE medication_id = @medicationId AND user_id = @userId
        `;
        const request = connection.request();
        request.input("medicationId", sql.Int, medicationId);
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null;
        }
        return { medicationId, userId };
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function tickOffMedication(medicationId, userId) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Medications
            SET is_taken = 1, updated_at = GETDATE()
            WHERE medication_id = @medicationId AND user_id = @userId
        `;
        const request = connection.request();
        request.input("medicationId", sql.Int, medicationId);
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null;
        }

        return { medicationId, userId, isTaken: true };
    }
    catch {
        console.error("Database error:", error);
        throw error;
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function searchMedicationByName(userId, medicationName) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        
        const query = `
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken
            FROM Medications
            WHERE user_id = @userId AND medication_name LIKE @medicationName
        `;

        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("medicationName", sql.NVarChar, `%${medicationName}%`);
        const result = await request.query(query);

        return result.recordset;
    } 
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function remindMedication(userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date();
        
        // Calculate the time 5 minutes from now
        const fiveMinutesFromNow = new Date(currentTime.getTime() + 5 * 60000);
        const currentTimeStr = currentTime.toTimeString().substring(0, 5); // HH:MM format
        const fiveMinutesFromNowStr = fiveMinutesFromNow.toTimeString().substring(0, 5);
        
        const query = `
            SELECT medication_id, medication_name, medication_time, medication_dosage, medication_notes
            FROM Medications
            WHERE user_id = @userId 
              AND medication_date = @currentDate 
              AND is_taken = 0
              AND medication_reminders = 1
              AND medication_time BETWEEN @currentTime AND @fiveMinutesFromNow
            ORDER BY medication_time ASC
        `;
        
        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("currentDate", sql.Date, currentDate);
        request.input("currentTime", sql.VarChar, currentTimeStr);
        request.input("fiveMinutesFromNow", sql.VarChar, fiveMinutesFromNowStr);

        const result = await request.query(query);
        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset;
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function tickAllMedications(userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Medications
            SET is_taken = 1, updated_at = GETDATE()
            WHERE user_id = @userId AND is_taken = 0
        `;

        const request = connection.request();
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }

        return { userId, message: "All medications marked as taken." };
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function getLowQuantityMedication(userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT medication_id, medication_name, medication_quantity
            FROM Medications
            WHERE user_id = @userId AND medication_quantity < 5
        `;

        const request = connection.request();
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset;
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function decrementMedicationQuantity(medicationId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Medications
            SET medication_quantity = medication_quantity - 1, updated_at = GETDATE()
            WHERE medication_id = @medicationId AND user_id = @userId AND medication_quantity > 0
        `;

        const request = connection.request();
        request.input("medicationId", sql.Int, medicationId);
        request.input("userId", sql.Int, userId);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null;
        }

        return { medicationId, userId, message: "Medication quantity decremented." };
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function filterMedicationByStatus(userId, isTaken) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken
            FROM Medications
            WHERE user_id = @userId AND is_taken = @isTaken
        `;

        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("isTaken", sql.Bit, isTaken);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset;
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

async function filterMedicationByDate(userId, startDate, endDate) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query =`
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_quantity, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken
            FROM Medications
            WHERE user_id = @userId AND medication_date BETWEEN @startDate AND @endDate
        `;
        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("startDate", sql.Date, new Date(startDate).toISOString().split('T')[0]);
        request.input("endDate", sql.Date, new Date(endDate).toISOString().split('T')[0]);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset;
    }
    catch (error) {
        console.error("Database error:", error);
        throw error;
    } 
    finally {
        if (connection) {
            try {
                await connection.close();
            } 
            catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

module.exports = {
    getMedicationById,
    getAllMedicationByUser,
    getDailyMedicationByUser,
    getWeeklyMedicationByUser,
    createMedication,
    updateMedication,
    deleteMedication,
    tickOffMedication,
    searchMedicationByName,
    remindMedication,
    tickAllMedications, 
    getLowQuantityMedication,
    decrementMedicationQuantity, 
    filterMedicationByStatus,
    filterMedicationByDate
};