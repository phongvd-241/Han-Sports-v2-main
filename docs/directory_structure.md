# Phân tích Cấu trúc Thư mục Project Han Sports v2

Dưới đây là bài phân tích chi tiết cấu trúc thư mục của project **Han Sports v2** dựa trên source code hiện tại.

## 1. Giải thích các thư mục chính

- **`hansport_v2fe/` (Frontend)**: Chứa toàn bộ mã nguồn của ứng dụng người dùng (UI) được xây dựng bằng React và Vite.
- **`hansport_v2be/` (Backend)**: Chứa toàn bộ mã nguồn của REST API Server xây dựng bằng Java Spring Boot.
- **`docs/`**: Chứa các tài liệu liên quan đến project (ví dụ: các file phân tích kiến trúc, cấu trúc).
- **Docker files**: Mặc dù không có thư mục `docker` riêng biệt, nhưng cấu hình docker nằm tại file `docker-compose.yml` ở thư mục gốc và các file `Dockerfile` nằm bên trong thư mục frontend/backend. Nó định nghĩa cách đóng gói và triển khai hệ thống thành các container.
- **Migration** (`hansport_v2be/src/main/resources/db/migration/`): Chứa các file SQL của Flyway. Flyway dùng các file này để tự động tạo bảng và quản lý cấu trúc schema của database khi backend khởi động.
- **Upload**: Hệ thống không có thư mục code cứng cho `upload`, mà nội dung upload được sinh ra trong quá trình chạy. File ảnh/excel tải lên được mount thông qua Docker Volume (`backend-upload:/app/upload`) để tránh mất dữ liệu khi container bị xóa.

---

## 2. Cấu trúc thư mục Backend (`hansport_v2be/.../com/javaweb/`)
Tuân theo chuẩn kiến trúc **Layered Architecture** của Spring Boot, chia thành các package:

- **`config/`**: Chứa các cấu hình chung của hệ thống (Security, CORS, Flyway, Cloudinary/Upload config...).
- **`controller/`**: Là tầng ngoài cùng tiếp nhận các HTTP Request (GET, POST, PUT, DELETE) từ Frontend và trả về HTTP Response (thường là JSON).
- **`service/`**: Tầng xử lý logic nghiệp vụ trung tâm. Controller sẽ gọi Service để thực hiện các phép toán, kiểm tra điều kiện kinh doanh trước khi gọi vào DB.
- **`repository/`**: Tầng giao tiếp cơ sở dữ liệu. Sử dụng Spring Data JPA (`JpaRepository`) để thao tác (CRUD) với MySQL mà không cần viết quá nhiều câu lệnh SQL thô.
- **`domain/`**: Chứa các lớp biểu diễn dữ liệu. Gồm các **Entity** (ánh xạ 1-1 với bảng trong DB) và các thư mục con như `request`, `response` (Data Transfer Objects - DTO) để giới hạn hoặc mở rộng dữ liệu trả ra cho client mà không lộ entity gốc.
- **`util/`**: Chứa các hàm, class tiện ích dùng chung (helper) cho toàn bộ hệ thống (ví dụ: format date, xử lý chuỗi, mã hóa password, validation custom).

---

## 3. Cấu trúc thư mục Frontend (`hansport_v2fe/src/`)
Được chia theo mô hình Module/Feature để tối ưu quản lý trong React:

- **`api/`**: Nơi cấu hình Axios instance và khai báo các hàm gọi API (endpoint) tương tác với Backend. Tách biệt logic call API ra khỏi giao diện.
- **`components/`**: Chứa các UI Component dùng chung (Button, Input, Modal, ProductCard, Navbar...). Những component này được tái sử dụng nhiều nơi.
- **`pages/`**: Chứa các component ở mức độ màn hình/trang nguyên chỉnh (ví dụ: `HomePage`, `ProductDetailPage`, `CartPage`, `AdminDashboard`).
- **`layouts/`**: Định nghĩa bố cục khung của trang web (Header + Content + Footer) hoặc khung của trang Admin (Sidebar + Content). `pages` sẽ được nhúng vào trong các layout này.
- **`store/`**: Quản lý State toàn cục (Global State) bằng thư viện `Zustand`. Chứa trạng thái của giỏ hàng, thông tin user đã đăng nhập, v.v.
- **`utils/`**: Chứa các hàm tiện ích hỗ trợ phía frontend (ví dụ: format tiền tệ VNĐ, xử lý chuỗi, validate token).

