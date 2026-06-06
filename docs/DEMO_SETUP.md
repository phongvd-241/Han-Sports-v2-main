# Han Sports v2 Demo Setup

Huong dan nay mo ta workflow demo portfolio an toan. Demo hien tai khong con dung Java seeder de tao product. Schema do Flyway quan ly, system data duoc seed co kiem soat, con hang hoa/media se di qua workflow import rieng.

## 1. Prerequisites

- Windows + PowerShell.
- Docker Desktop dang chay.
- Java 17 neu chay backend ngoai Docker.
- Node.js neu chay frontend ngoai Docker.

Kiem tra:

```powershell
docker --version
docker compose version
```

## 2. Clone And Configure Env

```powershell
Copy-Item .env.example .env
```

Cap nhat `.env` bang gia tri local cua ban. Khong commit `.env`.

Gia tri quan trong cho demo Docker:

```env
MYSQL_HOST_PORT=3307
FLYWAY_ENABLED=true
FLYWAY_BASELINE_ON_MIGRATE=false
SEED_ENABLED=false
SEED_REQUIRED_ENABLED=true
SEED_ADMIN_ENABLED=false
SEED_ADMIN_PASSWORD=
SEED_SETTINGS_ENABLED=false
```

Neu can tao local admin de demo admin UI, chi bat:

```env
SEED_ADMIN_ENABLED=true
SEED_ADMIN_PASSWORD=<local_admin_password>
```

Khong bat admin/settings seed tren database da restore/import neu khong co ly do ro.

## 3. Start Docker Stack

```powershell
docker compose up -d --build
```

Services:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api/v1` |
| Health | `http://localhost:8080/actuator/health` |
| MySQL host port | `3307` |

## 4. Migration And Seeder

- Flyway chay khi backend start neu `FLYWAY_ENABLED=true`.
- `DataSeeder` chi tao required roles va local admin optional.
- `AppSettingSeeder` chi tao setting key con thieu khi `SEED_SETTINGS_ENABLED=true`.
- Product/order/media demo khong con seed tu Java code.
- Hang hoa demo sau nay nen di theo `data/import/products.xlsx` va media trong `data/import/media`.

Xem:

```text
docs/SEEDING_POLICY.md
docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md
data/import/README.md
```

## 5. Product Data And Upload Media

Database chi luu metadata/filename anh. File that nam trong upload storage:

```text
/app/upload/product
/app/upload/logo
/app/upload/banner
```

Workflow muc tieu:

1. Chuan bi Excel hang hoa trong `data/import/products.xlsx`.
2. Dat file anh tuong ung vao `data/import/media/product`, `data/import/media/logo`, `data/import/media/banner`.
3. Chay import workflow co validate/dry-run trong task sau.
4. Chay `scripts/verify-data-integrity.ps1` de kiem tra DB metadata va file media khop nhau.

Neu chi import SQL ma khong restore/copy upload files, product images se bi broken image vi DB chi luu filename.

Backup Docker demo hien tai:

```powershell
.\scripts\backup-demo-data.ps1
```

Restore tu mot backup package:

```powershell
.\scripts\restore-demo-data.ps1 -PackageDir backups\YYYY-MM-DD_HHMMSS
```

Dong bo upload vao Docker neu DB da co metadata anh:

```powershell
.\scripts\sync-upload-to-docker.ps1 -SourceUploadPath data\import\media
```

## 6. Verify Demo

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost:8080/actuator/health
Invoke-WebRequest -UseBasicParsing "http://localhost:8080/api/v1/products?page=1&size=5"
.\scripts\verify-data-integrity.ps1 -SkipHttpChecks
```

Kiem tra UI:

- Trang home load duoc.
- Product list hien thi neu da import product data.
- Anh product load duoc neu media da duoc sync/restore.
- Logo load duoc.
- Cart them san pham duoc.
- Checkout COD hoat dong.

## 7. Before Reset

Doc truoc:

- `docs/DOCKER_VOLUME_SAFETY.md`
- `docs/BACKUP_PACKAGE_SPEC.md`
- `docs/BACKUP_AND_RESTORE.md`

Khong chay:

```powershell
docker compose down -v
docker volume rm mysql-data backend-upload
```

tru khi ban da co backup package day du va da test restore.

## 8. Common Issues

| Loi | Nguyen nhan thuong gap | Cach kiem tra |
| --- | --- | --- |
| Product name bi `???` | SQL dump/import sai encoding | Dung UTF-8/utf8mb4 va tranh text-piping SQL qua PowerShell |
| Product list rong | Chua import product data | Kiem tra DB hoac import workflow |
| Anh san pham khong hien | Chua restore/sync upload hoac sai folder | Chay integrity check, kiem tra `/app/upload/product` |
| Logo khong hien | File logo thieu hoac folder `logo` sai | Kiem tra `/api/v1/files?folder=logo&fileName=...` |
| Banner khong hien | Chua restore/sync `upload/banner` hoac settings cu dang fallback ve `product` | Kiem tra `imageFolder`, `FileService` va settings |
| Backend khong start | DB chua san sang, migration loi, env sai | `docker compose logs backend` |
| MySQL port conflict | May local dang dung `3306` | Giu `MYSQL_HOST_PORT=3307` |

## Related Docs

- `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`
- `docs/SEEDING_POLICY.md`
- `docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md`
- `docs/DOCKER_VOLUME_REFERENCE.md`
- `docs/RESTORE_INTEGRITY_CHECKLIST.md`
