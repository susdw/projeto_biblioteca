const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root", // Usuário do MySQL
    password: "root", // Senha do MySQL
    database: "biblioteca", // Nome do banco de dados
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporta permitindo usar await/async
module.exports = pool.promise();