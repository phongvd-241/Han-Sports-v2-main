# Han Sports v2 Backup Package Spec

This document implements DATA-01 from `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`.
It defines the backup package format for database data and upload media. It does
not define the full restore workflow yet; that belongs to DATA-08.

## Purpose

Han Sports v2 stores product media as filenames in MySQL and stores the real
files separately under the upload directory. A database dump alone is not a
complete backup. A valid backup package must contain both:

- MySQL dump for schema/business data.
- Upload media folders for product, logo, and banner assets.
- Manifest metadata that proves what was backed up.

The default Docker demo database is MySQL on host port `3307`. Inside Docker,
the backend reads upload files from `/app/upload`, mounted from the
`backend-upload` volume.

## Current Storage Model

| Data type | Current location | Notes |
| --- | --- | --- |
| Database schema | Flyway migrations in `hansport_v2be/src/main/resources/db/migration/` | Versioned in Git |
| Business data | MySQL database `hansport_v2` | Docker volume `mysql-data` |
| Product image metadata | `product_images.image_url` | Stores filename only |
| Product media files | `/app/upload/product` in backend container | Docker volume `backend-upload` |
| Logo files | `/app/upload/logo` in backend container | Served through `/api/v1/files` |
| Banner files | Local/API folder `upload/banner` | Used for hero/banner media; old settings without `imageFolder` still fall back to `product` |

## Backup Package Layout

Every backup must be stored in a timestamped folder:

```text
backups/
└── YYYY-MM-DD_HHMMSS/
    ├── manifest.json
    ├── database/
    │   └── hansport-demo.sql
    └── upload/
        ├── product/
        ├── logo/
        └── banner/
```

Example:

```text
backups/
└── 2026-06-05_143000/
    ├── manifest.json
    ├── database/
    │   └── hansport-demo.sql
    └── upload/
        ├── product/
        ├── logo/
        └── banner/
```

`backups/` is ignored by Git and must remain ignored. Real backups can contain
business data, user data, email addresses, file names, and media files that
should not be committed.

## Naming Convention

| Item | Convention | Example |
| --- | --- | --- |
| Backup folder | `YYYY-MM-DD_HHMMSS` | `2026-06-05_143000` |
| Database dump | `hansport-demo.sql` for Docker demo backups | `database/hansport-demo.sql` |
| Local DB export | `hansport-local.sql` when exporting old local DB | `database/hansport-local.sql` |
| Manifest | Always `manifest.json` | `manifest.json` |
| Upload folders | Match backend folder names | `upload/product`, `upload/logo`, `upload/banner` |

Use timestamped folders rather than overwriting an existing backup. If a backup
script finds an existing timestamp folder, it must fail or create a new
timestamp. It must not silently overwrite.

## Manifest Format

`manifest.json` must not contain secrets. It should contain only metadata needed
to verify backup completeness.

```json
{
  "app": "Han Sports v2",
  "backupVersion": 1,
  "createdAt": "2026-06-05T14:30:00+07:00",
  "sourceEnvironment": "docker-demo",
  "gitCommit": "<commit-sha-or-unknown>",
  "docker": {
    "databaseContainer": "hansport-mysql",
    "backendContainer": "hansport-backend",
    "databaseVolume": "mysql-data",
    "uploadVolume": "backend-upload"
  },
  "database": {
    "name": "hansport_v2",
    "hostPort": 3307,
    "dumpPath": "database/hansport-demo.sql",
    "flywayVersion": "2",
    "tableCount": 10,
    "roleCount": 2,
    "userCount": 0,
    "productCount": 0,
    "productImageCount": 0,
    "settingCount": 0
  },
  "upload": {
    "basePath": "/app/upload",
    "productFiles": 0,
    "logoFiles": 0,
    "bannerFiles": 0,
    "totalFiles": 0
  },
  "checksums": {
    "database/hansport-demo.sql": "<sha256>"
  },
  "notes": [
    "No secrets are stored in this manifest.",
    "Import must be binary-safe and UTF-8 compatible."
  ]
}
```

