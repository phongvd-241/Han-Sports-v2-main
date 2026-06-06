# Han Sports v2 Restore Integrity Checklist

Dung checklist nay sau khi restore database va upload media vao Docker demo.

## Database

- [ ] Docker stack dang chay.
- [ ] MySQL Docker su dung host port `3307`.
- [ ] Flyway migration thanh cong.
- [ ] Khong co migration loi trong backend logs.
- [ ] Du cac bang chinh: `users`, `roles`, `products`, `product_images`, `carts`, `cart_detail`, `orders`, `order_detail`, `settings`.
- [ ] Co role `ADMIN`.
- [ ] Co role `USER`.
- [ ] Admin demo dang nhap thanh cong neu demo dataset co admin.
- [ ] So luong product hop ly voi dataset da restore.
- [ ] So luong `product_images` hop ly voi so product co anh.

## Media

- [ ] Folder `/app/upload/product` ton tai.
- [ ] Folder `/app/upload/logo` ton tai.
- [ ] Folder `/app/upload/banner` duoc xac nhan neu demo dung banner.
- [ ] Moi `product_images.image_url` quan trong co file tuong ung trong product upload.
- [ ] Logo hien thi tren frontend.
- [ ] Banner hien thi neu settings/frontend dang dung banner.
- [ ] Khong co broken image tren trang home/shop.
- [ ] Integrity script khong bao missing folder.
- [ ] Integrity script khong bao missing file nghiem trong.
- [ ] Orphan files neu co da duoc review thu cong, chua tu dong xoa.

## API And UI

- [ ] `GET /actuator/health` tra ve healthy.
- [ ] `GET /api/v1/products` tra ve danh sach product.
- [ ] `GET /api/v1/files?folder=product&fileName=<sample>` tra ve image.
- [ ] Dang nhap admin demo thanh cong neu co.
- [ ] Them san pham vao cart thanh cong.
- [ ] Update quantity cart hoat dong neu chuc nang da trien khai.
- [ ] Checkout COD thanh cong.
- [ ] Order vua tao hien thi trong My Orders hoac admin order.

## Persistence

- [ ] `docker compose restart` khong lam mat DB.
- [ ] `docker compose restart` khong lam mat upload.
- [ ] `docker compose up -d --build` khong lam mat DB.
- [ ] `docker compose up -d --build` khong lam mat upload.
- [ ] Khong chay `docker compose down -v` trong qua trinh verify.

## Read-Only Verification Commands

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost:8080/actuator/health
Invoke-WebRequest -UseBasicParsing "http://localhost:8080/api/v1/products?page=1&size=5"
```

Kiem tra integrity DB/upload:

```powershell
.\scripts\verify-data-integrity.ps1
```

## Related Docs

- `docs/MEDIA_INTEGRITY_CHECK.md`
- `docs/BACKUP_AND_RESTORE.md`
- `docs/DEMO_SETUP.md`
