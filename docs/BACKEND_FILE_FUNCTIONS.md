# Chức năng từng file backend - Han Sports v2

Tài liệu này mô tả vai trò của các file trong backend `hansport_v2be`.

Phạm vi:

- Bao gồm file source Java, cấu hình Maven/Docker, resource, Flyway migration, template email, test và metadata IDE/local đang có trong backend.
- Không mô tả từng file trong `hansport_v2be/target/` vì đây là output build/generated classes/generated metamodel/surefire report, không phải source chính cần maintain.
- Không đọc/trích nội dung `.env`; chỉ ghi vai trò vì đây là file chứa cấu hình bí mật local.

## 1. File gốc của backend

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/pom.xml` | Khai báo Maven project, dependency Spring Boot/JPA/Security/Flyway/Mail/Thymeleaf/POI, plugin build. | Build, dependency |
| `hansport_v2be/Dockerfile` | Build/chạy backend trong container Java; dùng khi Docker Compose chạy service backend. | Docker, deployment |
| `hansport_v2be/.dockerignore` | Loại trừ file/thư mục không cần copy vào Docker build context. | Docker |
| `hansport_v2be/.env` | File cấu hình bí mật/local cho backend như DB/JWT/mail nếu developer dùng local env. Không nên commit hoặc chia sẻ. | Runtime config |
| `hansport_v2be/.env.example` | Mẫu biến môi trường để người khác tạo `.env`. | Runtime config |

## 2. Metadata IDE

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/.idea/.gitignore` | Quy định ignore riêng trong thư mục IntelliJ IDEA project. | IDE |
| `hansport_v2be/.idea/compiler.xml` | Metadata IntelliJ về compiler/build settings. | IDE |
| `hansport_v2be/.idea/encodings.xml` | Metadata IntelliJ về encoding file/project. | IDE |
| `hansport_v2be/.idea/jarRepositories.xml` | Metadata IntelliJ về Maven/JAR repositories. | IDE |
| `hansport_v2be/.idea/misc.xml` | Metadata IntelliJ chung của module/project. | IDE |

## 3. Entry point và test

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/HansportApplication.java` | Entry point Spring Boot, gọi `SpringApplication.run(...)` để khởi động backend. | Application bootstrap |
| `hansport_v2be/src/test/java/com/javaweb/HansportApplicationTests.java` | Test context Spring Boot, kiểm tra application context có thể load. | Test |

## 4. Package `config`

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java` | Cấu hình Spring Security stateless JWT, JWT encoder/decoder HS512, role authorization, public/admin/authenticated endpoint, password encoder. | Auth, authorization |
| `hansport_v2be/src/main/java/com/javaweb/config/CorsConfig.java` | Tạo `CorsConfigurationSource`, cấu hình allowed origins, credentials, methods, headers cho frontend gọi API. | CORS |
| `hansport_v2be/src/main/java/com/javaweb/config/AuthRateLimitFilter.java` | Filter rate limit cho các endpoint auth như login/register/google/refresh bằng map in-memory theo IP + endpoint. | Security, rate limit |
| `hansport_v2be/src/main/java/com/javaweb/config/CustomAuthenticationEntryPoint.java` | Tạo response JSON chuẩn khi request bị lỗi authentication/JWT thay vì trả lỗi mặc định. | Security error handling |
| `hansport_v2be/src/main/java/com/javaweb/config/UserDetailsCustom.java` | Implement `UserDetailsService`, load user bằng email và map role thành authority `ROLE_*` cho Spring Security. | Login, user auth |
| `hansport_v2be/src/main/java/com/javaweb/config/StaticResourcesWebConfiguration.java` | Map `/storage/**` tới thư mục upload local từ property `hansport.upload-file.base-path`. | Static file, upload |
| `hansport_v2be/src/main/java/com/javaweb/config/DataSeeder.java` | Seed role `ADMIN`, `USER` và optional local admin khi app chạy theo cấu hình. | Seed data, user/role |
| `hansport_v2be/src/main/java/com/javaweb/config/AppSettingSeeder.java` | Seed settings/site content mặc định, banner, category, navigation vào DB khi thiếu dữ liệu. | Settings, site content |

