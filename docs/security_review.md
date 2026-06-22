# Review bảo mật - Han Sports v2

Tài liệu này chỉ dựa trên source code trong project Han Sports v2. Các kết luận dưới đây không khẳng định lỗ hổng nếu không có bằng chứng từ code; nhưng chỗ nào là rủi ro thiết kế sẽ được ghi rõ là rủi ro.

## 1. Kiểm tra JWT

JWT được cấu hình trong Spring Security Resource Server.

```java
// hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java
@Bean
public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(
            getSecretKey()).macAlgorithm(SecurityUtil.JWT_ALGORITHM).build();
}

@Bean
public JwtEncoder jwtEncoder() {
    return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
}
```

Thuật toán ký:

```java
// hansport_v2be/src/main/java/com/javaweb/util/SecurityUtil.java
public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS512;
```

Secret lấy từ env:

```properties
# hansport_v2be/src/main/resources/application.properties
hansport.jwt.base64-secret=${JWT_BASE64_SECRET}
```

Access token có `jti`, `iat`, `exp`, `sub`, claim `user`, claim `roles`:

```java
// hansport_v2be/src/main/java/com/javaweb/util/SecurityUtil.java
JwtClaimsSet claims = JwtClaimsSet.builder()
        .id(UUID.randomUUID().toString())
        .issuedAt(now)
        .expiresAt(validity)
        .subject(email)
        .claim("user", userToken)
        .claim("roles", List.of(role))
        .build();
```

Role trong JWT được convert từ claim `roles`:

```java
// hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java
JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
grantedAuthoritiesConverter.setAuthorityPrefix("");
grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
```

Thời gian song mặc định:

```properties
# hansport_v2be/src/main/resources/application.properties
hansport.jwt.access-token-validity-in-seconds=${JWT_ACCESS_TOKEN_VALIDITY:86400}
hansport.jwt.refreshtoken-validity-in-seconds=${JWT_REFRESH_TOKEN_VALIDITY:604800}
```

Nhận xét:

- Có ký JWT bằng HS512.
- Secret không hard-code trong `application.properties`, mà lấy từ env.
- Access token mặc định 86400 giây, tức 24 giờ, hơi dài với access token production.
- Token chưa có claim phân biệt rõ `access` vì `refresh`.

## 2. Kiểm tra refresh token

Refresh token được tạo bằng JWT riêng:

```java
// hansport_v2be/src/main/java/com/javaweb/util/SecurityUtil.java
public String createRefreshToken(String email, ResLoginDTO dto) {
    Instant now = Instant.now();
    Instant validity = now.plus(this.refreshTokenExpiration, ChronoUnit.SECONDS);
    ...
    JwtClaimsSet claims = JwtClaimsSet.builder()
            .id(UUID.randomUUID().toString())
            .issuedAt(now)
            .expiresAt(validity)
            .subject(email)
            .claim("user", userToken)
            .claim("roles", List.of(role))
            .build();
```

Refresh token raw được trả về cookie HttpOnly:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java
ResponseCookie resCookies = ResponseCookie
        .from("refresh_token", refresh_token)
        .httpOnly(true)
        .secure(secureCookie)
        .path("/")
        .sameSite("Lax")
        .maxAge(refreshTokenExpiration)
        .build();
```

Trong DB chỉ lưu hash của refresh token:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java
this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(refresh_token), loginDTO.getUsername());
```

Hash refresh token bằng HMAC SHA-256:

```java
// hansport_v2be/src/main/java/com/javaweb/util/SecurityUtil.java
public String hashRefreshToken(String rawToken) {
    ...
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(keyBytes, "HmacSHA256"));
    byte[] digest = mac.doFinal(rawToken.getBytes(StandardCharsets.UTF_8));
    return java.util.Base64.getEncoder().encodeToString(digest);
}
```

Refresh endpoint kiểm tra JWT hợp lệ và hash trong DB:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java
Jwt decodedToken = this.securityUtil.checkValidRefreshToken(refresh_token);
String email = decodedToken.getSubject();

