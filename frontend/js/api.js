// Comunicação com o backend

// um wrapper em volta do fetch para facilitar o tratamento de erros e conversões de JSON.
export async function apiFetch(url, options = {}) {
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
export function mapBookFormToApi(form) {
  return {
    nome: form.title.trim(),
    descricao: form.description,
    estoque: Number(form.stock),
    preco: Number(form.price),
    status: form.status,
    idCategoria: form.categoryId || null,
  };
}