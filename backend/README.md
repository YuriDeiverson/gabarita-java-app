# Gabarita Java API

Backend principal do Gabarita.ai, construido com Java 21, Spring Boot, PostgreSQL e Flyway.

## Execucao local

Na raiz do repositorio:

```bash
npm run dev
```

O frontend abre em `http://localhost:3000` e encaminha `/api` para a API em `http://localhost:3001`.

Para usar Supabase em desenvolvimento, configure as variaveis do backend antes de rodar `npm run dev`:

```env
DATABASE_URL=jdbc:postgresql://db.xxxxxxxxxxxxx.supabase.co:5432/postgres?sslmode=require
DATABASE_USER=postgres
DATABASE_PASSWORD=sua-senha
CORS_ORIGINS=http://localhost:3000
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

No frontend, configure apenas a URL pública e a publishable key do Supabase Auth:

```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxx
```

O backend valida localmente cada access token pelo endpoint JWKS do projeto. Em projetos antigos que ainda
usam HS256, `SUPABASE_JWT_SECRET` pode ser configurado temporariamente, mas a recomendação é ativar uma
chave assimétrica em Authentication > Signing Keys.

Ao iniciar, o Flyway aplica as migrações disponíveis, atualmente de `V1` a `V13`. A `V7` conecta `auth.users` a `public.users`, instala
o gatilho de perfil e remove o acesso direto das roles `anon` e `authenticated` às tabelas da aplicação.
O navegador usa Supabase somente para autenticação; os dados de estudo passam pela API Spring autenticada.

Se preferir rodar com Docker e PostgreSQL local:

```bash
npm run dev:backend:docker
npm run dev:frontend
```

Verificacao:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/actuator/health
```

## Deploy no Railway

1. Crie um novo projeto no Railway e conecte este repositorio.
2. Crie um servico para o backend.
3. Configure o root directory do servico como `backend`.
4. Adicione um banco PostgreSQL pelo Railway.
5. Garanta que a variavel `DATABASE_URL` do PostgreSQL esteja disponivel no servico do backend.
6. Configure `CORS_ORIGINS` com a URL publica do frontend React.

Exemplo de variaveis no backend:

```env
CORS_ORIGINS=https://seu-frontend.vercel.app
```

O Railway fornece `PORT` automaticamente. O app tambem aceita `DATABASE_URL` tanto no formato `postgresql://...` do Railway quanto no formato JDBC `jdbc:postgresql://...`.

Depois do deploy, teste:

```bash
curl https://seu-backend.up.railway.app/api/health
curl https://seu-backend.up.railway.app/actuator/health
```

## Conectar com o frontend React

No ambiente de producao do frontend, configure:

```env
VITE_API_URL=https://seu-backend.up.railway.app/api
```

Em desenvolvimento local, mantenha:

```env
VITE_API_URL=/api
```

O Vite faz proxy de `/api` para `http://localhost:3001` durante o desenvolvimento.

## Variaveis

- `DATABASE_URL`: URL do PostgreSQL. No Railway, normalmente vem do servico PostgreSQL.
- `DATABASE_USER`: usuario do banco, opcional quando `DATABASE_URL` ja contem credenciais.
- `DATABASE_PASSWORD`: senha do banco, opcional quando `DATABASE_URL` ja contem credenciais.
- `CORS_ORIGINS`: origens permitidas para o frontend, separadas por virgula.
- `PORT`: porta HTTP. Padrao local: `3001`.
- `SUPABASE_URL`: URL pública do projeto, usada como issuer do JWT.
- `SUPABASE_JWKS_URL`: endpoint JWKS opcional; por padrão é derivado de `SUPABASE_URL`.
- `SUPABASE_JWT_SECRET`: compatibilidade opcional com tokens HS256 legados; nunca exponha no frontend.

## APIs implementadas

- `/api/study-plans`: criacao, edicao, exclusao, duplicacao, arquivamento, ativacao e historico.
- `/api/schedule`: geracao, regeneracao, progresso e estatisticas do cronograma.
- `/api/questions`: leitura para o simulador e importacao das questoes legadas.
- `/api/quiz-progress`: compatibilidade com o simulador atual.
- `/api/simulations`: simulados persistentes, pausa, continuacao, respostas e conclusao.
- `/api/analytics/dashboard?days=30`: aproveitamento, evolucao diaria, pontos fortes, pontos fracos e recomendacao de estudo.

## Persistencia e modo offline

O PostgreSQL e a fonte principal. O frontend mantem uma copia no `localStorage` para carregamento imediato e tolerancia a falhas de conexao.
