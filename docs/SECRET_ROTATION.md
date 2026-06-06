# Manual Credential Rotation

Use this note before making the repository public or sharing the workspace.

## Rotate These Values

If any local `.env` file may have been exposed, replace the following values in their original providers and then update only your private `.env` files:

| Value | Where to rotate | Used by |
| --- | --- | --- |
| Database credentials | MySQL user management | Backend database connection |
| JWT signing key | Generate a new strong base64 key | Backend JWT creation and validation |
| Google OAuth client credentials | Google Cloud Console | Google login |
| Gmail app password | Google Account app passwords | Order email sending |

## Repository Rules

- Do not commit real `.env` files.
- Keep only `.env.example` files in Git.
- Treat any shared local `.env` value as exposed and replace it manually.
- After replacing values, restart the backend and frontend so they read the new environment.
- Backend startup requires sensitive values such as `DB_PASSWORD` and `JWT_BASE64_SECRET` to be provided through a private environment source.

## Quick Checks

```bash
git ls-files | rg "(^|/)\\.env(\\.local)?$"
git status --short
```

The first command should print nothing for real `.env` files.
