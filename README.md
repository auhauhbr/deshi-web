# DESHI Web

Aplicação web da DESHI, plataforma para profissionais independentes de atividades físicas e seus alunos. O profissional gerencia alunos, modalidades, atividades e programas de treino; o aluno acompanha os programas, registra sessões e consulta seu histórico e evolução.

## Tecnologias

- React 19 e Vite 8
- React Router para navegação
- Axios para chamadas à API
- CSS com tokens em `src/styles/variables.css`, incluindo tema claro e escuro
- Three.js para a cena animada da home do aluno
- Componentes de interface em `src/components/`, incluindo Kokonut UI e React Bits
- Oxlint

## Requisitos

- Node.js 22 LTS
- npm
- A API DESHI em execução local ou publicada

## Instalar e executar

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

O Vite mostra os endereços local e de rede ao iniciar. Para abrir no celular, conecte-o à mesma rede Wi-Fi e acesse o endereço `Network` exibido pelo Vite. O servidor está configurado para aceitar conexões da rede local.

Por padrão, a API usa o mesmo hostname do frontend na porta `3030`. Para apontar a aplicação para outra API, preencha `VITE_API_URL` no `.env` com a origem completa, sem acrescentar um caminho de rota:

```env
VITE_API_URL=https://sua-api.vercel.app
```

Depois de alterar variáveis `VITE_*`, reinicie o servidor Vite. Para desenvolvimento local sem configuração adicional, deixe `VITE_API_URL` vazio.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite. |
| `npm run build` | Gera os arquivos de produção em `dist/`. |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | Executa o Oxlint. |

## Funcionalidades

### Área do profissional

- Home com atividade recente, sessões em andamento e indicadores da equipe.
- Gerenciamento de alunos, convites e perfis individuais.
- Biblioteca de exercícios padrão e personalizados.
- Criação e edição de atividades e programas de treino.
- Visualização de sessões e comentários registrados pelos alunos.
- Perfil profissional e seleção de modalidades.

### Área do aluno

- Home com recomendação de treino, resumo semanal e sessões recentes.
- Visualização dos programas recebidos e retomada de uma sessão em andamento.
- Execução de atividades por séries ou rounds, com descanso e registro de resultados.
- Histórico, vínculos com profissionais e perfil com medidas corporais e evolução.

A rota `/home` escolhe a home correspondente ao perfil autenticado. As rotas internas protegem as páginas e as áreas específicas de cada perfil.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Públicas | `/`, `/login`, `/cadastro`, `/sessao-expirada` |
| Aluno | `/home`, `/sessions/start`, `/sessions/completed`, `/sessions/:sessionId`, `/profile`, `/invites/accept` |
| Profissional | `/home`, `/alunos`, `/alunos/:studentId`, `/biblioteca`, `/atividades`, `/perfil`, `/modalidades` |

As rotas de criação/edição de programas, atividades e execução de sessões usam parâmetros de URL adicionais. Consulte `src/routes.jsx` para a lista completa.

## Organização do código

```text
src/
├── components/       # Componentes compartilhados e navegação
├── hooks/            # Hooks reutilizáveis
├── pages/             # Páginas agrupadas por área, cada uma com JSX e CSS
├── services/          # Cliente Axios e serviços por domínio
├── styles/            # Variáveis de design, incluindo os temas
├── utils/             # Funções auxiliares
├── routes.jsx         # Rotas e proteção por perfil
└── main.jsx           # Inicialização do React
```

O cliente HTTP fica em `src/services/api.js`. Ele adiciona o token de sessão às chamadas autenticadas, controla a tela global de carregamento e encaminha sessões expiradas para o fluxo correspondente. As páginas que precisam de carregamento local podem optar por não acionar a tela global.

## Build e publicação

O frontend pode ser publicado em serviços estáticos, como Vercel. Configure `VITE_API_URL` no ambiente de build com a origem publicada da API. No backend, inclua a origem publicada do frontend em `FRONTEND_ORIGINS` para permitir as chamadas via CORS.

Para conferir o build localmente:

```bash
npm run build
npm run preview
```

O build grava os arquivos em `dist/`. O projeto atualmente não define um script `npm test`.
