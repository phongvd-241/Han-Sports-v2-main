# Phân tích Service Layer - Backend Han Sports v2

Service layer trong hệ thống Han Sports v2 đóng vai trò trung tâm xử lý business logic, thao tác với Repository và trả về các DTO cho Controller. 

## 1. Danh sách các Service hiện có và Nghiệp vụ xử lý
Dưới đây là các service tồn tại trong package `com.javaweb.service`:

1. **`UserService`**: Quản lý người dùng, phân quyền, đăng ký, bảo mật (mã hóa mật khẩu, lưu Refresh Token hash), quản lý hồ sơ và đổi mật khẩu.
2. **`ProductService`**: Quản lý vòng đời sản phẩm (Tạo, Sửa, Xóa), tìm kiếm và lọc nâng cao, quản lý các thuộc tính phân loại và danh sách hình ảnh đính kèm.
3. **`ProductImportService`**: Xử lý logic import sản phẩm hàng loạt từ file Excel (`.xlsx`) hoặc `.csv`, bao gồm cơ chế kiểm tra (dry-run) và ghi dữ liệu.
4. **`CartService`**: Quản lý giỏ hàng của từng user, thêm sản phẩm, cập nhật số lượng, xóa sản phẩm khỏi giỏ hàng. Kiểm tra tồn kho trước khi thêm.
5. **`OrderService`**: Xử lý luồng thanh toán (checkout), trừ số lượng tồn kho, lưu thông tin hóa đơn và gửi email xác nhận.
6. **`FileService`**: Quản lý upload file (đặc biệt là hình ảnh), kiểm tra tính hợp lệ (định dạng, dung lượng, signature của file), lưu trữ trên hệ thống file local.
7. **`AppSettingService`**: Quản lý các cấu hình động của website (Hotline, phí ship, danh sách danh mục, banner trang chủ).
8. **`DashboardService`**: Tổng hợp dữ liệu thống kê cho trang quản trị Admin.
9. **`EmailService`**: Chịu trách nhiệm render template email và gửi qua SMTP.
10. **`GoogleTokenVerifierService`**: Xác thực token OAuth2 của Google trong luồng đăng nhập SSO.

---

## 2. Phân tích chi tiết các Service quan trọng

### 2.1. UserService
- **Input**: Nhận các Request DTO như `ReqUserCreateDTO`, `ReqRegisterDTO`, `ReqAccountUpdateDTO`, `ReqChangePasswordDTO`...
- **Repository được gọi**: `UserRepository`, `RoleRepository`.
- **Entity thao tác**: Tạo mới hoặc cập nhật Entity `User`. (Đọc từ Entity `Role`).
- **Transaction**: Sử dụng `@Transactional` ở tất cả các hàm thay đổi dữ liệu như `createUser`, `register`, `updateUser`, `deleteUserById`, `updateAccountProfile`, `changePassword`.
- **DTO Response**: Service tự khởi tạo các class Response DTO (như `ResUserDTO`, `ResCreateUserDTO`) và gọi các hàm helper thủ công như `convertToResCreateUserDTO()` để map dữ liệu từ Entity sang DTO.

### 2.2. ProductService
- **Input**: `ReqProductDTO`, các tham số lọc tìm kiếm (từ thư viện filter spec, query string).
- **Repository được gọi**: `ProductRepository`, `ProductImageRepository`.
- **Entity thao tác**: Khởi tạo và lưu Entity `Product`, `ProductImage`.
- **Transaction**: `@Transactional` ở hàm tạo, sửa, xóa, và `@Transactional(readOnly = true)` ở các hàm fetch dữ liệu để tối ưu performance.
- **DTO Response**: Áp dụng tương tự, sử dụng các hàm private như `convertToResCreateProductDTO()` hoặc `convertToResProductDTO()`.

### 2.3. ProductImportService
- **Input**: `MultipartFile` từ request, cờ `dryRun`.
- **Repository được gọi**: `ProductRepository`.
- **Entity thao tác**: Khởi tạo mới hoặc cập nhật hàng loạt Entity `Product` và `ProductImage`.
- **Transaction**: Đặt `@Transactional` bao quanh toàn bộ hàm `importProducts`. Nếu `dryRun = false` và không có lỗi, tiến hành lưu toàn bộ, nếu có Exception sẽ rollback tránh rác DB.
- **DTO Response**: Trả về `ResProductImportDTO` chứa báo cáo kết quả (số lượng validate thành công/thất bại).

### 2.4. CartService
- **Input**: Email người dùng lấy từ Context, `ReqAddProductToCartDTO`, cartDetailId.
- **Repository được gọi**: `CartRepository`, `CartDetailRepository`, `UserRepository`, `ProductRepository`.
- **Entity thao tác**: Entity `Cart` và `CartDetail`. Cập nhật `sum` của Cart.
- **Transaction**: Bắt buộc dùng `@Transactional` do thao tác kiểm tra tồn kho, thêm vào Cart Detail và cập nhật tổng số lượng trên Cart (logic liên bảng).
- **DTO Response**: Hàm `convertToResCartDTO()` lồng nhau để xử lý quan hệ One-to-Many giữa Cart và CartDetail.