---

## 4. Bảng tóm tắt đường dẫn và vai trò

| Đường dẫn (Path) | Vai trò | Các File / Folder quan trọng | Module liên quan |
| :--- | :--- | :--- | :--- |
| `hansport_v2fe/src/` | Chứa code UI React | `App.jsx`, `main.jsx` | Frontend UI |
| `hansport_v2be/src/main/java/` | Chứa code Backend Java | `HansportApplication.java` | Backend API Server |
| `hansport_v2fe/src/store/` | Quản lý state toàn cục | Tùy thuộc file (ví dụ `authStore.js`) | Frontend (Zustand) |
| `hansport_v2fe/src/api/` | Gọi API đến Backend | `axiosConfig`, các API services | Integration |
| `.../javaweb/controller/` | Tiếp nhận HTTP Request | `ProductController.java`, v.v. | Backend Routing |
| `.../javaweb/domain/` | Định nghĩa dữ liệu truyền tải | Entity class, `request/`, `response/`| Database & API Schema |
| `.../resources/db/migration/`| Quản lý DB version | `V1__init_db.sql` | Database |
| `/docker-compose.yml` | Khởi chạy toàn bộ hệ thống | `docker-compose.yml` | DevOps / Deployment |

---

## 5. Entry point (Điểm khởi chạy) của hệ thống

- **Frontend Entry Point**: File **`hansport_v2fe/src/main.jsx`**. Đây là file đầu tiên được Vite build, nó sẽ khởi tạo cây DOM của React, bọc ứng dụng trong React Router và mount component `App.jsx` vào thẻ `<div id="root">` trong `index.html`.
- **Backend Entry Point**: File **`hansport_v2be/src/main/java/com/javaweb/HansportApplication.java`**. Chứa hàm `main()` có annotation `@SpringBootApplication`. Khi chạy hàm này, Spring Boot sẽ khởi động nhúng Tomcat server và quét toàn bộ các Bean trong cấu trúc thư mục để vận hành server.

---

## 6. Cách các thư mục phối hợp khi User thao tác
**Ví dụ luồng tương tác: User bấm "Thêm vào giỏ hàng" trên Website**

1. **Giao diện (Frontend - `pages` / `components`)**: User bấm nút "Add to Cart" tại trang chi tiết sản phẩm (`pages/`). Component này bắt sự kiện `onClick`.
2. **Quản lý State & Gọi API (Frontend - `store` / `api`)**:
   - Giao diện có thể gọi hàm cập nhật state cục bộ trong `store/` (Zustand) để icon giỏ hàng nhảy số ngay lập tức.
   - Đồng thời, Frontend sử dụng file cấu hình gọi API (trong `api/`) để bắn HTTP POST Request chứa thông tin `productId` và `quantity` đến server.
3. **Tiếp nhận Request (Backend - `controller`)**: Request đi tới Spring Boot. `CartController` (trong `controller/`) sẽ bắt được request POST này, check bảo mật qua `config/` (nếu có yêu cầu đăng nhập).
4. **Xử lý Logic (Backend - `service`)**: Controller gọi phương thức của `CartService` (trong `service/`). Service kiểm tra xem sản phẩm có tồn tại và còn hàng không.
5. **Truyền tải Database (Backend - `repository` & `domain`)**: `CartService` gọi `CartRepository` (trong `repository/`) để lưu thông tin giỏ hàng mới vào cơ sở dữ liệu MySQL (mapped qua các Entity trong `domain/`).
6. **Phản hồi**: Khi lưu thành công, Service trả `CartResponseDTO` về lại cho Controller. Controller trả mã HTTP 200/201 kèm chuỗi JSON về lại cho `api` của Frontend.
7. **Cập nhật UI**: Frontend (qua `Axios`) nhận được phản hồi thành công, hiển thị thông báo (Toast) "Thêm thành công" cho User.
