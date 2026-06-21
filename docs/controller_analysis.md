# Phân tích Controller Layer - Backend Han Sports v2

Bài viết này phân tích chi tiết toàn bộ các Controller trong hệ thống Backend Spring Boot của dự án **Han Sports v2**.

## 1. Danh sách các Controller và Tổng hợp Endpoint

Dưới đây là bảng tổng hợp tất cả 9 Controller đang tồn tại trong package `com.javaweb.controller`, cùng với các endpoint và đặc tả chi tiết của chúng:

| Controller | Endpoint | HTTP Method | Input (Nguồn dữ liệu) | Quyền truy cập | Output (DTO trả về) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`AppSettingController`** | `/api/v1/settings` | GET | Không | Public | `Map<String, String>` |
| | `/api/v1/settings/bulk` | PUT | `@RequestBody List<ReqSettingUpdateDTO>` | ADMIN | `Void` (Status 200) |
| | `/api/v1/admin/settings` | GET | Không | ADMIN | `Map<String, String>` |
| | `/api/v1/admin/settings/site` | PUT | `@RequestBody ReqSiteSettingsDTO` | ADMIN | `Void` (Status 200) |
| **`AuthController`** | `/api/v1/auth/login` | POST | `@RequestBody ReqLoginDTO` | Public | `ResLoginDTO` + Cookie |
| | `/api/v1/auth/google` | POST | `@RequestBody ReqGoogleLoginDTO` | Public | `ResLoginDTO` + Cookie |
| | `/api/v1/auth/register` | POST | `@RequestBody ReqRegisterDTO` | Public | `ResCreateUserDTO` |
| | `/api/v1/auth/account` | GET | `SecurityContext` (Auth token) | User đang Login | `ResLoginDTO.UserGetAccount` |
| | `/api/v1/auth/account` | PUT | `@RequestBody ReqAccountUpdateDTO` | User đang Login | `ResUserDTO` |
| | `/api/v1/auth/refresh` | GET | `@CookieValue refresh_token` | Public (kèm Cookie) | `ResLoginDTO` + Cookie |
| | `/api/v1/auth/logout` | POST | `SecurityContext` (Auth token) | User đang Login | Xóa Cookie |
| | `/api/v1/auth/change-password`| POST | `@RequestBody ReqChangePasswordDTO` | User đang Login | Xóa Cookie |
| **`CartController`** | `/api/v1/carts/add` | POST | `@RequestBody ReqAddProductToCartDTO` | User đang Login | `ResCartDTO` |
| | `/api/v1/carts` | GET | `SecurityContext` (Auth token) | User đang Login | `ResCartDTO` |
| | `/api/v1/carts/{id}` | DELETE | `@PathVariable id` | User đang Login | `Void` (Status 200) |
| | `/api/v1/carts/{id}` | PUT | `@PathVariable id`, `@RequestBody ReqUpdateCartDetailDTO` | User đang Login | `ResCartDTO` |
| **`DashboardController`** | `/api/v1/admin/dashboard/summary`| GET | Không | ADMIN (Theo Config) | `ResDashboardSummaryDTO` |
| **`EmailController`** | `/api/v1/orders/{id}/send-email`| POST | `@PathVariable id` | ADMIN | `Void` |
| **`FileController`** | `/api/v1/files` | POST | `@RequestParam files`, `@RequestParam folder` (Multipart) | Login Required | `ResUploadFileDTO` |
| | `/api/v1/files` | GET | `@RequestParam fileName`, `@RequestParam folder` | Public | `Resource` (File stream) |
| **`OrderController`** | `/api/v1/orders` | POST | `@RequestBody ReqOrderDTO` | User đang Login | `ResOrderDTO` |
| | `/api/v1/orders` | PUT | `@RequestBody ReqUpdateOrderStatusDTO` | ADMIN/User | `ResOrderDTO` |
| | `/api/v1/orders` | GET | `Specification<Order>`, `Pageable` | ADMIN | `ResultPaginationDTO` |
| | `/api/v1/orders/my` | GET | `SecurityContext`, `Pageable` | User đang Login | `ResultPaginationDTO` |
| | `/api/v1/orders/{id}` | DELETE | `@PathVariable id` | User/ADMIN | `Void` |
| **`ProductController`** | `/api/v1/products` | POST | `@RequestBody ReqProductDTO` | ADMIN | `ResCreateProductDTO` |
| | `/api/v1/products` | PUT | `@RequestBody ReqProductDTO` | ADMIN | `ResUpdateProductDTO` |
| | `/api/v1/products/import` | POST | `@RequestParam file` (Multipart) | ADMIN | `ResProductImportDTO` |
| | `/api/v1/products/{id}` | DELETE | `@PathVariable id` | ADMIN | `Void` |
| | `/api/v1/products/{id}` | GET | `@PathVariable id` | Public | `ResProductDTO` |
| | `/api/v1/products/navigation` | GET | Không | Public | `ResProductNavigationDTO` |
| | `/api/v1/products` | GET | `Specification<Product>`, `Pageable`, Params (`q`, `brand`...) | Public | `ResultPaginationDTO` |
| **`UserController`** | `/api/v1/users` | POST | `@RequestBody ReqUserCreateDTO` | ADMIN | `ResCreateUserDTO` |
| | `/api/v1/users` | PUT | `@RequestBody ReqUserUpdateDTO` | ADMIN | `ResUpdateUserDTO` |
| | `/api/v1/users/{id}` | DELETE | `@PathVariable id` | ADMIN | `Void` |
| | `/api/v1/users` | GET | `Specification<User>`, `Pageable` | ADMIN | `ResultPaginationDTO` |
| | `/api/v1/users/{id}` | GET | `@PathVariable id` | ADMIN | `ResUserDTO` |

