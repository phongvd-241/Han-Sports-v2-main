# Implementation Changes

File này tóm tắt các thay đổi đã được triển khai để hoàn thiện HanSport v2 thành project demo full-stack.

## 1. Backend stability and configuration

- Chuẩn hóa `application.properties` để dùng biến môi trường cho database, JWT, upload path, frontend URL, cookie secure và seed data.
- Thêm H2 test dependency để backend test không phụ thuộc MySQL local.
- Cập nhật test context để kiểm tra seed role, user demo và sản phẩm demo.

## 2. Backend architecture, validation, and DTO

- Thêm request DTO cho login, register, user create/update, product create/update, cart add và order status update.
- Chuyển user/product controller sang nhận DTO thay vì nhận entity trực tiếp.
- Chuyển password validation sang request DTO để tránh validate bcrypt hash trong entity.
- Chuẩn hóa response product/cart/order để có `image` phục vụ frontend.

## 3. Auth, authorization, and demo data

- Thêm endpoint register user.
- JWT access/refresh token có claim `roles`.
- Spring Security phân quyền `ADMIN` và `USER`.
- `UserDetailsCustom` lấy role thật từ database thay vì hard-code `ROLE_USER`.
- Thêm `RoleRepository` và `DataSeeder` tạo role, tài khoản demo, sản phẩm mẫu.

## 4. Business flows

- Sửa cart để xử lý cart rỗng, validate số lượng, kiểm tra tồn kho và chặn xóa cart item không thuộc user.
- Sửa order để tính tổng tiền = giá x số lượng, trừ tồn kho, tăng số đã bán, xóa cart sau checkout.
- Thêm API xem đơn hàng của user và cập nhật trạng thái đơn hàng cho admin.

## 5. Upload and static resources

- Chuyển upload config từ URI tuyệt đối sang base path cấu hình được.
- Whitelist folder upload `product`.
- Chuẩn hóa tên file, chặn path traversal và không wrap response download file.

## 6. Frontend React/Vite

- Tạo frontend React/Vite mới trong `hansport_v2fe`.
- Thêm API client dùng JWT bearer token và cookie credentials.
- Thêm các màn hình: shop, login/register, cart, checkout, user orders, admin products/users/orders.
- Admin có upload ảnh sản phẩm, CRUD sản phẩm/user và cập nhật trạng thái đơn hàng.
- Nâng Vite lên bản không còn vulnerability theo `npm audit`.

## 7. Documentation and demo

- Thêm README hướng dẫn cài đặt, cấu hình, chạy backend/frontend và tài khoản demo.
- Thêm DEMO_SCRIPT hướng dẫn flow demo 5-10 phút.
- Thêm `.gitignore` cho target, node_modules, dist, env và log.

## Verification

- `npm install`: pass.
- `npm run build`: pass.
- `npm audit --audit-level=moderate`: pass, 0 vulnerabilities.
- Frontend dev server: `http://127.0.0.1:5173`, HTTP 200.
- Backend Maven test chưa chạy được trong môi trường hiện tại vì `java` và `mvn` chưa có trong PATH.
