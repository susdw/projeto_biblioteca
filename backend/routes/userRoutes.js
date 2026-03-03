const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/clientes", async (req, res) => {
    const { nome, email, telefone, endereco } = req.body;
    try {
        const [resAddr] = await db.query(
            "INSERT INTO endereco (cep, bairro, cidade, estado, numero, rua) VALUES (?, ?, ?, ?, ?, ?)",
            [endereco.cep, endereco.bairro, endereco.cidade, endereco.estado, endereco.numero, endereco.rua]
        );
        const idEndereco = resAddr.insertId;
        await db.query(
            "INSERT INTO Clientes (nome, email, telefone, endereco_idendereco) VALUES (?, ?, ?, ?)",
            [nome, email, telefone, idEndereco]
        );
        res.json({ msg: "Cliente e endereço cadastrados!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/clientes", async (req, res) => {
    try {
        const [clientes] = await db.query(`
            SELECT c.*, e.rua, e.cidade 
            FROM Clientes c 
            JOIN endereco e ON c.endereco_idendereco = e.idendereco`);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/clientes/:id", async (req, res) => {
    const { email, telefone } = req.body;
    try {
        await db.query(
            "UPDATE Clientes SET email = ?, telefone = ? WHERE idClientes = ?",
            [email, telefone, req.params.id]
        );
        res.json({ msg: "Dados atualizados!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/clientes/:id", async (req, res) => {
    try {
        const [cliente] = await db.query("SELECT endereco_idendereco FROM Clientes WHERE idClientes = ?", [req.params.id]);
        if (cliente.length > 0) {
            const idEndereco = cliente[0].endereco_idendereco;
            await db.query("DELETE FROM Clientes WHERE idClientes = ?", [req.params.id]);
            await db.query("DELETE FROM endereco WHERE idendereco = ?", [idEndereco]);
            res.json({ msg: "Cliente e endereço removidos!" });
        } else {
            res.status(404).json({ error: "Cliente não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: o cliente possui pedidos vinculados." });
    }
});

module.exports = router;