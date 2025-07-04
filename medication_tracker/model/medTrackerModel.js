const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getDailyMedications(date) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = "SELECT U.Name, M.MedicationName, M.MedicationDate, M.MedicationTime, M.MedicationDosage, M.MedicationNotes M.MedicationReminders, M.PrescriptionStartDate, M.PrescriptionEndDate, M.IsTaken FROM Medications M JOIN Users U ON M.UserID = U.UserID WHERE U.Name = @name";
        const request = connection.request();
        request.input("name", sql.NVarChar, name);
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

async function getWeeklyMedications(startDate, endDate) {
    let connection; 
    try {
        connection = await sql.connect(dbConfig);
        const query = "SELECT U.Name, M.MedicationName, M.MedicationDate, M.MedicationTime, M.MedicationDosage, M.MedicationNotes, M.MedicationReminders, M.PrescriptionStartDate, M.PrescriptionEndDate, M.IsTaken FROM Medications M JOIN Users U ON M.UserID = U.UserID WHERE U.Name = @name AND M.MedicationDate BETWEEN @startDate AND @endDate";
        const request = connection.request();
        request.input("name", sql.NVarChar, name);
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

module.exports = {
    getDailyMedications,
    getWeeklyMedications
};