# Báo cáo Đánh giá Bảo mật (Security Review) - Han Sports v2

Qua quá trình kiểm tra mã nguồn hệ thống Han Sports v2, hệ thống đã áp dụng các Best Practices về xác thực và phân quyền, mã hóa mật khẩu, và bảo vệ File Upload. Tuy nhiên, vẫn tồn tại một số điểm yếu rủi ro bảo mật từ thấp đến cao cần khắc phục.

---

## 1. Các hạng mục có Thiết kế Tốt (Good Practices)
- **Mã hóa mật khẩu**: Sử dụng `BCryptPasswordEncoder` (tiêu chuẩn công nghiệp) để hash mật khẩu trong DB.
- **Upload File an toàn**: `FileService.java` không chỉ check tên đuôi mở rộng (`.png`, `.jpg`) mà còn kiểm tra sâu vào **Magic Numbers** (chữ ký Byte) để ngăn chặn việc hacker nhét file thực thi (`.exe`, `.sh`) giả danh hình ảnh.
- **Bảo mật SQL Injection**: Hệ thống tuân thủ dùng ORM (Spring Data JPA) với các truy vấn `@Query` kiểu tham số (`:productId`), tự động escape data, không phát hiện ghép chuỗi (String concatenation) ở SQL.
- **Quản lý Secrets**: Các key quan trọng (`JWT_BASE64_SECRET`, `DB_PASSWORD`) không bị hardcode mà được đẩy ra `docker-compose.yml` kết hợp với biến môi trường `${}`.

---

## 2. Bảng Tổng hợp Rủi ro & Cách khắc phục

| Vấn đề | File liên quan | Mức độ rủi ro | Bằng chứng từ code | Cách khắc phục |
| :--- | :--- | :--- | :--- | :--- |
| **1. Rò rỉ bộ nhớ (Memory Leak) ở bộ đếm Rate Limit** | `AuthRateLimitFilter.java` | **Cao (High)** | Khai báo `Map<String, Counter> counters = new ConcurrentHashMap<>()` nhưng không có luồng nào xóa (evict) các IP cũ đã hết hạn cửa sổ đếm. | Một đợt tấn công DDoS với hàng triệu IP giả (IP Spoofing) sẽ làm biến `counters` phình to gây tràn RAM (OOM). Đề xuất thay thế bằng **Guava Cache** (có expireAfterWrite) hoặc thư viện **Bucket4j / Redis**. |
| **2. Lộ thông tin qua Error Message (Information Disclosure)** | `GlobalException.java` | **Trung Bình (Medium)** | Ở handler lỗi tổng `Exception.class`, trả về `res.setMessage(ex.getMessage());`. | Các lỗi như đứt kết nối DB, cú pháp SQL sai, NullPointer có thể bị lộ kèm theo cấu trúc thu mục server. Cần ẩn `ex.getMessage()`, log ra server bằng SLF4J, và trả về trình duyệt chuỗi: `"Đã có lỗi hệ thống xảy ra"`. |
| **3. Thiếu cơ chế thu hồi Access Token (No Revocation)** | `AuthController.java` (Hàm `logoutAccount`) | **Trung Bình (Medium)** | Khi gọi `/api/v1/auth/logout`, hệ thống chỉ xóa `refresh_token` dưới DB và Cookie. Nhưng Access Token chưa hết hạn vẫn sống. | Hacker chép được Access Token trước lúc logout có thể dùng đến lúc hết hạn. Cần thêm cơ chế Token Blacklist (lưu trong RAM hoặc Redis) cho các JWT đã chủ động bị đăng xuất. |
| **4. Tắt CSRF trong khi có sử dụng Cookie** | `SecurityConfiguration.java` | **Thấp (Low)** | Code gọi lệnh `.csrf(c -> c.disable());`. Nhưng luồng `/api/v1/auth/refresh` lại sử dụng HTTP-Only Cookie làm xác thực. | Trình duyệt mặc định gửi Cookie ở các cross-site request. Mặc dù CORS cấm attacker đọc response, chúng vẫn có thể gửi fake request bắt server xử lý. Khuyến nghị bật lại `.csrf()` hoặc tích hợp `CookieCsrfTokenRepository`. |
| **5. Rủi ro CORS trên môi trường DEV** | `CorsConfig.java` | **Thấp (Low)** | `allowLocalhost` mặc định là `true`, sẽ mở rộng cấp phép cho `http://localhost:*` và `127.0.0.1:*`. | Bất kỳ web app nào chạy ở port local khác đều có thể gọi api của Han Sports. Mặc dù `docker-compose.yml` đã gán `false` để ghi đè, nhưng cần chú ý khi mang file jar lên các môi trường khác deploy. |

---

## 3. Khuyến nghị Bổ sung
1. **Password Policy**: API Register chưa có filter kiểm tra mật khẩu đủ mạnh (ít nhất 8 ký tự, bao gồm số và chữ cái viết hoa). Nên bổ sung Regex validation tại `ReqRegisterDTO`.
2. **Brute Force Lock**: Ngoài việc chặn IP (Rate Limit), hệ thống nên có bảng log số lần nhập sai Password của 1 tài khoản (Email). Sai quá 5 lần thì Block account đó 15 phút. Việc chặn IP là chưa đủ vì hacker có thể xoay (rotate) IP liên tục.
