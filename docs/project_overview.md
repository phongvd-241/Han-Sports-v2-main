# Phân tích Tổng quan Project Han Sports v2

Dựa trên source code hiện có trong workspace, dưới đây là bài phân tích tổng quan về project **Han Sports v2**.

## 1. Project giải quyết bài toán gì?
Han Sports v2 là một hệ thống **website thương mại điện tử chuyên bán đồ thể thao**. Nó giải quyết bài toán mua sắm trực tuyến cho khách hàng (tìm kiếm, đặt hàng) và cung cấp một hệ thống quản trị nội dung/bán hàng số hóa cho chủ cửa hàng. Thanh toán trực tuyến chưa được triển khai, hệ thống hiện tại đang tập trung giải quyết luồng đặt hàng và thanh toán khi nhận hàng (COD).

## 2. Đối tượng người dùng là ai?
Hệ thống phân chia rõ ràng làm 2 đối tượng người dùng chính:
- **Khách hàng (Customer)**: Những người truy cập vào website để tìm kiếm, mua sắm đồ thể thao và theo dõi đơn hàng của họ.
- **Quản trị viên (Admin)**: Chủ cửa hàng hoặc nhân viên quản lý website, có quyền truy cập vào trang dashboard riêng để vận hành hệ thống, quản lý thông tin sản phẩm, đơn hàng và khách hàng.

## 3. Các nhóm chức năng chính là gì?
Hệ thống có các nhóm chức năng sau:
- **Dành cho Khách hàng**:
  - Đăng ký, đăng nhập (hỗ trợ cả Google Login) và quản lý tài khoản/đổi mật khẩu.
  - Xem danh sách, tìm kiếm và lọc sản phẩm.
  - Quản lý giỏ hàng và đặt hàng (Thanh toán COD).
  - Theo dõi lịch sử/trạng thái đơn hàng.
- **Dành cho Quản trị viên**:
  - Dashboard thống kê dữ liệu.
  - Quản lý danh mục/sản phẩm (Hỗ trợ tính năng upload nhiều ảnh và Import sản phẩm hàng loạt qua file Excel/CSV bằng `Apache POI`).
  - Quản lý trạng thái đơn hàng.
  - Quản lý tài khoản người dùng và phân quyền hệ thống.

## 4. Frontend, backend, database phối hợp với nhau như thế nào?
Hệ thống phối hợp thông qua cơ chế Containerization (Docker) được định nghĩa trong `docker-compose.yml`:
- **Frontend** (`hansport-frontend` container ở port `5173`): Đóng vai trò là Client, render giao diện, quản lý state bằng `Zustand` và gửi các HTTP Request (qua `Axios`) đến Backend.
- **Backend** (`hansport-backend` container ở port `8080`): Đóng vai trò là Server cung cấp REST API. Nó tiếp nhận request từ Frontend, kiểm tra bảo mật (Xác thực token JWT qua Spring Security), xử lý logic nghiệp vụ và truy vấn dữ liệu từ Database.
- **Database** (`hansport-mysql` container ở port `3306`): Lưu trữ toàn bộ dữ liệu. Backend kết nối đến DB thông qua JDBC/Hibernate. Ngoài ra, cấu trúc DB được khởi tạo và kiểm soát phiên bản tự động bằng `Flyway` mỗi khi backend khởi động lại.

## 5. Project dùng những công nghệ nào?
Những công nghệ chính được hệ thống sử dụng:
- **Frontend**: `React 19`, `Vite`, `Zustand` (State management), `React Router DOM` (Routing), `Axios` (HTTP Client), `Tailwind CSS` (Styling).
- **Backend**: `Java 17`, `Spring Boot 3.2.2`, `Spring Security` (OAuth2 Resource Server & JWT), `Spring Data JPA` (ORM), `Apache POI` (Xử lý Excel), `Thymeleaf` & `Spring Mail` (Gửi email).
- **Database**: `MySQL 8.0` và `Flyway` (Database Migration).
- **DevOps/Deployment**: `Docker` và `Docker Compose`.

## 6. Kiến trúc tổng thể đang là gì?
Kiến trúc ở cấp độ toàn hệ thống là **Client-Server** giao tiếp thông qua **REST API** (Frontend và Backend tách rời hoàn toàn).

Ở cấp độ Backend, mã nguồn tuân theo thiết kế **Layered Architecture (Kiến trúc phân tầng)** truyền thống của Spring Boot, được tổ chức rất quy chuẩn trong cấu trúc source code:
- **Controller Layer (`controller`)**: Chứa các REST Controller tiếp nhận request từ Client.
- **Service Layer (`service`)**: Xử lý logic nghiệp vụ, tính toán.
- **Repository Layer (`repository`)**: Data Access Layer, dùng Spring Data JPA để tương tác với Database.
- **Domain/Model Layer (`domain`)**: Chứa Entity mapped với database và các DTO (Request/Response Object).

## 7. Sơ đồ mô tả kiến trúc tổng thể

```mermaid
graph TD
    User([Khách hàng / Admin])
    
    subgraph Frontend ["Frontend (React / Vite)"]
        UI[Giao diện React]
        Zustand[Zustand State]
        Axios[Axios HTTP Client]
    end
    
    subgraph Backend ["Backend (Spring Boot REST API)"]
        Security[Spring Security & JWT Filter]
        Controller[Controller Layer]
        Service[Service Layer]
        Repository[Repository Layer (Spring Data JPA)]
    end
    
    subgraph Database ["Database (MySQL 8.0)"]
        DB[(MySQL Database)]
        Flyway[Flyway Migration]
    end
    
    User -->|Tương tác web| UI
    UI <--> Zustand
    UI -->|Gọi API| Axios
    
    Axios -->|HTTP/REST Request| Security
    Security -->|Xác thực hợp lệ| Controller
    Controller -->|Truyền DTO| Service
    Service -->|Gọi DB| Repository
    
    Repository <-->|Hibernate/JDBC| DB
    Flyway -->|Tự động đồng bộ Schema| DB
```
