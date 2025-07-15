module.exports = {
    user: process.env.DB_User,
    password: process.env.DB_Password,
    server: process.env.DB_Host,
    database: process.env.DB_Name,
    trustServerCertificate: true,
    options: {
        port: 1433, // Default SQL Server port
        connectionTimeout: 60000, // Connection timeout in milliseconds
    },
};
/*
module.exports = {
    user: "123",
    password: "123",
    server: "DESKTOP-4RFAEEN/SQLEXPRESS",
    database: "bed_spm",
    trustServerCertificate: true,
    options: {
        port: parseInt(process.env.DB_PORT), // Default SQL Server port
        connectionTimeout: 60000, // Connection timeout in milliseconds
    },
};

*/