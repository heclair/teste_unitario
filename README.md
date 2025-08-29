# Autenticação com JWT, Redis e Testes de Integração

Este projeto implementa autenticação baseada em **JSON Web Tokens (JWT)** em uma aplicação Node.js/TypeScript, incluindo **controle de logout com blacklist de tokens** utilizando **Redis**, além de **testes de integração automatizados** com Jest, Supertest e Docker.

---

### 📌 Funcionalidades

- Registro e login de usuários.
- Geração e validação de **JWT** com payload customizado.
- Logout com blacklist de tokens armazenada no Redis.
- CRUD de contatos associado ao usuário autenticado.
- Testes automatizados de integração (usuário + contatos).
- Isolamento de ambiente de testes com Docker (Postgres + Redis).

---

### 🛠️ Tecnologias Utilizadas

- **Node.js** + **TypeScript**
- **Express** (servidor HTTP)
- **PostgreSQL** (persistência)
- **Redis** (armazenamento da blacklist)
- **Docker / Docker Compose** (infra isolada para testes)
- **jsonwebtoken** – geração e validação de JWT
- **bcrypt** – hash de senha
- **Jest** – framework de testes
- **Supertest** – simulação de requisições HTTP
- **REST Client (VSCode Extension)** – testes manuais via `requests.http`

---

### 📂 Estrutura de Pastas

```
app/
├── http/
│   └── requests.http        # Requisições prontas para testar a API
├── src/
│   ├── configs/             # Configuração de DB, Redis e comandos.sql
│   ├── controllers/         # Lógica de negócio (users e contacts)
│   ├── middlewares/         # Auth, validação e error handler
│   ├── routes/              # Rotas da API
│   ├── types/               # Tipagens globais e para Express
│   ├── utils/               # Funções auxiliares (JWT)
│   └── index.ts             # App principal
├── tests/
│   ├── controllers/         # Testes de integração (users e contacts)
│   ├── helpers/             # Helpers para testes (testApp, auth)
│   └── jest.setup.ts        # Setup de ambiente de testes
├── .env                     # Variáveis de ambiente (dev)
├── .env.test                # Variáveis de ambiente (testes)
├── docker-compose.test.yml  # Compose com Postgres e Redis para testes
├── package.json
└── tsconfig.json
```

---

### ▶️ Como executar o projeto (modo desenvolvimento)

1. **Clonar o repositório e instalar dependências**
```bash
git clone https://github.com/arleysouza/unit-tests-base.git app
cd app
npm i
```

2. **Configurar o PostgreSQL**
- Crie um BD chamado `bdaula` (ou outro nome).
- Atualize o `.env` com suas credenciais.

3. **Rodar o script de schema**
```bash
psql -U postgres -d bdaula -f src/configs/comandos.sql
```

4. **Subir o Redis (local ou Docker)**
```bash
docker run --name redis -p 6379:6379 -d redis:alpine redis-server --requirepass 123
```
ou
```bash
npm run redis-start
```

5. **Rodar o servidor**
```bash
npm run dev
```

---

### ▶️ Testando a API com REST Client (manual)

O arquivo `/http/requests.http` contém as rotas para:
- Registro
- Login
- Logout
- CRUD de contatos

Abra no VSCode com a extensão **REST Client** e clique em “Send Request”.

---

### ▶️ Executando Testes Automatizados

1. **Subir containers de teste**
```bash
npm run test:up
```

2. **Rodar os testes**
```bash
npm test
```

3. **Parar containers**
```bash
npm run test:stop
```

> Durante os testes:
> - O `jest.setup.ts` conecta no Postgres/Redis de teste.
> - Aplica o `comandos.sql` para garantir que as tabelas existam.
> - Antes/depois de cada teste, executa `TRUNCATE contacts, users RESTART IDENTITY CASCADE` e `redis.flushall()` → garantindo **isolamento total**.

---

### 🔑 Endpoints

- **POST /users** – Registro  
- **POST /users/login** – Login  
- **POST /users/logout** – Logout (token → blacklist Redis)  
- **GET /users/profile** – Perfil do usuário autenticado (novo)  
- **GET /contacts** – Listar contatos do usuário  
- **POST /contacts** – Criar contato  
- **PUT /contacts/:id** – Atualizar contato  
- **DELETE /contacts/:id** – Deletar contato  

---

### ✅ Cenários de Teste Implementados

**Usuário**
- Registro válido
- Impedir inválidos (username curto / senha <6)
- Impedir duplicado
- Login válido retorna JWT
- Login inválido (senha incorreta / usuário inexistente)
- Login com campos ausentes
- Logout invalida token (Redis) e middleware rejeita reuso
- Nova rota `/users/profile` protegida

**Contatos**
- Criar contato válido
- Impedir sem `name`/`phone`
- Impedir `name` curto
- Impedir telefone inválido (regex)
- Listar apenas contatos do usuário logado
- Atualizar contato existente
- Retornar 404 em contato inexistente
- Deletar contato existente
- Retornar 404 ao deletar inexistente

---

👉 Assim, o projeto cobre **todas as histórias funcionais e de testes de integração** pedidas.  
