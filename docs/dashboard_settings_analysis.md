# Phân tích Admin Dashboard & Cấu hình hệ thống (Settings)

Hai module Dashboard và Settings là những chức năng quan trọng giúp Quản trị viên (Admin) nắm bắt tình hình kinh doanh và thay đổi cấu hình website theo thời gian thực mà không cần deploy lại code.

## 1. Phân tích Admin Dashboard

### 1.1. Frontend (`DashboardPage.jsx`)
- Sử dụng Custom Hook `useDashboard` để gọi API `/api/v1/admin/dashboard/summary`.
- Render dữ liệu dạng tổng quan qua các thẻ `AdminMetricCard` (Số lượng sản phẩm, doanh thu, đơn hàng).
- Tích hợp thư viện **Chart.js** (thông qua `react-chartjs-2`) để vẽ biểu đồ đường (Line Chart) cho Doanh thu 7 ngày qua và Biểu đồ cột (Bar Chart) cho top sản phẩm bán chạy.

### 1.2. Backend (`DashboardController` & `DashboardService`)
- Khi Admin truy cập, Controller chuyển tiếp gọi `DashboardService.getSummary()`.
- **Dữ liệu được lấy từ Database**:
  - `TotalProducts`, `TotalUsers`, `TotalOrders`: Dùng hàm `count()` cơ bản của JPA.
  - `RevenueTotal` và `RevenueRecent`: Dùng Query SQL `sumTotalPrice()` từ bảng `Order`.
  - `LowStockCount`: Đếm các sản phẩm có `quantity <= 5`.
  - `DailyRevenue`: Dùng vòng lặp 7 ngày, tính khoảng `dayStart` đến `dayEnd` và tính tổng tiền các đơn hàng `COMPLETED` trong khoảng đó.
- **Tính năng Mocking (Đáng chú ý)**:
  - Nếu DB chưa có Order nào (mới khởi tạo), service sẽ trả về bộ dữ liệu Mock (giả lập) bao gồm *Daily Orders*, *Monthly Revenue*, *Top Products* để biểu đồ trên Frontend không bị trống, giúp Admin hình dung được thiết kế của hệ thống.
  - Nếu có từ 1 Order trở lên, Service sẽ tự động tính toán dữ liệu thật từ List All Orders. Mặc dù logic tính toán bằng Java Loop khá tiện trong lúc đầu, nhưng nếu hệ thống có hàng triệu đơn hàng, việc load toàn bộ `findAll()` ra RAM để tính doanh thu sẽ gây tràn bộ nhớ (OOM). Đây là điểm cần tối ưu bằng SQL `GROUP BY` thuần sau này.

---

## 2. Phân tích Cấu hình hệ thống (Settings)

### 2.1. Frontend (`SettingsPage.jsx`)
- Giao diện cung cấp form nhập liệu các thông số: Hotline, Phí giao hàng, Giới hạn Free ship.
- Hỗ trợ giao diện kéo thả (Drag & Drop), thêm mới, xóa cho các danh sách động như: Banners, Categories (Danh mục), Navigation (Menu điều hướng).
- Khi Submit, gọi `settingApi.updateSiteSettings()` gom toàn bộ cục JSON gửi xuống Backend.

### 2.2. Backend (`AppSettingController` & `AppSettingService`)
- **Hai Endpoint chính**:
  - `GET /api/v1/settings`: Public endpoint. Lấy toàn bộ setting.
  - `PUT /api/v1/admin/settings/site`: Ghi đè cập nhật setting, yêu cầu quyền `ADMIN`.
- **Logic cập nhật**: Service nhận DTO dạng Object Tree lớn. Nó tách lẻ từng thuộc tính, Serialize thành chuỗi JSON (Dùng `ObjectMapper`) và lưu xuống DB.

### 2.3. Vấn đề "Source of Truth" giữa bảng Settings và Site Content
Hệ thống sử dụng hai cách lưu trữ song song:
1. Bảng `settings`: Lưu trữ Key-Value truyền thống (VD: `HOTLINE` -> `0901234567`). Đối với Array phức tạp (như danh sách Banner), nó Serialize mảng Object thành 1 chuỗi JSON dài và nhét vào cột `setting_value`.
2. Bảng cấu trúc (`site_banners`, `site_categories`, `site_navigation_items`): Các bảng SQL truyền thống có cột đàng hoàng (id, name, path, icon...).

**Phân tích code trong `AppSettingService.updateSiteSettings()`:**
```java
// Vừa lưu JSON dạng String vào bảng settings
updateSetting("HERO_SLIDES", objectMapper.writeValueAsString(settings.getHeroSlides()));
// Lại vừa bóc tách từng phần tử lưu vào bảng site_banners
replaceBanners(settings.getHeroSlides());
```

Khi lấy dữ liệu ra (`getAllSettings()`), hệ thống query bảng `site_banners`, parse ra DTO và **ghi đè** ngược lại Key `HERO_SLIDES`. 
=> **Nguồn sự thật (Source of Truth)** thực tế lúc Read là các bảng cấu trúc (`site_banners`,...), nhưng hệ thống lại đang lưu thừa một bản Copy dạng JSON trong bảng `settings`. Điều này gây ra sự dư thừa dữ liệu (Data Redundancy) và rủi ro bất đồng bộ nếu ai đó sửa thẳng DB bảng này mà quên bảng kia.

---

## 3. Đề xuất cải thiện Module Settings

1. **Chuẩn hóa Source of Truth**: Loại bỏ hoàn toàn việc lưu các Key `HERO_SLIDES`, `CATEGORIES`, `HEADER_NAV` trong bảng `settings`. Chỉ lưu chúng ở các bảng `site_*`. Khi API trả về, ghép nối chúng lại là đủ. Bảng `settings` chỉ nên lưu Key-Value đơn giản (Hotline, Config chữ).
2. **Cơ chế Cache**: Các thông tin như Banner, Category hầu như không thay đổi hằng ngày nhưng lại được gọi ở TẤT CẢ request từ người dùng (Hiển thị Header). Nên tích hợp **Redis** hoặc `@Cacheable` của Spring Boot để lưu map Settings này trên RAM, tránh query DB lặp lại vô ích. (Hiện tại Frontend có dùng Zustand để cache 1 lần phía trình duyệt là một điểm sáng cứu vớt performance).
3. **Tối ưu Dashboard Query**: Các báo cáo như Monthly Revenue, Top Product nên được chuyển thành `@Query` JPQL chạy thẳng dưới Database (Dùng `GROUP BY MONTH`, `SUM`, `LIMIT`). Tránh dùng `orderRepository.findAll()` rồi dùng For loop Java để tính toán.
