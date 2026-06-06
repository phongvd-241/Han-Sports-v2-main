# Han Sports v2

Han Sports v2 is a sports e-commerce web project with a Spring Boot REST API backend and a React/Vite frontend in one repository.

## Main Stack

| Layer | Technology |
| --- | --- |
| Backend | Java 17, Spring Boot 3.2.2, Spring Security, JWT, Spring Data JPA |
| Database | MySQL, Flyway migrations |
| Frontend | React 19, Vite 8, Zustand, Axios, React Router |
| Styling | Tailwind CSS, Material Symbols |
| Build/Test | Maven, npm, ESLint, Vite build |
| DevOps baseline | Docker Compose, GitHub Actions CI, Spring Boot Actuator |

## Project Structure

```text
hansport_v2be/      Spring Boot backend REST API
hansport_v2fe/      React/Vite frontend
docs/               Technical docs, improvement plan, deployment notes
scripts/            Local helper scripts
```

## Environment Setup

Requirements:

- Java 17
- Maven
- Node.js and npm
- MySQL 8 compatible database

Create local environment files from templates:

```bash
cp hansport_v2be/.env.example hansport_v2be/.env
cp hansport_v2fe/.env.example hansport_v2fe/.env
```

Fill in real local values in `.env`. Never commit `.env` or `.env.local`.

Secret categories that must be provided manually:

- Database password
- JWT base64 secret
- Google OAuth client secret
- Gmail app password if email sending is used

See also: `docs/SECRET_ROTATION.md`.

## Run Backend Locally

```bash
cd hansport_v2be
mvn spring-boot:run
```

Backend API prefix:

```text
/api/v1
```

Flyway migrations:

```text
hansport_v2be/src/main/resources/db/migration
```

Health endpoint:

```text
http://localhost:8080/actuator/health
```

## Run Frontend Locally

```bash
cd hansport_v2fe
npm install
npm run dev
```

Frontend needs `VITE_API_URL` pointing to the backend, for example:

```env
VITE_API_URL=http://localhost:8080
```

## Docker Compose

Required shell variables before running:

```env
DB_PASSWORD=<db_password>
MYSQL_ROOT_PASSWORD=<mysql_root_password>
JWT_BASE64_SECRET=<base64_jwt_signing_key>
```

Run:

```bash
docker compose up --build
```

Default URLs:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api/v1` |
| Backend health | `http://localhost:8080/actuator/health` |

See: `docs/DEPLOYMENT.md`.

## Local Admin Account

Product/demo data is no longer seeded from Java code. Flyway owns database schema, while seeders only create system data such as roles, optional settings, and an optional local admin account.

When `SEED_ADMIN_ENABLED=true` and `SEED_ADMIN_PASSWORD` is set, the backend can create a local admin account:

```text
Email: admin@hansport.local
Password: value from SEED_ADMIN_PASSWORD
```

Use this only for local development/demo. Keep `SEED_ADMIN_ENABLED=false` for imported, staging, or production-like databases.

Product import workflow:

```text
docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md
data/import/README.md
```

## Verification

Backend:

```bash
cd hansport_v2be
mvn test
```

Frontend:

```bash
cd hansport_v2fe
npm run lint
npm run build
```

Current verification baseline:

- Backend tests cover context, hashed refresh token, refresh rotation, email authorization, login rate limit, cart quantity update, settings validation, upload validation, password change, empty checkout, order oversell prevention, and product image lifecycle cleanup.
- Frontend lint passes with zero warnings.
- Frontend build passes.
- CI workflow runs backend tests, frontend lint, and frontend build.

## Documentation

- `PROJECT_TECHNICAL_REPORT.md`: detailed technical report.
- `docs/HANSPORT_IMPROVEMENT_PLAN.md`: phased improvement plan.
- `docs/SECRET_ROTATION.md`: manual secret rotation notes.
- `docs/DEPLOYMENT.md`: Docker, CI, healthcheck, CORS, and backup notes.
- `docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md`: planned Excel-based product import workflow.
- `docs/openapi.yaml`: starter OpenAPI contract for key endpoints.

## Known Limitations

- Real online payment/VNPAY is not implemented; checkout currently uses COD.
- Upload storage is local filesystem; object storage/CDN is still production backlog.
- Rate limiting is in-memory and suitable for one demo backend instance only.
- Production deployment still needs a real HTTPS domain and environment-specific CORS values.
- Centralized monitoring and distributed rate limiting are not implemented yet.
- Some older Vietnamese UI text in source files still has mojibake and should be normalized gradually.

## Security Notes

- Do not commit `.env`, `.env.local`, database dumps, or real secrets.
- If the workspace/repository was shared, rotate Google OAuth secret, Gmail app password, JWT secret, and DB password manually.
- Refresh token is stored as a hash in the database; the raw refresh token only lives in an HTTP-only cookie.
