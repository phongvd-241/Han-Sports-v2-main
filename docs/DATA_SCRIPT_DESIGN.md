# Han Sports v2 Data Script Design

This document implements DATA-02 from `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`.
It defines and tracks the PowerShell scripts for database and upload backup,
restore, sync, and integrity verification.

Implementation status: the scripts listed below now exist in `scripts/`. They
have guardrails, typed confirmation for overwrite operations, and use binary-safe
SQL dump/import patterns. This document remains the operating contract for those
scripts.

## Design Goals

- Replace manual SQL export/import and manual upload copy with repeatable
  scripts.
- Preserve Vietnamese text by using `utf8mb4` and binary-safe SQL import.
- Require confirmation before overwriting Docker database or upload data.
- Create a backup before any operation that can overwrite Docker data.
- Keep real secrets out of command output, docs, and manifest files.
- Keep real backup packages inside `backups/`, which is ignored by Git.

## Current Baseline

| Item | Current state |
| --- | --- |
| Existing script | `scripts/backup-mysql.ps1` backs up MySQL only and now avoids PowerShell text piping |
| Docker DB container | `hansport-mysql` |
| Docker backend container | `hansport-backend` |
| Docker DB volume | `mysql-data` |
| Docker upload volume | `backend-upload` mounted at `/app/upload` |
| Docker host DB port | `${MYSQL_HOST_PORT:-3307}` |
| Backup package spec | `docs/BACKUP_PACKAGE_SPEC.md` |
| Volume safety guide | `docs/DOCKER_VOLUME_SAFETY.md` |

Existing `scripts/backup-mysql.ps1` remains a narrow DB-only helper. Use
`scripts/backup-demo-data.ps1` for complete database + upload + manifest backup.

## Script Summary

| Script | Function | Reads data | Writes data | Can overwrite | Needs confirmation | Auto-backup before write |
| --- | --- | --- | --- | --- | --- | --- |
| `scripts/export-local-db.ps1` | Export MySQL local `3306` to SQL dump | Yes | Backup file only | No, timestamped output | No | No |
| `scripts/import-db-to-docker.ps1` | Import SQL dump into Docker MySQL | Yes | Docker DB | Yes | Yes | Yes |
| `scripts/backup-demo-data.ps1` | Backup Docker DB and upload volume | Yes | Backup package only | No, timestamped output | No | No |
| `scripts/restore-demo-data.ps1` | Restore full backup/demo package into Docker | Yes | Docker DB and upload volume | Yes | Yes | Yes |
| `scripts/sync-upload-to-docker.ps1` | Copy upload files into Docker upload volume | Yes | Docker upload volume | Yes | Yes when target non-empty | Yes when target non-empty |
| `scripts/verify-data-integrity.ps1` | Compare DB metadata, upload files, and HTTP responses | Yes | No | No | No | No |

## Shared Conventions

All scripts should use these defaults unless a parameter overrides them:

| Setting | Default |
| --- | --- |
| Compose project root | Current repository root |
| Docker DB container | `hansport-mysql` |
| Docker backend container | `hansport-backend` |
| Database name | `hansport_v2` |
| Docker DB user | `hansport` |
| Docker DB host port | `3307` |
| Backup root | `backups/` |
| Backup package timestamp | `YYYY-MM-DD_HHMMSS` |
| Docker upload path | `/app/upload` |
| Upload folders | `product`, `logo`, `banner` |
| Import confirmation phrase | `IMPORT HANS SPORT DB` |
| Restore confirmation phrase | `RESTORE HANS SPORT DEMO` |
| Upload sync confirmation phrase | `SYNC HANS SPORT UPLOAD` |

Scripts that need DB credentials should read `DB_PASSWORD` from the current
process environment or from an explicitly supplied secure source. They must not
print the password. If a password is unavailable, the script must fail before
making changes.

## Script: `scripts/export-local-db.ps1`

### Purpose

