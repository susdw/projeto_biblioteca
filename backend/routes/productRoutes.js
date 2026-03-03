const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/produtos", async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.nome as categoria_nome 
            FROM Produtos p
            LEFT JOIN categorias c ON p.categorias_idcategorias = c.idcategorias`;
        const [produtos] = await db.query(query);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/produtos", async (req, res) => {
    const { nome, descricao, estoque, preco, status, idCategoria } = req.body;
    try {
        await db.query(
            "INSERT INTO Produtos (nome, descricao, estoque, preco, status, categorias_idcategorias) VALUES (?, ?, ?, ?, ?, ?)",
            [nome, descricao, estoque, preco, status, idCategoria]
        );
        res.json({ msg: "Produto cadastrado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/produtos/:id/autores", async (req, res) => {
    try {
        const query = `
            SELECT a.nome FROM autores a
            JOIN livro_autor la ON a.idautores = la.autores_idautores
            WHERE la.Produtos_idProdutos = ?`;
        const [autores] = await db.query(query, [req.params.id]);
        res.json(autores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/produtos/:id", async (req, res) => {
    const { estoque, preco, status } = req.body;
    try {
        await db.query(
            "UPDATE Produtos SET estoque = ?, preco = ?, status = ? WHERE idProdutos = ?",
            [estoque, preco, status, req.params.id]
        );
        res.json({ msg: "Produto atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/produtos/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM Produtos WHERE idProdutos = ?", [req.params.id]);
        res.json({ msg: "Produto removido!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: verifique se há pedidos com este produto." });
    }
});

module.exports = router;