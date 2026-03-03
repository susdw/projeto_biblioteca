const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/pedidos", async (req, res) => {
    const { idClientes, valor_total, itens, tipo_pagamento } = req.body;
    try {
        const [resPedido] = await db.query(
            "INSERT INTO pedidos (valor_total, status, data_pedido, Clientes_idClientes) VALUES (?, 'Processando', NOW(), ?)",
            [valor_total, idClientes]
        );
        const idPedido = resPedido.insertId;
        for (let item of itens) {
            await db.query(
                "INSERT INTO `Itens pedidos` (quantidade, preco_unitario, Produtos_idProdutos, pedidos_idpedidos) VALUES (?, ?, ?, ?)",
                [item.quantidade, item.preco, item.idProduto, idPedido]
            );
        }
        await db.query(
            "INSERT INTO pagamentos (tipo, status, pedidos_idpedidos) VALUES (?, 'Pendente', ?)",
            [tipo_pagamento, idPedido]
        );
        res.json({ msg: "Pedido e Pagamento registrados!", idPedido });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/pedidos/cliente/:id", async (req, res) => {
    try {
        const [pedidos] = await db.query(
            "SELECT * FROM pedidos WHERE Clientes_idClientes = ?", 
            [req.params.id]
        );
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/pedidos/:id/status", async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(
            "UPDATE pedidos SET status = ? WHERE idpedidos = ?",
            [status, req.params.id]
        );
        res.json({ msg: "Status do pedido atualizado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/pagamentos/pedido/:idPedido", async (req, res) => {
    const { status_pagamento } = req.body;
    try {
        await db.query(
            "UPDATE pagamentos SET status = ? WHERE pedidos_idpedidos = ?",
            [status_pagamento, req.params.idPedido]
        );
        res.json({ msg: "Status do pagamento atualizado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/pedidos/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM pagamentos WHERE pedidos_idpedidos = ?", [req.params.id]);
        await db.query("DELETE FROM `Itens pedidos` WHERE pedidos_idpedidos = ?", [req.params.id]);
        await db.query("DELETE FROM pedidos WHERE idpedidos = ?", [req.params.id]);
        res.json({ msg: "Pedido e dados relacionados excluídos!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;