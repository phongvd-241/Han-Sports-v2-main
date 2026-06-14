# Han Sports v2

Website thương mại điện tử bán đồ thể thao, gồm ứng dụng khách hàng và trang quản trị.

## Công nghệ

- Backend: Java 17, Spring Boot, Spring Security, JWT, Spring Data JPA
- Database: MySQL, Flyway
- Frontend: React, Vite, Zustand, Axios, React Router
- Giao diện: Tailwind CSS
- Triển khai local: Docker Compose

## Chức năng

Khách hàng:

- Đăng ký, đăng nhập, Google Login và đổi mật khẩu
- Xem, tìm kiếm và lọc sản phẩm
- Quản lý giỏ hàng và đặt hàng COD
- Theo dõi đơn hàng và cập nhật thông tin cá nhân

Quản trị viên:

- Dashboard thống kê
- Quản lý sản phẩm và import Excel/CSV
- Quản lý đơn hàng, người dùng và nội dung website
- Upload nhiều ảnh sản phẩm

## Cấu trúc

```text
hansport_v2be/    Spring Boot REST API
hansport_v2fe/    React/Vite frontend
docker-compose.yml
```

## Chạy bằng Docker

1. Tạo file môi trường:

```powershell
Copy-Item .env.example .env
```

2. Điền các biến bắt buộc trong `.env`:

```env
DB_PASSWORD=<database_password>
MYSQL_ROOT_PASSWORD=<mysql_root_password>
JWT_BASE64_SECRET=<base64_jwt_secret>
```

3. Khởi động:

```bash
docker compose up --build
```

Địa chỉ mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080/api/v1`
- Health check: `http://localhost:8080/actuator/health`

## Chạy thủ công

Backend:

```powershell
Copy-Item hansport_v2be/.env.example hansport_v2be/.env
cd hansport_v2be
mvn spring-boot:run
```

Frontend:

```powershell
Copy-Item hansport_v2fe/.env.example hansport_v2fe/.env
cd hansport_v2fe
npm install
npm run dev
```

## Kiểm thử

```bash
cd hansport_v2be
mvn test
```

```bash
cd hansport_v2fe
npm run lint
npm run build
```

## Lưu ý

- Không commit `.env`, database dump hoặc secret thật.
- Flyway quản lý thay đổi schema trong `hansport_v2be/src/main/resources/db/migration`.
- Thanh toán trực tuyến chưa được triển khai; hệ thống hiện sử dụng COD.
- File upload hiện được lưu trên local filesystem hoặc Docker volume.
