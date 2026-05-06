# HanSport v2

HanSport v2 là web bán đồ thể thao gồm backend Spring Boot REST API và frontend React/Vite. Project có flow demo cho `ADMIN` và `USER`: đăng nhập, xem sản phẩm, thêm giỏ hàng, đặt hàng, quản trị sản phẩm, tài khoản và đơn hàng.

## Công nghệ

- Backend: Java 17, Spring Boot 3.2.2, Spring Web, Spring Security, JWT, Spring Data JPA, MySQL, Bean Validation.
- Frontend: React 18, Vite, Fetch API, lucide-react.
- Database local: MySQL, schema mặc định `hansport_v2`.
- Test backend: H2 in-memory cho `mvn test`.

## Cấu trúc thư mục

```text
hansport_v2be/        Backend Spring Boot REST API
hansport_v2fe/        Frontend React/Vite
hansport_v2fe/upload/ Thu muc upload anh san pham demo
DEMO_SCRIPT.md        Kich ban demo de bao ve do an
```

## Cấu hình database

Tạo database MySQL:

```sql
CREATE DATABASE hansport_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Backend đọc cấu hình từ biến môi trường, có default local:

```properties
DB_URL=jdbc:mysql://localhost:3306/hansport_v2?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=
SERVER_PORT=8080
FRONTEND_URL=http://localhost:5173
UPLOAD_FILE_BASE_PATH=../hansport_v2fe/upload
COOKIE_SECURE=false
SEED_ENABLED=true
```

Nếu MySQL của bạn đang dùng mật khẩu `123456`, chạy backend với:

```powershell
$env:DB_PASSWORD="123456"
```

## Cách chạy backend

Yêu cầu cài Java 17 và Maven, sau đó:

```powershell
cd hansport_v2be
mvn clean test
mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`. Khi `SEED_ENABLED=true`, app tự tạo role, tài khoản demo và sản phẩm mẫu.

## Cách chạy frontend

```powershell
cd hansport_v2fe
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`. Nếu backend không chạy ở port 8080, tạo file `.env.local`:

```properties
VITE_API_BASE_URL=http://localhost:8080
```

## Tài khoản demo

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@hansport.local` | `Admin@123` |
| USER | `user@hansport.local` | `User@123` |

## Chức năng chính

- Đăng nhập, đăng ký user, đăng xuất, refresh token bằng cookie.
- Phân quyền API theo `ADMIN` và `USER`.
- User xem sản phẩm, thêm giỏ hàng, checkout, xem đơn hàng của mình.
- Admin quản lý sản phẩm, upload ảnh sản phẩm, quản lý user, cập nhật trạng thái đơn hàng.
- Seed dữ liệu demo để chạy nhanh khi trình bày.

## Lỗi thường gặp

- `mvn` hoặc `java` không nhận lệnh: cài Java 17 và Maven, rồi thêm vào PATH.
- Backend không kết nối DB: kiểm tra MySQL đang chạy, đúng `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- Frontend báo CORS/token: kiểm tra backend chạy port 8080 và `FRONTEND_URL=http://localhost:5173`.
- Không thấy ảnh upload: kiểm tra `UPLOAD_FILE_BASE_PATH` đang trỏ tới `hansport_v2fe/upload`.
- Refresh token không lưu khi chạy local HTTP: đảm bảo `COOKIE_SECURE=false`.
