# Han Sports v2 - E-commerce Website

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-green)
![MySQL](https://img.shields.io/badge/MySQL-8.x-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-black)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38bdf8)

**Han Sports v2** là website thương mại điện tử bán đồ thể thao, tập trung vào các sản phẩm cầu lông như vợt, giày, quần áo, balo, túi và phụ kiện.  
Dự án gồm **Backend Spring Boot** và **Frontend React**, hỗ trợ người dùng mua hàng, quản lý giỏ hàng, đặt hàng, đăng nhập bảo mật và quản trị dữ liệu sản phẩm.

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cấu hình database](#cấu-hình-database)
- [Cấu hình backend](#cấu-hình-backend)
- [Chạy dự án](#chạy-dự-án)
- [Tài khoản demo](#tài-khoản-demo)

---

## Tính năng chính

### Người dùng

- Đăng ký, đăng nhập tài khoản.
- Đăng nhập bằng Google OAuth2.
- Xác thực bằng JWT Access Token và Refresh Token.
- Xem danh sách sản phẩm.
- Xem chi tiết sản phẩm.
- Tìm kiếm và lọc sản phẩm theo thương hiệu, đối tượng, danh mục.
- Thêm sản phẩm vào giỏ hàng.
- Cập nhật số lượng sản phẩm trong giỏ hàng.
- Đặt hàng và xem lịch sử đơn hàng.
- Cập nhật thông tin cá nhân.

### Quản trị viên

- Đăng nhập tài khoản quản trị.
- Quản lý sản phẩm.
- Quản lý hình ảnh sản phẩm.
- Quản lý đơn hàng.
- Cập nhật trạng thái đơn hàng.
- Cấu hình thông tin hệ thống như banner, danh mục, hotline, phí vận chuyển và ngưỡng miễn phí ship.

### Cấu hình hệ thống

Dự án có cơ chế seed dữ liệu ban đầu khi chạy backend:

- Seed role `ADMIN`, `USER`.
- Seed tài khoản admin mặc định.
- Seed cấu hình website:
  - `HERO_SLIDES`
  - `CATEGORIES`
  - `BRANDS`
  - `TARGETS`
  - `HOTLINE`
  - `SHIPPING_FEE`
  - `FREE_SHIP_LIMIT`
- Có thể seed sản phẩm và hình ảnh sản phẩm nếu được cấu hình trong seeder.

---

## Công nghệ sử dụng

### Backend

- Java 17
- Spring Boot 3.2.2
- Spring Web
- Spring Security
- Spring Data JPA
- Hibernate
- MySQL
- Maven
- JWT / OAuth2 Resource Server
- Google API Client
- Spring Mail
- Thymeleaf
- Lombok
- Hibernate Validator

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Zustand
- Lucide Icons
- Material Symbols

### Database

- MySQL 8.x

---

## Cấu trúc dự án

```text
Han-Sports-v2
├── hansport_v2be/        # Backend Spring Boot
│   ├── src/main/java
│   │   └── com/javaweb
│   │       ├── config
│   │       ├── controller
│   │       ├── domain
│   │       ├── repository
│   │       ├── service
│   │       └── util
│   ├── src/main/resources
│   │   └── application.properties
│   └── pom.xml
│
├── hansport_v2fe/        # Frontend React
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

> Tên thư mục có thể thay đổi tùy cách bạn đặt project. Nếu project backend và frontend đang nằm cùng cấp, chỉ cần chạy đúng thư mục tương ứng.

---

## Yêu cầu hệ thống

Trước khi chạy dự án, cần cài đặt:

- Java JDK 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.x
- Git

Kiểm tra phiên bản:

```bash
java -version
mvn -version
node -v
npm -v
mysql --version
```

---

## Cấu hình database

Tạo database MySQL:

```sql
CREATE DATABASE hansport_v2
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

## Cấu hình backend

Mở file:

```text
src/main/resources/application.properties
```

Ví dụ cấu hình cơ bản:

```properties
spring.application.name=hansport

spring.datasource.url=jdbc:mysql://localhost:3306/hansport_v2?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

app.seed.enabled=true
```

Nếu dùng biến môi trường, có thể cấu hình dạng:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/hansport_v2?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:123456}
```

---

## Chạy dự án

### 1. Chạy backend

Di chuyển vào thư mục backend:

```bash
cd hansport_v2be
```

Cài dependency và chạy project:

```bash
mvn clean spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

---

### 2. Chạy frontend

Di chuyển vào thư mục frontend:

```bash
cd hansport_v2fe
```

Cài dependency:

```bash
npm install
```

Chạy React:

```bash
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

## Tài khoản demo

Nếu bật seed dữ liệu:

```properties
app.seed.enabled=true
```

Tài khoản admin mặc định:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@hansport.local` | `Admin@123` |

---

## Dữ liệu seed mặc định

Project có các class seeder trong package:

```text
com.javaweb.config
```

Ví dụ:

```text
AppSettingSeeder.java
DataSeeder.java
```

### AppSettingSeeder

Dùng để thêm dữ liệu cấu hình website ban đầu:

- Banner trang chủ
- Danh mục sản phẩm
- Danh sách thương hiệu
- Danh sách đối tượng sử dụng
- Hotline
- Phí vận chuyển
- Mốc miễn phí vận chuyển

Seeder này thường chỉ chạy khi bảng `app_setting` chưa có dữ liệu.

### DataSeeder

Dùng để thêm dữ liệu hệ thống ban đầu:

- Role `ADMIN`
- Role `USER`
- Tài khoản admin mặc định
- Map hình ảnh sản phẩm nếu sản phẩm đã tồn tại

Có thể bật hoặc tắt bằng:

```properties
app.seed.enabled=true
```

hoặc:

```properties
app.seed.enabled=false
```

---
