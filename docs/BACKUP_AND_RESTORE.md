# Han Sports v2 Backup And Restore Guide

Tai lieu nay chuan hoa cach backup/restore database va upload media. Project da co script full backup/restore trong `scripts/`; van khong duoc chay lenh reset volume neu chua tao backup package va test restore.

## Backup Scope

Backup day du phai gom:

| Thanh phan | Vi tri |
| --- | --- |
| Database dump | `database/hansport-demo.sql` |
| Product images | `upload/product/` |
| Logo files | `upload/logo/` |
| Banner files | `upload/banner/` neu duoc support |
| Manifest | `manifest.json` |
| Metadata | Timestamp, app version, Flyway version, row counts, file counts |

## Target Backup Package

```text
backups/YYYY-MM-DD_HHMMSS/
+-- manifest.json
+-- database/
|   +-- hansport-demo.sql
+-- upload/
    +-- product/
    +-- logo/
    +-- banner/
```

`backups/` da duoc ignore boi Git va khong duoc commit.

## Encoding And Binary Safety

- SQL dump/import phai dung UTF-8/utf8mb4.
- Tranh pipe SQL qua PowerShell dang text vi co the lam hong encoding tieng Viet.
- Khi import vao Docker, uu tien binary-safe stream hoac `docker cp` file SQL vao container roi import ben trong container.
- Media files phai copy binary-safe, khong doc/ghi nhu text.

## Backup Workflow

Lenh tao backup package day du:

```powershell
.\scripts\backup-demo-data.ps1
```

1. Tao timestamp folder.
2. Dump database ra `database/hansport-demo.sql`.
3. Copy upload folders vao `upload/`.
4. Tao `manifest.json`.
5. Tinh checksum neu can.
6. Dem so bang, so product, so `product_images`, so file product/logo/banner.
7. Chay integrity check.
8. Luu report trong backup package neu can.

## Restore Workflow

Restore co kha nang overwrite data nen phai co guardrail:

1. Yeu cau confirmation ro rang.
2. Tao backup hien tai truoc khi overwrite.
3. Restore database vao MySQL Docker host port `3307`.
4. Restore upload vao Docker volume `backend-upload:/app/upload`.
5. Chay Flyway/health check.
6. Chay integrity check.
7. Restart stack neu can, khong xoa volume neu khong co ly do.

Lenh restore tu backup package:

```powershell
.\scripts\restore-demo-data.ps1 -PackageDir backups\YYYY-MM-DD_HHMMSS
```

Script se yeu cau go dung phrase `RESTORE HANS SPORT DEMO`. Neu muon thay upload folder bang noi dung trong package, dung them `-ReplaceUpload`; mac dinh script copy/merge file va khong xoa orphan files.

Import rieng SQL vao Docker DB:

```powershell
.\scripts\import-db-to-docker.ps1 -SqlFile backups\YYYY-MM-DD_HHMMSS\database\hansport-demo.sql
```

Script se yeu cau phrase `IMPORT HANS SPORT DB` va tao backup truoc khi import, tru khi ban truyen `-SkipPreBackup`.

## Restore Test

Sau moi thay doi lon, tao mot restore test:

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost:8080/actuator/health
Invoke-WebRequest -UseBasicParsing "http://localhost:8080/api/v1/products?page=1&size=5"
```

Sau do dung checklist:

```text
docs/RESTORE_INTEGRITY_CHECKLIST.md
```

## Overwrite Warnings

| Hanh dong | Rui ro | Yeu cau |
| --- | --- | --- |
| Import SQL vao Docker DB | Ghi de hoac lam lech data | Confirmation + backup truoc |
| Restore upload folder | Ghi de anh hien co | Confirmation + backup upload truoc |
| Reset volume | Mat DB/upload | Chi lam sau khi backup va test restore |
| Import SQL sai encoding | Ten/mo ta tieng Viet thanh `???` | Dung UTF-8/utf8mb4 va binary-safe import |

## Verification Commands

```powershell
Test-Path backups
git check-ignore backups/
rg -n "mysql-data|backend-upload|3307|utf8mb4|manifest.json" docs
.\scripts\verify-data-integrity.ps1 -SkipHttpChecks
```

## Related Docs

- `docs/BACKUP_PACKAGE_SPEC.md`
- `docs/DATA_SCRIPT_DESIGN.md`
- `docs/DOCKER_VOLUME_SAFETY.md`
- `docs/RESTORE_INTEGRITY_CHECKLIST.md`