User currentUser = this.userService.getUserByRefreshTokenHashAndEmail(
        this.securityUtil.hashRefreshToken(refresh_token), email);
if (currentUser == null) {
    throw new IdInvalidException("Refresh Token khong hop le");
}
```

Refresh token được rotate mới lan refresh:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java
String new_refresh_token = this.securityUtil.createRefreshToken(email, res);
this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(new_refresh_token), email);
```

Nhận xét:

- Điểm tốt: refresh token HttpOnly cookie, hash trong DB, rotate khi refresh, logout xóa hash.
- Rủi ro: endpoint refresh là `GET /api/v1/auth/refresh` nhưng có side effect rotate token.
- Rủi ro: `secureCookie` default false, nên production phải bắt `COOKIE_SECURE=true`.

## 3. Kiểm tra password hashing

PasswordEncoder:

```java
// hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

Khi tạo user:

```java
// hansport_v2be/src/main/java/com/javaweb/service/UserService.java
user.setPassword(this.passwordEncoder.encode(req.getPassword()));
```

Khi đổi mật khẩu:

```java
// hansport_v2be/src/main/java/com/javaweb/service/UserService.java
if (!this.passwordEncoder.matches(req.getCurrentPassword(), currentUser.getPassword())) {
    throw new IdInvalidException("Mat khau hien tai khong chinh xac");
}
...
currentUser.setPassword(this.passwordEncoder.encode(req.getNewPassword()));
currentUser.setRefreshToken(null);
```

Password policy:

```java
// hansport_v2be/src/main/java/com/javaweb/util/validator/StrongPasswordValidator.java
return value.matches("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*()]).{8,}$");
```

DTO đang dùng strong password:

```java
// hansport_v2be/src/main/java/com/javaweb/domain/request/ReqRegisterDTO.java
@NotBlank(message = "Password khong duoc de trong")
@StrongPassword
private String password;
```

```java
// hansport_v2be/src/main/java/com/javaweb/domain/request/ReqChangePasswordDTO.java
@NotBlank(message = "New password must not be blank")
@StrongPassword
private String newPassword;
```

Nhận xét:

- Có BCrypt.
- Có password policy cho register/change-password/admin create.
- Google user có password null, `changePassword` đã chặn trường hợp này.

## 4. Kiểm tra phân quyền ADMIN/USER

SecurityConfiguration:

```java
// hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java
.authorizeHttpRequests(
        authz -> authz
                .requestMatchers("/", "/api/v1/auth/login", "/api/v1/auth/register",
                        "/api/v1/auth/refresh", "/storage/**", "/api/v1/auth/google").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/**", "/api/v1/files", "/api/v1/settings").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/products", "/api/v1/products/import", "/api/v1/files").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/users", "/api/v1/users/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/admin", "/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/orders").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/orders").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/orders/*/send-email").hasRole("ADMIN")
                .anyRequest().authenticated())
```

Settings controller có method-level security:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AppSettingController.java
@PutMapping("/settings/bulk")
@PreAuthorize("hasRole('ADMIN')")
...
@GetMapping("/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
...
@PutMapping("/admin/settings/site")
@PreAuthorize("hasRole('ADMIN')")
```

Ownership check giỏ hàng:

```java
// hansport_v2be/src/main/java/com/javaweb/service/CartService.java
if (currentCart == null || currentCart.getUser() == null || currentCart.getUser().getId() != currentUser.getId()) {
    throw new IdInvalidException("Ban khong co quyen cap nhat san pham nay trong gio hang");
}
```

Ownership check xóa order:

```java
// hansport_v2be/src/main/java/com/javaweb/service/OrderService.java
boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
if (isAdmin) {
    order = this.orderRepository.findById(id)
            .orElseThrow(() -> new IdInvalidException("Don hang khong ton tai"));
} else {
    order = this.orderRepository.findByUserAndId(currentUser, id)
            .orElseThrow(() -> new IdInvalidException("Don hang khong ton tai"));
}
```

Nhận xét:

- ADMIN endpoints được chặn ở URL layer.
- Cart/order ownership có check trong service.
- Frontend admin guard không phải biện pháp bảo mật chính; backend mới là source of truth.

## 5. Kiểm tra upload file

Upload chỉ chấp nhận folder allowlist:

```java
// hansport_v2be/src/main/java/com/javaweb/service/FileService.java
private static final Set<String> ALLOWED_FOLDERS = Set.of("product", "logo", "banner", "avatar");
```

Chỉ chấp nhận ảnh JPG/JPEG/PNG/WebP, MIME hợp lệ, max 5MB vì magic bytes hợp lệ:

```java
// hansport_v2be/src/main/java/com/javaweb/service/FileService.java
if (file.getSize() > MAX_IMAGE_BYTES) {
    throw new IllegalArgumentException("Image file must not exceed 5MB");
}
...
if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
    throw new IllegalArgumentException("Only JPG, JPEG, PNG, or WebP images are allowed");
}
...
if (!hasValidImageSignature(file, extension)) {
    throw new IllegalArgumentException("Invalid image file content");
}
```

Chống path traversal:

```java
// hansport_v2be/src/main/java/com/javaweb/service/FileService.java
if (safeName.isBlank() || safeName.contains("..") || safeName.contains("/") || safeName.contains("\\")) {
    throw new IllegalArgumentException("Invalid file name");
}
```

Nhận xét:

- Upload validation khá tốt.
- Rủi ro/chưa đồng bộ: frontend user profile có upload avatar, nhưng backend chỉ cho ADMIN upload `/api/v1/files`.
- Media GET public với fileName/folder; phù hợp product/banner, nhưng cần xác định avatar cũ được public hay không.

## 6. Kiểm tra rate limiting

Có filter rate limit riêng cho auth:

```java
// hansport_v2be/src/main/java/com/javaweb/config/AuthRateLimitFilter.java
private static final long WINDOW_MILLIS = 60_000L;
private static final Map<String, Integer> LIMITS = Map.of(
        "POST /api/v1/auth/login", 5,
        "POST /api/v1/auth/register", 3,
        "POST /api/v1/auth/google", 5,
        "GET /api/v1/auth/refresh", 30
);
```

Key rate limit theo IP + endpoint:

```java
// hansport_v2be/src/main/java/com/javaweb/config/AuthRateLimitFilter.java
String key = clientIp(request) + ":" + endpoint;
```

IP lấy từ `X-Forwarded-For` nếu có:

```java
// hansport_v2be/src/main/java/com/javaweb/config/AuthRateLimitFilter.java
private String clientIp(HttpServletRequest request) {
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
        return forwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
}
```

Nhận xét:

- Có rate limit cho login/register/google/refresh.
- Rủi ro: in-memory map, không distributed, reset khi app restart.
- Rủi ro: tin `X-Forwarded-For` trực tiếp; nếu app expose trực tiếp không qua proxy tin cậy, client có thể spoof header.
- Chưa thấy rate limit cho upload/order/product public endpoints.

## 7. Kiểm tra CORS

CORS config:

```java
// hansport_v2be/src/main/java/com/javaweb/config/CorsConfig.java
configuration.setAllowedOriginPatterns(allowedOriginPatterns);
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "x-no-retry", "Cookie"));
configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "Authorization"));
configuration.setAllowCredentials(true);
configuration.setMaxAge(3600L);
```

Allowed origins lấy từ env vì có option localhost:

```java
// hansport_v2be/src/main/java/com/javaweb/config/CorsConfig.java
@Value("${app.frontend.url:http://localhost:5173}")
private String frontendUrl;

@Value("${app.cors.allow-localhost:true}")
private boolean allowLocalhost;
...
if (allowLocalhost) {
    allowedOriginPatterns.add("http://localhost:*");
    allowedOriginPatterns.add("http://127.0.0.1:*");
}
```

Docker Compose set localhost false:

```yaml
# docker-compose.yml
CORS_ALLOW_LOCALHOST: "false"
FRONTEND_URL: http://localhost:5173
```

Nhận xét:

