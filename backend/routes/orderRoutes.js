const express = require("express");
const router = express.Router();
const db = require("../db");

// criação de pedidos
router.post("/pedidos", async (req, res) => {
    const { idClientes, valor_total, itens, tipo_pagamento } = req.body;
    try {
        // cria o registro principal do pedido e recupera o ID gerado pelo banco
        const [resPedido] = await db.query(
            "INSERT INTO orders (total_value, status, ordered_at, customer_id) VALUES (?, 'processing', NOW(), ?)",
            [valor_total, idClientes]
        );

        const idPedido = resPedido.insertId;

        // percorre a lista de produtos para salvar cada item individualmente
        for (let item of itens) {
            await db.query(
                "INSERT INTO order_items (quantity, unit_price, product_id, order_id) VALUES (?, ?, ?, ?)",
                [item.quantidade, item.preco, item.idProduto, idPedido]
            );
        }

        // gera o registro de pagamento vinculado ao pedido
        await db.query(
            "INSERT INTO payments (method, status, order_id) VALUES (?, 'pending', ?)",
            [tipo_pagamento, idPedido]
        );

        res.json({ msg: "Pedido e Pagamento registrados!", idPedido });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// consulta de dados
router.get("/pedidos/cliente/:id", async (req, res) => {
    try {
        // busca o histórico completo de pedidos de um cliente específico
        const [pedidos] = await db.query(
            "SELECT * FROM orders WHERE customer_id = ?",
            [req.params.id]
        );
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// manutenção de status
router.put("/pedidos/:id/status", async (req, res) => {
    const { status } = req.body;
    try {
        // atualiza a situação do pedido (ex: enviado, cancelado, etc)
        await db.query(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, req.params.id]
        );
        res.json({ msg: "Status do pedido atualizado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// exclusão de registros
router.delete("/pedidos/:id", async (req, res) => {
    try {
        // remove primeiro os pagamentos e itens para não travar na restrição de chave estrangeira
        await db.query("DELETE FROM payments WHERE order_id = ?", [req.params.id]);
        await db.query("DELETE FROM order_items WHERE order_id = ?", [req.params.id]);
        await db.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
        
        res.json({ msg: "Pedido e dados relacionados excluídos!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;