// CONFIGURAÇÕES
export const API_BASE = "http://localhost:3000/api";
export const IMG_BASE = "http://localhost:3000";
export const SESSION_KEY = "biblioteca_usuario";

const STATUS_COLORS = { active: '#b8ff57', inactive: '#ff6b6b', out_of_stock: '#ffaa00' };
const STATUS_LABELS = { active: 'Disponível', inactive: 'Indisponível', out_of_stock: 'Esgotado' };
const ROLE_LABELS = { client: 'Cliente', admin: 'Administrador' };

// VALIDAÇÃO DE DADOS
const VALIDATORS = {
  name: (value) => {
    const text = value?.trim();
    if (!text) return 'Nome é obrigatório';
    if (text.length < 2) return 'Mín. 2 caracteres';
    if (text.length > 255) return 'Máx. 255 caracteres';
    return null;
  },

  title: (value) => {
    const text = value?.trim();
    if (!text) return 'Título é obrigatório';
    if (text.length > 255) return 'Máx. 255 caracteres';
    return null;
  },

  author: (value) => {
    const text = value?.trim();
    if (!text) return 'Autor é obrigatório';
    if (text.length < 2) return 'Mín. 2 caracteres';
    if (text.length > 255) return 'Máx. 255 caracteres';
    return null;
  },

  email: (value) => {
    const text = value?.trim();
    if (!text) return 'E-mail é obrigatório';
    
    // regex significa expressão regular, nesse caso, é usada pra validar emails (achei na internet)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(text)) return 'E-mail inválido';
    
    return null;
  },

  password: (value) => {
    if (!value) return 'Senha é obrigatória';
    if (value.length < 4) return 'Mín. 4 caracteres';
    if (value.length > 255) return 'Máx. 255 caracteres';
    return null;
  },

  phone: (value) => {
    if (!value?.trim()) return null; // telefone é opcional
    
    const digits = value.replace(/\D/g, ''); // remove oq nao é numero
    if (digits.length > 0 && digits.length < 10) return 'Mín. 10 dígitos';
    if (digits.length > 15) return 'Número muito longo';
    
    return null;
  },

  price: (value) => {
    if (value === '' || value == null) return 'Preço é obrigatório';
    
    const num = Number(value);
    if (isNaN(num)) return 'Deve ser um número';
    if (num < 0) return 'Não pode ser negativo';
    
    return null;
  },

  stock: (value) => {
    if (value === '' || value == null) return 'Estoque é obrigatório';
    
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) return 'Deve ser número inteiro';
    if (num < 0) return 'Não pode ser negativo';
    
    return null;
  },


  street: (value) => !value?.trim() ? 'Rua é obrigatória' : null,
  city: (value) => !value?.trim() ? 'Cidade é obrigatória' : null,
  state: (value) => !value?.trim() ? 'Estado é obrigatório' : null,
  zipCode: (value) => !value?.trim() ? 'CEP é obrigatório' : null,
};

// roda a validação em um grupo de campos do formulário e devolve os erros.
// chama as funções (campos) do VALIDATORS. 
function runValidation(fields, form) {
  const errors = {};
  fields.forEach(field => {
    const error = VALIDATORS[field]?.(form[field]);
    if (error) errors[field] = error;
  });
  return errors;
}

// HELPERS (FUNÇÕES AUXILIÁRES)

// formata valores numéricos para o padrão de moeda brasileiro (R$) ou mostra "GRÁTIS".
function formatPrice(n) {
  const num = Number(n);
  if (isNaN(num)) return '—';
  if (num === 0) return 'GRÁTIS';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// descobre qual deve ser o status real do livro olhando para a quantidade em estoque.
function deriveStatus(stock, currentStatus) {
  if (currentStatus === 'inactive') return 'inactive';
  if (Number(stock) === 0) return 'out_of_stock';
  if (currentStatus === 'out_of_stock') return 'active';
  return currentStatus;
}

// limpa caracteres perigosos para evitar ataques de injeção de HTML (XSS).
function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// CONSTRUTORES DE INTERFACE

// cria as etiquetas coloridas (usadas em status, funções de usuário, etc).
function tagHtml(label, color) {
  return `<span class="tag" style="background:${color}18;border:1px solid ${color}40;color:${color}">${label}</span>`;
}

// retorna a imagem da capa do livro. se não tiver, coloca um emoji de livro no lugar.
function coverHtml(src, size = 120) {
  const height = Math.round(size * 1.4);
  const fallback = `Object.assign(document.createElement('div'),{className:'cover-placeholder',style:'width:${size}px;height:${height}px;font-size:${Math.round(size * .32)}px;flex-shrink:0',textContent:'📖'})`;
  if (!src) return `<div class="cover-placeholder" style="width:${size}px;height:${height}px;font-size:${Math.round(size * .32)}px;flex-shrink:0">📖</div>`;
  return `<img src="${IMG_BASE}${src}" alt="Capa" onerror="this.replaceWith(${fallback})" style="width:${size}px;height:${height}px;object-fit:cover;border-radius:2px;flex-shrink:0;display:block" />`;
}

// monta os inputs, textareas e selects de forma padronizada, já lidando com erros e dicas.
function buildField({ label, name, type = 'text', value = '', placeholder = '', required = false, as = 'input', options = [], hint = '', error = '', colSpan }) {
  const spanStyle = colSpan ? `grid-column:span ${colSpan}` : '';
  const errorClass = error ? 'err' : '';
  const labelClass = error ? 'error' : '';
  let inputHtml = '';

  if (as === 'textarea') {
    inputHtml = `<textarea class="field-input ${errorClass}" name="${name}" placeholder="${placeholder}"
        oninput="App.handleInput(this)"
        onfocus="if(!this.classList.contains('err'))this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor=''">${escapeHtml(value)}</textarea>`;
  } else if (as === 'select') {
    const optionsHtml = options.map(opt =>
      `<option value="${escapeHtml(opt.value)}" ${opt.value === value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
    ).join('');
    inputHtml = `<select class="field-input ${errorClass}" name="${name}" onchange="App.handleInput(this)">${optionsHtml}</select>`;
  } else {
    inputHtml = `<input class="field-input ${errorClass}" type="${type}" name="${name}"
        value="${escapeHtml(value)}" placeholder="${placeholder}"
        oninput="App.handleInput(this)"
        onfocus="if(!this.classList.contains('err'))this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor=''" />`;
  }

  return `
    <div style="${spanStyle}">
      <label class="field-label ${labelClass}">${label}${required ? '<span class="required-star"> *</span>' : ''}</label>
      ${error ? `<page class="field-error">⚠ ${error}</page>` : ''}
      ${inputHtml}
      ${hint && !error ? `<page class="field-hint">${hint}</page>` : ''}
    </div>`;
}

// bloco de campos de endereço padrão para reaproveitarmos onde precisar.
function addressFieldsHtml(form = {}, errors = {}) {
  return `
    <div class="form-section-divider">
      <page class="form-section-title">Endereço</page>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
        ${buildField({ label: 'Rua', name: 'street', value: form.street, placeholder: 'Rua das Flores', required: true, error: errors.street, colSpan: 2 })}
        ${buildField({ label: 'Número', name: 'number', value: form.number, placeholder: '123' })}
        ${buildField({ label: 'Bairro', name: 'neighborhood', value: form.neighborhood, placeholder: 'Centro' })}
        ${buildField({ label: 'Cidade', name: 'city', value: form.city, placeholder: 'Curitiba', required: true, error: errors.city })}
        ${buildField({ label: 'Estado', name: 'state', value: form.state, placeholder: 'PR', required: true, error: errors.state })}
        ${buildField({ label: 'CEP', name: 'zipCode', value: form.zipCode, placeholder: '80000-000', required: true, error: errors.zipCode, colSpan: 2 })}
      </div>
    </div>`;
}

// cria os botões de navegação das páginas (com "..." se houverem muitas páginas).
function buildPaginationHtml(currentPage, totalPages, callbackName) {
  if (totalPages <= 1) return '';
  const range = [1];
  if (currentPage > 3) range.push('…');
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) range.push(page);
  if (currentPage < totalPages - 2) range.push('…');
  if (totalPages > 1) range.push(totalPages);

  const buttons = range.map(page =>
    page === '…'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${page === currentPage ? 'active' : ''}" onclick="${callbackName}(${page})">${page}</button>`
  ).join('');

  return `
    <div class="pagination-wrap">
      <button class="page-btn arrow" onclick="${callbackName}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${buttons}
      <button class="page-btn arrow" onclick="${callbackName}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
      <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
    </div>`;
}

// COMUNICAÇÃO COM A API

// um wrapper em volta do fetch para facilitar o tratamento de erros e conversões de JSON.
async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(data.error || response.statusText);
    return data;
  } catch (err) {
    if (err.message.includes('JSON')) throw new Error(`Erro do servidor (${response.status})`);
    throw err;
  }
}

