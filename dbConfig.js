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
