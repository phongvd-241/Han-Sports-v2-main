# Phân tích Kiến trúc Frontend React - Han Sports v2

Han Sports v2 sử dụng bộ khung frontend hiện đại dựa trên **React 18** và **Vite** nhằm mang lại trải nghiệm SPA (Single Page Application) mượt mà, kết hợp với các công cụ tối ưu state management và data fetching.

## 1. Công nghệ Lõi (React / Vite)
- Sử dụng **Vite** thay cho Create React App (CRA) truyền thống giúp tốc độ khởi động dev server và Hot Module Replacement (HMR) cực nhanh.
- Mã nguồn thuần JavaScript (ES6+), JSX (Không dùng TypeScript).

## 2. Hệ thống Routing (`App.jsx`)
- Sử dụng `react-router-dom` (BrowserRouter).
- Routing được chia làm hai luồng Layout chính thông qua cơ chế Nested Routes (Route lồng nhau):
  1. **Public/Client Routes**: Được bọc trong thẻ `<Route element={<ClientLayout />}>`. Các đường dẫn gốc `/`, `/shop`, `/products/:id`, `/login`,... phục vụ khách hàng.
  2. **Admin Routes**: Bắt đầu bằng `/admin` và được bọc trong `<Route element={<AdminLayout />}>`.

## 3. Kiến trúc Layout (`layouts/`)
- **`ClientLayout.jsx`**: Gồm thanh Header (Điều hướng, giỏ hàng, search), vùng nội dung (`<Outlet />`) thay đổi theo Route, và Footer tĩnh.
- **`AdminLayout.jsx`**: 
  - Cấu trúc phức tạp hơn với `AdminSidebar` (Thanh menu trái) và `AdminTopbar`.
  - Có tích hợp bảo vệ truy cập (Route Guarding): Ngay trong layout kiểm tra `!user` hoặc `!isAdmin()` thì dùng `<Navigate>` đá văng về `/login` hoặc `/`.
  - Responsive với `AdminMobileDrawer` cho màn hình điện thoại.

## 4. Tương tác API (Axios Interceptors)
- Toàn bộ kết nối API được gom về `api/axiosSetup.js` với 2 instance độc lập:
  - `axiosPublic`: Dành cho các request không cần header xác thực (như lấy token mới).
  - `axiosInstance`: Dành cho mọi request.
- **Request Interceptor**: Tự động chèn header `Authorization: Bearer <accessToken>` lấy trực tiếp từ Zustand store.
- **Response Interceptor (Refresh Token Logic)**: 
  - Khi API báo lỗi `401 Unauthorized`, Axios tự động chặn lại (Interceptor).
  - Tạm dừng (Pause) các request tiếp theo thông qua cơ chế `failedQueue`.
  - Gọi `/api/v1/auth/refresh` bằng Cookie ẩn. Nhận Access Token mới và Resume (thực thi lại) những request bị kẹt. Nếu lấy thất bại (hết hạn Cookie), đá văng ra `/login`.
  - Đây là kỹ thuật *Silent Refresh Token* cực kỳ chuẩn mực trong SPA.

## 5. Quản lý State (Zustand)
Thay vì Redux cồng kềnh, hệ thống chọn **Zustand** kết hợp middleware `persist` (Lưu vào LocalStorage):
- **`useAuthStore.js`**: Lưu giữ `accessToken` (chỉ trên RAM) và thông tin `user` (lưu cả RAM + LocalStorage). Cung cấp hàm tiện ích `isAuthenticated()`, `isAdmin()`. Việc không persist accessToken là để chống XSS.
- **`useCartStore.js`**: Lưu danh sách sản phẩm trong giỏ hàng.
- **`useSettingStore.js`**: Lưu trữ cài đặt tĩnh của site (phí vận chuyển, banner...) để mọi Component đều dùng chung thay vì phải fetch liên tục.

