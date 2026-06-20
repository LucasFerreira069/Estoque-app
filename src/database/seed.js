const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      criado_em DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria_id INTEGER,
      unidade TEXT NOT NULL DEFAULT 'un',
      preco_custo REAL DEFAULT 0,
      preco_venda REAL DEFAULT 0,
      estoque_atual REAL DEFAULT 0,
      estoque_minimo REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
      quantidade REAL NOT NULL,
      observacao TEXT,
      usuario_id INTEGER,
      criado_em DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS atualiza_estoque_entrada
    AFTER INSERT ON movimentacoes
    WHEN NEW.tipo = 'entrada'
    BEGIN
      UPDATE produtos SET estoque_atual = estoque_atual + NEW.quantidade
      WHERE id = NEW.produto_id;
    END;

    CREATE TRIGGER IF NOT EXISTS atualiza_estoque_saida
    AFTER INSERT ON movimentacoes
    WHEN NEW.tipo = 'saida'
    BEGIN
      UPDATE produtos SET estoque_atual = estoque_atual - NEW.quantidade
      WHERE id = NEW.produto_id;
    END;
  `);

  const adminExiste = db.prepare(
    'SELECT id FROM usuarios WHERE email = ?'
  ).get('admin@estoque.com');

  if (!adminExiste) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)'
    ).run('Administrador', 'admin@estoque.com', hash);
    console.log('Usuário admin criado: admin@estoque.com / admin123');
  }

  const cats = ['Alimentos','Bebidas','Limpeza','Higiene','Outros'];
  const insertCat = db.prepare(
    'INSERT OR IGNORE INTO categorias (nome) VALUES (?)'
  );
  cats.forEach(c => insertCat.run(c));

  console.log('Banco de dados inicializado com sucesso!');
}

seed();