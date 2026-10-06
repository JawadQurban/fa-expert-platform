# Deployment — Docker, Nginx, and the Expert Hub containers

**Function:** How Expert Hub is built, shipped and configured per environment.

## Setup / connection

```
Browser → server Nginx → expert-hub-frontend (127.0.0.1:8085) → container Nginx → static React build
                       → expert-hub-api      (127.0.0.1:8086) → ASP.NET Core → SQL Server
```

- Assets: `deploy/` — `Dockerfile` (frontend), `api.Dockerfile`,
  `nginx.conf` (in-container), `server-nginx.example.conf` (the host's),
  `docker-compose.yml`, `config.js.template`, `docker-entrypoint.sh`, and
  `scripts/{build,deploy,rollback,verify}-expert-hub.sh`.
- Build context is the repository root, because the image needs `frontend/` and
  `deploy/` together.
- Environment values: `deploy/env/{local,development,uat,production}.env`.
  Secrets live in the **uncommitted** `env/api.secrets.env` (git-ignored; see its
  `.example`), passed as a second `--env-file`.
- SQL Server for the testing stack is opt-in: `--profile db`.

## Conventions

- **One image per environment, configured at runtime.** The frontend's
  `config.js` is rendered from `config.js.template` at container start into
  `window.__EXPERT_HUB_RUNTIME_CONFIG__`. Never bake an environment value into
  the build.
- **The base path is centralised** in `EXPERT_HUB_BASE_PATH`
  (`VITE_EXPERT_HUB_BASE_PATH`, default `/expert-hub`, `''` for root) and mirrored
  by Vite's `base`. Never hardcode `/expert-hub` anywhere else.
- **Browser-visible config holds no secret.** The frontend knows only the API
  base URL; FAST, MTM, ERP and SQL values live in the API's environment.
- Containers bind to `127.0.0.1` only; the server Nginx is the sole public entry.
  `no-new-privileges` is set and the images run as non-root.
- A deployment rebuilds and replaces **only** the Expert Hub containers. Never a
  repo-wide `docker compose down` or `docker system prune`.

## Gotchas

- ⚠️ **Two named volumes must survive a redeploy:** the data-protection keys
  (`/home/app/.aspnet/DataProtection-Keys`) — lose them and every session cookie
  is invalid — and the uploaded documents (`Documents__RootPath`, default
  `/var/expert-hub/documents`). Written anywhere else, every uploaded CV is lost
  with the container. Back the documents up with the database.
- ⚠️ **Nginx defaults to a 1 MB body.** Attachment rules allow more, and Kestrel
  and the form reader are both set to 25 MB — so `client_max_body_size` must be
  raised in the server Nginx too, or the upload the product invites is refused.
- The API applies EF migrations at startup when `Database__AutoMigrate` is on
  (compose default). With more than one replica, run migrations explicitly
  instead.
- `EXPERT_HUB_OIDC_SCOPES` reaching the frontend changes nothing: since the OIDC
  flow moved into the API, the scopes that matter are the API's `Oidc__Scopes`.
