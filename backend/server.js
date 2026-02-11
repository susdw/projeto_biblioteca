const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

// Rotas de usuários e compras
app.use('/api', userRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));