// pega os dados do formulário e traduz para os nomes que a API espera.
function mapBookFormToApi(form) {
  return {
    nome: form.title.trim(),
    descricao: form.description,
    estoque: Number(form.stock),
    preco: Number(form.price),
    status: form.status,
    idCategoria: form.categoryId || null,
  };
}

// UTILITÁRIOS VISUAIS (toast, ou notifação, e modais)

let toastTimer = null;
// mostra o alerta que some sozinho (toast).
function showToast(message, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = type;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}
window.showToast = showToast;

let confirmCallback = null;
// mostra um popup pedindo confirmação do usuário (ex: antes de deletar algo).
function showConfirm(message, callback) {
  document.getElementById('confirm-msg').textContent = message;
  document.getElementById('confirm-overlay').classList.add('open');
  confirmCallback = callback;
}

// ESTADO GLOBAL (STATE)

// guarda o estado atual do app. a conta logada, página atual, etc.
const State = {
  currentUser: null,
  viewMode: 'client', // admin ou client
  activeTab: 'livros', // livros ou usuários

  allBooks: [],
  allUsers: [],
  selectedBook: null,
  selectedUser: null,
  reloadCallback: null,

  // controle de paginação
  booksPage: 1,
  booksPerPage: 12,
  usersPage: 1,
  usersPerPage: 10,

  // formulário de edição de livro (usado na tela de detalhes)
  bookEditForm: { title: '', description: '', price: '', stock: '', status: 'active', categoryId: '', author: '' },
  bookEditErrors: {},
  bookEditCoverFile: null,
  isEditingBook: false,

  // formulário de edição de usuário
  userEditForm: { name: '', email: '', phone: '', role: 'client', street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
  userEditErrors: {},
  isEditingUser: false,

  // cadastro de novo livro
  newBookForm: { title: '', description: '', price: '', stock: '', status: 'active', categoryId: '', author: '' },
  newBookFormErrors: {},
  newBookCoverFile: null,

  // cadastro de novo usuário
  newUserForm: { name: '', email: '', password: '', phone: '', role: 'client', street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
  newUserFormErrors: {},
};

// CONTROLADOR (APP)

// o controlador reage ao usuário e atualiza a tela.
const App = {

  // tenta puxar a sessão salva. se der bom, abre o app, se não, pede login.
  init() {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        State.currentUser = JSON.parse(saved);
        State.viewMode = State.currentUser.role === 'admin' ? 'admin' : 'client';
      }
    } catch { 
      // erro
    }

    State.currentUser ? this.showApp() : this.showLogin('login');
  },

  // login e cadastro
  showLogin(mode) {
    document.getElementById('login-page').style.display = '';
    document.getElementById('app-shell').style.display = 'none';
    this._renderLoginForm(mode);
  },

  // renderiza o formulario de login
  _renderLoginForm(mode) {
    document.getElementById('login-heading').textContent = mode === 'login' ? 'Bem-vindo' : 'Criar conta';
    document.getElementById('server-msg').style.display = 'none';
    const isRegister = mode === 'register';
    
    document.getElementById('login-box').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        ${isRegister ? buildField({ label: 'Nome completo', name: 'name', placeholder: 'João Silva', required: true, colSpan: 2 }) : ''}
        ${buildField({ label: 'E-mail', name: 'email', type: 'email', placeholder: 'joao@email.com', required: true, colSpan: 2 })}
        ${buildField({ label: 'Senha', name: 'password', type: 'password', placeholder: '••••••', required: true, colSpan: 2 })}
        ${isRegister ? `
          ${buildField({ label: 'Telefone', name: 'phone', placeholder: '(41) 99999-9999', colSpan: 2 })}
          <div style="grid-column:span 2">${addressFieldsHtml()}</div>
        ` : ''}
        <div style="grid-column:span 2;margin-top:4px">
          <button class="btn-lib btn-primary-lib full" id="login-submit-btn" onclick="App.submitLogin('${mode}')">
            ${mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </div>`;

    document.getElementById('login-toggle-row').innerHTML =
      (mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? ') +
      `<button class="login-toggle" onclick="App.showLogin('${mode === 'login' ? 'register' : 'login'}')">
        ${mode === 'login' ? 'Cadastre-se' : 'Entrar'}
      </button>`;
  },

  // conclui o login (envia o formulário)
  async submitLogin(mode) {
    const box = document.getElementById('login-box');
    const formData = {};
    box.querySelectorAll('[name]').forEach(input => { formData[input.name] = input.value; });

    const fields = mode === 'login'
      ? ['email', 'password']
      : ['name', 'email', 'password', 'phone', 'street', 'city', 'state', 'zipCode'];

    const errors = runValidation(fields, formData);
    if (Object.keys(errors).length) {
      fields.forEach(field => {
        const input = box.querySelector(`[name="${field}"]`);
        if (!input) return;
        const parent = input.closest('div');
        parent.querySelector('.field-error')?.remove();
        if (errors[field]) {
          input.classList.add('err');
          parent.querySelector('.field-label')?.classList.add('error');
          const errEl = document.createElement('page');
          errEl.className = 'field-error';
          errEl.textContent = '⚠ ' + errors[field];
          input.before(errEl);
        }
      });
      return;
    }

    const btn = document.getElementById('login-submit-btn');
    btn.disabled = true; btn.textContent = '…';
    try {
      if (mode === 'login') {
        const { user } = await apiFetch(`${API_BASE}/users/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
        });
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        State.currentUser = user;
        State.viewMode = user.role === 'admin' ? 'admin' : 'client';
        this.showApp();
      } else {
        await apiFetch(`${API_BASE}/users/clientes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.name.trim(), email: formData.email.trim(),
            password: formData.password, telefone: formData.phone,
            endereco: { rua: formData.street.trim(), numero: formData.number, bairro: formData.neighborhood, cidade: formData.city.trim(), estado: formData.state.trim(), cep: formData.zipCode.trim() }
          }),
        });
        this._showServerMsg('Cadastro realizado! Faça login.', true);
        this.showLogin('login');
      }
    } catch (err) {
      btn.disabled = false; btn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
      this._showServerMsg(err.message, false);
    }
  },

  // mostra mensagem
  _showServerMsg(message, isSuccess) {
    const el = document.getElementById('server-msg');
    el.className = 'server-msg ' + (isSuccess ? 'ok' : 'err');
    el.textContent = message;
    el.style.display = '';
  },

  // desconectar
  logout() {
    localStorage.removeItem(SESSION_KEY);
    State.currentUser = null; State.viewMode = 'client';
    this.showLogin('login');
  },

  // carrega o app
  showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-shell').style.display = '';
    this._renderHeader();
    this.goList();
    this.loadBooks();
  },

  // carrega o header (barra no topo da tela)
  _renderHeader() {
    const user = State.currentUser;
    const isAdmin = user.role === 'admin';
    const inAdmin = isAdmin && State.viewMode === 'admin';

    document.getElementById('admin-badge').style.display = inAdmin ? '' : 'none';
    document.getElementById('main-nav').style.display = inAdmin ? '' : 'none';

    document.getElementById('user-chip-wrap').innerHTML = `
      <button class="chip-btn" onclick="App.toggleChip()">
        <div class="chip-avatar">${user.name?.charAt(0).toUpperCase()}</div>
        <span class="chip-name">${escapeHtml(user.name)}</span>
        ${isAdmin ? tagHtml('admin', '#ff9f43') : ''}
      </button>
      <div class="chip-dropdown" id="chip-dd">
        <div class="chip-dd-header">
          <div class="name">${escapeHtml(user.name)}</div>
          <div class="email">${escapeHtml(user.email)}</div>
        </div>
        ${isAdmin ? `
          <button class="chip-dd-btn switch" onclick="App.toggleViewMode()">
            ${inAdmin ? '👁 Ver como cliente' : '⚙ Painel admin'}
          </button>` : ''}
        <button class="chip-dd-btn logout" onclick="App.logout()">Sair</button>
      </div>`;

    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.activeTab = btn.dataset.tab;
        this.goList();
        State.activeTab === 'livros' ? this.loadBooks() : this.loadUsers();
      };
    });

    document.querySelectorAll('.nav-tab-mobile').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.nav-tab-mobile').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === btn.dataset.tab));
        btn.classList.add('active');
        State.activeTab = btn.dataset.tab;
        document.getElementById('mobile-nav-drawer').classList.remove('open');
        this.goList();
        State.activeTab === 'livros' ? this.loadBooks() : this.loadUsers();
      };
    });
  },

  toggleChip() {
    document.getElementById('chip-dd')?.classList.toggle('open');
  },

  toggleViewMode() {
    State.viewMode = State.viewMode === 'admin' ? 'client' : 'admin';
    State.activeTab = 'livros';
    document.getElementById('chip-dd')?.classList.remove('open');
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === 'livros');
    });
    this._renderHeader();
    this.goList();
    this.loadBooks();
  },

  // navegação entre páginas internas (estilo SPA)

  _showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goList() {
    this._showPage('page-list');
    const inAdmin = State.currentUser?.role === 'admin' && State.viewMode === 'admin';

    document.getElementById('books-section').style.display =
      (State.viewMode === 'client' || State.activeTab === 'livros') ? '' : 'none';
    document.getElementById('users-section').style.display =
      (inAdmin && State.activeTab === 'usuarios') ? '' : 'none';

    // admins precisam ver o filtro de status (porque podem ver livros inativos)
    const statusFilter = document.getElementById('books-status-filter');
    if (statusFilter) statusFilter.style.display = inAdmin ? '' : 'none';

    document.getElementById('books-admin-bar').style.display = inAdmin ? '' : 'none';
  },

  toggleHamburger() {
    document.getElementById('mobile-nav-drawer')?.classList.toggle('open');
  },

  goCreate(section) {
    if (section === 'livros') {
      State.newBookForm = { title: '', description: '', price: '', stock: '', status: 'active', categoryId: '', author: '' };
      State.newBookFormErrors = {};
      State.newBookCoverFile = null;
      this._renderCreateBook();
      this._showPage('page-create-book');
    } else {
      State.newUserForm = { name: '', email: '', password: '', phone: '', role: 'client', street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' };
      State.newUserFormErrors = {};
      this._renderCreateUser();
      this._showPage('page-create-user');
    }
  },

  // gestão de livros

  async loadBooks() {
    document.getElementById('books-loading').style.display = 'flex';
    document.getElementById('books-grid').style.display = 'none';
    document.getElementById('books-empty').style.display = 'none';
    try {
      State.allBooks = await apiFetch(`${API_BASE}/products/produtos`);
      this.renderBookGrid();
    } catch { 
      // erro
    }
    document.getElementById('books-loading').style.display = 'none';
  },

  _getBookFilters() {
    return {
      search: document.getElementById('books-search')?.value.trim() || '',
      status: document.getElementById('books-status-filter')?.value || '',
      minPrice: document.getElementById('books-min-price')?.value || '',
      maxPrice: document.getElementById('books-max-price')?.value || '',
      sortBy: document.getElementById('books-sort')?.value || 'name_asc',
    };
  },

  _applyBookFilters(books) {
    const { search, status, minPrice, maxPrice, sortBy } = this._getBookFilters();
    const inAdmin = State.currentUser?.role === 'admin' && State.viewMode === 'admin';

    let result = books.filter(book => {
      // se for cliente, não deixa ver os livros inativos
      if (!inAdmin && book.status !== 'active') return false;
      if (search && !book.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (status && book.status !== status) return false;
      if (minPrice !== '' && Number(book.price) < Number(minPrice)) return false;
      if (maxPrice !== '' && Number(book.price) > Number(maxPrice)) return false;
      return true;
    });

    const collator = new Intl.Collator('pt-BR');
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return collator.compare(a.name, b.name);
        case 'name_desc': return collator.compare(b.name, a.name);
        case 'price_asc': return Number(a.price) - Number(b.price);
        case 'price_desc': return Number(b.price) - Number(a.price);
        case 'stock_asc': return Number(a.stock) - Number(b.stock);
        case 'stock_desc': return Number(b.stock) - Number(a.stock);
        default: return 0;
      }
    });
    return result;
  },

  renderBookGrid() {
    const filtered = this._applyBookFilters(State.allBooks);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / State.booksPerPage));
    if (State.booksPage > totalPages) State.booksPage = totalPages;

    const start = (State.booksPage - 1) * State.booksPerPage;
    const pageItems = filtered.slice(start, start + State.booksPerPage);

    const gridEl = document.getElementById('books-grid');
    const emptyEl = document.getElementById('books-empty');
    const emptyMsgEl = document.getElementById('books-empty-msg');
    const emptyClearEl = document.getElementById('books-empty-clear');
    const countEl = document.getElementById('books-results-count');
    const paginationEl = document.getElementById('books-pagination');

    countEl.textContent = `${total} ${total === 1 ? 'livro' : 'livros'}`;

    const hasFilters = this._hasActiveBookFilters();
    document.getElementById('books-clear-btn').style.display = hasFilters ? '' : 'none';

    if (!pageItems.length) {
      gridEl.style.display = 'none';
      emptyEl.style.display = '';
      emptyMsgEl.textContent = hasFilters
        ? 'Nenhum livro encontrado com os filtros aplicados.'
        : 'Nenhum livro cadastrado.';
      if (emptyClearEl) emptyClearEl.style.display = hasFilters ? '' : 'none';
      paginationEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';
    gridEl.style.display = '';
    const inAdmin = State.currentUser?.role === 'admin' && State.viewMode === 'admin';

    gridEl.innerHTML = pageItems.map((book, index) => `
      <div class="book-card" style="animation-delay:${index * .03}s;opacity:${book.status === 'inactive' && !inAdmin ? .4 : 1}" onclick="App.openBook(${book.id})">
        <div class="book-card-img">${coverHtml(book.cover_image, 90)}</div>
        <div class="book-card-body">
          <page class="book-card-title" title="${escapeHtml(book.name)}">${escapeHtml(book.name)}</page>
          <page class="book-card-price" style="color:${Number(book.price) === 0 ? 'var(--blue)' : 'var(--accent)'}">${formatPrice(book.price)}</page>
          <div class="book-card-footer">
            <span class="book-card-stock">${book.stock} unidade${book.stock > 1 || book.stock < 1 ? "s" : ""}</span>
            ${tagHtml(STATUS_LABELS[book.status] ?? book.status, STATUS_COLORS[book.status] ?? '#888')}
          </div>
        </div>
      </div>`).join('');

    paginationEl.innerHTML = buildPaginationHtml(State.booksPage, totalPages, 'App.goBooksPage');
  },

  _hasActiveBookFilters() {
    const f = this._getBookFilters();
    return !!(f.search || f.status || f.minPrice || f.maxPrice || f.sortBy !== 'name_asc');
  },

  onBookFilterChange() { State.booksPage = 1; this.renderBookGrid(); },

  goBooksPage(page) {
    State.booksPage = page;
    this.renderBookGrid();
    document.getElementById('books-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  updateBooksPerPage(value) { State.booksPerPage = Number(value); State.booksPage = 1; this.renderBookGrid(); },

  clearBookFilters() {
    ['books-search', 'books-author-filter', 'books-status-filter', 'books-min-price', 'books-max-price'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const sortEl = document.getElementById('books-sort');
    if (sortEl) sortEl.value = 'name_asc';
    State.booksPage = 1;
    this.renderBookGrid();
  },

  // detalhes do livro

  async openBook(bookId) {
    const book = State.allBooks.find(b => b.id === bookId);
    if (!book) return;
    State.selectedBook = book;
    State.reloadCallback = () => this.loadBooks();
    State.isEditingBook = false;
    State.bookEditCoverFile = null;
    State.bookEditForm = { title: book.name, description: book.description || '', price: String(book.price), stock: String(book.stock), status: book.status, categoryId: book.category_id ?? '', author: '' };
    State.bookEditErrors = {};
    this._showPage('page-book-detail');
    await this._renderBookDetail();
  },

  async _renderBookDetail() {
    const book = State.selectedBook;
    const inAdmin = State.currentUser?.role === 'admin' && State.viewMode === 'admin';
    let authors = [];
    try { authors = await apiFetch(`${API_BASE}/products/produtos/${book.id}/autores`); } catch { /* Se não tiver autores a gente segue a vida */ }
    
    if (!State.bookEditForm.author && authors.length) {
      State.bookEditForm.author = authors.map(a => a.name).join(', ');
    }

    const el = document.getElementById('book-detail-content');

    if (State.isEditingBook && inAdmin) {
      const f = State.bookEditForm; 
      const e = State.bookEditErrors;
      el.innerHTML = `
        <div>
          ${coverHtml(book.cover_image, 180)}
          <label class="cover-upload-label ${State.bookEditCoverFile ? 'has-file' : ''}" id="cover-upload-lbl">
            <input type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="App.onCoverPick(this,'edit')">
            ${State.bookEditCoverFile ? `✓ ${State.bookEditCoverFile.name}` : '+ Nova capa'}
          </label>
        </div>
        <div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px">
            ${buildField({ label: 'Título', name: 'title', value: f.title, placeholder: 'Dom Casmurro', required: true, error: e.title, colSpan: 2 })}
            ${buildField({ label: 'Autor', name: 'author', value: f.author, placeholder: 'Machado de Assis', required: true, error: e.author, colSpan: 2 })}
            ${buildField({ label: 'Descrição', name: 'description', value: f.description, placeholder: 'Sinopse…', as: 'textarea', colSpan: 2 })}
            ${buildField({ label: 'Preço (R$)', name: 'price', value: f.price, placeholder: '0 = GRÁTIS', type: 'number', required: true, error: e.price, hint: !e.price && f.price !== '' ? formatPrice(f.price) : '' })}
            ${buildField({ label: 'Estoque', name: 'stock', value: f.stock, placeholder: '0', type: 'number', required: true, error: e.stock, hint: !e.stock && f.stock !== '' ? `→ ${STATUS_LABELS[deriveStatus(f.stock, f.status)] ?? ''}` : '' })}
            ${buildField({ label: 'ID Categoria', name: 'categoryId', value: f.categoryId, placeholder: '0 = Ação, 1 = Fantasia…' })}
            ${buildField({ label: 'Status', name: 'status', value: f.status, as: 'select', options: [
              { value: 'active', label: 'Disponível' },
              { value: 'inactive', label: 'Indisponível' },
              { value: 'out_of_stock', label: 'Esgotado' },
            ]})}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn-lib btn-primary-lib" id="book-save-btn" onclick="App.saveBook()">Salvar alterações</button>
            <button class="btn-lib btn-ghost-lib" onclick="App.cancelBookEdit()">Cancelar</button>
          </div>
        </div>`;
      this._bindForm(el, State.bookEditForm, State.bookEditErrors);
    } else {
      const canBuy = book.status === 'active' && book.stock > 0;
      el.innerHTML = `
        <div>${coverHtml(book.cover_image, 180)}</div>
        <div>
          <page class="detail-author">${authors.map(a => escapeHtml(a.name)).join(', ') || 'Autor desconhecido'}</page>
          <h1 class="detail-title">${escapeHtml(book.name)}</h1>
          ${book.description ? `<page class="detail-desc">${escapeHtml(book.description)}</page>` : ''}
          <div style="display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;align-items:baseline">
            <div>
              <div class="detail-stat-label">Preço</div>
              <div class="detail-stat-val" style="color:${Number(book.price) === 0 ? 'var(--blue)' : 'var(--accent)'}">${formatPrice(book.price)}</div>
            </div>
            <div>
              <div class="detail-stat-label">Estoque</div>
              <div class="detail-stat-val" style="color:${book.stock > 0 ? 'var(--text)' : 'var(--red)'}">${book.stock} un.</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
            ${tagHtml(STATUS_LABELS[book.status] ?? book.status, STATUS_COLORS[book.status] ?? '#888')}
            ${book.category_name ? tagHtml(book.category_name, 'var(--blue)') : ''}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${inAdmin ? `
              <button class="btn-lib btn-primary-lib" onclick="App.startBookEdit()">Editar</button>
              <button class="btn-lib btn-danger-lib" onclick="App.confirmDeleteBook()">Remover</button>
            ` : `
              <button class="btn-lib btn-primary-lib" ${!canBuy ? 'disabled' : ''} onclick="showToast('Funcionalidade de compra em breve!','ok')">
                ${book.status === 'inactive' ? 'Indisponível' : book.stock === 0 ? 'Esgotado' : 'Comprar agora'}
              </button>
            `}
          </div>
        </div>`;
    }
  },

  onCoverPick(input, context) {
    const file = input.files[0];
    if (!file) return;
    if (context === 'edit') {
      State.bookEditCoverFile = file;
      const lbl = document.getElementById('cover-upload-lbl');
      if (lbl) { lbl.classList.add('has-file'); lbl.childNodes[lbl.childNodes.length - 1].textContent = `✓ ${file.name}`; }
    } else {
      State.newBookCoverFile = file;
      const lbl = document.getElementById('new-cover-lbl');
      if (lbl) { lbl.classList.add('has-file'); lbl.querySelector('span').textContent = `✓ ${file.name}`; }
    }
  },

  startBookEdit() { State.isEditingBook = true; this._renderBookDetail(); },
  cancelBookEdit() { State.isEditingBook = false; State.bookEditCoverFile = null; this._renderBookDetail(); },

  async saveBook() {
    const book = State.selectedBook;
    const form = State.bookEditForm;
    const errors = runValidation(['title', 'price', 'stock', 'author'], form);
    
    if (Object.keys(errors).length) { 
      State.bookEditErrors = errors; 
      this._renderBookDetail(); 
      return; 
    }

    const finalStatus = deriveStatus(form.stock, form.status);
    const btn = document.getElementById('book-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    
    try {
      await apiFetch(`${API_BASE}/products/produtos/${book.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mapBookFormToApi(form), status: finalStatus }),
      });
      if (form.author.trim()) {
        await apiFetch(`${API_BASE}/products/autores`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: form.author.trim(), productId: book.id }),
        });
      }
      if (State.bookEditCoverFile) {
        const fd = new FormData(); fd.append('cover', State.bookEditCoverFile);
        await fetch(`${API_BASE}/products/produtos/${book.id}/cover`, { method: 'PUT', body: fd });
      }

      const updatedList = await apiFetch(`${API_BASE}/products/produtos`);
      State.allBooks = updatedList;
      const updated = updatedList.find(b => b.id === book.id);
      if (updated) State.selectedBook = updated;
      
      State.isEditingBook = false; 
      State.bookEditCoverFile = null; 
      State.bookEditErrors = {};
      
      showToast(`"${form.title}" atualizado com sucesso!`, 'ok');
      this._renderBookDetail();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
    }
  },

  confirmDeleteBook() {
    showConfirm(`Remover "${State.selectedBook?.name}"?\nEsta ação não pode ser desfeita.`, async () => {
      try {
        await apiFetch(`${API_BASE}/products/produtos/${State.selectedBook.id}`, { method: 'DELETE' });
        showToast('Livro removido.', 'ok');
        State.reloadCallback?.();
        this.goList();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  // gestão de usuários

  async loadUsers() {
    document.getElementById('users-loading').style.display = 'flex';
    document.getElementById('users-list').style.display = 'none';
    document.getElementById('users-empty').style.display = 'none';
    try {
      State.allUsers = await apiFetch(`${API_BASE}/users/clientes`);
      this.renderUserList();
    } catch { 
      // ignora
    }
    document.getElementById('users-loading').style.display = 'none';
  },

  _getUserFilters() {
    return {
      search: document.getElementById('users-search')?.value.trim() || '',
      role: document.getElementById('users-role-filter')?.value || '',
      status: document.getElementById('users-status-filter')?.value || '',
    };
  },

  _applyUserFilters(users) {
    const { search, role, status } = this._getUserFilters();
    return users.filter(user => {
      if (search && !user.name.toLowerCase().includes(search.toLowerCase()) &&
                   !user.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (role && user.role !== role) return false;
      if (status && String(user.active) !== status) return false;
      return true;
    });
  },

  renderUserList() {
    const filtered = this._applyUserFilters(State.allUsers);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / State.usersPerPage));
    if (State.usersPage > totalPages) State.usersPage = totalPages;

    const start = (State.usersPage - 1) * State.usersPerPage;
    const pageItems = filtered.slice(start, start + State.usersPerPage);

    const listEl = document.getElementById('users-list');
    const emptyEl = document.getElementById('users-empty');
    const emptyClearEl = document.getElementById('users-empty-clear');
    const countEl = document.getElementById('users-results-count');
    const paginationEl = document.getElementById('users-pagination');

    countEl.textContent = `${total} ${total === 1 ? 'usuário' : 'usuários'}`;
    const hasFilters = this._hasActiveUserFilters();
    document.getElementById('users-clear-btn').style.display = hasFilters ? '' : 'none';

    if (!pageItems.length) {
      listEl.style.display = 'none';
      emptyEl.style.display = '';
      if (emptyClearEl) emptyClearEl.style.display = hasFilters ? '' : 'none';
      paginationEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display = '';
    listEl.innerHTML = pageItems.map((user, index) => `
      <div class="user-row" style="animation-delay:${index * .03}s" onclick="App.openUser(${user.id})">
        <div class="user-avatar-sm">${user.name?.charAt(0).toUpperCase()}</div>
        <div style="min-width:0">
          <page class="user-name">${escapeHtml(user.name)}</page>
          <page class="user-email">${escapeHtml(user.email)}</page>
        </div>
        ${tagHtml(ROLE_LABELS[user.role] ?? user.role, user.role === 'admin' ? 'var(--orange)' : 'var(--blue)')}
      </div>`).join('');

    paginationEl.innerHTML = buildPaginationHtml(State.usersPage, totalPages, 'App.goUsersPage');
  },

  _hasActiveUserFilters() {
    const f = this._getUserFilters();
    return !!(f.search || f.role || f.status);
  },

  onUserFilterChange() { State.usersPage = 1; this.renderUserList(); },

  goUsersPage(page) {
    State.usersPage = page;
    this.renderUserList();
    document.getElementById('users-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  updateUsersPerPage(value) { State.usersPerPage = Number(value); State.usersPage = 1; this.renderUserList(); },

  clearUserFilters() {
    ['users-search', 'users-role-filter', 'users-status-filter'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    State.usersPage = 1;
    this.renderUserList();
  },

  // detalhes do usuario

  openUser(userId) {
    const user = State.allUsers.find(u => u.id === userId);
    if (!user) return;
    State.selectedUser = user;
    State.reloadCallback = () => this.loadUsers();
    State.isEditingUser = false;
    State.userEditErrors = {};
    State.userEditForm = { name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'client', street: user.street || '', number: '', neighborhood: '', city: user.city || '', state: '', zipCode: '' };
    this._renderUserDetail();
    this._showPage('page-user-detail');
  },

  _renderUserDetail() {
    const user = State.selectedUser;
    const f = State.userEditForm;
    const e = State.userEditErrors;
    const el = document.getElementById('user-detail-content');
    
    el.innerHTML = `
      <div class="ud-avatar">${user.name?.charAt(0).toUpperCase()}</div>
      <h1 class="ud-title">${escapeHtml(user.name)}</h1>
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
        ${tagHtml(ROLE_LABELS[user.role] ?? user.role, user.role === 'admin' ? 'var(--orange)' : 'var(--blue)')}
      </div>
      ${State.isEditingUser ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;padding:clamp(14px,3vw,20px)">
          ${buildField({ label: 'Nome', name: 'name', value: f.name, placeholder: 'João Silva', required: true, error: e.name, colSpan: 2 })}
          ${buildField({ label: 'E-mail', name: 'email', value: f.email, placeholder: 'joao@email.com', required: true, error: e.email, colSpan: 2, type: 'email' })}
          ${buildField({ label: 'Telefone', name: 'phone', value: f.phone, placeholder: '(41) 99999-9999', error: e.phone })}
          ${buildField({ label: 'Função', name: 'role', value: f.role, as: 'select', options: [
            { value: 'client', label: 'Cliente' },
            { value: 'admin', label: 'Administrador' },
          ]})}
          <div style="grid-column:span 2">${addressFieldsHtml(f, e)}</div>
        </div>
      ` : `
        <div class="info-grid">
          ${[['E-mail', user.email], ['Telefone', user.phone || '—'], ['Cidade', user.city || '—'], ['Rua', user.street || '—']].map(([label, value]) => `
            <div class="info-cell">
              <div class="info-cell-label">${label}</div>
              <div class="info-cell-val">${escapeHtml(value)}</div>
            </div>`).join('')}
        </div>
      `}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${State.isEditingUser ? `
          <button class="btn-lib btn-primary-lib" id="user-save-btn" onclick="App.saveUser()">Salvar alterações</button>
          <button class="btn-lib btn-ghost-lib" onclick="App.cancelUserEdit()">Cancelar</button>
        ` : `
          <button class="btn-lib btn-primary-lib" onclick="App.startUserEdit()">Editar</button>
          <button class="btn-lib btn-danger-lib" onclick="App.confirmDeleteUser()">Remover</button>
        `}
      </div>`;
    if (State.isEditingUser) this._bindForm(el, State.userEditForm, State.userEditErrors);
  },

  startUserEdit() { State.isEditingUser = true; this._renderUserDetail(); },
  cancelUserEdit() { State.isEditingUser = false; this._renderUserDetail(); },

  async saveUser() {
    const form = State.userEditForm;
    const errors = runValidation(['name', 'email', 'phone'], form);
    if (Object.keys(errors).length) { State.userEditErrors = errors; this._renderUserDetail(); return; }
    
    const btn = document.getElementById('user-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    
    try {
      await apiFetch(`${API_BASE}/users/clientes/${State.selectedUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.name.trim(), email: form.email.trim(), telefone: form.phone, role: form.role, rua: form.street, numero: form.number, bairro: form.neighborhood, cidade: form.city, estado: form.state, cep: form.zipCode }),
      });
      State.selectedUser = { ...State.selectedUser, name: form.name.trim(), email: form.email.trim(), phone: form.phone, role: form.role, street: form.street, city: form.city };
      State.isEditingUser = false; 
      State.userEditErrors = {};
      
      showToast(`"${form.name}" atualizado com sucesso!`, 'ok');
      this._renderUserDetail();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
    }
  },

  confirmDeleteUser() {
    showConfirm(`Remover "${State.selectedUser?.name}"?\nEsta ação não pode ser desfeita.`, async () => {
      try {
        await apiFetch(`${API_BASE}/users/clientes/${State.selectedUser.id}`, { method: 'DELETE' });
        showToast('Usuário removido.', 'ok');
        State.reloadCallback?.();
        this.goList();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  // cadastro do novo livro

  _renderCreateBook() {
    const f = State.newBookForm; 
    const e = State.newBookFormErrors;
    document.getElementById('create-book-form').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
        ${buildField({ label: 'Título', name: 'title', value: f.title, placeholder: 'Dom Casmurro', required: true, error: e.title, colSpan: 2 })}
        ${buildField({ label: 'Autor', name: 'author', value: f.author, placeholder: 'Machado de Assis', required: true, error: e.author, colSpan: 2 })}
        ${buildField({ label: 'Descrição', name: 'description', value: f.description, placeholder: 'Sinopse…', as: 'textarea', colSpan: 2 })}
        ${buildField({ label: 'Preço (R$)', name: 'price', value: f.price, placeholder: '0 = GRÁTIS', type: 'number', required: true, error: e.price, hint: !e.price && f.price !== '' ? formatPrice(f.price) : '' })}
        ${buildField({ label: 'Estoque', name: 'stock', value: f.stock, placeholder: '0', type: 'number', required: true, error: e.stock, hint: !e.stock && f.stock !== '' ? `→ ${STATUS_LABELS[deriveStatus(f.stock, f.status)] ?? ''}` : '' })}
        ${buildField({ label: 'ID Categoria', name: 'categoryId', value: f.categoryId, placeholder: '0 = Ação, 1 = Fantasia…' })}
        ${buildField({ label: 'Status', name: 'status', value: f.status, as: 'select', options: [
          { value: 'active', label: 'Disponível' },
          { value: 'inactive', label: 'Indisponível' },
          { value: 'out_of_stock', label: 'Esgotado' },
        ]})}
        <div style="grid-column:span 2">
          <label class="field-label">Capa</label>
          <label class="cover-upload-label" id="new-cover-lbl">
            <input type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="App.onCoverPick(this,'new')">
            <span>${State.newBookCoverFile ? `✓ ${State.newBookCoverFile.name}` : '+ Selecionar imagem'}</span>
          </label>
        </div>
        <div style="grid-column:span 2">
          <button class="btn-lib btn-primary-lib full" id="create-book-btn" onclick="App.submitCreateBook()">Cadastrar livro</button>
        </div>
      </div>`;
    this._bindForm(document.getElementById('create-book-form'), State.newBookForm, State.newBookFormErrors);
  },

  async submitCreateBook() {
    const form = State.newBookForm;
    const errors = runValidation(['title', 'price', 'stock', 'author'], form);
    if (Object.keys(errors).length) { State.newBookFormErrors = errors; this._renderCreateBook(); return; }
    
    const finalStatus = deriveStatus(form.stock, form.status);
    const btn = document.getElementById('create-book-btn');
    btn.disabled = true; btn.textContent = '…';
    
    try {
      await apiFetch(`${API_BASE}/products/produtos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mapBookFormToApi(form), status: finalStatus }),
      });
      const updatedList = await apiFetch(`${API_BASE}/products/produtos`);
      State.allBooks = updatedList;
      const created = updatedList.find(b => b.name === form.title.trim());
      
      if (created) {
        if (form.author.trim()) {
          await apiFetch(`${API_BASE}/products/autores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: form.author.trim(), productId: created.id }) });
        }
        if (State.newBookCoverFile) {
          const fd = new FormData(); fd.append('cover', State.newBookCoverFile);
          await fetch(`${API_BASE}/products/produtos/${created.id}/cover`, { method: 'PUT', body: fd });
        }
      }
      showToast(`"${form.title}" cadastrado com sucesso!`, 'ok');
      this.goList();
      this.renderBookGrid();
    } catch (err) { 
      showToast(err.message, 'error'); 
      btn.disabled = false; 
      btn.textContent = 'Cadastrar livro'; 
    }
  },

  // cadastro de novo usuário

  _renderCreateUser() {
    const f = State.newUserForm; 
    const e = State.newUserFormErrors;
    document.getElementById('create-user-form').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
        ${buildField({ label: 'Nome', name: 'name', value: f.name, placeholder: 'João Silva', required: true, error: e.name, colSpan: 2 })}
        ${buildField({ label: 'E-mail', name: 'email', value: f.email, placeholder: 'joao@email.com', required: true, error: e.email, type: 'email' })}
        ${buildField({ label: 'Senha', name: 'password', value: f.password, placeholder: '••••••', required: true, error: e.password, type: 'password' })}
        ${buildField({ label: 'Telefone', name: 'phone', value: f.phone, placeholder: '(41) 99999-9999', error: e.phone })}
        ${buildField({ label: 'Função', name: 'role', value: f.role, as: 'select', options: [
          { value: 'client', label: 'Cliente' },
          { value: 'admin', label: 'Administrador' },
        ]})}
        <div style="grid-column:span 2">${addressFieldsHtml(f, e)}</div>
        <div style="grid-column:span 2">
          <button class="btn-lib btn-primary-lib full" id="create-user-btn" onclick="App.submitCreateUser()">Cadastrar usuário</button>
        </div>
      </div>`;
    this._bindForm(document.getElementById('create-user-form'), State.newUserForm, State.newUserFormErrors);
  },

  async submitCreateUser() {
    const form = State.newUserForm;
    const errors = runValidation(['name', 'email', 'password', 'phone', 'street', 'city', 'state', 'zipCode'], form);
    if (Object.keys(errors).length) { State.newUserFormErrors = errors; this._renderCreateUser(); return; }
    
    const btn = document.getElementById('create-user-btn');
    btn.disabled = true; btn.textContent = '…';
    
    try {
      await apiFetch(`${API_BASE}/users/clientes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.name.trim(), email: form.email.trim(), password: form.password,
          telefone: form.phone, role: form.role,
          endereco: { rua: form.street.trim(), numero: form.number, bairro: form.neighborhood, cidade: form.city.trim(), estado: form.state.trim(), cep: form.zipCode.trim() }
        }),
      });
      showToast(`"${form.name}" cadastrado com sucesso!`, 'ok');
      this.goList();
      this.loadUsers();
    } catch (err) { 
      showToast(err.message, 'error'); 
      btn.disabled = false; 
      btn.textContent = 'Cadastrar usuário'; 
    }
  },

  // Sincronização Dinâmica dos Formulários

  // fica de olho no que o usuário digita para atualizar o objeto e já limpar os erros.
  _bindForm(container, formObject, errorsObject) {
    container.querySelectorAll('[name]').forEach(input => {
      input.addEventListener('input', () => {
        formObject[input.name] = input.value;

        // se mexeu no estoque, já atualiza o status automaticamente
        if (input.name === 'stock' && formObject.status !== undefined) {
          formObject.status = deriveStatus(input.value, formObject.status);
          const statusSelect = container.querySelector('[name="status"]');
          if (statusSelect) statusSelect.value = formObject.status;
        }

        // atualiza o texto de dica embaixo do campo dinamicamente
        if (input.name === 'price' || input.name === 'stock') {
          const hintEl = input.parentElement.querySelector('.field-hint');
          if (hintEl) {
            hintEl.textContent = input.name === 'price'
              ? (input.value !== '' ? formatPrice(input.value) : '')
              : (input.value !== '' ? `→ ${STATUS_LABELS[deriveStatus(input.value, formObject.status)] ?? ''}` : '');
          }
        }

        // se o cara começou a corrigir, já remove a cor vermelha de erro do campo
        if (errorsObject[input.name]) {
          errorsObject[input.name] = null;
          input.classList.remove('err');
          input.closest('div')?.querySelector('.field-label')?.classList.remove('error');
          input.closest('div')?.querySelector('.field-error')?.remove();
        }
      });
    });
  },

  // funções vazias para evitar erros no HTML onde estão sendo chamadas diretamente
  handleInput(input) {},
  blurInput(input) {},

  // função dos modais
  
  confirmYes() {
    document.getElementById('confirm-overlay').classList.remove('open');
    confirmCallback?.();
    confirmCallback = null;
  },
  
  confirmNo() {
    document.getElementById('confirm-overlay').classList.remove('open');
    confirmCallback = null;
  },
};

// EVENTOS GLOBAIS E INICIALIZAÇÃO

document.addEventListener('click', event => {
  const chipWrap = document.getElementById('user-chip-wrap');
  if (chipWrap && !chipWrap.contains(event.target))
    document.getElementById('chip-dd')?.classList.remove('open');

  const drawer = document.getElementById('mobile-nav-drawer');
  const hamburger = document.getElementById('hamburger-btn');
  if (drawer && hamburger && !drawer.contains(event.target) && !hamburger.contains(event.target))
    drawer.classList.remove('open');
});

// dá enter pra logar
document.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const loginBtn = document.getElementById('login-submit-btn');
  if (loginBtn && !loginBtn.disabled) loginBtn.click();
});

// inicializa
App.init();
window.App = App;