Export the old/local MySQL database, usually running on `localhost:3306`, into a
timestamped backup package or standalone SQL dump.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-Host` | `127.0.0.1` | Yes |
| `-Port` | `3306` | Yes |
| `-Database` | `hansport_v2` | Yes |
| `-User` | `root` | Yes |
| `-OutputDir` | `backups/<timestamp>/database` | Yes |
| `-OutputFileName` | `hansport-local.sql` | Yes |
| `-PasswordEnvName` | `DB_PASSWORD` | Yes |

### Outputs

- `backups/<timestamp>/database/hansport-local.sql`
- Optional metadata printed to console: output path, file size, source host,
  source port, database name.

### Safety Rules

- Read-only against source DB.
- Must use `--default-character-set=utf8mb4`.
- Must use `--single-transaction`.
- Must not write password to console.
- Must not overwrite existing SQL dump.

### Internal Commands

```powershell
mysqldump `
  --host <host> `
  --port <port> `
  --user <user> `
  --default-character-set=utf8mb4 `
  --single-transaction `
  --routines `
  --triggers `
  --no-tablespaces `
  --result-file <output-file> `
  <database>
```

### Acceptance Criteria

- [ ] SQL file exists and is greater than 0 bytes.
- [ ] Vietnamese text remains valid after a restore test.
- [ ] The script exits non-zero if MySQL client is missing.
- [ ] The script exits non-zero if the output path already exists.

## Script: `scripts/import-db-to-docker.ps1`

### Purpose

Import a SQL dump into the Docker MySQL database.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-SqlFile` | None | Yes |
| `-Container` | `hansport-mysql` | Yes |
| `-Database` | `hansport_v2` | Yes |
| `-User` | `hansport` | Yes |
| `-PasswordEnvName` | `DB_PASSWORD` | Yes |
| `-BaselineFlyway` | `false` | No |
| `-ConfirmPhrase` | None | Yes |

### Outputs

- Docker DB overwritten/imported.
- Pre-import backup package under `backups/<timestamp>/`.
- Console summary: backup path, SQL file imported, table count after import.

### Safety Rules

- Must create backup before import.
- Must require typed confirmation phrase.
- Must use binary-safe import:
  - `docker cp <sql> hansport-mysql:/tmp/<file>`
  - `docker exec ... sh -c "mysql ... < /tmp/<file>"`
- Must not import with `Get-Content -Raw | docker exec`.
- Must remove temp SQL file from container after import.
- Must not target local MySQL `3306` by default.

### Internal Commands

```powershell
.\scripts\backup-demo-data.ps1
docker cp <sql-file> hansport-mysql:/tmp/hansport-import.sql
docker exec -e MYSQL_PWD=<redacted> hansport-mysql sh -c "mysql --default-character-set=utf8mb4 -u hansport hansport_v2 < /tmp/hansport-import.sql"
docker exec hansport-mysql rm -f /tmp/hansport-import.sql
```

If Flyway baseline is needed for a non-empty schema without
`flyway_schema_history`, the script should print the required next step rather
than silently changing compose config. A later implementation may support a
`-BaselineFlyway` mode.

### Acceptance Criteria

- [ ] Refuses to run without confirmation phrase.
- [ ] Creates backup before import.
- [ ] Imports SQL without corrupting UTF-8.
- [ ] Removes temporary SQL file.
- [ ] Runs `verify-data-integrity.ps1` or prints the exact follow-up command.

## Script: `scripts/backup-demo-data.ps1`

### Purpose

Create a full Docker demo backup package that includes database dump, upload
folders, and manifest.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-DbContainer` | `hansport-mysql` | Yes |
| `-BackendContainer` | `hansport-backend` | Yes |
| `-Database` | `hansport_v2` | Yes |
| `-User` | `hansport` | Yes |
| `-OutputRoot` | `backups` | Yes |
| `-PasswordEnvName` | `DB_PASSWORD` | Yes |

### Outputs

```text
backups/<timestamp>/
├── manifest.json
├── database/
│   └── hansport-demo.sql
└── upload/
    ├── product/
    ├── logo/
    └── banner/
