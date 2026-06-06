# Admin And Profile QA Checklist

Checklist này dùng để kiểm tra thủ công sau các thay đổi về tài khoản cá nhân và admin UI. Không ghi secret hoặc dữ liệu thật vào tài liệu QA.

## Viewports

- [ ] Mobile: `390x844`
- [ ] Tablet: `768x1024`
- [ ] Desktop: `1440x900`

## Tài Khoản Cá Nhân

- [ ] Đăng nhập thường hiển thị đúng tên, email, số điện thoại và địa chỉ.
- [ ] Google login, nếu cấu hình, vẫn normalize đúng `fullName`.
- [ ] Form thông tin cá nhân disable nút lưu khi chưa có thay đổi.
- [ ] Họ tên dưới 3 ký tự hiển thị lỗi gần input.
- [ ] Số điện thoại sai định dạng hiển thị lỗi gần input.
- [ ] Lưu profile cập nhật UI ngay, không cần đăng nhập lại.
- [ ] Tab địa chỉ lưu được địa chỉ mặc định.
- [ ] Tab bảo mật chặn confirm password không khớp.
- [ ] Đổi mật khẩu thành công logout về trang đăng nhập.
- [ ] Summary card đơn hàng dùng dữ liệu thật, không có thống kê giả wishlist/member.

## Checkout, Cart, My Orders

- [ ] Checkout chỉ hiển thị COD, không trình bày VNPAY như chức năng đã hoạt động.
- [ ] Checkout lỗi hiển thị bằng toast, không dùng browser alert.
- [ ] Cart không cho checkout khi chưa chọn sản phẩm và hiển thị toast rõ ràng.
- [ ] My Orders hủy đơn dùng confirm dialog, không dùng browser confirm.
- [ ] My Orders không vỡ layout khi đơn có nhiều sản phẩm.

## Admin Shell

- [ ] Desktop hiển thị sidebar cố định, nội dung không bị che.
- [ ] Mobile/tablet mở/đóng drawer menu được.
- [ ] Nút icon có `aria-label` hoặc `title` rõ nghĩa.
- [ ] Modal/confirm dialog đóng được bằng Escape khi không loading.
- [ ] Không thấy text mojibake trong AdminLayout, Dashboard, Products, Orders, Users, Settings.

## Admin Dashboard

- [ ] Dashboard lấy số liệu từ API summary, không tự tính doanh thu từ vài đơn gần đây.
- [ ] Recent orders hiển thị empty state khi chưa có đơn.
- [ ] Low stock card đổi màu cảnh báo khi có sản phẩm sắp hết hàng.
- [ ] Quick actions đi đúng route admin.

## Admin Products

- [ ] Tìm kiếm sản phẩm reset về trang đầu.
- [ ] Add/edit product modal không tràn màn hình mobile.
- [ ] Upload ảnh hiển thị loading và lỗi rõ ràng.
- [ ] Xóa sản phẩm dùng confirm dialog.
- [ ] Bảng sản phẩm scroll ngang trên mobile, không làm vỡ layout.

## Admin Orders

- [ ] Filter status reset về trang đầu.
- [ ] Click row mở/đóng panel chi tiết.
- [ ] Panel chi tiết nằm dưới bảng trên mobile/tablet và nằm cạnh bảng trên desktop rộng.
- [ ] Cập nhật trạng thái hiển thị toast.
- [ ] Khi chuyển sang `PROCESSING`, lỗi gửi email không làm mất trạng thái đã cập nhật.
- [ ] Xóa đơn hàng dùng confirm dialog.

## Admin Users

- [ ] Admin không thể tự xóa tài khoản đang đăng nhập ở UI.
- [ ] Backend cũng chặn self-delete nếu gọi API trực tiếp.
- [ ] Add/edit user modal có label rõ.
- [ ] Role hiển thị đúng badge.
- [ ] Bảng user scroll ngang trên mobile.

## Admin Settings

- [ ] Settings chia tab Banner, Menu, Catalog, Vận chuyển, Liên hệ.
- [ ] Path menu/category/banner nội bộ phải bắt đầu bằng `/`.
- [ ] Shipping fee và free ship limit phải là số không âm.
- [ ] Banner preview hiển thị đúng ảnh sau upload.
- [ ] Lưu settings thành công đồng bộ lại giao diện client.

## Verification Commands

```bash
cd hansport_v2fe
npm run lint
npm run build

cd ../hansport_v2be
mvn test
```
