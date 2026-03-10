const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/clientes", async (req, res) => {
    const { nome, email, telefone, endereco } = req.body;
    try {
        const [resAddr] = await db.query(
            "INSERT INTO addresses (zip_code, neighborhood, city, state, number, street) VALUES (?, ?, ?, ?, ?, ?)",
            [endereco.cep, endereco.bairro, endereco.cidade, endereco.estado, endereco.numero, endereco.rua]
        );
        const idEndereco = resAddr.insertId;

        await db.query(
            "INSERT INTO customers (name, email, phone, address_id) VALUES (?, ?, ?, ?)",
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
            SELECT c.*, a.street, a.city
            FROM customers c
            JOIN addresses a ON c.address_id = a.id`);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/clientes/:id", async (req, res) => {
    const { email, telefone } = req.body;
    try {
        await db.query(
            "UPDATE customers SET email = ?, phone = ? WHERE id = ?",
            [email, telefone, req.params.id]
        );
        res.json({ msg: "Dados atualizados!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/clientes/:id", async (req, res) => {
    try {
        const [cliente] = await db.query(
            "SELECT address_id FROM customers WHERE id = ?",
            [req.params.id]
        );
        if (cliente.length > 0) {
            const idEndereco = cliente[0].address_id;
            await db.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
            await db.query("DELETE FROM addresses WHERE id = ?", [idEndereco]);
            res.json({ msg: "Cliente e endereço removidos!" });
        } else {
            res.status(404).json({ error: "Cliente não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: o cliente possui pedidos vinculados." });
    }
});

module.exports = router;
