# Documentação do Projeto: Sistema de Gestão de Biblioteca

Este repositório contém o código de um sistema de gerenciamento de uma biblioteca e controle de usuários. O projeto foi desenvolvido com foco na modularização de código, segurança de dados e interface responsiva.

## 1. Visão Geral
O sistema permite a administração completa de uma biblioteca digital. Através de uma interface intuitiva, é possível gerenciar o inventário de livros, controlar níveis de estoque, processar preços e administrar permissões de usuários. A aplicação foi construída utilizando uma arquitetura que separa a lógica de interface da lógica de servidor, facilitando a manutenção futura.

## 2. Equipe de Desenvolvimento
A execução do projeto foi dividida em três pessoas, cada um sob responsabilidade de um integrante:

* **Carlos (Desenvolvimento Backend):** Responsável pelo desenvolvimento da API RESTful, criação das rotas de autenticação, implementação de middlewares de segurança e processamento da lógica de negócio no servidor.
* **Lucas (Desenvolvimento Frontend):** Responsável pela arquitetura da interface do usuário (UI), implementação do sistema de design via CSS moderno (variáveis e grid), lógica de navegação entre páginas e integração com os serviços de API.
* **Gean (Arquitetura de Dados):** Responsável pela modelagem do banco de dados, estruturação das tabelas, definição de relacionamentos entre dados e otimização das consultas para garantir integridade e performance.

## 3. Especificações Técnicas
* **Frontend:** JavaScript, HTML e CSS com utilização do Bootstrap.
* **Backend:** Middlewares como Express, Cors e Path.

## 4. Estrutura de Instalação e Execução

### Pré-requisitos
* Node.js instalado.
* Gerenciador de pacotes NPM.

### Procedimentos
1.  **Clonagem do Repositório:**
    ```bash
    git clone https://github.com/usuario/projeto-biblioteca.git
    ```
2.  **Instalação de Dependências:**
    ```bash
    npm install
    ```
3.  **Configuração de Ambiente:**
    No arquivo `main.js`, defina as variaveis necessárias. `API_BASE`, `IMG_BASE`, `SESSION_KEY`
4.  **Inicialização do Backend:**
    ```bash
    cd backend
    node server.js
    ```
    4.  **Inicialização do Frontend:**
    Utilize uma extensão como a FiveServer ou LiveServer do VSCode para rodar o frontend.

## 5. Considerações Finais
Este projeto foi elaborado durante um projeto do SENAI com o professor Lucas, buscando aplicar conceitos de desenvolvimento Full Stack, versionamento de código e colaboração em equipe dentro de padrões técnicos de mercado.