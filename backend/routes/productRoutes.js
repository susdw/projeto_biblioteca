const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../db");
const upload = require("../upload");

// GET /produtos
router.get("/produtos", async (req, res) => {
    try {
        const [produtos] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id`);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /produtos
router.post("/produtos", async (req, res) => {
    const { nome, descricao, estoque, preco, status, idCategoria } = req.body;
    if (!nome || preco === undefined || estoque === undefined)
        return res.status(400).json({ error: "Nome, preço e estoque são obrigatórios." });
    try {
        await db.query(
            "INSERT INTO products (name, description, stock, price, status, category_id) VALUES (?, ?, ?, ?, ?, ?)",
            [nome, descricao || "", estoque, preco, status || "active", idCategoria || null]
        );
        res.json({ msg: "Produto cadastrado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /produtos/:id/autores
router.get("/produtos/:id/autores", async (req, res) => {
    try {
        const [autores] = await db.query(`
            SELECT a.name FROM authors a
            JOIN product_authors pa ON a.id = pa.author_id
            WHERE pa.product_id = ?`, [req.params.id]);
        res.json(autores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /autores — create author if not exists and link to product
router.post("/autores", async (req, res) => {
    const { nome, productId } = req.body;
    if (!nome || !productId)
        return res.status(400).json({ error: "Nome e productId são obrigatórios." });
    try {
        const [existing] = await db.query("SELECT id FROM authors WHERE name = ?", [nome]);
        let authorId;
        if (existing.length > 0) {
            authorId = existing[0].id;
        } else {
            const [result] = await db.query("INSERT INTO authors (name) VALUES (?)", [nome]);
            authorId = result.insertId;
        }
        await db.query(
            "INSERT IGNORE INTO product_authors (product_id, author_id) VALUES (?, ?)",
            [productId, authorId]
        );
        res.json({ msg: "Autor vinculado!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /produtos/:id — update all fields
router.put("/produtos/:id", async (req, res) => {
    const { nome, descricao, estoque, preco, status, idCategoria } = req.body;
    if (!nome || preco === undefined || estoque === undefined)
        return res.status(400).json({ error: "Nome, preço e estoque são obrigatórios." });
    try {
        await db.query(
            "UPDATE products SET name = ?, description = ?, stock = ?, price = ?, status = ?, category_id = ? WHERE id = ?",
            [nome, descricao || "", estoque, preco, status, idCategoria || null, req.params.id]
        );
        res.json({ msg: "Produto atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /produtos/:id/cover
router.put("/produtos/:id/cover", upload.single("cover"), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: "No image file provided." });
    const newPath = `/uploads/covers/${req.file.filename}`;
    try {
        const [rows] = await db.query("SELECT cover_image FROM products WHERE id = ?", [req.params.id]);
        if (rows.length === 0)
            return res.status(404).json({ error: "Produto não encontrado." });
        const oldPath = rows[0].cover_image;
        await db.query("UPDATE products SET cover_image = ? WHERE id = ?", [newPath, req.params.id]);
        if (oldPath) {
            const abs = path.join(__dirname, "../", oldPath);
            fs.unlink(abs, err => { if (err) console.warn("Could not delete old cover:", err.message); });
        }
        res.json({ msg: "Capa atualizada!", cover_image: newPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /produtos/:id
router.delete("/produtos/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT cover_image FROM products WHERE id = ?", [req.params.id]);
        if (rows.length > 0 && rows[0].cover_image) {
            const abs = path.join(__dirname, "../", rows[0].cover_image);
            fs.unlink(abs, err => { if (err) console.warn("Could not delete cover:", err.message); });
        }
        await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
        res.json({ msg: "Produto removido!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;