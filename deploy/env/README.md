# `deploy/env/` — the files you edit when FAST replies

One file per environment. They are the **only** thing that changes when the FAST
team issues the OpenID Connect client registration: no rebuild, no code edit, no
new image. The container reads them at start, renders `config.js`, and the app
picks the values up at bootstrap.

```
docker compose --env-file deploy/env/production.env up -d
```

| File | Environment |
|---|---|
| `development.env` | Local / dev server |
| `uat.env` | UAT |
| `production.env` | Production |

## ⚠️ Never edit a tracked env file on a server

Every file above is **tracked in git**. A value typed into one on a server is
overwritten by the next `git pull` — or blocks it with a merge conflict, which
is what happened on the testing server on 2026-08-31.

Per-server values belong in **`api.secrets.env`**, which is untracked. Compose
applies `--env-file` in order and the **last file wins**, so anything there
overrides the tracked file and survives every pull:

```bash
echo 'EXPERT_HUB_BOOTSTRAP_ADMINS=you@fa.gov.sa' >> env/api.secrets.env

docker compose --env-file env/local.env --env-file env/api.secrets.env \
  --profile db up -d --build
```

That applies to anything true of one machine rather than of the environment:
the bootstrap administrators, the database password and connection string, and
any future host-specific endpoint.

## ⚠️ There is no client-secret variable, and adding one will stop the container

Everything in these files ends up in `config.js`, which is **served to the
browser**. A secret placed here is a published secret — anyone who opens
developer tools can read it.

If FAST issues a **client secret**, that means they registered Expert Hub as a
*confidential* client, and a confidential client cannot run in a browser at all.
The authorization-code exchange then belongs in the Expert Hub API, which is the
only component that may hold the secret. The entrypoint refuses to start if
`EXPERT_HUB_OIDC_CLIENT_SECRET` is set on this container, so the mistake is loud
rather than silent.

## Filling in the OIDC block

Six values arrive from FAST. Until `EXPERT_HUB_OIDC_CLIENT_ID` is set, the app
stays on its development sign-in placeholder rather than half-attempting a real
login — a partly-configured client fails in ways that look like an outage.

| Variable | Who supplies it | Notes |
|---|---|---|
| `EXPERT_HUB_OIDC_ISSUER` | FAST | The `iss` value; discovery is derived from it |
| `EXPERT_HUB_OIDC_DISCOVERY_URL` | FAST | Only if not at `{issuer}/.well-known/openid-configuration` |
| `EXPERT_HUB_OIDC_CLIENT_ID` | FAST | Public. Travels in the authorize URL by design |
| `EXPERT_HUB_OIDC_SCOPES` | **We ask, FAST grants** | Must include `openid` |
| `EXPERT_HUB_OIDC_REDIRECT_URI` | **We choose, FAST registers** | Must match their registration character for character |
| `EXPERT_HUB_OIDC_POST_LOGOUT_REDIRECT_URI` | **We choose, FAST registers** | Where the browser lands after sign-out |

Four more map the identity provider's claims onto Expert Hub's two access roles.
Their names **and** their values are still open (`G16`/`G28`), which is exactly
why they are configuration: when FAST says which claim carries the role, that is
an edit here and not a release.

| Variable | Notes |
|---|---|
| `EXPERT_HUB_OIDC_ROLE_CLAIM` | e.g. `roles`, `groups`, or a namespaced claim |
| `EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES` | Comma-separated claim values granting staff access |
| `EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES` | Comma-separated claim values granting trainer access |
| `EXPERT_HUB_OIDC_NAME_CLAIM` | Defaults to `name` |

Full handover — including the exact URLs to send FAST and the questions still
outstanding — is in
[`docs/specification/16_SSO_OIDC_CONFIGURATION.md`](../../docs/specification/16_SSO_OIDC_CONFIGURATION.md).