```

### Safety Rules

- Read-only against Docker DB and upload volume.
- Must create a new timestamped folder.
- Must fail if the timestamp folder already exists.
- Must not include secrets in `manifest.json`.
- Must record counts and checksum.

### Internal Commands

```powershell
docker exec -e MYSQL_PWD=<redacted> hansport-mysql sh -c "mysqldump --default-character-set=utf8mb4 --single-transaction --routines --triggers --no-tablespaces -u hansport hansport_v2" > <dump>
docker cp hansport-backend:/app/upload/product <backup>\upload\product
docker cp hansport-backend:/app/upload/logo <backup>\upload\logo
docker cp hansport-backend:/app/upload/banner <backup>\upload\banner
Get-FileHash <dump> -Algorithm SHA256
```

If `/app/upload/banner` does not exist, the script should create an empty
`upload/banner` folder in the backup and record `bannerFiles: 0`.

### Acceptance Criteria

- [ ] Backup package matches `docs/BACKUP_PACKAGE_SPEC.md`.
- [ ] Manifest JSON parses successfully.
- [ ] Dump file is non-empty.
- [ ] Upload folders exist even when empty.
- [ ] `git check-ignore backups/` returns `backups/`.

## Script: `scripts/restore-demo-data.ps1`

### Purpose

Restore a backup/demo package into Docker MySQL and Docker upload volume.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-PackagePath` | None | Yes |
| `-DbContainer` | `hansport-mysql` | Yes |
| `-BackendContainer` | `hansport-backend` | Yes |
| `-Database` | `hansport_v2` | Yes |
| `-User` | `hansport` | Yes |
| `-PasswordEnvName` | `DB_PASSWORD` | Yes |
| `-ConfirmPhrase` | None | Yes |

### Outputs

- Docker DB restored from package SQL.
- Docker upload volume restored from package folders.
- Pre-restore backup package under `backups/<timestamp>/`.
- Integrity report after restore.

### Safety Rules

- Must validate package before making changes.
- Must require typed confirmation phrase.
- Must run `backup-demo-data.ps1` before overwriting.
- Must import SQL via `docker cp` plus container shell redirection.
- Must copy upload into `/app/upload`, then ensure backend user owns files.
- Must not delete orphan files unless a future explicit cleanup mode is added.

### Internal Commands

```powershell
.\scripts\backup-demo-data.ps1
docker cp <package>\database\hansport-demo.sql hansport-mysql:/tmp/hansport-restore.sql
docker exec -e MYSQL_PWD=<redacted> hansport-mysql sh -c "mysql --default-character-set=utf8mb4 -u hansport hansport_v2 < /tmp/hansport-restore.sql"
docker cp <package>\upload\. hansport-backend:/app/upload/
docker exec -u root hansport-backend sh -c "chown -R app:app /app/upload"
.\scripts\verify-data-integrity.ps1
```

### Acceptance Criteria

- [ ] Refuses invalid package.
- [ ] Refuses to run without confirmation phrase.
- [ ] Creates pre-restore backup.
- [ ] Restores DB without UTF-8 corruption.
- [ ] Restores upload files.
- [ ] Integrity check reports no missing referenced files.

## Script: `scripts/sync-upload-to-docker.ps1`

### Purpose

Copy upload files from a local source package/folder into the Docker backend
upload volume.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-SourceUploadPath` | `hansport_v2fe/upload` | Yes |
| `-BackendContainer` | `hansport-backend` | Yes |
| `-TargetPath` | `/app/upload` | Yes |
| `-ConfirmPhrase` | Required when target non-empty | Conditional |
| `-BackupFirst` | `true` | Yes |

### Outputs

- Files copied to `/app/upload/product`, `/app/upload/logo`, `/app/upload/banner`.
- Optional pre-sync backup if target contains files.
- Console summary of copied file counts.

### Safety Rules

- Must verify source folders before copy.
- Must backup first when target has files.
- Must require confirmation before overwriting existing target files.
- Must set ownership to backend app user after copy.
- Must run integrity check after sync.

### Internal Commands

```powershell
docker cp <source-upload>\. hansport-backend:/app/upload/
docker exec -u root hansport-backend sh -c "chown -R app:app /app/upload"
.\scripts\verify-data-integrity.ps1
```

### Acceptance Criteria

- [ ] Source folder exists.
- [ ] Target folder exists after copy.
- [ ] Backend app user can write `/app/upload`.
- [ ] Product/logo/banner file counts are printed.
- [ ] Integrity check is triggered or exact command is printed.

## Script: `scripts/verify-data-integrity.ps1`

### Purpose

Report mismatches between DB media metadata, files inside upload storage, and
HTTP file endpoints.

### Inputs

| Parameter | Default | Required |
| --- | --- | --- |
| `-DbContainer` | `hansport-mysql` | Yes |
| `-BackendContainer` | `hansport-backend` | Yes |
| `-Database` | `hansport_v2` | Yes |
| `-User` | `hansport` | Yes |
| `-PasswordEnvName` | `DB_PASSWORD` | Yes |
| `-BaseUrl` | `http://localhost:5173` | Yes |
| `-OutputFormat` | `text` | No |

