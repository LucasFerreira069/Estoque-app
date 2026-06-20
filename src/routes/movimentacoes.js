const express = require('express');
const router = express.Router();
const db = require('../database/db');
const autenticar = require('../middlewares/auth');

router.get('/', autenticar, (req, res) => {
  const { produto_id, data_inicio, data_fim } = req.query;

  let sql = `
    SELECT m.*, p.nome as produto_nome
    FROM movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (produto_id) {
    sql += ' AND m.produto_id = ?';
    params.push(produto_id);
  }

  if (data_inicio) {
    sql += ' AND m.criado_em >= ?';
    params.push(data_inicio);
  }

  if (data_fim) {
    sql += ' AND m.criado_em <= ?';
    params.push(data_fim + ' 23:59:59');
  }

  sql += ' ORDER BY m.criado_em DESC LIMIT 100';

  const movimentacoes = db.prepare(sql).all(...params);
  res.json(movimentacoes);
});

router.post('/', autenticar, (req, res) => {
  const { produto_id, tipo, quantidade, observacao } = req.body;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ erro: 'produto_id, tipo e quantidade são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser entrada ou saida' });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(produto_id);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  if (tipo === 'saida' && produto.estoque_atual < quantidade) {
    return res.status(400).json({
      erro: `Estoque insuficiente. Disponível: ${produto.estoque_atual}`
    });
  }

  const result = db.prepare(`
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao, usuario_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(produto_id, tipo, quantidade, observacao || null, req.usuario.id);

  const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);

  res.status(201).json({
    id: result.lastInsertRowid,
    produto: produtoAtualizado
  });
});

module.exports = router;