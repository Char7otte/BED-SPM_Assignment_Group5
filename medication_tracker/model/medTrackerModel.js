const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getDailyMedicationByUser(userId, date) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = `SELECT M.MedicationName, M.MedicationTime, M.MedicationDate, M.MedicationDosage, M.MedicationNotes, M.IsTaken
                       FROM Medications M
                       JOIN Users U ON M.UserID = U.UserID
                       WHERE U.UserID = @userId AND M.MedicationDate = @date
                       `;
        const request = connection.request();
        request.input("userId", sql.Int, userId);
        request.input("date", sql.Date, date);
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

async function getWeeklyMedicationByUser(userId, startDate, endDate) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT M.MedicationName, M.MedicationTime, M.MedicationDate, M.MedicationDosage, M.MedicationNotes, M.IsTaken
            FROM Medications M
            JOIN Users U ON M.UserID = U.UserID
            WHERE U.UserID = @userId AND M.MedicationDate BETWEEN @startDate AND @endDate
            `;
        const request = connection.request();
        request.input("userId", sql.NVarChar, userId);
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
        const query = 
            `INSERT INTO Medications 
            (UserID, MedicationName, MedicationDate, MedicationTime, MedicationDosage, MedicationNotes, MedicationReminders, PrescriptionStartDate, PrescriptionEndDate, IsTaken)
            VALUES 
            (@userID, @medicationName, @medicationDate, @medicationTime, @medicationDosage, @medicationNotes, @medicationReminders, @prescriptionStartDate, @prescriptionEndDate, @isTaken)
            `;
    
        const request = connection.request();

        request.input("userID", sql.Int, medicationData.userID);
        request.input("medicationName", sql.NVarChar, medicationData.medicationName);
        request.input("medicationDate", sql.Date, medicationData.medicationDate);
        request.input("medicationTime", sql.Time, medicationData.medicationTime);
        request.input("medicationDosage", sql.NVarChar, medicationData.medicationDosage);
        request.input("medicationNotes", sql.NVarChar, medicationData.medicationNotes);
        request.input("medicationReminders", sql.NVarChar, medicationData.medicationReminders);
        request.input("prescriptionStartDate", sql.Date, medicationData.prescriptionStartDate);
        request.input("prescriptionEndDate", sql.Date, medicationData.prescriptionEndDate);
        request.input("isTaken", sql.Bit, medicationData.isTaken);

        const result = await request.query(query);
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

module.exports = {
    getDailyMedicationByUser,
    getWeeklyMedicationByUser,
    createMedication
};