# Han Sports v2 Media Integrity Check

Tai lieu nay dinh nghia cach kiem tra tinh khop nhau giua metadata anh trong database va file that trong upload storage.

## Current State

| Noi dung | Trang thai |
| --- | --- |
| Database product image metadata | Bang `product_images`, cot `image_url` luu filename |
| Docker upload path | `backend-upload:/app/upload` |
| Local upload folders | `hansport_v2fe/upload/product`, `hansport_v2fe/upload/logo`, `hansport_v2fe/upload/banner` |
| File API | `GET /api/v1/files?folder=<folder>&fileName=<name>` |
| Static resources | `StaticResourcesWebConfiguration.java` map `/storage/**` |
| Allowed folder trong `FileService` | Hien cho phep `product`, `logo`, `banner` |
| Banner folder | `banner` duoc dung cho hero/banner media; du lieu cu khong co `imageFolder` van fallback ve `product` |

Frontend hien uu tien lay anh qua `/api/v1/files`, nen integrity check can kiem tra ca file tren filesystem va HTTP response tu backend.

## Error Types

| Loai loi | Vi du | Cach xu ly v1 |
| --- | --- | --- |
| Missing file | DB co `product_images.image_url = a.jpg` nhung `/app/upload/product/a.jpg` khong ton tai | Bao danh sach file thieu, khong tu sua |
| Orphan file | `/app/upload/product/b.jpg` ton tai nhung khong duoc DB tham chieu | Bao danh sach file co the don, khong tu xoa |
| Missing folder | `/app/upload/product` hoac `/app/upload/logo` khong ton tai | Dung script va bao loi mount/path |
| Duplicate filename | Hai ban ghi cung tham chieu filename nhung khong chu dong share | Bao loi de kiem tra thu cong |
| HTTP check failure | File co tren disk nhung `GET /api/v1/files` tra 404/401/500 | Bao endpoint/folder/file bi loi |
| Folder mismatch | Settings tham chieu folder khong nam trong workflow | Bao mismatch, can kiem tra source hoac data |

## Implemented `scripts/verify-data-integrity.ps1`

Script chi doc du lieu, khong xoa file trong phien ban dau tien.

| Hang muc | Input | Output |
| --- | --- | --- |
| Database image metadata | MySQL Docker `3307`, bang `product_images` | Danh sach filename product dang duoc tham chieu |
| Upload folders | `/app/upload/product`, `/app/upload/logo`, `/app/upload/banner` | Danh sach file tren storage |
| HTTP checks | Backend URL, mac dinh `http://localhost:8080/api/v1/files` | Trang thai GET cho tung file mau |
| Report | Console + optional JSON report | Missing file, orphan file, duplicate filename, HTTP failure |

## Verification Rules

1. Kiem tra folder ton tai truoc khi query chi tiet.
2. Query DB lay danh sach filename khong null, khong rong.
3. So sanh DB filename voi file that trong folder tuong ung.
4. Kiem tra duplicate filename trong DB va tren disk.
5. Goi HTTP `GET /api/v1/files` cho mot tap mau hoac toan bo file neu so luong nho.
6. Khong dung `HEAD` lam check chinh neu backend chua dam bao endpoint ho tro.
7. Khong tu dong xoa orphan file o version 1.

## Verification Commands

```powershell
rg -n "product_images|image_url" hansport_v2be\src\main\resources\db hansport_v2be\src\main\java
rg -n "allowedFolders|product|logo|banner" hansport_v2be\src\main\java\com\javaweb\service\FileService.java
rg -n "/api/v1/files|folder|fileName" hansport_v2be\src\main\java\com\javaweb\controller\FileController.java hansport_v2fe\src
.\scripts\verify-data-integrity.ps1 -SkipHttpChecks
```

Neu backend dang chay va muon check HTTP image endpoint:

```powershell
.\scripts\verify-data-integrity.ps1
```

## Acceptance Criteria

- [ ] Script report duoc missing files.
- [ ] Script report duoc orphan files.
- [ ] Script report duoc duplicate filenames.
- [ ] Script report duoc missing folders.
- [ ] Script report duoc HTTP failures.
- [ ] Script khong xoa orphan file.
- [ ] `banner` duoc kiem tra nhu upload API folder chinh thuc.

## Related Tasks

- `DATA-05` trong `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`
- `DATA-02` trong `docs/DATA_SCRIPT_DESIGN.md`
