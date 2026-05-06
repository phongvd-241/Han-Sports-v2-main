# Kịch Bản Demo HanSport v2

## Mục tiêu demo

Chứng minh project chạy được end-to-end: user mua hàng, admin quản trị dữ liệu, backend có phân quyền và dữ liệu demo rõ ràng.

## Tài khoản demo

- Admin: `admin@hansport.local` / `Admin@123`
- User: `user@hansport.local` / `User@123`

## Chuẩn bị trước demo

1. Chạy MySQL và tạo database `hansport_v2`.
2. Chạy backend:

```powershell
cd hansport_v2be
mvn spring-boot:run
```

3. Chạy frontend:

```powershell
cd hansport_v2fe
npm run dev
```

4. Mở `http://localhost:5173`.

## Thứ tự demo đề xuất

1. Mở trang sản phẩm.
   - Kết quả mong đợi: hiển thị danh sách sản phẩm seed từ database.
   - Nên nói: dữ liệu lấy từ Spring Boot API, không hard-code trên frontend.

2. Đăng nhập bằng user demo.
   - Click `Dang nhap`.
   - Nhập `user@hansport.local` / `User@123`.
   - Kết quả mong đợi: quay về trang sản phẩm, menu có giỏ hàng và đơn hàng.

3. Thêm sản phẩm vào giỏ hàng.
   - Click `Them` ở một sản phẩm.
   - Vào `Gio hang`.
   - Kết quả mong đợi: sản phẩm xuất hiện, tổng tiền = giá x số lượng.

4. Đặt hàng.
   - Nhập người nhận, số điện thoại, địa chỉ.
   - Click `Dat hang`.
   - Kết quả mong đợi: giỏ hàng rỗng, đơn mới xuất hiện trong danh sách đơn gần đây.
   - Nên nói: backend kiểm tra tồn kho, trừ số lượng sản phẩm và xóa cart sau checkout.

5. Đăng xuất user, đăng nhập admin.
   - Email `admin@hansport.local`, password `Admin@123`.
   - Kết quả mong đợi: xuất hiện menu `Quan tri`.

6. Quản lý sản phẩm.
   - Vào `Quan tri` -> tab `San pham`.
   - Thêm hoặc sửa sản phẩm, có thể upload ảnh.
   - Kết quả mong đợi: sản phẩm lưu vào database và hiển thị ở trang sản phẩm.

7. Quản lý tài khoản.
   - Chuyển tab `Tai khoan`.
   - Thêm user mới hoặc sửa role.
   - Kết quả mong đợi: dữ liệu user cập nhật qua API admin.

8. Quản lý đơn hàng.
   - Chuyển tab `Don hang`.
   - Cập nhật trạng thái từ `PENDING` sang `CONFIRMED` hoặc `SHIPPING`.
   - Kết quả mong đợi: trạng thái đơn hàng cập nhật ngay.

9. Kiểm tra phân quyền.
   - Đăng nhập user thường và thử vào `#admin`.
   - Kết quả mong đợi: bị chuyển về shop, API admin cũng trả 403 nếu gọi trực tiếp.

## Điểm nên nói với giảng viên

- Backend tách Controller, Service, Repository, DTO request/response.
- JWT có role claim, Spring Security phân quyền API.
- Config quan trọng đã tách qua biến môi trường.
- Test backend dùng H2 để không phụ thuộc MySQL khi chạy kiểm thử.
- Frontend React gọi REST API thật, có loading/empty/error state cơ bản.

## Điểm cần tránh

- Không reset database ngay trước demo nếu chưa chắc seed chạy thành công.
- Không bật `COOKIE_SECURE=true` khi demo local bằng HTTP.
- Không đổi port backend/frontend nếu chưa cập nhật `FRONTEND_URL` và `VITE_API_BASE_URL`.
