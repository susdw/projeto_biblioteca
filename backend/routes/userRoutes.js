const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role FROM customers WHERE email = ? AND password = ? AND active = TRUE",
            [email, password]
        );
        if (rows.length === 0)
            return res.status(401).json({ error: "Email ou senha inválidos." });
        res.json({ user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /clientes
router.post("/clientes", async (req, res) => {
    const { nome, email, telefone, password, role, endereco } = req.body;
    if (!nome || !email || !password || !endereco?.rua || !endereco?.cidade || !endereco?.estado || !endereco?.cep)
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
    try {
        const [resAddr] = await db.query(
            "INSERT INTO addresses (zip_code, neighborhood, city, state, number, street) VALUES (?, ?, ?, ?, ?, ?)",
            [endereco.cep, endereco.bairro || "", endereco.cidade, endereco.estado, endereco.numero || "", endereco.rua]
        );
        const idEndereco = resAddr.insertId;
        await db.query(
            "INSERT INTO customers (name, email, phone, password, role, address_id) VALUES (?, ?, ?, ?, ?, ?)",
            [nome, email, telefone || "", password, role || "client", idEndereco]
        );
        res.json({ msg: "Cliente cadastrado!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email já cadastrado." });
        res.status(500).json({ error: error.message });
    }
});

// GET /clientes
router.get("/clientes", async (req, res) => {
    try {
        const [clientes] = await db.query(`
            SELECT c.id, c.name, c.email, c.phone, c.role, c.active, c.address_id,
                   a.street, a.city, a.state, a.zip_code, a.neighborhood, a.number
            FROM customers c
            LEFT JOIN addresses a ON c.address_id = a.id`);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /clientes/:id — update all editable fields
router.put("/clientes/:id", async (req, res) => {
    const { nome, email, telefone, role, rua, numero, bairro, cidade, estado, cep } = req.body;
    if (!email) return res.status(400).json({ error: "Email é obrigatório." });
    try {
        // update customer
        await db.query(
            "UPDATE customers SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?",
            [nome, email, telefone || "", role || "client", req.params.id]
        );
        // update address if provided
        if (rua || cidade || estado || cep) {
            const [rows] = await db.query("SELECT address_id FROM customers WHERE id = ?", [req.params.id]);
            if (rows.length > 0 && rows[0].address_id) {
                await db.query(
                    "UPDATE addresses SET street = ?, number = ?, neighborhood = ?, city = ?, state = ?, zip_code = ? WHERE id = ?",
                    [rua || "", numero || "", bairro || "", cidade || "", estado || "", cep || "", rows[0].address_id]
                );
            }
        }
        res.json({ msg: "Dados atualizados!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email já cadastrado." });
        res.status(500).json({ error: error.message });
    }
});

// DELETE /clientes/:id
router.delete("/clientes/:id", async (req, res) => {
    try {
        const [cliente] = await db.query("SELECT address_id FROM customers WHERE id = ?", [req.params.id]);
        if (cliente.length > 0) {
            const idEndereco = cliente[0].address_id;
            await db.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
            if (idEndereco) await db.query("DELETE FROM addresses WHERE id = ?", [idEndereco]);
            res.json({ msg: "Cliente e endereço removidos!" });
        } else {
            res.status(404).json({ error: "Cliente não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: o cliente possui pedidos vinculados." });
    }
});

module.exports = router;