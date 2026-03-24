const express = require("express");
const router = express.Router();
const db = require("../db");

// autenticação de usuário
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password)
        return res.status(400).json({ error: "Email e senha são obrigatórios." });

    try {
        // busca o usuário apenas se ele estiver com a conta ativa
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

// gestão de cadastro
router.post("/clientes", async (req, res) => {
    const { nome, email, telefone, password, role, endereco } = req.body;

    // validação básica pra não deixar passar campo nulo
    if (!nome || !email || !password || !endereco?.rua || !endereco?.cidade || !endereco?.estado || !endereco?.cep)
        return res.status(400).json({ error: "Campos obrigatórios faltando." });

    try {
        // salva o endereço para pegar o ID e vincular ao cliente
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

// leitura e atualização
router.get("/clientes", async (req, res) => {
    try {
        // join para trazer os dados do cliente junto com o endereço
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

// atualiza os dados do cliente
router.put("/clientes/:id", async (req, res) => {
    const { nome, email, telefone, role, rua, numero, bairro, cidade, estado, cep } = req.body;

    if (!email) return res.status(400).json({ error: "Email é obrigatório." });

    try {
        // atualiza os dados básicos do perfil
        await db.query(
            "UPDATE customers SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?",
            [nome, email, telefone || "", role || "client", req.params.id]
        );

        // se mandou dados de endereço, atualiza a tabela vinculada
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

// remover registro de cliente
router.delete("/clientes/:id", async (req, res) => {
    try {
        const [cliente] = await db.query("SELECT address_id FROM customers WHERE id = ?", [req.params.id]);
        
        if (cliente.length > 0) {
            const idEndereco = cliente[0].address_id;

            // apaga o cliente primeiro e depois o endereço pra limpar o banco
            await db.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
            if (idEndereco) await db.query("DELETE FROM addresses WHERE id = ?", [idEndereco]);

            res.json({ msg: "Cliente e endereço removidos!" });
        } else {
            res.status(404).json({ error: "Cliente não encontrado" });
        }
    } catch (error) {
        // erro provavelmente porque o cliente já tem pedidos e o banco travou a deleção
        res.status(500).json({ error: "Erro ao excluir: o cliente possui pedidos vinculados." });
    }
});

module.exports = router;