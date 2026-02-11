const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Criar uma nova conta de usuário
router.post('/usuarios', userController.createUser);

// Listar livros de um usuário
router.get('/usuarios/:id/livros', userController.getUserBooks);

// Comprar um livro
router.post('/comprar', userController.buyBook);

module.exports = router;