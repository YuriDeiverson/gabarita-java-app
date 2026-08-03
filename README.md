# Gabarita.ai - Sistema de Estudos para Concursos

Sistema inteligente de estudos para concursos públicos com metodologia Pareto 80/20, focado em reta final e otimização de tempo.

## 🏗️ Estrutura do Projeto

Este projeto segue uma arquitetura monorepo profissional com separação clara entre frontend e backend:

```
gabarita.ai/
├── frontend/           # Aplicação React + Vite
│   ├── src/           # Código fonte do frontend
│   ├── src/auth/      # Cliente e sessão do Supabase Auth
│   ├── index.html     # Entry point HTML
│   ├── vite.config.ts # Configuração do Vite
│   ├── tsconfig.json  # Configuração TypeScript
│   └── package.json   # Dependências do frontend
├── backend/           # API Spring Boot + Java 21
│   ├── src/main/java  # Controllers, serviços e segurança JWT
│   ├── src/main/resources/db/migration # Schema PostgreSQL/Flyway
│   ├── .env.example   # Exemplo de variáveis de ambiente
│   └── pom.xml        # Dependências Maven
├── package.json       # Scripts do monorepo
└── README.md          # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### Instalação

Instale todas as dependências de uma vez:

```bash
npm run install:all
```

Ou instale separadamente:

```bash
# Instalar dependências do frontend
cd frontend
npm install

# Instalar dependências do backend
cd ../backend
npm install
```

### Desenvolvimento

Para executar ambos frontend e backend simultaneamente:

```bash
npm run dev
```

Isso iniciará:
- Frontend em http://localhost:3000
- Backend API em http://localhost:3001

Para executar separadamente:

```bash
# Apenas frontend
npm run dev:frontend

# Apenas backend
npm run dev:backend
```

### Build de Produção

```bash
# Build de ambos
npm run build

# Build separado
npm run build:frontend
npm run build:backend
```

## 📡 API Endpoints

### Planos de Estudo
- `GET /api/study-plans` - Listar todos os planos
- `POST /api/study-plans` - Criar novo plano
- `GET /api/study-plans/:id` - Buscar plano específico
- `PUT /api/study-plans/:id` - Atualizar plano
- `DELETE /api/study-plans/:id` - Excluir plano
- `PATCH /api/study-plans/:id/activate` - Ativar plano
- `GET /api/study-plans/active/current` - Buscar plano ativo

### Progresso do Quiz
- `GET /api/quiz-progress/study-plan/:id` - Buscar progresso
- `POST /api/quiz-progress` - Salvar resposta
- `GET /api/quiz-progress/stats/:id` - Estatísticas

### Cronograma
- `POST /api/schedule/generate` - Gerar cronograma inteligente
- `POST /api/schedule/progress` - Salvar progresso
- `GET /api/schedule/stats/:id` - Estatísticas

## 💾 Banco de Dados e autenticação

O sistema utiliza PostgreSQL/Supabase. O Flyway cria e atualiza o schema automaticamente. O Supabase Auth
realiza cadastro, login, confirmação de e-mail e renovação da sessão; a API Spring valida o JWT antes de
acessar qualquer dado e sempre filtra planos, sessões, simulados e progresso pelo usuário autenticado.

## 🔧 Variáveis de Ambiente

Backend (`backend/.env`):
```env
PORT=3001
DATABASE_URL=jdbc:postgresql://db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DATABASE_USER=postgres
DATABASE_PASSWORD=sua-senha
SUPABASE_URL=https://PROJECT_REF.supabase.co
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

## 🛠️ Tecnologias

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- Lucide Icons

### Backend
- Java 21 e Spring Boot
- Spring Security OAuth2 Resource Server
- PostgreSQL/Supabase
- Flyway

## 📝 Funcionalidades

- ✅ CRUD completo de planos de estudo
- ✅ Geração inteligente de cronograma baseado em horas/dias disponíveis
- ✅ Persistência de questões respondidas
- ✅ Progresso do cronograma em tempo real
- ✅ Metodologia Pareto 80/20 para otimização de estudos
- ✅ Suporte a múltiplos concursos