## 5. Package `controller`

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java` | REST API auth: login, Google login, register, account profile, refresh token, logout, đổi mật khẩu. | Auth, user |
| `hansport_v2be/src/main/java/com/javaweb/controller/UserController.java` | REST API admin quản lý user: create, update, delete, list/filter/page, get by id. | User admin |
| `hansport_v2be/src/main/java/com/javaweb/controller/ProductController.java` | REST API sản phẩm: create/update/delete, import Excel/CSV, public detail/navigation/list với filter/pagination. | Product |
| `hansport_v2be/src/main/java/com/javaweb/controller/CartController.java` | REST API giỏ hàng: thêm sản phẩm, xem giỏ hàng của user hiện tại, cập nhật/xóa cart detail. | Cart |
| `hansport_v2be/src/main/java/com/javaweb/controller/OrderController.java` | REST API đơn hàng: checkout, admin cập nhật status/list, user xem order của mình, delete/cancel order. | Order |
| `hansport_v2be/src/main/java/com/javaweb/controller/EmailController.java` | REST API admin gửi email cho đơn hàng qua endpoint `/orders/{id}/send-email`. | Order email |
| `hansport_v2be/src/main/java/com/javaweb/controller/FileController.java` | REST API upload/download file ảnh; upload nhận multipart `files` + `folder`, download trả `Resource`. | File upload/media |
| `hansport_v2be/src/main/java/com/javaweb/controller/DashboardController.java` | REST API admin dashboard summary tại `/api/v1/admin/dashboard/summary`. | Admin dashboard |
| `hansport_v2be/src/main/java/com/javaweb/controller/AppSettingController.java` | REST API settings public/admin: lấy public settings, update bulk settings, lấy admin settings, update site settings. | Settings |

## 6. Package `domain` - Entity JPA

| File | Chức năng | Bảng DB |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/domain/User.java` | Entity user: email/password/fullName/address/phone/avatar/refreshToken, liên kết role và cart. | `users` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Role.java` | Entity role: tên role, mô tả, danh sách users thuộc role. | `roles` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Product.java` | Entity sản phẩm: SKU/name/price/originalPrice/quantity/sold/catalog/options/active/images/audit fields. | `products` |
| `hansport_v2be/src/main/java/com/javaweb/domain/ProductImage.java` | Entity ảnh sản phẩm, lưu `imageUrl` và liên kết nhiều-1 tới `Product`. | `product_images` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Cart.java` | Entity giỏ hàng, lưu số dòng `sum`, liên kết 1-1 tới user và 1-n tới cart detail. | `carts` |
| `hansport_v2be/src/main/java/com/javaweb/domain/CartDetail.java` | Entity dòng giỏ hàng, lưu product, quantity, price snapshot, selected color/size. | `cart_detail` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Order.java` | Entity đơn hàng: receiver info, totalPrice, status, user, order details, audit fields. | `orders` |
| `hansport_v2be/src/main/java/com/javaweb/domain/OrderDetail.java` | Entity dòng đơn hàng, lưu product, quantity, price snapshot, selected color/size. | `order_detail` |
| `hansport_v2be/src/main/java/com/javaweb/domain/AppSetting.java` | Entity key-value setting, gồm setting key/value/description. | `settings` |
| `hansport_v2be/src/main/java/com/javaweb/domain/SiteBanner.java` | Entity banner/hero slide: title/subtitle/CTA/image/sortOrder/active. | `site_banners` |
| `hansport_v2be/src/main/java/com/javaweb/domain/SiteCategory.java` | Entity category hiển thị site: name/icon/path/color/sortOrder/active. | `site_categories` |
| `hansport_v2be/src/main/java/com/javaweb/domain/SiteNavigationItem.java` | Entity navigation item: label/path/group/parent/sortOrder/active. | `site_navigation_items` |

## 7. Package `domain/request`

