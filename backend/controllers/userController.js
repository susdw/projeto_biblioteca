const User = require('../models/user');
const Book = require('../models/book');

// Criar uma nova conta de usuário
exports.createUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await User.create({ name, email, password });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

// Listar livros de um usuário
exports.getUserBooks = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [{ model: Book, as: 'books' }]
        });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(user.books);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar livros do usuário' });
    }
};

// Comprar um livro
exports.buyBook = async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        const book = await Book.findByPk(bookId);
        if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

        // Atualizar o dono do livro
        await book.update({ userId });
        res.json({ msg: 'Livro comprado com sucesso!', book });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao comprar livro' });
    }
};