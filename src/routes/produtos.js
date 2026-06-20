const express = require('express');
const router = express.Router();
const db = require('../database/db');
const autenticar = require('../middlewares/auth');

router.get('/', autenticar, (req, res) => {
  const { busca, categoria, alerta } = req.query;

  let sql = `
    SELECT p.*, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = 1
  `;
  const params = [];

  if (busca) {
    sql += ' AND p.nome LIKE ?';
    params.push(`%${busca}%`);
  }

  if (categoria) {
    sql += ' AND p.categoria_id = ?';
    params.push(categoria);
  }

  if (alerta === '1') {
    sql += ' AND p.estoque_atual <= p.estoque_minimo';
  }

  sql += ' ORDER BY p.nome';

  const produtos = db.prepare(sql).all(...params);
  res.json(produtos);
});

router.get('/:id', autenticar, (req, res) => {
  const produto = db.prepare(`
    SELECT p.*, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ? AND p.ativo = 1
  `).get(req.params.id);

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  res.json(produto);
});

router.post('/', autenticar, (req, res) => {
  const { nome, categoria_id, unidade, preco_custo, preco_venda, estoque_minimo } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  const result = db.prepare(`
    INSERT INTO produtos (nome, categoria_id, unidade, preco_custo, preco_venda, estoque_minimo)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    nome.trim(),
    categoria_id || null,
    unidade || 'un',
    preco_custo || 0,
    preco_venda || 0,
    estoque_minimo || 0
  );

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(produto);
});

router.put('/:id', autenticar, (req, res) => {
  const { nome, categoria_id, unidade, preco_custo, preco_venda, estoque_minimo } = req.body;
  const { id } = req.params;

  const existe = db.prepare('SELECT id FROM produtos WHERE id = ? AND ativo = 1').get(id);
  if (!existe) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  db.prepare(`
    UPDATE produtos
    SET nome = ?, categoria_id = ?, unidade = ?,
        preco_custo = ?, preco_venda = ?, estoque_minimo = ?
    WHERE id = ?
  `).run(nome, categoria_id || null, unidade, preco_custo || 0, preco_venda || 0, estoque_minimo || 0, id);

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  res.json(produto);
});

router.delete('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  const existe = db.prepare('SELECT id FROM produtos WHERE id = ? AND ativo = 1').get(id);
  if (!existe) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(id);
  res.json({ mensagem: 'Produto removido com sucesso' });
});

module.exports = router;