The first script implementation may start with database checksum only. Later
versions can add per-file media checksums if needed.

## Required Backup Contents

| Required content | Required path | Verification |
| --- | --- | --- |
| Manifest | `manifest.json` | File exists and parses as JSON |
| Database dump | `database/hansport-demo.sql` | File exists, non-empty, UTF-8 safe |
| Product uploads | `upload/product/` | Folder exists; file count recorded |
| Logo uploads | `upload/logo/` | Folder exists; file count recorded |
| Banner uploads | `upload/banner/` | Folder exists; file count recorded, even if empty |

Empty folders should still be created so restore scripts can distinguish
"folder intentionally empty" from "folder missing".

## UTF-8 And Binary-Safe SQL Rules

Vietnamese product names and descriptions must survive export/import. Use
`utf8mb4` for dump and restore commands.

Required export behavior:

```text
mysqldump --default-character-set=utf8mb4 --single-transaction --routines --triggers
```

Required import behavior for Docker:

```text
docker cp <dump-file> hansport-mysql:/tmp/hansport-demo.sql
docker exec hansport-mysql sh -c "mysql --default-character-set=utf8mb4 ... < /tmp/hansport-demo.sql"
```

Do not import SQL into Docker through a PowerShell text pipe such as:

```powershell
Get-Content .\dump.sql -Raw | docker exec -i hansport-mysql mysql ...
```

That style can corrupt non-ASCII text by passing SQL through PowerShell string
encoding. Use file copy plus shell redirection inside the container instead.

## Backup Completeness Checks

A backup is complete only if all checks pass.

| Check | Expected result |
| --- | --- |
| `manifest.json` exists | True |
| Database dump exists | True |
| Database dump size | Greater than 0 bytes |
| `upload/product` exists | True |
| `upload/logo` exists | True |
| `upload/banner` exists | True |
| Product count recorded | Number in manifest |
| Product image count recorded | Number in manifest |
| Upload file counts recorded | Number in manifest |
| Dump checksum recorded | SHA-256 value exists |
| Git ignore check | `backups/` is ignored |

Suggested read-only checks after backup script implementation:

```powershell
$Backup = "backups\<timestamp>"
Test-Path "$Backup\manifest.json"
Test-Path "$Backup\database\hansport-demo.sql"
Test-Path "$Backup\upload\product"
Test-Path "$Backup\upload\logo"
Test-Path "$Backup\upload\banner"
Get-Item "$Backup\database\hansport-demo.sql" | Select-Object Length
git check-ignore backups/
```

## Restore Test Criteria

DATA-01 does not implement restore, but every backup package must be designed so
it can be restore-tested later.

Minimum restore test criteria:

- Flyway migration succeeds after restore.
- Database has expected table count.
- `roles`, `users`, `products`, `product_images`, and `settings` counts match
  manifest values.
- Product images referenced by DB exist under restored `upload/product`.
- Logo files exist under restored `upload/logo`.
- Banner files exist under restored `upload/banner` when referenced by settings.
- `GET /api/v1/products` returns product data.
- `GET /api/v1/files?folder=product&fileName=<file>` returns `200 image/*` for
  referenced product images.
- Restarting containers does not remove database data.
- Restarting containers does not remove upload files.

## Safety Rules

- Do not store secrets in `manifest.json`.
- Do not commit real backup packages.
- Do not overwrite existing timestamped backup folders.
- Do not reset Docker volumes before a valid backup package exists.
- Do not restore a package into MySQL local `3306` by default.
- Restore into Docker demo `3307` first, then verify integrity.
- Treat `docker compose down -v`, `docker volume rm`, and
  `docker system prune --volumes` as destructive commands.

## Relationship To Future Tasks

| Future task | How this spec is used |
| --- | --- |
| DATA-02 | Scripts must produce and consume this package format |
| DATA-05 | Integrity script must compare DB metadata with `upload/` contents |
| DATA-08 | Backup/restore guide must explain how to create and restore this package |
| DATA-10 | Post-restore checklist must validate this package's contents |
