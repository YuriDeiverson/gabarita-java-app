# Gabarita Java API

Backend principal do Gabarita.ai, construído com Java 21, Spring Boot, PostgreSQL e Flyway.

## Execução

Na raiz do repositório:

```bash
docker compose up -d --build
npm run dev:frontend
```

O frontend abre em `http://localhost:3000` e encaminha `/api` para a API em `http://localhost:3001`.

Verificação:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/actuator/health
```

## Variáveis

- `DATABASE_URL`: URL JDBC do PostgreSQL.
- `DATABASE_USER`: usuário do banco.
- `DATABASE_PASSWORD`: senha do banco.
- `CORS_ORIGINS`: origens permitidas, separadas por vírgula.
- `PORT`: porta HTTP, padrão `3001`.

## APIs implementadas

- `/api/study-plans`: criação, edição, exclusão, duplicação, arquivamento, ativação e histórico.
- `/api/schedule`: geração, regeneração, progresso e estatísticas do cronograma.
- `/api/questions`: leitura para o simulador e importação das questões legadas. Operações administrativas foram removidas da API pública até a implementação de autenticação e autorização.
  - `GET /api/questions/course/{courseId}` fornece o formato otimizado consumido pelo simulador.
- `/api/quiz-progress`: compatibilidade com o simulador atual.
- `/api/simulations`: simulados persistentes, pausa, continuação, respostas e conclusão.
- `/api/analytics/dashboard?days=30`: aproveitamento, evolução diária, pontos fortes, pontos fracos e recomendação de estudo. Não utiliza tempo por questão.

## Persistência e modo offline

O PostgreSQL é a fonte principal. O frontend mantém uma cópia no `localStorage` para carregamento imediato e tolerância a falhas de conexão. Ao abrir o cronograma ou simulado, o progresso remoto é mesclado ao cache local.

## Estado atual

O frontend salva planos, progresso e respostas no Java, carrega o simulado diretamente do PostgreSQL e possui telas para gerenciamento de planos e análise de desempenho por assunto. O `localStorage` permanece como fallback offline.