- CORS có credentials vì refresh token dùng cookie.
- Production còn set `FRONTEND_URL` chính xác vì `CORS_ALLOW_LOCALHOST=false`.
- Nếu production dùng default `allow-localhost=true`, localhost origins được phép.

## 8. Kiểm tra CSRF

CSRF dạng disable:

```java
// hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java
.csrf(c -> c.disable())
```

Nhận xét:

- Với Bearer access token trong `Authorization`, disable CSRF thường chấp nhận được cho REST API.
- Nhưng project có refresh token trong cookie HttpOnly vì endpoint refresh public.
- Refresh endpoint là GET vì có side effect rotate token:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/AuthController.java
@GetMapping("/auth/refresh")
...
String new_refresh_token = this.securityUtil.createRefreshToken(email, res);
this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(new_refresh_token), email);
```

Rủi ro:

- `SameSite=Lax` giảm nhiều request cross-site cookie, nhưng GET endpoint có side effect vẫn là thiết kế nên tránh.
- Nên đổi refresh thành POST vì cân nhắc CSRF token/double-submit nếu tiếp tục dùng cookie.

## 9. Kiểm tra lộ secret trong .env hoặc config

Config source không hard-code secret trong `application.properties`; nó dùng env variable:

```properties
# hansport_v2be/src/main/resources/application.properties
spring.datasource.password=${DB_PASSWORD}
hansport.jwt.base64-secret=${JWT_BASE64_SECRET}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.mail.password=${YOUR_APP_PASSWORD}
```

`.env.example` có cảnh báo:

```text
# .env.example
# Copy to .env for local Docker runs. Never commit real secrets.
```

`.gitignore` có ignore `.env`:

```text
# .gitignore
.env
.env.local
```

Kiểm tra Git tracking:

- `git ls-files .env hansport_v2be/.env hansport_v2fe/.env` không trả về file nào.
- Nghĩa là các `.env` hiện tại không bộ Git track trong repo local này.

Nhận xét:

- Không thấy bằng chứng `.env` dạng bộ Git track.
- Có file `.env` thật tồn tại trong workspace local, vì có giá trị non-empty cho DB/JWT/Google/Mail. Khi copy/nop project, không nên gửi kem `.env` thật.

## 10. Kiểm tra SQL injection / JPA query

Không thấy native SQL nội chuỗi trong repository/service qua `rg`.

Custom query trong repository là JPQL tính hoặc có parameter binding:

```java
// hansport_v2be/src/main/java/com/javaweb/repository/ProductRepository.java
@Query("update Product p set p.quantity = p.quantity - :quantity, p.sold = p.sold + :quantity where p.id = :productId and p.quantity >= :quantity")
int decrementStockIfAvailable(@Param("productId") long productId, @Param("quantity") long quantity);
```

```java
// hansport_v2be/src/main/java/com/javaweb/repository/OrderRepository.java
@Query("select coalesce(sum(o.totalPrice), 0) from Order o where o.status = 'COMPLETED' and o.createdAt >= :createdAt")
long sumTotalPriceSince(Instant createdAt);
```

Filter/search dùng Spring Data Specification vì springfilter:

```java
// hansport_v2be/src/main/java/com/javaweb/controller/ProductController.java
public ResponseEntity<ResultPaginationDTO> getAllProducts(@Filter Specification<Product> spec,
                                                          Pageable pageable,
                                                          @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive,
                                                          @RequestParam(name = "q", required = false) String query,
                                                          ...)