| File | Chức năng | API dùng |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqLoginDTO.java` | Request body đăng nhập local bằng email/password. | `POST /auth/login` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqGoogleLoginDTO.java` | Request body Google login, nhận Google credential/id token. | `POST /auth/google` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqRegisterDTO.java` | Request đăng ký user thường, có validate email/password/fullName. | `POST /auth/register` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqAccountUpdateDTO.java` | Request user cập nhật profile account của chính mình. | `PUT /auth/account` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqChangePasswordDTO.java` | Request đổi mật khẩu: currentPassword, newPassword, confirmPassword. | `POST /auth/change-password` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqUserCreateDTO.java` | Request admin tạo user, gồm email/password/profile/roleName. | `POST /users` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqUserUpdateDTO.java` | Request admin cập nhật user, gồm id/email/profile/roleName. | `PUT /users` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqProductDTO.java` | Request create/update product, gồm thông tin giá, tồn kho, catalog, images, options. | `POST/PUT /products` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqAddProductToCartDTO.java` | Request thêm sản phẩm vào giỏ, gồm productId, quantity, selectedColor, selectedSize. | `POST /carts/add` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqUpdateCartDetailDTO.java` | Request cập nhật quantity của một cart detail. | `PUT /carts/{id}` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqOrderDTO.java` | Request checkout/tạo order, gồm receiver info và danh sách cartDetailIds. | `POST /orders` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqUpdateOrderStatusDTO.java` | Request admin cập nhật trạng thái order, gồm id và status. | `PUT /orders` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqSettingUpdateDTO.java` | Request cập nhật một setting key-value. | `PUT /settings/bulk` |
| `hansport_v2be/src/main/java/com/javaweb/domain/request/ReqSiteSettingsDTO.java` | Request cập nhật site settings có cấu trúc: hotline, shipping, brands, targets, hero slides, categories, navigation. | `PUT /admin/settings/site` |

## 8. Package `domain/response`

| File | Chức năng | API/Module dùng |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/domain/response/RestResponse.java` | Wrapper response chung gồm statusCode, error, message, data. | Toàn API |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/ResultPaginationDTO.java` | DTO phân trang gồm `Meta` và list result. | List product/user/order |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/ResLoginDTO.java` | Response login/refresh/account, chứa access token và các nested user DTO/token DTO. | Auth |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/role/ResRoleDTO.java` | Response role rút gọn trả kèm user DTO. | User |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/user/ResCreateUserDTO.java` | Response sau khi tạo user. | User admin/register |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/user/ResUpdateUserDTO.java` | Response sau khi cập nhật user. | User admin/profile |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/user/ResUserDTO.java` | Response user đầy đủ cho list/detail/account. | User |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResCreateProductDTO.java` | Response sau khi tạo product. | Product |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResUpdateProductDTO.java` | Response sau khi cập nhật product. | Product |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResProductDTO.java` | Response product detail/list, gồm catalog, giá, tồn kho, images, options, active. | Product public/admin |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResProductNavigationDTO.java` | Response navigation catalog cho frontend, gồm category/brand items. | Product navigation |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResProductImportDTO.java` | Response tổng hợp import product: summary, error/warning rows, preview rows. | Product import |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/product/ResProductImportRowDTO.java` | Response từng dòng import product sau khi parse/validate. | Product import |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/cart/ResCartDTO.java` | Response giỏ hàng, gồm user rút gọn, sum, cart details. | Cart |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/cartdetail/ResCartDetailDTO.java` | Response từng dòng cart, gồm product rút gọn, quantity, price, selected color/size. | Cart |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/order/ResOrderDTO.java` | Response order, gồm receiver info, total, status, user, order details. | Order |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/orderdetail/ResOrderDetailDTO.java` | Response từng dòng order, gồm product rút gọn, quantity, price, selected color/size. | Order |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/dashboard/ResDashboardSummaryDTO.java` | Response dashboard admin: KPI, daily orders/revenue, monthly revenue, top products, status distribution, recent orders. | Dashboard |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/email/OrderEmailDTO.java` | DTO trung gian render email đơn hàng, gồm customer/order/items. | Email |
| `hansport_v2be/src/main/java/com/javaweb/domain/response/file/ResUploadFileDTO.java` | Response upload file, gồm danh sách fileName và thời điểm upload. | File upload |

