
module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    trustServerCertificate: true,
    options: {
        port: parseInt(process.env.DB_PORT), // Default SQL Server port
        connectionTimeout: 15000, // Connection timeout in milliseconds
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