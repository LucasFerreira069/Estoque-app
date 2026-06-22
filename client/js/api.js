const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/pages/login.html';
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(BASE + path, { ...options, headers });

  if (res.status === 401) {
    logout();
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.erro || 'Erro na requisição');
  }

  return data;
}

const api = {
  login: (email, senha) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    }),

  categorias: {
    listar: () => request('/categorias'),
    criar: (nome) => request('/categorias', { method: 'POST', body: JSON.stringify({ nome }) })
  },

  produtos: {
    listar: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('/produtos' + (q ? '?' + q : ''));
    },
    buscar: (id) => request('/produtos/' + id),
    criar: (dados) => request('/produtos', { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id, dados) => request('/produtos/' + id, { method: 'PUT', body: JSON.stringify(dados) }),
    deletar: (id) => request('/produtos/' + id, { method: 'DELETE' })
  },

  movimentacoes: {
    listar: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('/movimentacoes' + (q ? '?' + q : ''));
    },
    criar: (dados) => request('/movimentacoes', { method: 'POST', body: JSON.stringify(dados) })
  }
};

function getUsuario() {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

function exigirLogin() {
  if (!getToken()) {
    window.location.href = '/pages/login.html';
  }
}

window.api = api;
window.logout = logout;
window.getUsuario = getUsuario;
window.exigirLogin = exigirLogin;
window.getToken = getToken;