## 9. Package `repository`

| File | Chức năng | Entity |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/repository/UserRepository.java` | Repository user, query theo email, refresh token hash + email, kiểm tra tồn tại email. | `User` |
| `hansport_v2be/src/main/java/com/javaweb/repository/RoleRepository.java` | Repository role, tìm role theo name. | `Role` |
| `hansport_v2be/src/main/java/com/javaweb/repository/ProductRepository.java` | Repository product, hỗ trợ JPA specification, kiểm tra trùng SKU/name, query navigation, trừ tồn kho atomic. | `Product` |
| `hansport_v2be/src/main/java/com/javaweb/repository/ProductImageRepository.java` | Repository ảnh product, tìm ảnh theo productId, đếm số product image dùng cùng imageUrl. | `ProductImage` |
| `hansport_v2be/src/main/java/com/javaweb/repository/CartRepository.java` | Repository cart, tìm cart theo user. | `Cart` |
| `hansport_v2be/src/main/java/com/javaweb/repository/CartDetailRepository.java` | Repository cart detail CRUD. | `CartDetail` |
| `hansport_v2be/src/main/java/com/javaweb/repository/OrderRepository.java` | Repository order, hỗ trợ specification, thống kê doanh thu, query order theo user/status/time, top recent orders. | `Order` |
| `hansport_v2be/src/main/java/com/javaweb/repository/OrderDetailRepository.java` | Repository order detail CRUD. | `OrderDetail` |
| `hansport_v2be/src/main/java/com/javaweb/repository/AppSettingRepository.java` | Repository settings, tìm setting theo key. | `AppSetting` |
| `hansport_v2be/src/main/java/com/javaweb/repository/SiteBannerRepository.java` | Repository site banner, tìm/sắp xếp theo active và sortOrder. | `SiteBanner` |
| `hansport_v2be/src/main/java/com/javaweb/repository/SiteCategoryRepository.java` | Repository site category, tìm/sắp xếp theo active và sortOrder. | `SiteCategory` |
| `hansport_v2be/src/main/java/com/javaweb/repository/SiteNavigationItemRepository.java` | Repository navigation item, tìm/sắp xếp theo active và sortOrder. | `SiteNavigationItem` |

## 10. Package `service`

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/service/UserService.java` | Xử lý nghiệp vụ user: admin CRUD, register, Google user, profile, đổi mật khẩu, refresh token hash, map user DTO. | User, auth |
| `hansport_v2be/src/main/java/com/javaweb/service/ProductService.java` | Xử lý CRUD product, search/filter/pagination, navigation, validate SKU/name, image list, xóa file ảnh không còn dùng. | Product |
| `hansport_v2be/src/main/java/com/javaweb/service/ProductImportService.java` | Parse/validate/import product từ Excel/CSV, hỗ trợ dry-run/apply, create/update/skip, report lỗi và warning. | Product import |
| `hansport_v2be/src/main/java/com/javaweb/service/CartService.java` | Xử lý giỏ hàng: lấy cart, thêm sản phẩm, cập nhật quantity, xóa cart detail, validate owner/tồn kho/options. | Cart |
| `hansport_v2be/src/main/java/com/javaweb/service/OrderService.java` | Xử lý checkout/order: tạo order/detail, trừ tồn kho, dọn cart, list order, update status, delete, gửi email. | Order |
| `hansport_v2be/src/main/java/com/javaweb/service/FileService.java` | Validate/upload/download/delete file ảnh, kiểm tra folder allowlist, extension, MIME, magic bytes, path traversal. | File upload/media |
| `hansport_v2be/src/main/java/com/javaweb/service/AppSettingService.java` | Quản lý settings key-value và structured site content; validate settings, serialize JSON, replace banner/category/navigation. | Settings |
| `hansport_v2be/src/main/java/com/javaweb/service/DashboardService.java` | Tổng hợp số liệu dashboard: total products/users/orders/revenue, recent orders, daily/monthly stats, top products/status. | Admin dashboard |
| `hansport_v2be/src/main/java/com/javaweb/service/EmailService.java` | Render Thymeleaf template và gửi email HTML bằng `JavaMailSender`, có phương thức sync/async. | Email |
| `hansport_v2be/src/main/java/com/javaweb/service/GoogleTokenVerifierService.java` | Verify Google ID token bằng Google API client và `client-id` config. | Google login |

