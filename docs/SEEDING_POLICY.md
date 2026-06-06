# Han Sports v2 Seeding Policy

Tai lieu nay dinh nghia cach kiem soat seeder theo tung moi truong de tranh chen nham demo/business data vao database da import.

## Current State

| Thanh phan | Trang thai hien tai | Rui ro con lai |
| --- | --- | --- |
| Flyway | Quan ly schema qua `hansport_v2be/src/main/resources/db/migration` | Can viet migration cho moi thay doi schema, khong sua DB bang tay |
| `DataSeeder` | Chi seed role bat buoc va local admin tuy chon | Local admin chi nen bat trong dev/demo |
| `AppSettingSeeder` | Co gate `app.seed.settings.enabled` / `SEED_SETTINGS_ENABLED`, chi tao setting key con thieu | Can tat khi restore/import DB that neu khong muon them setting mac dinh |
| Product data | Khong con seed tu Java code | Can import bang workflow Excel/script rieng sau nay |
| Upload media | Nam ngoai DB trong `/app/upload/<folder>` | Phai backup/restore dong bo voi metadata DB |

## Target Rule

Schema, system data va business data phai duoc tach rieng:

| Loai data | Chu so huu | Cach bat/tat |
| --- | --- | --- |
| Schema | Flyway | `FLYWAY_ENABLED=true` |
| Required roles | `DataSeeder` idempotent | `SEED_REQUIRED_ENABLED=true` |
| Settings mac dinh | `AppSettingSeeder` idempotent | `SEED_SETTINGS_ENABLED=true` |
| Local admin | `DataSeeder` optional | `SEED_ADMIN_ENABLED=true` va `SEED_ADMIN_PASSWORD=<local_password>` |
| Product/business data | Excel import workflow hoac backup/restore package | Khong seed tu Java |
| Upload media | Upload storage + backup package | Restore dong bo voi DB |

## Environment Matrix

| Environment | Co chay migration? | Co seed role? | Co seed settings? | Co seed admin? | Co seed product? | Co import du lieu hang hoa? |
| --- | --- | --- | --- | --- | --- | --- |
| Local development | Co | Co | Tuy chon | Tuy chon | Khong | Khi developer chu dong |
| Test | Co | Theo test fixture | Theo test fixture | Theo test fixture | Khong | Khong |
| Demo portfolio | Co | Co | Co neu can UI mac dinh | Tuy chon | Khong | Tu Excel/demo import package sach |
| Staging | Co | Co idempotent neu thieu | Thuong tat hoac duoc phe duyet | Khong | Khong | Chi restore/import staging data |
| Production | Co | Co idempotent neu thieu | Thuong tat hoac duoc phe duyet | Khong | Khong | Khong import thu cong tu dev |

## Implementation Rules

1. Flyway la nguon su that cua schema. Khong dung seeder de tao/sua bang.
2. `DataSeeder` chi phu trach role bat buoc va local admin optional.
3. `AppSettingSeeder` chi tao key con thieu, khong ghi de setting hien co.
4. Product, order va media demo khong duoc nam trong Java seeder.
5. Hang hoa sau nay nen import tu `data/import/products.xlsx` bang workflow co validate/dry-run.
6. Upload media phai di kem Excel/import package hoac backup package, vi DB chi luu filename.
7. Khi restore DB da co du lieu that, de `SEED_ADMIN_ENABLED=false` va `SEED_SETTINGS_ENABLED=false` tru khi co ly do ro.
8. Neu bat `SEED_ADMIN_ENABLED=true`, phai dat `SEED_ADMIN_PASSWORD`; backend se fail fast neu password bi thieu.

## Safety Rules

- Khong bat admin seed tren staging/production.
- Khong seed product demo vao DB da import.
- Khong commit password, email khach hang, dia chi, so dien thoai that trong dataset demo/import.
- Khong bat local admin seed neu chua dat password rieng cho moi truong local.
- Required roles/settings phai idempotent, chay lai khong tao duplicate.
- Product import phai co backup truoc va nen co dry-run truoc khi apply.

## Verification Plan

```powershell
rg -n "app.seed.required.enabled|app.seed.admin.enabled|app.seed.settings.enabled" hansport_v2be\src\main\resources\application.properties
rg -n "SEED_REQUIRED_ENABLED|SEED_ADMIN_ENABLED|SEED_ADMIN_PASSWORD|SEED_SETTINGS_ENABLED" .env.example hansport_v2be\.env.example docker-compose.yml
rg -n "Product|productRepository|ProductImage" hansport_v2be\src\main\java\com\javaweb\config\DataSeeder.java
mvn -f hansport_v2be\pom.xml test
```

## Acceptance Criteria

- [x] `DataSeeder` khong con seed product demo.
- [x] `DataSeeder` co flag rieng cho required roles va local admin.
- [x] Local admin password lay tu env, khong hard-code trong seeder.
- [x] `AppSettingSeeder` co gate rieng qua `SEED_SETTINGS_ENABLED`.
- [x] Docker mac dinh tat admin/settings seed khi chay DB da import.
- [ ] Excel import service/script duoc trien khai rieng trong task sau.
- [ ] Product import co dry-run, validate va backup truoc khi apply.

## Related Docs

- `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`
- `docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md`
- `docs/BACKUP_AND_RESTORE.md`
- `data/import/README.md`
