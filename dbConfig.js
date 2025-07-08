module.exports = {
    user: "12345",
    password: "12345",
    server: "DESKTOP-4RFAEEN/SQLEXPRESS",
    database: "bed_spm",
    trustServerCertificate: true,
    options: {
        port: parseInt(process.env.DB_PORT), // Default SQL Server port
        connectionTimeout: 60000, // Connection timeout in milliseconds
    },
};
