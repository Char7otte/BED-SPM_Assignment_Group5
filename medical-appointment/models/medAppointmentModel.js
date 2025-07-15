const sql = require("mssql");
const dbConfig = require("../../dbConfig");

// Get all appointments for a user
async function getAllAppointmentsByUser(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = 
    `SELECT appointment_date, appointment_title, doctor, start_time, end_time, location, notes 
     FROM MedAppointments 
     WHERE user_id = @user_id
     ORDER BY appointment_date, start_time ASC`; // Order by date and time
    const request = connection.request();
    request.input("user_id", userId);
    const result = await request.query(query);
    return result.recordset;
    
    } catch(error){
        console.error("Database error in getAllAppointments:", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection:", err);
            }
        }
    }
}

// Get appointment by date 
async function getAppointmentByDate(date, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = 
    `SELECT appointment_date, appointment_title, doctor, start_time, end_time, location, notes 
     FROM MedAppointments 
     WHERE appointment_date = @appointment_date AND user_id = @user_id
     ORDER BY start_time`; 
    const request = connection.request();
    request.input("appointment_date", date);
    request.input("user_id", userId);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Appointment not found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Database error in getAppointmentByDate:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get appointment by appointment id
async function getAppointmentById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = 
    `SELECT appointment_date, appointment_title, doctor, start_time, end_time, location, notes 
     FROM MedAppointments 
     WHERE appointment_id = @appointment_id`;
    const request = connection.request();
    request.input("appointment_id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Appointment not found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Database error in getAppointmentById:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Create new appointment
async function createAppointment(userId, appointmentData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query =
      `INSERT INTO MedAppointments (user_id, appointment_date, appointment_title, doctor, start_time, end_time, location, notes) 
       VALUES (@user_id, @appointment_date, @appointment_title, @doctor, @start_time, @end_time, @location, @notes); 
       SELECT SCOPE_IDENTITY() AS appointment_id;`;
    const request = connection.request();
    request.input("user_id", userId);
    request.input("appointment_date", appointmentData.appointment_date);
    request.input("appointment_title", appointmentData.appointment_title);
    request.input("doctor", appointmentData.doctor);
    request.input("start_time", appointmentData.start_time);
    request.input("end_time", appointmentData.end_time);
    request.input("location", appointmentData.location);
    request.input("notes", appointmentData.notes);
    const result = await request.query(query);

    const newAppointmentId = result.recordset[0].appointment_id;
    return await getAppointmentById(newAppointmentId);

    } catch(error){
        console.error("Database error in createAppointment:", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection:", err);
            }
        }
    }
}

// Update appointment by appointment id
async function updateAppointment(id, userId, appointmentData){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = 
        `UPDATE MedAppointments 
         SET appointment_date = @appointment_date, appointment_title = @appointment_title, doctor = @doctor, start_time = @start_time, end_time = @end_time, location = @location, notes = @notes 
         WHERE appointment_id = @appointment_id AND user_id = @user_id`;
        const request = connection.request();
        request.input("appointment_id", id);
        request.input("user_id", userId);
        request.input("appointment_date", appointmentData.appointment_date);
        request.input("appointment_title", appointmentData.appointment_title);
        request.input("doctor", appointmentData.doctor);
        request.input("start_time", appointmentData.start_time);
        request.input("end_time", appointmentData.end_time);
        request.input("location", appointmentData.location);
        request.input("notes", appointmentData.notes);
        const result = await request.query(query);

        if(result.rowsAffected[0] === 0){
            return null; // Appointment not found
        }

        return await getAppointmentById(id);
    } catch(error){
        console.error("Database error in updateAppointment:", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection:", err);
            }
        }
    }
}

// Delete appointment by appointment id
async function deleteAppointment(id, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = "DELETE FROM MedAppointments WHERE appointment_id = @appointment_id AND user_id = @user_id";
        const request = connection.request();
        request.input("appointment_id", id);
        request.input("user_id", userId);
        const result = await request.query(query);

        if(result.rowsAffected[0] === 0){
            return null; // Appointment not found
        }
        return true; //return success response to prevent error
    } catch(error){
        console.error("Database error in deleteAppointment:", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection:", err);
            }
        }
    }
}


module.exports = {
  getAllAppointmentsByUser,
  getAppointmentByDate,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};