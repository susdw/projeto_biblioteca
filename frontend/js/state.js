// Estado global da aplicação, utilitários de toast e confirmação.

// ESTADO GLOBAL

// guarda o estado atual do app: conta logada, página atual, etc.
export const State = {
  currentUser: null,
  viewMode: 'client', // 'admin' ou 'client'
  activeTab: 'livros', // 'livros' ou 'usuarios'

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

// TOAST (notificação)

let toastTimer = null;

export function showToast(message, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = type;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// expõe globalmente porque é chamada de dentro de strings HTML geradas dinamicamente
window.showToast = showToast;

// MODAL DE CONFIRMAÇÃO

let confirmCallback = null;

export function showConfirm(message, callback) {
  document.getElementById('confirm-msg').textContent = message;
  document.getElementById('confirm-overlay').classList.add('open');
  confirmCallback = callback;
}

export function confirmYes() {
  document.getElementById('confirm-overlay').classList.remove('open');
  confirmCallback?.();
  confirmCallback = null;
}

export function confirmNo() {
  document.getElementById('confirm-overlay').classList.remove('open');
  confirmCallback = null;
}