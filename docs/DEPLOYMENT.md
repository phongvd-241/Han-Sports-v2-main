# Han Sports v2 Deployment Notes

This document covers the lightweight production baseline added for portfolio/demo usage.

## Install Docker On Windows

1. Install Docker Desktop from the official Docker website.
2. During installation, keep the WSL 2 backend enabled.
3. Restart Windows if Docker Desktop asks for it.
4. Open Docker Desktop and wait until the engine status is running.
5. Verify from PowerShell:

```powershell
docker --version
docker compose version
```

## Docker Compose

Copy the root environment template and fill in local values:

```powershell
Copy-Item .env.example .env
```

Required values in `.env` before running:

```bash
DB_PASSWORD=<db_password>
MYSQL_ROOT_PASSWORD=<mysql_root_password>
MYSQL_HOST_PORT=3307
JWT_BASE64_SECRET=<base64_jwt_signing_key>
```

Optional variables:

```bash
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
YOUR_EMAIL=<gmail_address>
YOUR_APP_PASSWORD=<gmail_app_password>
VITE_GOOGLE_CLIENT_ID=<google_client_id>
MANAGEMENT_HEALTH_MAIL_ENABLED=false
```

For local Docker demo, `MANAGEMENT_HEALTH_MAIL_ENABLED=false` keeps `/actuator/health` independent from Gmail credentials. If you want the health endpoint to validate SMTP in a real deployment, set it to `true` and provide valid mail credentials through a secret store. Do not write real secrets in documentation or commit them to Git.

Run:

```powershell
docker compose up --build -d
```

Services:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api/v1` |
| Backend health | `http://localhost:8080/actuator/health` |

Check status:

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost:8080/actuator/health
Invoke-WebRequest -UseBasicParsing http://localhost:5173
```

Stop the stack:

```powershell
docker compose down
```

Do not use volume reset commands during normal development. The Docker database
and uploaded files live in named volumes, so deleting volumes can remove data and
break product images. Read the safety guide first:

```text
docs/DOCKER_VOLUME_SAFETY.md
```

Remove local Docker database/upload volumes only when you intentionally want a
clean reset and have a valid backup package:

```powershell
docker compose down -v
```

If local MySQL already uses port `3306`, keep `MYSQL_HOST_PORT=3307` in `.env`. The backend container still connects to MySQL internally on port `3306`.

## Health Checks

Backend exposes Actuator health and info endpoints:

```text
/actuator/health
/actuator/info
```

Only health is allowed anonymously by Spring Security. Keep other actuator endpoints limited through `MANAGEMENT_ENDPOINTS`.

## CORS

Local development keeps localhost origins enabled by default:

```env
CORS_ALLOW_LOCALHOST=true
```

For production, set:

```env
FRONTEND_URL=https://your-domain.example
CORS_ALLOW_LOCALHOST=false
COOKIE_SECURE=true
```

## CI

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

The pipeline runs:

```bash
cd hansport_v2be && mvn -B test
cd hansport_v2fe && npm ci && npm run lint && npm run build
```

## Database Backup

For Docker Compose local/demo database:

```powershell
.\scripts\backup-mysql.ps1
```

Backups are written to `backups/`, which is ignored by Git. For a complete
database + upload backup package, use:

```powershell
.\scripts\backup-demo-data.ps1
```

The database dump alone is not a complete backup for this project because
product/logo/banner files live in the upload volume. Use the data and media docs
before moving data between local MySQL, Docker MySQL, and upload storage:

```text
docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md
docs/BACKUP_PACKAGE_SPEC.md
docs/DATA_SCRIPT_DESIGN.md
docs/BACKUP_AND_RESTORE.md
docs/DOCKER_VOLUME_REFERENCE.md
docs/SEEDING_POLICY.md
docs/MEDIA_INTEGRITY_CHECK.md
docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md
docs/DEMO_SETUP.md
docs/RESTORE_INTEGRITY_CHECKLIST.md
```

## OpenAPI

A starter OpenAPI contract is maintained at:

```text
docs/openapi.yaml
```

It documents the main public, user, and admin endpoints. Keep it in sync when changing controllers.
