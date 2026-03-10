const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs");
const db = require("../db");

const upload = require("../upload");

router.get("/produtos", async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id`;
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
            "INSERT INTO products (name, description, stock, price, status, category_id) VALUES (?, ?, ?, ?, ?, ?)",
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
            SELECT a.name FROM authors a
            JOIN product_authors pa ON a.id = pa.author_id
            WHERE pa.product_id = ?`;
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
            "UPDATE products SET stock = ?, price = ?, status = ? WHERE id = ?",
            [estoque, preco, status, req.params.id]
        );
        res.json({ msg: "Produto atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/produtos/:id/cover", upload.single("cover"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image file provided." });
    }

    const newPath = `/uploads/covers/${req.file.filename}`;

    try {
        const [rows] = await db.query(
            "SELECT cover_image FROM products WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }

        const oldPath = rows[0].cover_image;

        await db.query(
            "UPDATE products SET cover_image = ? WHERE id = ?",
            [newPath, req.params.id]
        );

        if (oldPath) {
            const absoluteOld = path.join(__dirname, "../", oldPath);
            fs.unlink(absoluteOld, (err) => {
                if (err) console.warn("Could not delete old cover:", err.message);
            });
        }

        res.json({ msg: "Capa atualizada!", cover_image: newPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;