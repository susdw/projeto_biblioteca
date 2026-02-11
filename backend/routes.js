const express = require("express");
const router = express.Router();
const db = require("./db");

// GET: Livros
router.get("/livros", async (req, res) => {
    try {
        const [livros] = await db.query("SELECT * FROM livros");
        res.json(livros);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Adicionar Livro
router.post("/livros", async (req, res) => {
    const { titulo, autor, ano_publicacao, genero } = req.body;
    try {
        await db.query(
            "INSERT INTO livros (titulo, autor, ano_publicacao, genero) VALUES (?, ?, ?, ?)",
            [titulo, autor, ano_publicacao, genero]
        );
        res.json({ msg: "Livro adicionado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao adicionar livro" });
    }
});

// PUT: Atualizar Livro
router.put("/livros/:id", async (req, res) => {
    const { titulo, autor, ano_publicacao, genero } = req.body;
    try {
        await db.query(
            "UPDATE livros SET titulo = ?, autor = ?, ano_publicacao = ?, genero = ? WHERE id = ?",
            [titulo, autor, ano_publicacao, genero, req.params.id]
        );
        res.json({ msg: "Livro atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar livro" });
    }
});

// DELETE: Remover Livro
router.delete("/livros/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM livros WHERE id = ?", [req.params.id]);
        res.json({ msg: "Livro removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover livro" });
    }
});