## 6. Cấu trúc thư mục `pages/` và `components/`
- **`components/`**:
  - `admin/`: Các UI tái sử dụng riêng cho Admin (Card, Header, Modal, Chart).
  - `client/`: Các UI hiển thị cho User (Header, ProductCard, Banner).
  - `ui/`: Các Component gốc dùng chung (ConfirmDialog, Toast).
- **`pages/`**:
  - `client/`: Gồm `HomePage`, `ShopPage`, `CartPage`, `CheckoutPage`,...
  - `admin/`: Phân rã thành từng thư mục con tương ứng module. VD: `pages/admin/products/` có `ProductsPage.jsx` và các Modal/Table của sản phẩm. Cách chia này theo chuẩn Feature-based (Tập trung theo tính năng) rất khoa học.

## 7. Các Trang chính (Key Pages)
- **HomePage**: Render `SiteBanner`, `Category` từ CSDL và danh sách sản phẩm nổi bật/mới nhất.
- **ProductDetailPage**: Hiển thị ảnh (có zoom/carousel slider), tùy chọn màu/size. Click thêm sẽ dispatch vào `useCartStore`.
- **CheckoutPage**: Xác nhận giỏ hàng và nhập form. Gọi `orderApi.createOrder()` và kết thúc luồng mua hàng.
- **Admin Dashboard**: Dùng chart.js để thống kê doanh thu, đơn hàng, người dùng.
- **Admin Products / Orders**: Quản lý dạng lưới CRUD, tích hợp thanh Filter mạnh mẽ, Modal Create/Update có form validate.

---

## 8. Sơ đồ Kiến Trúc Frontend

```mermaid
graph TD
    subgraph "Trình duyệt (Browser)"
        A[App.jsx - React Router]
        
        subgraph "Layouts"
            C1[ClientLayout]
            C2[AdminLayout (Protected)]
        end
        
        A --> C1
        A --> C2
        
        subgraph "Zustand Stores (State)"
            S1((AuthStore))
            S2((CartStore))
            S3((SettingStore))
        end
        
        C1 -->|Render| P1(HomePage, ShopPage, CartPage...)
        C2 -->|Render| P2(Dashboard, Admin Products...)
        
        P1 -.->|Read/Write State| S2
        P1 -.->|Read/Write State| S1
        P2 -.->|Read/Write State| S1
        
        subgraph "Axios Client (axiosSetup.js)"
            AX[Interceptors]
            AX -->|Tự động nối Bearer| Token[Access Token]
            AX -->|Tự động refresh| RT[Refresh Token Queue]
        end
        
        P1 -->|Fetch Data| AX
        P2 -->|Fetch Data| AX
    end
    
    AX -->|HTTP Requests| B((Spring Boot Backend API))
```

---

## 9. Đánh giá (Pros & Cons)

**Điểm mạnh (Strengths):**
1. **Kiến trúc Modern**: Sự kết hợp Vite + Zustand + Axios Interceptor Silent Refresh là combo gọn nhẹ, dễ scale, code dễ đọc hơn Redux nhiều.
2. **Feature-based Structure**: Cấu trúc thư mục chia theo Feature/Domain giúp project không bị lộn xộn khi phình to.
3. **Phân quyền Route chuẩn**: Route Admin bị ẩn chặt chẽ, check quyền đồng thời ở cả React Router và Header Axios.

**Điểm cần cải thiện (Weaknesses):**
1. **Chưa áp dụng TypeScript**: Việc dùng thuần JavaScript dễ gây ra lỗi undefined hoặc sai kiểu dữ liệu truyền vào props/API, gây khó khăn cho việc bảo trì đường dài.
2. **SSR / SEO**: Vì đây là CSR (Client-Side Rendering) 100%, việc SEO các trang Product Detail sẽ không bằng Next.js.
3. **Data Fetching chưa tối ưu cache**: Đang dùng Axios gọi API và lưu state thủ công `useEffect(fetchData)`. Có thể cân nhắc dùng `React Query (TanStack Query)` để cache dữ liệu, giảm thiểu gọi API dư thừa và tự động stale-while-revalidate.