```

Nhận xét:

- Chưa thấy bằng chứng SQL injection từ query nội chuỗi.
- Còn review policy field filter vì public product endpoint nhận `@Filter Specification<Product> spec`; đây không phải SQL injection rõ ràng, nhưng là attack surface cho query/filter phức tạp.

## 11. Kiểm tra error message có lộ thông tin không

Global exception tra `ex.getMessage()` cho 500:

```java
// hansport_v2be/src/main/java/com/javaweb/util/error/GlobalException.java
@ExceptionHandler(Exception.class)
public ResponseEntity<RestResponse<Object>> handleAllException(Exception ex) {
    RestResponse<Object> res = new RestResponse<Object>();
    res.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
    res.setMessage(ex.getMessage());
    res.setError("Internal Server Error");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res);
}
```

Bad request cóng trả message exception:

```java
// hansport_v2be/src/main/java/com/javaweb/util/error/GlobalException.java
res.setMessage(ex.getMessage());
res.setError("Exception occurs...");
```

JWT auth entry point trả message từ exception/cause:

```java
// hansport_v2be/src/main/java/com/javaweb/config/CustomAuthenticationEntryPoint.java
String errorMessage = Optional.ofNullable(authException.getCause())
        .map(Throwable::getMessage)
        .orElse(authException.getMessage());
