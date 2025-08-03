const sql = require("mssql");
const dbConfig = require("../../dbConfig");

// Get all feedback for a user
async function getAllFeedbacksByUser(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        fbk_id as id, 
        FORMAT(creation_date, 'yyyy-MM-dd') as DateOfCreation, 
        title, 
        feature, 
        description, 
        status
      FROM Feedbacks
      WHERE user_id = @user_id
      ORDER BY creation_date ASC`; 

    const request = connection.request();
    request.input("user_id", userId);
    const result = await request.query(query);
    return result.recordset;
    
  } catch(error){
      console.error("Database error in getAllFeedbacksByUser:", error);
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

// Get all feedbacks from all users - for admin use
async function getAllFeedbacks(){
    let connection;
    try{
        connection = await sql.connect(dbConfig);

        const query = `
        SELECT 
            fbk_id as id, 
            user_id,
            FORMAT(creation_date, 'yyyy-MM-dd') as DateOfCreation, 
            title, 
            feature, 
            description, 
            status
        FROM Feedbacks
        ORDER BY creation_date DESC`; 

        const request = connection.request();
        const result = await request.query(query);
        return result.recordset;
    } catch(error){
        console.error("Database error in getAllFeedbacks:", error);
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

// Get feedback by id
async function getFeedbackById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        fbk_id as id, 
        FORMAT(creation_date, 'yyyy-MM-dd') as DateOfCreation, 
        title, 
        feature, 
        description, 
        status
      FROM Feedbacks
      WHERE fbk_id = @fbk_id`;

    const request = connection.request();
    request.input("fbk_id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }

    return result.recordset[0];
  } catch (error) {
      console.error("Database error in getFeedbackById:", error);
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

// Create new feedback
async function createFeedback(userId, feedbackData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      INSERT INTO Feedbacks (user_id, creation_date, title, feature, description, status) 
      VALUES (@user_id, GETDATE(), @title, @feature, @description, @status); 
      SELECT SCOPE_IDENTITY() AS fbk_id;`;

    const request = connection.request();
    request.input("user_id", userId);
    request.input("title", feedbackData.title);
    request.input("feature", feedbackData.feature);
    request.input("description", feedbackData.description);
    request.input("status", "Pending"); // Default status to 'Pending'
    
    const result = await request.query(query);

    const newFeedbackId = result.recordset[0].fbk_id;
    return await getFeedbackById(newFeedbackId);

  } catch(error){
      console.error("Database error in createFeedback:", error);
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

// Update feedback by feedback id
async function updateFeedback(id, userId, feedbackData){
  let connection;
  try{
      connection = await sql.connect(dbConfig);

      const query = `
        UPDATE Feedbacks
        SET title = @title, feature = @feature, description = @description, status = @status
        WHERE fbk_id = @fbk_id AND user_id = @user_id`;
        
      const request = connection.request();
      request.input("fbk_id", id);
      request.input("user_id", userId);
      request.input("title", feedbackData.title);
      request.input("feature", feedbackData.feature);
      request.input("description", feedbackData.description);
      request.input("status", "Pending");

      const result = await request.query(query);

      if(result.rowsAffected[0] === 0){
          return null; // Feedback not found
      }
      return await getFeedbackById(id);
  } catch(error){
      console.error("Database error in updateFeedback:", error);
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

// Update status of feedback - for admin use
async function editFeedbackStatus(id, status) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);

        const query = `
            UPDATE Feedbacks
            SET status = @status
            WHERE fbk_id = @fbk_id`;

        const request = connection.request();
        request.input("status", status);
        request.input("fbk_id", id);
        
        const result = await request.query(query);

        if(result.rowsAffected[0] === 0){
            return null; // Feedback not found
        }
        return await getFeedbackById(id);
    } catch (error) {
        console.error("Database error in editFeedbackStatus:", error);
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

// Delete feedback by feedback id
async function deleteFeedback(id, userId) {
  let connection;
  try {
      connection = await sql.connect(dbConfig);

      const query = `
      DELETE FROM Feedbacks
      WHERE fbk_id = @fbk_id AND user_id = @user_id`;

      const request = connection.request();
      request.input("fbk_id", id);
      request.input("user_id", userId);
      
      const result = await request.query(query);

      if(result.rowsAffected[0] === 0){
          return null; // Feedback not found
      }
      return true; //return success response to prevent error
  } catch(error){
      console.error("Database error in deleteFeedback:", error);
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

// Delete feedback - for admin use
async function deleteFeedbackAdmin(id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);

        const query = `
            DELETE FROM Feedbacks
            WHERE fbk_id = @fbk_id`;

        const request = connection.request();
        request.input("fbk_id", id);
        
        const result = await request.query(query);

        if(result.rowsAffected[0] === 0){
            return null; // Feedback not found
        }
        return true;
    } catch (error) {
        console.error("Database error in deleteFeedbackAdmin:", error);
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

// Search feedbacks by search term
async function searchFeedbacks(searchTerm, userId) {
  let connection;
  try {
      connection = await sql.connect(dbConfig);

      const query = `
      SELECT 
        fbk_id as id, 
        user_id,
        FORMAT(creation_date, 'yyyy-MM-dd') as DateOfCreation, 
        title, 
        feature, 
        description, 
        status
      FROM Feedbacks
      WHERE user_id = @user_id AND (
        creation_date LIKE '%' + @searchTerm + '%'
        OR title LIKE '%' + @searchTerm + '%'
        OR feature LIKE '%' + @searchTerm + '%'
        OR description LIKE '%' + @searchTerm + '%'
      )
      ORDER BY creation_date ASC`; 

      const request = connection.request();
      request.input("user_id", userId); 
      request.input("searchTerm", sql.NVarChar, searchTerm); // Explicitly define type
      
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error("Database error in searchFeedbacks:", error); 
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

// Search feedbacks by title or status - for admin use
async function searchFeedbacksAdmin(searchTerm) {
  let connection;
  try {
      connection = await sql.connect(dbConfig);

      const query = `
      SELECT 
        fbk_id as id, 
        user_id,
        FORMAT(creation_date, 'yyyy-MM-dd') as DateOfCreation, 
        title, 
        feature, 
        description, 
        status
      FROM Feedbacks
      WHERE 
        title LIKE '%' + @searchTerm + '%'
        OR status LIKE '%' + @searchTerm + '%'
      ORDER BY creation_date ASC`; 

      const request = connection.request();
      request.input("searchTerm", sql.NVarChar, searchTerm); // Explicitly define type
      
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error("Database error in searchFeedbacksAdmin:", error); 
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

module.exports = {
  getAllFeedbacksByUser,
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  editFeedbackStatus,
  deleteFeedback,
  deleteFeedbackAdmin,
  searchFeedbacks,
  searchFeedbacksAdmin
};