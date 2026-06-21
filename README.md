# Nasci pra Deus — Plataforma de Ministérios

Plataforma web para gestão de ministérios da igreja "Nasci pra Deus".

## Stack
- **Next.js 16** (App Router, TypeScript)
- **Tailwind v4** + **shadcn/ui** (BaseUI)
- **Supabase** (Auth, Postgres, Realtime, Storage) — projeto: `imfneeqmfocjidghutbl` (sa-east-1)
- **@dnd-kit** para o kanban

## Setup local

1. Variáveis de ambiente (`.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...      # já preenchido
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... # já preenchido
   SUPABASE_SERVICE_ROLE_KEY=...     # **PEGAR NO DASHBOARD** (Settings → API)
   ```

2. Criar o primeiro master no Supabase Dashboard:
   - **Authentication → Users → Add user** (email + senha)
   - **Table Editor → profiles** — mudar `role` desse usuário para `master`

3. Rodar localmente:
   ```bash
   npm run dev
   ```

## Rotas

| Rota | Quem acessa | Função |
|------|-------------|--------|
| `/login` | público | login email/senha |
| `/` | autenticado | redireciona pra ministério ou admin |
| `/admin/usuarios` | master | CRUD de usuários + atribuição de ministérios |
| `/[slug]/cadastro` | público | formulário mobile-first de contato (QR code) |
| `/[slug]/pessoas` | líderes do ministério + master | lista + kanban |
| `/[slug]/cronometro/controle` | líderes do ministério + master | painel de controle |
| `/[slug]/cronometro/apresentacao` | público | tela fullscreen pra projeção |

Slugs iniciais: `role-up`, `we-go`, `npdp`.

## Modelo de dados

- `profiles` (perfil + role: `lider`/`master`)
- `ministerios` (lista global)
- `ministerio_membros` (N:N profile ↔ ministério)
- `kanban_colunas` (globais, ordenadas)
- `contatos` (vinculados a ministério + coluna)
- `cronometro_estado` (1:1 com ministério, estado determinístico via `started_at`)
- `cronometro_imagens` (galeria por ministério, armazenadas em `cronometro-imagens/{ministerio_id}/`)

RLS isola dados por ministério. Helper functions `is_master()` e `is_membro(uuid)` em SECURITY DEFINER.

## Deploy na Vercel

```bash
vercel link
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel deploy --prod
```