### 2.5. OrderService
- **Input**: `ReqOrderDTO`, `ReqUpdateOrderStatusDTO`, Email người dùng.
- **Repository được gọi**: `OrderRepository`, `OrderDetailRepository`, `UserRepository`, `CartRepository`, `ProductRepository`.
- **Entity thao tác**: Xóa `CartDetail`, cập nhật lại `Cart`, tạo mới `Order`, `OrderDetail`, cập nhật tồn kho của `Product`.
- **Transaction**: Sử dụng `@Transactional` rất chặt chẽ tại `placeOrder()` vì nó là chuỗi nghiệp vụ quan trọng. Nếu trừ tồn kho không thành công, phải rollback toàn bộ giỏ hàng và Order.
- **DTO Response**: Khởi tạo `ResOrderDTO` và mapping các `ResOrderDetailDTO`.

### 2.6. FileService
- **Input**: `MultipartFile`, tên folder chỉ định (`product`, `logo`, `banner`).
- **Repository được gọi**: Không có. Thao tác trực tiếp với File System (`java.nio.file.Files`).
- **Nghiệp vụ**: Validate size, đuôi mở rộng, MIME type và đặc biệt là kiểm tra Byte signature (ví dụ file JPEG phải bắt đầu bằng `FF D8 FF`) để chống upload mã độc giả mạo hình ảnh.

### 2.7. AppSettingService
- **Input**: `ReqSettingUpdateDTO`, `ReqSiteSettingsDTO`.
- **Repository được gọi**: `AppSettingRepository`, `SiteBannerRepository`, `SiteCategoryRepository`, `SiteNavigationItemRepository`.
- **Transaction**: Dùng `@Transactional` để xóa toàn bộ cấu hình cũ (`deleteAll`) và thêm mới lại toàn bộ banner/category/nav (`saveAll`).
- **Nghiệp vụ**: Serialize/Deserialize chuỗi JSON vào DB bằng `ObjectMapper`.

---

## 3. Sơ đồ luồng (Flow) của Product, Cart, Order

```mermaid
graph TD
    %% Định nghĩa các luồng cho 3 nghiệp vụ chính

    subgraph "1. Product Flow (Admin Tạo Sản Phẩm)"
        A1[Admin (Client)] -->|POST /api/v1/products\nDTO: ReqProductDTO| B1(ProductController)
        B1 -->|handleSaveProduct| C1(ProductService)
        C1 -->|Check SKU / Name tồn tại| D1[(ProductRepository)]
        C1 -->|Save Product| D1
        C1 -->|Lưu hình ảnh| E1[(ProductImageRepository)]
        C1 -->|Format Response| B1
        B1 -->|Return DTO| A1
    end

    subgraph "2. Cart Flow (User Thêm Giỏ Hàng)"
        A2[User (Client)] -->|POST /api/v1/carts/add| B2(CartController)
        B2 -->|Lấy Context Email| C2(CartService)
        C2 -->|1. Find User| D2[(UserRepository)]
        C2 -->|2. Check/Tạo Cart| E2[(CartRepository)]
        C2 -->|3. Validate Stock| F2[(ProductRepository)]
        C2 -->|4. Lưu CartDetail| G2[(CartDetailRepository)]
        C2 -->|5. Update Cart Sum| E2
        C2 -->|Return ResCartDTO| B2
        B2 -->|JSON Response| A2
    end

    subgraph "3. Order Flow (Checkout)"
        A3[User (Client)] -->|POST /api/v1/orders| B3(OrderController)
        B3 -->|placeOrder(Email, DTO)| C3(OrderService)
        C3 -->|1. Kiểm tra Cart Details| E3[(CartRepository)]
        C3 -->|2. Tạo Order mới| D3[(OrderRepository)]
        C3 -->|3. Loop qua SP: Trừ Tồn Kho| F3[(ProductRepository)]
        C3 -->|4. Lưu OrderDetail| G3[(OrderDetailRepository)]
        C3 -->|5. Clear Cart/CartDetail| E3
        C3 -->|Return ResOrderDTO| B3
        B3 -->|JSON Response| A3
    end
```

---

## 4. Gợi ý Refactor Logic (Sang Mapper / Helper)

Qua quá trình phân tích code, phát hiện ra các pattern có thể được tách biệt ra để source code clean hơn:

1. **Object Mapping (DTO <-> Entity)**:
   - *Hiện trạng*: Trong `UserService`, `ProductService`, `CartService`, `OrderService`, có vô số hàm như `convertToResUpdateUserDTO()`, `applyProductRequest()`. Việc gán giá trị từng trường `a.setField(b.getField())` tốn hàng trăm dòng code.
   - *Khuyến nghị*: Nên sử dụng thư viện **MapStruct** hoặc **ModelMapper**. Tạo package `mapper` và định nghĩa các interface MapStruct để tự động hóa việc convert.

2. **Parsing Logic (ProductImportService)**:
   - *Hiện trạng*: Việc đọc file Excel (Apache POI) và đọc file CSV nằm gộp toàn bộ trong `ProductImportService`, khiến file bị phình to (>500 lines).
   - *Khuyến nghị*: Tách logic đọc file ra các helper class `ExcelHelper` và `CsvHelper`. Chỉ giữ lại logic Validate và Lưu xuống DB trong Service.

3. **String / Option Parsing Helpers**:
   - *Hiện trạng*: `ProductService` và `CartService` dùng chung các logic phân tách String bằng ký tự `|` (hàm `splitOptions`, `joinOptions`).
   - *Khuyến nghị*: Chuyển chúng ra một utility class tĩnh `StringOptionHelper.java` dùng chung để tái sử dụng mã.

4. **File Validation Logic**:
   - *Hiện trạng*: `FileService` có chứa cứng mảng bit byte check signature của JPEG/PNG/WEBP.
   - *Khuyến nghị*: Tạo ra một `FileValidatorUtils` riêng để tăng tính Single Responsibility.
