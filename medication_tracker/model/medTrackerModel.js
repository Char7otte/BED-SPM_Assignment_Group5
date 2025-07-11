const sql = require("mssql");
const dbConfig = require("../../dbConfig");

async function getMedicationById(medicationId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = ` 
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_notes, is_taken
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
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_notes, is_taken
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

async function getDailyMedicationByUser(userId, date) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);

        const currentDate = new Date().toISOString().split('T')[0];
        const updateQuery = `
            UPDATE Medications 
            SET medication_date = @currentDate,
                updated_at = GETDATE()
            WHERE user_id = @userId
              AND medication_date < @currentDate
              AND is_taken = 0
              AND @currentDate BETWEEN prescription_startdate AND prescription_enddate
        `;

        const updateRequest = connection.request();
        updateRequest.input("userId", sql.Int, userId);
        updateRequest.input("currentDate", sql.Date, currentDate);
        const updateResult = await updateRequest.query(updateQuery);

        const getQuery = `
            SELECT M.medication_name, M.medication_time, M.medication_dosage, M.medication_notes, M.is_taken
            FROM Medications M
            WHERE M.user_id = @userId AND M.medication_date = @date
        `;  
        const getRequest = connection.request();
        getRequest.input("userId", sql.Int, userId);
        getRequest.input("date", sql.Date, date);
        const result = await getRequest.query(getQuery);
        
        return {
            date: date,
            medications: result.recordset,
            autoUpdated: updateResult.rowsAffected[0]
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

async function getWeeklyMedicationByUser(userId, startDate, endDate) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT M.medication_name, M.medication_time, M.medication_dosage, M.medication_notes, M.is_taken
            FROM Medications M
            WHERE M.user_id = @userId AND M.medication_date BETWEEN @startDate AND @endDate
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
            (user_id, medication_name, medication_date, medication_time, medication_dosage, medication_notes, medication_reminders, prescription_startdate, prescription_enddate, is_taken)
            OUTPUT INSERTED.*
            VALUES 
            (@userId, @medicationName, @medicationDate, @medicationTime, @medicationDosage, @medicationNotes, @medicationReminders, @prescriptionStartDate, @prescriptionEndDate, @isTaken)
        `;
        const request = connection.request();
        request.input("userId", sql.Int, medicationData.user_id);
        request.input("medicationName", sql.NVarChar, medicationData.medication_name);
        request.input("medicationDate", sql.Date, medicationData.medication_date);
        request.input("medicationTime", sql.VarChar, medicationData.medication_time);
        request.input("medicationDosage", sql.NVarChar, medicationData.medication_dosage);
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
        request.input("medicationTime", sql.Time, medicationData.medicationTime);
        request.input("medicationDosage", sql.NVarChar, medicationData.medicationDosage);
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
            SELECT medication_id, medication_name, medication_date, medication_time, medication_dosage, medication_notes, is_taken
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

module.exports = {
    getMedicationById,
    getAllMedicationByUser,
    getDailyMedicationByUser,
    getWeeklyMedicationByUser,
    createMedication,
    updateMedication,
    deleteMedication,
    tickOffMedication,
    searchMedicationByName
};