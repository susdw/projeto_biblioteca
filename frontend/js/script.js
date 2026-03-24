const api = "http://localhost:3000/livros";

async function listarLivros(){

const resposta = await fetch(api);

const livros = await resposta.json();

const tabela = document.getElementById("listaLivros");

tabela.innerHTML = "";

livros.forEach(livro => {

tabela.innerHTML += `
<tr>

<td>${livro.id}</td>
<td>${livro.titulo}</td>
<td>${livro.autor}</td>
<td>${livro.ano}</td>

<td>

<button class="btn btn-danger" onclick="excluirLivro(${livro.id})">

Excluir

</button>

</td>

</tr>
`;

});

}

async function cadastrarLivro(e){

e.preventDefault();

const titulo = document.getElementById("titulo").value;
const autor = document.getElementById("autor").value;
const ano = document.getElementById("ano").value;

if(titulo === "" || autor === ""){

alert("Preencha todos os campos");

return;

}

await fetch(api,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify({
titulo,
autor,
ano
})

});

alert("Livro cadastrado com sucesso");

}

async function excluirLivro(id){

await fetch(`${api}/${id}`,{

method:"DELETE"

});

alert("Livro removido");

listarLivros();

}

if(document.getElementById("listaLivros")){

listarLivros();

}

if(document.getElementById("formLivro")){

document
.getElementById("formLivro")
.addEventListener("submit", cadastrarLivro);

}