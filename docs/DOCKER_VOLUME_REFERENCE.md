# Han Sports v2 Docker Volume Reference

Tai lieu nay mo ta ro volume Docker dang chua database va upload media.

## Current Volumes

| Volume | Mount trong container | Service | Chua du lieu gi |
| --- | --- | --- | --- |
| `mysql-data` | `/var/lib/mysql` | `mysql` | Database MySQL |
| `backend-upload` | `/app/upload` | `backend` | Uploaded media: product/logo/banner neu duoc mount |

MySQL Docker duoc expose ra host port mac dinh `3307`. Ben trong Docker network, backend van ket noi MySQL qua port container `3306`.

## Lifecycle Matrix

| Hanh dong | Container | `mysql-data` | `backend-upload` | Ghi chu |
| --- | --- | --- | --- | --- |
| `docker compose restart` | Restart | Giu lai | Giu lai | An toan neu config khong doi |
| `docker compose up -d` | Tao/chay container | Giu lai | Giu lai | An toan |
| `docker compose up -d --build` | Rebuild image va chay lai | Giu lai | Giu lai | Data khong nam trong image |
| `docker compose down` | Xoa container/network | Giu lai | Giu lai | Thuong an toan |
| `docker compose down -v` | Xoa container/network/volume | Mat | Mat | Nguy hiem, can backup |
| `docker volume rm mysql-data` | Khong xoa container neu dang dung | Mat DB | Khong anh huong truc tiep | Nguy hiem |
| `docker volume rm backend-upload` | Khong xoa container neu dang dung | Khong anh huong truc tiep | Mat upload | Nguy hiem |

## Backup Mapping

| Du lieu | Backup tu dau | Restore vao dau |
| --- | --- | --- |
| Database | `mysql-data` qua `mysqldump` | MySQL Docker `3307` hoac container mysql |
| Product images | `/app/upload/product` | `backend-upload:/app/upload/product` |
| Logo files | `/app/upload/logo` | `backend-upload:/app/upload/logo` |
| Banner files | `/app/upload/banner` neu support | `backend-upload:/app/upload/banner` |

## Rules

- Khong luu DB trong image backend/mysql.
- Khong copy media vao image frontend/backend de lam data demo lau dai.
- `backend-upload` la data runtime, can backup rieng.
- `backups/` la output tam/thuc te va khong commit.
- Demo/import media neu can commit thi dat trong `data/import/media/`, khong dat trong `backups/`.

## Verification Commands

```powershell
docker compose ps
docker volume ls
docker volume inspect mysql-data
docker volume inspect backend-upload
```

Khong chay `docker compose down -v` hoac `docker volume rm` neu chua co backup package.

## Related Docs

- `docs/DOCKER_VOLUME_SAFETY.md`
- `docs/BACKUP_AND_RESTORE.md`
- `docs/BACKUP_PACKAGE_SPEC.md`