---

## 2. Phân tích chi tiết 3 Controller quan trọng nhất

### 2.1. `AuthController.java` (Quản lý Xác thực & Tài khoản)
**Đường dẫn file**: `[AuthController.java](file:///D:/web/Han-Sports-v2-main/Han-Sports-v2-main/hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java)`

Đây là Controller cốt lõi quản lý việc cấp phát JWT Token, xử lý đăng nhập (truyền thống & Google) và cấp lại token (Refresh Token).

**Trích đoạn code quan trọng: Đăng nhập truyền thống**
```java
@PostMapping("/auth/login")
public ResponseEntity<ResLoginDTO> login(@RequestBody @Valid ReqLoginDTO loginDTO) {
    // 1. Xác thực thông tin Username và Password qua AuthenticationManager
    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
            loginDTO.getUsername(), loginDTO.getPassword());
    Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

    // 2. Lưu vào SecurityContext
    SecurityContextHolder.getContext().setAuthentication(authentication);

    // 3. Truy xuất User từ DB để tạo thông tin trả về
    User currentUserDB = this.userService.getUserByUsername(loginDTO.getUsername());
    // ... Khởi tạo ResLoginDTO ...

    // 4. Tạo Access Token và Refresh Token qua SecurityUtil
    String access_token = this.securityUtil.createAccessToken(authentication.getName(), resLoginDTO);
    resLoginDTO.setAccessToken(access_token);
    String refresh_token = this.securityUtil.createRefreshToken(loginDTO.getUsername(), resLoginDTO);

    // 5. Lưu Refresh Token băm vào DB và gắn vào HTTP-Only Cookie
    this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(refresh_token), loginDTO.getUsername());
    ResponseCookie resCookies = ResponseCookie.from("refresh_token", refresh_token)
            .httpOnly(true).secure(secureCookie).path("/").sameSite("Lax").maxAge(refreshTokenExpiration).build();

    return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, resCookies.toString()).body(resLoginDTO);
}
```
**Giải thích**: 
- **Input**: `@RequestBody ReqLoginDTO` chứa `username` và `password`.
- **Luồng xử lý**: Gọi `authenticationManagerBuilder` của Spring Security để check mật khẩu. Khi thành công, tạo **Access Token** (trả về trong JSON body) và **Refresh Token** (lưu vào DB và set làm `httpOnly` Cookie để bảo mật chống XSS).
- **Service sử dụng**: `UserService` (truy xuất DB), `SecurityUtil` (Tạo JWT token).