## 11. Package `util`

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/util/SecurityUtil.java` | Helper JWT/security: tạo access/refresh token, decode refresh token, hash refresh token, normalize role, lấy current login. | Auth/JWT |
| `hansport_v2be/src/main/java/com/javaweb/util/FormatRestResponse.java` | `ResponseBodyAdvice` bọc response JSON thành `RestResponse`, bỏ qua `Resource`/file response. | API response |
| `hansport_v2be/src/main/java/com/javaweb/util/annotation/ApiMessage.java` | Annotation custom để controller/service gắn message cho response wrapper. | API response |
| `hansport_v2be/src/main/java/com/javaweb/util/error/GlobalException.java` | Global exception handler, chuyển validation/auth/business/storage exception thành `RestResponse` lỗi. | Error handling |
| `hansport_v2be/src/main/java/com/javaweb/util/error/IdInvalidException.java` | Custom checked exception cho lỗi nghiệp vụ/id/token invalid. | Error handling |
| `hansport_v2be/src/main/java/com/javaweb/util/error/StorageException.java` | Custom checked exception cho lỗi upload/download/storage file. | File upload |
| `hansport_v2be/src/main/java/com/javaweb/util/validator/StrongPassword.java` | Annotation validation custom cho password mạnh. | Validation |
| `hansport_v2be/src/main/java/com/javaweb/util/validator/StrongPasswordValidator.java` | Logic validate password mạnh: độ dài, chữ hoa/thường, số, ký tự đặc biệt. | Validation |

## 12. Resources

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/resources/application.properties` | Cấu hình runtime: datasource, JPA/Flyway, JWT, upload path, mail, CORS, cookie, multipart, seeding. | Config |
| `hansport_v2be/src/main/resources/templates/order.html` | Thymeleaf HTML template để render email đơn hàng. | Email |

## 13. Flyway migrations

| File | Chức năng | Module liên quan |
|---|---|---|
| `hansport_v2be/src/main/resources/db/migration/V1__baseline_schema.sql` | Migration baseline tạo schema chính: users, roles, products, product_images, carts, cart_detail, orders, order_detail, settings. | Database |
| `hansport_v2be/src/main/resources/db/migration/V2__money_fields_to_bigint.sql` | Chuyển/đảm bảo các field tiền sang kiểu lớn hơn để lưu VND an toàn hơn. | Database |
| `hansport_v2be/src/main/resources/db/migration/V3__site_content_tables.sql` | Tạo các bảng structured site content: site_banners, site_categories, site_navigation_items. | Settings/site content |
| `hansport_v2be/src/main/resources/db/migration/V4__product_sku_and_active.sql` | Bổ sung SKU/active và các ràng buộc/index liên quan cho product. | Product |
| `hansport_v2be/src/main/resources/db/migration/V5__product_image_order.sql` | Bổ sung thứ tự ảnh product bằng cột `sort_order`. | Product image |
| `hansport_v2be/src/main/resources/db/migration/V6__product_sale_options.sql` | Bổ sung original price, color/size options, selected color/size cho cart/order detail. | Product/cart/order options |
| `hansport_v2be/src/main/resources/db/migration/V7__add_user_avatar.sql` | Bổ sung avatar cho user. | User profile |

## 14. Ghi chú về `target/`

`hansport_v2be/target/` là thư mục Maven sinh ra khi build/test, gồm:

- `target/classes`: bản copy compiled resources/classes.
- `target/generated-sources/annotations`: JPA static metamodel generated từ entity.
- `target/surefire-reports`: report test.

Các file này có thể xóa và sinh lại bằng Maven, nên không được xem là source chính của backend.