### Outputs

- Console report.
- Optional report file in future: `backups/<timestamp>/integrity-report.json`.

### Checks

| Check | Source | Expected |
| --- | --- | --- |
| DB product image metadata | `product_images.image_url` | Non-empty filenames |
| Product files | `/app/upload/product` | All DB product images exist |
| Logo files | `/app/upload/logo` | Files referenced by frontend/settings exist |
| Banner files | `/app/upload/banner` | Files referenced by settings exist when used |
| Orphan files | Upload folders | Report only; do not delete |
| Duplicate filenames | DB metadata | Report for manual review |
| HTTP product image | `GET /api/v1/files?folder=product&fileName=<file>` | `200 image/*` |
| HTTP logo | `GET /api/v1/files?folder=logo&fileName=<file>` | `200 image/*` |

Use `GET` for HTTP checks. Do not use `HEAD` as the primary check because the
current security rules explicitly permit `GET /api/v1/files`.

### Safety Rules

- Must be read-only.
- Must not delete orphan files in v1.
- Must not update DB metadata.
- Must not print DB password.
- Must return non-zero when missing files or HTTP failures are found.

### Internal Commands

```powershell
docker exec -e MYSQL_PWD=<redacted> hansport-mysql mysql -u hansport --default-character-set=utf8mb4 -N -B hansport_v2 -e "SELECT image_url FROM product_images ORDER BY id"
docker exec hansport-backend sh -c "find /app/upload/product -maxdepth 1 -type f"
Invoke-WebRequest -UseBasicParsing "http://localhost:5173/api/v1/files?folder=product&fileName=<encoded>"
```

### Acceptance Criteria

- [ ] Missing files are reported.
- [ ] Orphan files are reported but not deleted.
- [ ] Missing upload folders fail the check.
- [ ] Duplicate DB filenames are reported.
- [ ] HTTP failures are reported.
- [ ] Success output clearly says all checks passed.

## Implementation Order

| Order | Script | Reason |
| --- | --- | --- |
| 1 | `backup-demo-data.ps1` | Needed before any overwrite operation |
| 2 | `verify-data-integrity.ps1` | Needed to validate backup and restore |
| 3 | `sync-upload-to-docker.ps1` | Solves missing media without touching DB |
| 4 | `export-local-db.ps1` | Makes local DB export repeatable |
| 5 | `import-db-to-docker.ps1` | Replaces manual import with backup + confirmation |
| 6 | `restore-demo-data.ps1` | Full restore uses backup, import, upload sync, verify |

## Verification Commands For This Design

```powershell
Test-Path docs\DATA_SCRIPT_DESIGN.md
rg -n "export-local-db|import-db-to-docker|backup-demo-data|restore-demo-data|sync-upload-to-docker|verify-data-integrity" docs\DATA_SCRIPT_DESIGN.md
rg -n "IMPORT HANS SPORT DB|RESTORE HANS SPORT DEMO|SYNC HANS SPORT UPLOAD|binary-safe|utf8mb4" docs\DATA_SCRIPT_DESIGN.md scripts
rg -n "mysql-data|backend-upload|/app/upload|3307|utf8mb4" docs\DATA_SCRIPT_DESIGN.md
```

## Safety Boundaries

- Script files exist, but creating them is not the same as running them.
- Do not run restore, import, or upload sync without an intentional backup/restore session.
- Do not reset Docker volumes.
- Do not modify `.env`.
- Do not commit real backup packages from `backups/`.