### 2.2. `ProductController.java` (Quản lý Sản phẩm)
**Đường dẫn file**: `[ProductController.java](file:///D:/web/Han-Sports-v2-main/Han-Sports-v2-main/hansport_v2be/src/main/java/com/javaweb/controller/ProductController.java)`

Quản lý tất cả danh mục sản phẩm, bao gồm xem danh sách (có bộ lọc đa dạng cho khách) và tạo/sửa/import (dành cho Admin).

**Trích đoạn code quan trọng: Lấy danh sách sản phẩm với Filter động**
```java
@GetMapping("/products")
@ApiMessage("get all products")
public ResponseEntity<ResultPaginationDTO> getAllProducts(@Filter Specification<Product> spec,
                                                          Pageable pageable,
                                                          @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive,
                                                          // Các RequestParam phục vụ search...
                                                          Authentication authentication){
    // Kiểm tra xem người gọi có phải ADMIN không để cho phép lấy các sản phẩm đang ẩn (Inactive)
    boolean canIncludeInactive = includeInactive && isAdmin(authentication);
    
    // Đẩy xuống ProductService xử lý việc mapping Spec và truy vấn DB
    return ResponseEntity.status(HttpStatus.OK)
            .body(this.productService.fetchAllProducts(
                    spec, pageable, canIncludeInactive, query, brand, target, category, minPrice, maxPrice));
}
```
**Giải thích**: 
- **Input**: Nhận các tham số tìm kiếm qua URL Query (như `?brand=Nike&minPrice=100`). Đặc biệt, tham số `@Filter Specification<Product> spec` là tính năng của thư viện `turkraft.springfilter`, cho phép tự động chuyển cú pháp search trên URL thành các mệnh đề `WHERE` của Hibernate mà không cần code logic tìm kiếm thủ công. Nhận thêm `Pageable` để phân trang.
- **Bảo mật**: Method này Public cho User xem danh sách, nhưng có cơ chế check `isAdmin(authentication)` bên trong thân hàm. Nếu là Admin thì mới xem được các sản phẩm có trạng thái "Inactive".
- **Output**: Trả về `ResultPaginationDTO` (gồm danh sách sản phẩm và siêu dữ liệu phân trang).

### 2.3. `OrderController.java` (Quản lý Đặt hàng)
**Đường dẫn file**: `[OrderController.java](file:///D:/web/Han-Sports-v2-main/Han-Sports-v2-main/hansport_v2be/src/main/java/com/javaweb/controller/OrderController.java)`

Xử lý luồng đặt hàng (Checkout) quan trọng nhất của hệ thống thương mại điện tử.

**Trích đoạn code quan trọng: Tạo Đơn Hàng Mới**
```java
@PostMapping("/orders")
public ResponseEntity<ResOrderDTO> placeOrder(@RequestBody @Valid ReqOrderDTO redOrderDTO) throws com.javaweb.util.error.IdInvalidException {
    // 1. Lấy thông tin email (username) của người dùng đang đăng nhập từ Security Context
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";

    // 2. Giao cho OrderService xử lý logic khởi tạo đơn hàng (trừ tồn kho, lưu chi tiết)
    ResOrderDTO order = this.orderService.placeOrder(email, redOrderDTO);
    
    // 3. Trả về kết quả
    return ResponseEntity.ok(order);
}
```
**Giải thích**:
- **Input**: `@RequestBody ReqOrderDTO` chứa các thông tin người nhận hàng, danh sách sản phẩm mua, ghi chú. Lấy `email` người dùng từ Context ẩn thay vì bắt user truyền lên để đảm bảo tính an toàn (không bị mạo danh).
- **Luồng xử lý**: Đẩy vào `OrderService.placeOrder()`. Trong service này, thông thường hệ thống sẽ tự động trừ sản phẩm trong giỏ hàng (`Cart`), giảm số lượng tồn kho (`Product`), và ghi dữ liệu mới vào bảng `Order` cùng `OrderDetail`.
- **Output**: Trả về `ResOrderDTO` chứa chi tiết thông tin đơn hàng vừa khởi tạo thành công để Frontend hiển thị màn hình báo thành công.
