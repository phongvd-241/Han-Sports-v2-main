# Han Sports - E-commerce Platform v2

**Han Sports** là nền tảng thương mại điện tử chuyên nghiệp dành cho các sản phẩm thể thao. Project được xây dựng theo kiến trúc hiện đại với sự kết hợp mạnh mẽ giữa **Spring Boot (Backend)** và **React (Frontend)**, mang lại trải nghiệm mượt mà và an toàn cho người dùng.

---

## Tính Năng Nổi Bật

### Dành cho Khách hàng (User)

- **Hệ thống xác thực**: Đăng ký, đăng nhập và bảo mật tài khoản bằng JWT.
- **Trải nghiệm mua sắm**: Xem danh mục sản phẩm, chi tiết sản phẩm với giao diện hiện đại.
- **Giỏ hàng thông minh**: Thêm/xóa sản phẩm, cập nhật số lượng và tính tổng tiền thời gian thực.
- **Thanh toán linh hoạt**: Hỗ trợ đặt hàng theo từng phần hoặc toàn bộ giỏ hàng.
- **Theo dõi đơn hàng**: Xem lịch sử mua hàng và trạng thái vận chuyển của từng đơn hàng.
- **Flash Sale**: Bộ đếm ngược thời gian ưu đãi đồng bộ theo phiên làm việc.

### Dành cho Quản trị viên (Admin)

- **Dashboard quản lý**: Theo dõi tổng quan hoạt động kinh doanh.
- **Quản lý sản phẩm**: Thêm mới, chỉnh sửa và tải lên hình ảnh sản phẩm.
- **Quản lý đơn hàng**: Tiếp nhận và cập nhật trạng thái đơn hàng (Chờ xử lý, Đang giao, Hoàn thành, Hủy).
- **Cấu hình hệ thống**: Thay đổi Banner, Hotline và các thông tin chung của website trực tiếp từ giao diện Admin.

---

## 🛠 Công Nghệ Sử Dụng

### Backend

- **Java 17** & **Spring Boot 3.x**
- **Spring Security** & **JWT (JSON Web Token)**
- **Spring Data JPA** (Hibernate)
- **MySQL Database**
- **Maven** (Quản lý thư viện)

### Frontend

- **React.js 18** (Vite)
- **Tailwind CSS** (Styling UI)
- **Zustand** (State Management)
- **React Router Dom** (Navigation)
- **Lucide Icons** & **Material Symbols**

---

## Hướng Dẫn Cài Đặt

### 1. Yêu cầu hệ thống

- Java 17+
- Node.js 18+
- MySQL 8.x

### 2. Cấu hình Database

Tạo database MySQL mới:

```sql
CREATE DATABASE hansport_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Khởi chạy Backend

```bash
cd hansport_v2be
mvn clean spring-boot:run
```

_Mặc định chạy tại: `http://localhost:8080`_

### 4. Khởi chạy Frontend

```bash
cd hansport_v2fe
npm install
npm run dev
```

_Mặc định chạy tại: `http://localhost:5173`_

---

## Tài Khoản Demo

| Vai trò           | Email                  | Mật khẩu    |
| :---------------- | :--------------------- | :---------- |
| **Quản trị viên** | `admin@hansport.local` | `Admin@123` |

---

## Cấu Trúc Thư Mục

- `hansport_v2be/`: Mã nguồn máy chủ Spring Boot.
- `hansport_v2fe/`: Mã nguồn giao diện React.
- `hansport_v2fe/upload/`: Thư mục lưu trữ hình ảnh sản phẩm và banner.

---

## 🛡 Bảo Mật và Lưu Ý

- Ứng dụng sử dụng **Refresh Token** lưu trữ trong **HTTP-Only Cookie** để tối ưu bảo mật.
- Khi triển khai thực tế (Production), hãy đổi `COOKIE_SECURE=true` trong cấu hình backend.
- Hình ảnh được lưu trữ cục bộ tại server, hãy đảm bảo phân quyền ghi cho thư mục `upload`.

---

© 2026 **Han Sports Team**. All rights reserved.
