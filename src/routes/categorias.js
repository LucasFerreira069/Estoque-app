const express = require('express');
const router = express.Router();
const db = require('../database/db');
const autenticar = require('../middlewares/auth');

router.get('/', autenticar, (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome').all();
  res.json(categorias);
});

router.post('/', autenticar, (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO categorias (nome) VALUES (?)'
    ).run(nome.trim());

    res.status(201).json({ id: result.lastInsertRowid, nome: nome.trim() });
  } catch (err) {
    res.status(400).json({ erro: 'Categoria já existe' });
  }
});

module.exports = router;