res.setError(errorMessage);
```

Nhận xét:

- Có nguy cơ lộ thông tin nội bộ nếu exception message chưa path/class/query/stack detail.
- Nên log chi tiết server-side, trả message generic cho client.

## 12. Bằng tổng hợp vấn đề/rủi ro có bằng chứng

| Vấn đề | File liên quan | Mức độ rủi ro | Bằng chứng từ code | Cách sửa |
|---|---|---|---|---|
| Access token mặc định song 24 giờ | `application.properties`, `SecurityUtil.java` | Medium | `JWT_ACCESS_TOKEN_VALIDITY:86400`; access token có exp từ config | Giảm access token 5-15 phút, giữ refresh token để cấp mới. |
| Refresh token endpoint dùng GET nhưng có side effect | `AuthController.java` | Medium | `@GetMapping("/auth/refresh")` tạo `new_refresh_token` vì update DB | Đổi sang `POST /auth/refresh`; thêm CSRF protection/double-submit nếu dùng cookie. |
| Cookie secure default false | `application.properties`, `docker-compose.yml`, `AuthController.java` | High trong production nếu dùng HTTP/HTTPS sai | `app.cookie.secure=${COOKIE_SECURE:false}` vì Docker set `COOKIE_SECURE: "false"` | Production bắt `COOKIE_SECURE=true`, chỉ chạy qua HTTPS. |
| CSRF disabled trong khi refresh token dùng cookie | `SecurityConfiguration.java`, `AuthController.java` | Medium | `.csrf(c -> c.disable())`; refresh cookie HttpOnly SameSite Lax | Cho Bearer API tiếp tục stateless, riêng cookie refresh dùng POST + CSRF token/double-submit. |
| Chưa có token type claim để phân biệt access/refresh | `SecurityUtil.java` | Low/Medium | `createAccessToken` vì `createRefreshToken` cùng claim `user`, `roles`, không thấy `token_type` | Thêm claim `typ`/`token_type`; decoder/endpoint refresh bắt buộc `refresh`. |
| Rate limit in-memory vì tin `X-Forwarded-For` trực tiếp | `AuthRateLimitFilter.java` | Medium | `ConcurrentHashMap` local; `clientIp()` lấy header `X-Forwarded-For` nếu cũ | Dùng Redis/Bucket4j/gateway rate limit; chỉ tin forwarded header từ proxy tin cậy. |
| Rate limit mới ap dùng auth endpoints | `AuthRateLimitFilter.java` | Low/Medium | LIMITS chỉ gồm login/register/google/refresh | Thêm limit cho upload, order create, product search nếu production còn. |
| Upload avatar frontend/user không khớp permission backend | `ProfilePage.jsx`, `SecurityConfiguration.java` | Medium functional/security design | Profile gửi `productApi.uploadFile(file, "avatar")`; backend `POST /api/v1/files` hasRole ADMIN | Tạo endpoint avatar authenticated riêng vì validate ownership; hoặc rule theo folder trong service. |
| Media GET public gồm cả avatar | `SecurityConfiguration.java`, `FileController.java`, `ProfilePage.jsx` | Low/Medium tuy yêu cầu privacy | `GET /api/v1/files` permitAll; avatar hiển thị qua `/api/v1/files?...&folder=avatar` | Nếu avatar riêng tư, cần auth/authorization hoặc signed URL; nếu public thì document rõ. |
| `/storage/**` public song song với `/api/v1/files` | `StaticResourcesWebConfiguration.java`, `SecurityConfiguration.java` | Low | ResourceHandler `/storage/**`; permitAll `/storage/**` | Chọn mất media sẽrving path chính; thêm cáche/header policy nhất quán. |
| Error response có thể là message nội bộ | `GlobalException.java`, `CustomAuthenticationEntryPoint.java` | Medium | `res.setMessage(ex.getMessage())`, `res.setError(authException message)` | Log detail server-side, trả generic message/client error code. |
| Google login không thấy check explicit `email_verified` | `GoogleTokenVerifierService.java`, `AuthController.java` | Low/Medium | Code verify token audience, lấy `payload.getEmail()`, nhưng không thấy check email verified | Kiểm tra `payload.getEmailVerified()` trước khi tạo user/login. |
| `.env` thật tồn tại local | `.env`, `hansport_v2be/.env`, `hansport_v2fe/.env`, `.gitignore` | Low nếu không commit, High nếu gửi nhầm | `.gitignore` cũ `.env`; `git ls-files` không track; local file có secret non-empty | Không share `.env`; dùng secret manager; rotate nếu đã là. |
| Public product filter bảng `@Filter Specification<Product>` là attack surface | `ProductController.java`, dependency `springfilter` | Low/Medium | Public `GET /products` nhận `@Filter Specification<Product> spec` | Whitelist filter fields/operators, giới hạn page size, log query bắt thường. |

## 13. Các điểm đã có kiểm sốát tốt

| Hàng mục | Bằng chứng | Nhận xét |
|---|---|---|
| Password hashing | `new BCryptPasswordEncoder()` | Tốt |
| Password policy | `@StrongPassword`, regex validator | Tốt cho local password |
| Refresh token không lưu raw DB | `hashRefreshToken()` + `updateUserRefreshTokenHash()` | Tốt |
| Refresh token rotate | `/auth/refresh` tạo token mới vì update hash | Tốt |
| Logout revoke refresh token | `updateUserRefreshTokenHash(null, email)` | Tốt |
| Upload validation | extension, MIME, magic bytes, max 5MB | Tốt |
| Path traversal upload | `resolveFolder`, `resolveFile` | Tốt |
| Admin URL security | `hasRole("ADMIN")` rules | Tốt |
| Cart/order ownership | Check user id trong service | Tốt |
| SQL injection bằng native query | Không thấy native SQL nội chuỗi | Tốt, tiếp tục review khi thêm query mới |
| `.env` trong Git | `git ls-files` không track `.env` | Tốt, nhưng còn canh giac khi copy project |

## 14. Khuyen nghi ưu tiên

1. Production config:
   - `COOKIE_SECURE=true`
   - `CORS_ALLOW_LOCALHOST=false`
   - `FRONTEND_URL` chỉ dùng domain frontend thật
   - Giảm access token validity.

2. Refresh token:
   - Đổi `GET /auth/refresh` thành `POST`.
   - Thêm `token_type=refresh`.
   - Còn nhắc CSRF token cho refresh cookie.

3. Upload/media:
   - Tách endpoint avatar authenticated.
   - Quyết định avatar public hay private.
   - Sửa `productApi.getFile(fileName, folder)`.

4. Error handling:
   - Client nhận message generic.
   - Server log chi tiết bằng logger.

5. Rate limit:
   - Dua rate limit ra Redis/gateway nếu scale nhiều instance.
   - Chỉ tin `X-Forwarded-For` từ reversẽ proxy tin cậy.

## 15. Kết luận

Project đã có nhiều nền tảng bảo mật dùng hướng: BCrypt, JWT signed, refresh token HttpOnly và hashed trong DB, role-based authorization, upload validation, rate limit auth. Các rủi ro đáng chú ý nhất là cấu hình production cho cookie/CORS, refresh token dùng GET có side effect, error message tra trực tiếp từ exception, vì mismatch giữa avatar upload frontend với permission backend.
