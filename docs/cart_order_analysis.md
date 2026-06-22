# Phân tích chức năng giỏ hàng và đặt hàng - Han Sports v2

Tài liệu này chỉ dựa trên source code hiện có trong workspace. Các file chính được đọc:

- `hansport_v2be/src/main/java/com/javaweb/controller/CartController.java`
- `hansport_v2be/src/main/java/com/javaweb/service/CartService.java`
- `hansport_v2be/src/main/java/com/javaweb/controller/OrderController.java`
- `hansport_v2be/src/main/java/com/javaweb/service/OrderService.java`
- `hansport_v2be/src/main/java/com/javaweb/controller/EmailController.java`
- `hansport_v2be/src/main/java/com/javaweb/domain/Cart.java`
- `hansport_v2be/src/main/java/com/javaweb/domain/CartDetail.java`
- `hansport_v2be/src/main/java/com/javaweb/domain/Order.java`
- `hansport_v2be/src/main/java/com/javaweb/domain/OrderDetail.java`
- `hansport_v2be/src/main/java/com/javaweb/repository/CartRepository.java`
- `hansport_v2be/src/main/java/com/javaweb/repository/CartDetailRepository.java`
- `hansport_v2be/src/main/java/com/javaweb/repository/OrderRepository.java`
- `hansport_v2be/src/main/java/com/javaweb/repository/OrderDetailRepository.java`
- `hansport_v2be/src/main/java/com/javaweb/repository/ProductRepository.java`
- `hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java`
- `hansport_v2be/src/main/resources/db/migration/V1__baseline_schema.sql`
- `hansport_v2be/src/main/resources/db/migration/V6__product_sale_options.sql`
- `hansport_v2fe/src/api/cartApi.js`
- `hansport_v2fe/src/api/orderApi.js`
- `hansport_v2fe/src/store/useCartStore.js`
- `hansport_v2fe/src/pages/client/CartPage.jsx`
- `hansport_v2fe/src/pages/client/CheckoutPage.jsx`
- `hansport_v2fe/src/pages/client/MyOrdersPage.jsx`
- `hansport_v2fe/src/pages/admin/OrdersAdminPage.jsx`
- `hansport_v2fe/src/pages/admin/orders/useOrdersAdmin.js`
- `hansport_v2fe/src/pages/admin/orders/OrderTable.jsx`
- `hansport_v2fe/src/pages/admin/orders/OrderDetailPanel.jsx`
- `hansport_v2fe/src/pages/admin/orders/OrderStatusActions.jsx`
- `hansport_v2fe/src/pages/admin/orders/orderWorkflow.js`
- `hansport_v2fe/src/utils/constants.js`

Ghi chú về snippet: các đoạn có `...` là rút gọn message/UI text để tránh copy sai encoding; logic, method, endpoint, field và luồng gửi được giữ đúng theo source.

## 1. Tổng quan chức năng

Module giỏ hàng và đơn hàng giải quyết các việc:

- User đăng nhập thêm sản phẩm vào giỏ.
- User xem giỏ hàng của mình.
- User cập nhật số lượng tổng dòng giỏ hàng.
- User xóa dòng giỏ hàng.
- User checkout các dòng giỏ hàng đã chọn để tạo đơn hàng.
- Backend trừ tồn kho khi checkout thành công.
- User xem lịch sử đơn hàng của mình.
- User có thể hủy đơn trên UI khi đơn dạng `PENDING`; backend hiện đang xóa order.
- ADMIN xem danh sách đơn, lọc theo status, cập nhật status, gửi email đơn hàng, xóa đơn.

Luồng tổng quát:

```text
React page/component
-> cartApi/orderApi
-> CartController/OrderController/EmailController
-> CartService/OrderService
-> Repository
-> JPA Entity
-> MySQL tables: carts, cart_detail, orders, order_detail, products
```

## 2. Security và endpoint

Quyền endpoint được cấu hình trong `hansport_v2be/src/main/java/com/javaweb/config/SecurityConfiguration.java`.

Snippet liên quan:

```java
.requestMatchers(HttpMethod.GET, "/api/v1/orders").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/api/v1/orders").hasRole("ADMIN")
.requestMatchers(HttpMethod.POST, "/api/v1/orders/*/send-email").hasRole("ADMIN")
.anyRequest().authenticated()
```

Kết luận quyền:

- Các endpoint cart `/api/v1/carts...` không public, bị bắt phải authenticated bởi `anyRequest().authenticated()`.
- `POST /api/v1/orders` tạo đơn: authenticated user.
- `GET /api/v1/orders/my`: authenticated user.
- `DELETE /api/v1/orders/{id}`: authenticated user; service phân biệt admin/user.
- `GET /api/v1/orders`: ADMIN.
- `PUT /api/v1/orders`: ADMIN.
- `POST /api/v1/orders/{id}/send-email`: ADMIN.

Bảng endpoint:

| Endpoint | Method | Quyền | Controller | Input | Output |
|---|---:|---|---|---|---|
| `/api/v1/carts/add` | POST | Authenticated | `CartController` | JSON `ReqAddProductToCartDTO` | `ResCartDTO` |
| `/api/v1/carts` | GET | Authenticated | `CartController` | Current user từ JWT | `ResCartDTO` |
| `/api/v1/carts/{id}` | PUT | Authenticated, owner check ở service | Path `cartDetailId`, JSON `ReqUpdateCartDetailDTO` | `ResCartDTO` |
| `/api/v1/carts/{id}` | DELETE | Authenticated, owner check ở service | Path `cartDetailId` | `Void` |
| `/api/v1/orders` | POST | Authenticated | `OrderController` | JSON `ReqOrderDTO` | `ResOrderDTO` |
| `/api/v1/orders/my` | GET | Authenticated | `OrderController` | `Pageable`, current user | `ResultPaginationDTO` |
| `/api/v1/orders` | GET | ADMIN | `OrderController` | `@Filter Specification<Order>`, `Pageable` | `ResultPaginationDTO` |
| `/api/v1/orders` | PUT | ADMIN | `OrderController` | JSON `ReqUpdateOrderStatusDTO` | `ResOrderDTO` |
| `/api/v1/orders/{id}` | DELETE | Authenticated; admin any, user own | Path `orderId` | `Void` |
| `/api/v1/orders/{id}/send-email` | POST | ADMIN | `EmailController` | Path `orderId` | `void` |

## 3. Database và entity

### 3.1 Bảng `carts`

Trong `hansport_v2be/src/main/resources/db/migration/V1__baseline_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sum INT NOT NULL,
    user_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_carts_user_id (user_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Entity `hansport_v2be/src/main/java/com/javaweb/domain/Cart.java`:

```java
@Entity
@Table(name = "carts")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Min(value = 0)
    private int sum;

    @OneToOne()
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "cart", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    List<CartDetail> cartDetails;
}
```

Ý nghĩa:

- Mỗi user có tối đa một cart đó unique key `uk_carts_user_id`.
- `sum` trong backend dạng đếm số dòng `CartDetail`, không phải tổng quantity.
- `cartDetails` có `orphanRemoval = true`, nên xóa detail khỏi cart có thể xóa row còn nếu entity lifecycle được quản lý.

### 3.2 Bảng `cart_detail`

Trong `V1__baseline_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS cart_detail (
    id BIGINT NOT NULL AUTO_INCREMENT,
    quantity BIGINT NOT NULL,
    price BIGINT NOT NULL,
    cart_id BIGINT,
    product_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_cart_detail_cart FOREIGN KEY (cart_id) REFERENCES carts (id),
    CONSTRAINT fk_cart_detail_product FOREIGN KEY (product_id) REFERENCES products (id)
);
```

Trong `V6__product_sale_options.sql`:

```sql
ALTER TABLE cart_detail
    ADD COLUMN selected_color VARCHAR(100) NULL AFTER price,
    ADD COLUMN selected_size VARCHAR(50) NULL AFTER selected_color;
```

Entity `hansport_v2be/src/main/java/com/javaweb/domain/CartDetail.java`:

```java
@Entity
@Table(name = "cart_detail")
public class CartDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private long quantity;
    private long price;
    private String selectedColor;
    private String selectedSize;

    @ManyToOne
    @JoinColumn(name = "cart_id")
    @JsonIgnore
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;
}
```

Ý nghĩa:

- `price` là snapshot giá tại thời điểm thêm vào cart.
- `selectedColor` vì `selectedSize` giúp phân biệt cùng mất product nhưng option khác nhau.
- Product trong cart detail dùng `FetchType.EAGER`.

### 3.3 Bảng `orders`

Trong `V1__baseline_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    total_price BIGINT NOT NULL,
    receiver_name VARCHAR(255),
    receiver_address VARCHAR(255),
    receiver_phone VARCHAR(255),
    status VARCHAR(255),
    user_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Entity `hansport_v2be/src/main/java/com/javaweb/domain/Order.java`:

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private long totalPrice;
    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> orderDetails;
}
```

### 3.4 Bảng `order_detail`

Trong `V1__baseline_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS order_detail (
    id BIGINT NOT NULL AUTO_INCREMENT,
    quantity BIGINT NOT NULL,
    price BIGINT NOT NULL,
    order_id BIGINT,
    product_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_detail_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_order_detail_product FOREIGN KEY (product_id) REFERENCES products (id)
);
```

Trong `V6__product_sale_options.sql`:

```sql
ALTER TABLE order_detail
    ADD COLUMN selected_color VARCHAR(100) NULL AFTER price,
    ADD COLUMN selected_size VARCHAR(50) NULL AFTER selected_color;
```

Entity `hansport_v2be/src/main/java/com/javaweb/domain/OrderDetail.java`:

```java
@Entity
@Table(name = "order_detail")
public class OrderDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private long quantity;
    private long price;
    private String selectedColor;
    private String selectedSize;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
}
```

Ý nghĩa:

- `OrderDetail.price` là snapshot giá từ `CartDetail.price`.
- `selectedColor`, `selectedSize` được copy từ giỏ hàng sang đơn hàng.

## 4. Thêm sản phẩm vào giỏ hàng

### 4.1 Frontend gửi add cart

API wrapper trong `hansport_v2fe/src/api/cartApi.js`:

```js
addToCart: (productId, quantity = 1, options = {}) =>
  axiosInstance.post("/api/v1/carts/add", {
    productId,
    quantity,
    selectedColor: options.selectedColor || null,
    selectedSize: options.selectedSize || null,
  }),
```

Từ trang detail `hansport_v2fe/src/pages/client/ProductDetailPage.jsx`, user có thể chọn quantity, color, size:

```js
await cartApi.addToCart(product.id, quantity, {
  selectedColor: selectedColor || availableColors[0] || "",
  selectedSize: selectedSize || availableSizes[0] || "",
});
const cartRes = await cartApi.getCart();
setCart(cartRes.data?.data?.cartDetails || []);
```

Từ list/home, frontend lấy option đầu tiên nếu có:

```js
await cartApi.addToCart(product.id, 1, {
  selectedColor: availableColors[0] || "",
  selectedSize: availableSizes[0] || "",
});
const cartRes = await cartApi.getCart();
setCart(cartRes.data?.data?.cartDetails || []);
```

### 4.2 Backend controller

File `hansport_v2be/src/main/java/com/javaweb/controller/CartController.java`:

```java
@PostMapping("/carts/add")
public ResponseEntity<ResCartDTO> addToCart(@RequestBody @Valid ReqAddProductToCartDTO reqAddProductToCartDTO)
        throws IdInvalidException {
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";
    ResCartDTO cart = this.cartService.addProductToCart(email, reqAddProductToCartDTO);
    return ResponseEntity.ok().body(cart);
}
```

Request DTO `ReqAddProductToCartDTO.java`:

```java
public class ReqAddProductToCartDTO {
    @Min(value = 1)
    private long productId;

    @Min(value = 1)
    private long quantity;
    private String selectedColor;
    private String selectedSize;
}
```

### 4.3 Backend service

File `hansport_v2be/src/main/java/com/javaweb/service/CartService.java`.

Lấy user vì cart, tạo cart nếu user chưa có:

```java
User currentUser = this.getUserOrThrow(email);
Cart cart = this.cartRepository.findByUser(currentUser).orElse(null);

if(cart==null){
    Cart otherCart = new Cart();
    otherCart.setUser(currentUser);
    otherCart.setSum(0);
    cart = this.cartRepository.save(otherCart);
}
```

Lấy product:

```java
Product realProduct = this.productRepository.findById(reqAddProductToCartDTO.getProductId())
        .orElseThrow(() -> new IdInvalidException(...));
```

Validate option:

```java
String selectedColor = resolveProductOption(reqAddProductToCartDTO.getSelectedColor(), realProduct.getColorOptions(), "Mau sac");
String selectedSize = resolveProductOption(reqAddProductToCartDTO.getSelectedSize(), realProduct.getSizeOptions(), "Size");
```

Tìm dòng cart cũ theo product + color + size:

```java
CartDetail oldDetail = this.cartDetailRepository.findByCartAndProductAndSelectedColorAndSelectedSize(
        cart, realProduct, selectedColor, selectedSize);
```

Kiểm tra quantity không vượt tồn kho hiện tại:

```java
long currentQuantity = oldDetail == null ? 0 : oldDetail.getQuantity();
if (currentQuantity + requestedQuantity > realProduct.getQuantity()) {
    throw new IdInvalidException(...);
}
```

Nếu chưa có dòng cart thứ tạo mới:

```java
CartDetail cd = new CartDetail();
cd.setCart(cart);
cd.setProduct(realProduct);
cd.setPrice(realProduct.getPrice());
cd.setQuantity(requestedQuantity);
cd.setSelectedColor(selectedColor);
cd.setSelectedSize(selectedSize);
this.cartDetailRepository.save(cd);

int s = cart.getSum() + 1;
cart.setSum(s);
cart = this.cartRepository.save(cart);
```

Nếu đã có dòng cart cùng product/color/size thủ công quantity:

```java
oldDetail.setQuantity(oldDetail.getQuantity() + requestedQuantity);
this.cartDetailRepository.save(oldDetail);
```

### 4.4 Luồng end-to-end add cart

```text
User bam Them vao gio
-> ProductDetailPage/ShopPage/HomePage gọi cartApi.addToCart
-> POST /api/v1/carts/add
-> CartController lay email từ SecurityUtil/JWT
-> CartService.getUserOrThrow(email)
-> CartRepository.findByUser, nếu chưa có thì tạo Cart
-> ProductRepository.findById(productId)
-> validate selectedColor/selectedSize theo product option
-> CartDetailRepository.findByCartAndProductAndSelectedColorAndSelectedSize
-> nếu dòng cũ tồn tại: cộng quantity
-> nếu chưa có: tạo CartDetail, snapshot price, tăng cart.sum
-> trả ResCartDTO
-> frontend gọi lại getCart và setCart vao Zustand
```

## 5. Xem giỏ hàng

### 5.1 Frontend

File `hansport_v2fe/src/pages/client/CartPage.jsx`:

```js
useEffect(() => {
  if (!user) { navigate("/login"); return; }
  cartApi.getCart()
    .then((res) => {
      const items = res.data?.data?.cartDetails || res.data?.data || [];
      setCart(items);
    })
    .finally(() => setLoading(false));
}, [navigate, setCart, user]);
```

State cart nằm trong `hansport_v2fe/src/store/useCartStore.js`:

```js
setCart: (items) => {
  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  set({ cartItems: items, totalCount, selectedIds: items.map(i => i.id) });
},
```

Ý nghĩa:

- Khi load cart, frontend chọn san tất cả cart detail ids vào `selectedIds`.
- `totalCount` frontend là tổng quantity, khác với backend `cart.sum` là số dòng cart detail.
- `getTotal` chỉ tính các item dạng được chọn:

```js
getTotal: () =>
  get().cartItems
    .filter(item => get().selectedIds.includes(item.id))
    .reduce(
      (sum, item) => sum + (item.product?.price || item.price || 0) * (item.quantity || 0),
      0
    ),
```

### 5.2 Backend

Controller:

```java
@GetMapping("/carts")
public ResponseEntity<ResCartDTO> getCart() throws IdInvalidException {
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";
    ResCartDTO cart = this.cartService.getCart(email);
    return ResponseEntity.ok().body(cart);
}
```

Service:

```java
@Transactional(readOnly = true)
public ResCartDTO getCart(String email) throws IdInvalidException {
    User currentUser = this.getUserOrThrow(email);
    Optional<Cart> cart = this.cartRepository.findByUser(currentUser);
    return cart.map(this::convertToResCartDTO).orElseGet(() -> this.convertEmptyCartDTO(currentUser));
}
```

Mapper cart:

```java
public ResCartDTO convertToResCartDTO (Cart cart){
    ResCartDTO resCartDTO = new ResCartDTO();
    List<CartDetail> cartDetails = cart.getCartDetails() == null ? Collections.emptyList() : cart.getCartDetails();

    List<ResCartDetailDTO> resCartDetailDTOS = new ArrayList<>();
    for(CartDetail cd : cartDetails) {
        resCartDetailDTOS.add(this.converToResCartDetailDTO(cd));
    }

    resCartDTO.setId(cart.getId());
    resCartDTO.setSum(cart.getSum());
    resCartDTO.setCartDetails(resCartDetailDTOS);
    return resCartDTO;
}
```

`ResCartDetailDTO` gồm product basic:

```java
public class ResCartDetailDTO {
    private long id;
    private long quantity;
    private long price;
    private String selectedColor;
    private String selectedSize;
    private ProductCartDetail product;

    public static class ProductCartDetail {
        private long id;
        private String name;
        private long price;
        private String image;
    }
}
```

Lưu ý: product trong cart response không có `quantity` tồn kho. Trong `CartPage.jsx`, UI dùng:

```js
const maxQty = item.product?.quantity ?? 999;
```

Vì backend DTO không tra `product.quantity`, frontend fallback `999`; backend vẫn là nơi chặn quantity vượt tồn kho khi update.

## 6. Cập nhật số lượng sản phẩm trong giỏ

### 6.1 Frontend

`CartPage.jsx`:

```js
const handleQuantityChange = async (item, delta) => {
  const newQty = (item.quantity || 1) + delta;
  const maxQty = item.product?.quantity ?? 999;
  if (newQty < 1 || newQty > maxQty) return;

  const cartRes = await cartApi.updateQuantity(item.id, newQty);
  const items = cartRes.data?.data?.cartDetails || cartRes.data?.data || [];
  setCart(items);
};
```

API:

```js
updateQuantity: (cartDetailId, quantity) =>
  axiosInstance.put(`/api/v1/carts/${cartDetailId}`, { quantity }),
```

### 6.2 Backend

Controller:

```java
@PutMapping("/carts/{id}")
public ResponseEntity<ResCartDTO> updateCartDetail(@PathVariable long id,
                                                   @RequestBody @Valid ReqUpdateCartDetailDTO req)
        throws IdInvalidException {
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";
    ResCartDTO cart = this.cartService.updateCartDetailQuantity(email, id, req.getQuantity());
    return ResponseEntity.ok().body(cart);
}
```

Request DTO:

```java
public class ReqUpdateCartDetailDTO {
    @Min(value = 1)
    private long quantity;
}
```

Service:

```java
CartDetail cartDetail = this.cartDetailRepository.findById(cartDetailId)
        .orElseThrow(() -> new IdInvalidException(...));

Cart currentCart = cartDetail.getCart();
if (currentCart == null || currentCart.getUser() == null || currentCart.getUser().getId() != currentUser.getId()) {
    throw new IdInvalidException(...);
}

Product product = cartDetail.getProduct();
if (quantity > product.getQuantity()) {
    throw new IdInvalidException(...);
}

cartDetail.setQuantity(quantity);
this.cartDetailRepository.save(cartDetail);
```

### 6.3 Luồng end-to-end update quantity

```text
User bam +/-
-> CartPage tinh newQty
-> cartApi.updateQuantity(cartDetailId, newQty)
-> PUT /api/v1/carts/{id}
-> CartController lay email current user
-> CartService.find cartDetail
-> kiểm tra cartDetail thuộc user hiện tại
-> kiểm tra quantity <= product.quantity
-> save cartDetail
-> trả ResCartDTO moi
-> frontend setCart(items)
```

## 7. Xóa sản phẩm khỏi giỏ hàng

### 7.1 Frontend

`CartPage.jsx`:

```js
const handleRemove = async (itemId) => {
  await cartApi.removeFromCart(itemId);
  removeItem(itemId);
};
```

`cartApi.js`:

```js
removeFromCart: (cartDetailId) =>
  axiosInstance.delete(`/api/v1/carts/${cartDetailId}`),
```

Zustand remove local:

```js
removeItem: (cartDetailId) => {
  const items = get().cartItems.filter((item) => item.id !== cartDetailId);
  const selectedIds = get().selectedIds.filter(id => id !== cartDetailId);
  const totalCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  set({ cartItems: items, totalCount, selectedIds });
},
```

### 7.2 Backend

Controller:

```java
@DeleteMapping("/carts/{id}")
public ResponseEntity<Void> deleteCartDetail(@PathVariable long id) throws IdInvalidException {
    if(!this.cartService.isCartDetailExist(id)){
        throw new IdInvalidException(...);
    }

    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";
    this.cartService.deleteCartDetail(email, id);
    return ResponseEntity.ok().body(null);
}
```

Service:

```java
CartDetail cartDetail = this.cartDetailRepository.findById(cartDetailId)
        .orElseThrow(() -> new IdInvalidException(...));

Cart currentCart = cartDetail.getCart();
if (currentCart == null || currentCart.getUser() == null || currentCart.getUser().getId() != currentUser.getId()) {
    throw new IdInvalidException(...);
}

this.cartDetailRepository.deleteById(cartDetailId);

if (currentCart.getSum() > 1) {
    int s = currentCart.getSum() - 1;
    currentCart.setSum(s);
    this.cartRepository.save(currentCart);
} else {
    this.cartRepository.deleteById(currentCart.getId());
}
```

### 7.3 Luồng end-to-end delete cart item

```text
User bấm delete tren dòng cart
-> cartApi.removeFromCart(cartDetailId)
-> DELETE /api/v1/carts/{id}
-> CartController check existsById
-> CartService.findById
-> kiểm tra dòng cart thuộc user hiện tại
-> delete cart_detail
-> nếu cart còn dòng: giảm cart.sum
-> nếu cart hết dòng: xóa cart
-> frontend removeItem khỏi Zustand
```

## 8. Checkout vì tạo đơn hàng

### 8.1 Frontend checkout

Từ `CartPage.jsx`, user chọn item thanh toán bằng checkbox. Nút checkout chỉ cho đi tiếp khi cũ `selectedIds`:

```js
if (selectedIds.length === 0) {
  toast.error(...);
  return;
}
navigate("/checkout");
```

`CheckoutPage.jsx` lấy cart vì selected ids từ Zustand:

```js
const { cartItems, getTotal, selectedIds, removeSelectedItems } = useCartStore();
```

Submit order:

```js
await orderApi.createOrder({ ...form, cartDetailIds: selectedIds });
removeSelectedItems();
setSuccess(true);
```

API:

```js
createOrder: (data) => axiosInstance.post("/api/v1/orders", data),
```

Lưu ý:

- Form frontend có field `note`, nhưng `ReqOrderDTO` backend không có `note`; field này không được lưu vào DB theo source hiện có.
- Frontend tính shipping theo sẽtting:

```js
const shipping = subtotal >= freeShipLimit ? 0 : baseShippingFee;
```

Nhưng backend `OrderService.placeOrder` chỉ set `totalPrice` bằng tổng tiền hàng `sum`, không cộng shipping.

### 8.2 Backend request và controller

Request DTO `ReqOrderDTO.java`:

```java
public class ReqOrderDTO {
    @NotBlank
    String receiverName;

    @NotBlank
    String receiverPhone;

    @NotBlank
    String receiverAddress;

    @NotEmpty
    List<Long> cartDetailIds;
}
```

Controller `OrderController.java`:

```java
@PostMapping("/orders")
public ResponseEntity<ResOrderDTO> placeOrder(@RequestBody @Valid ReqOrderDTO redOrderDTO)
        throws IdInvalidException {
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";

    ResOrderDTO order = this.orderService.placeOrder(email, redOrderDTO);
    return ResponseEntity.ok(order);
}
```

### 8.3 Backend service checkout

File `hansport_v2be/src/main/java/com/javaweb/service/OrderService.java`.

Lấy user vì cart:

```java
User currentUser = this.userRepository.findByEmail(email)
        .orElseThrow(() -> new IdInvalidException(...));
Cart cart = this.cartRepository.findByUser(currentUser)
        .orElseThrow(() -> new IdInvalidException(...));
```

Lọc các cart detail user đã chọn:

```java
List<CartDetail> allCartDetails = cart.getCartDetails();
List<CartDetail> orderItems = allCartDetails.stream()
        .filter(cd -> reqOrder.getCartDetailIds().contains(cd.getId()))
        .collect(Collectors.toList());

if (orderItems.isEmpty()) {
    throw new IdInvalidException(...);
}
```

Kiểm tra tồn kho và tính tổng tiền hàng:

```java
long sum = 0;
for (CartDetail cd : orderItems) {
    Product product = cd.getProduct();
    if (product.getQuantity() < cd.getQuantity()) {
        throw new IdInvalidException(...);
    }
    sum += cd.getPrice() * cd.getQuantity();
}
```

Tạo order `PENDING`:

```java
Order order = new Order();
order.setUser(currentUser);
order.setReceiverName(reqOrder.getReceiverName());
order.setReceiverAddress(reqOrder.getReceiverAddress());
order.setReceiverPhone(reqOrder.getReceiverPhone());
order.setStatus("PENDING");
order.setTotalPrice(sum);
order = this.orderRepository.save(order);
```

Trừ tồn kho vì tạo order detail:

```java
for (CartDetail cartDetail : orderItems) {
    Product product = cartDetail.getProduct();
    int affectedRows = this.productRepository.decrementStockIfAvailable(product.getId(), cartDetail.getQuantity());
    if (affectedRows == 0) {
        throw new IdInvalidException(...);
    }

    OrderDetail orderDetail = new OrderDetail();
    orderDetail.setOrder(order);
    orderDetail.setProduct(product);
    orderDetail.setPrice(cartDetail.getPrice());
    orderDetail.setQuantity(cartDetail.getQuantity());
    orderDetail.setSelectedColor(cartDetail.getSelectedColor());
    orderDetail.setSelectedSize(cartDetail.getSelectedSize());
    savedOrderDetails.add(this.orderDetailRepository.save(orderDetail));

    allCartDetails.remove(cartDetail);
}
```

Cập nhật/xóa cart sau checkout:

```java
if (!allCartDetails.isEmpty()) {
    cart.setSum(allCartDetails.size());
    this.cartRepository.save(cart);
} else {
    this.cartRepository.deleteById(cart.getId());
}
```

### 8.4 Stock decrement query

Trong `hansport_v2be/src/main/java/com/javaweb/repository/ProductRepository.java`:

```java
@Modifying(flushAutomatically = true)
@Query("update Product p set p.quantity = p.quantity - :quantity, p.sold = p.sold + :quantity where p.id = :productId and p.quantity >= :quantity")
int decrementStockIfAvailable(@Param("productId") long productId, @Param("quantity") long quantity);
```

Ý nghĩa:

- Chỉ update product nếu `p.quantity >= :quantity`.
- Nếu không đủ tồn kho tại thời điểm update, affected rows = 0.
- `OrderService` nem exception khi affected rows = 0.
- Do `placeOrder` có `@Transactional`, nếu một dòng thất bại thì order và các update trước đó cùng rollback.

### 8.5 Luồng end-to-end checkout

```text
User vào cart, chon các dòng cần thanh toán
-> CartPage luu selectedIds trong useCartStore
-> User vao CheckoutPage
-> Nhap receiverName/receiverPhone/receiverAddress
-> CheckoutPage gọi orderApi.createOrder({ receiver..., cartDetailIds: selectedIds })
-> POST /api/v1/orders
-> OrderController lay email current user
-> OrderService.placeOrder
-> UserRepository.findByEmail
-> CartRepository.findByUser
-> loc cartDetails theo cartDetailIds
-> tinh tong tien từ CartDetail.price * quantity
-> tạo Order status PENDING
-> với tung CartDetail: ProductRepository.decrementStockIfAvailable
-> tạo OrderDetail snapshot price/color/size
-> xóa các cart detail đã checkout khỏi cart, hoặc xóa cart nếu hết item
-> ResOrderDTO trả về
-> CheckoutPage removeSelectedItems và hiển thị success
```

## 9. Cập nhật trạng thái đơn hàng ở admin

### 9.1 Frontend admin

Trang admin: `hansport_v2fe/src/pages/admin/OrdersAdminPage.jsx`.

Nó lấy logic từ `useOrdersAdmin`:

```js
const {
  orders,
  page,
  setPage,
  totalPages,
  filterStatus,
  setFilterStatus,
  selected,
  handleUpdateStatus,
  handleSendEmail,
  handleDelete,
} = useOrdersAdmin();
```

Fetch list có filter status:

```js
const params = { page, size: 10 };
if (filterStatus) params.filter = `status:'${filterStatus}'`;
const res = await orderApi.getAllOrders(params);
```

API:

```js
getAllOrders: (params) => axiosInstance.get("/api/v1/orders", { params }),
updateOrder: (data) => axiosInstance.put("/api/v1/orders", data),
sendOrderEmail: (id) => axiosInstance.post(`/api/v1/orders/${id}/send-email`),
```

`OrderStatusActions.jsx` chỉ hiển thị các transition frontend cho phép:

```js
const allowedTransitions = getAllowedTransitions(currentStatus);
```

Workflow frontend trong `orderWorkflow.js`:

```js
export const STATUS_LIST = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"];

export const ORDER_WORKFLOW = {
  PENDING: { allowedTransitions: ["PROCESSING", "CANCELLED"] },
  PROCESSING: { allowedTransitions: ["SHIPPING", "CANCELLED"] },
  SHIPPING: { allowedTransitions: ["COMPLETED", "CANCELLED"] },
  COMPLETED: { allowedTransitions: [] },
  CANCELLED: { allowedTransitions: [] },
};
```

Component còn có comment/UI warning rang đây chỉ là UI guard, backend chưa enforce workflow:

```js
<span>
  ... UI guard ...
</span>
```

Hook update status:

```js
await orderApi.updateOrder({ id: order.id, status: newStatus });
setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, status: newStatus } : item));
if (selected?.id === order.id) setSelected({ ...selected, status: newStatus });

if (newStatus === "PROCESSING") {
  await orderApi.sendOrderEmail(order.id);
}
```

### 9.2 Backend admin order APIs

Lấy tất cả order:

```java
@GetMapping("/orders")
public ResponseEntity<ResultPaginationDTO> getAllOrders(@Filter Specification<Order> spec,
                                                        Pageable pageable) {
    return ResponseEntity.status(HttpStatus.OK).body(this.orderService.fetchAllOrders(spec, pageable));
}
```

Service:

```java
Page<Order> orders = this.orderRepository.findAll(spec, pageable);
```

Cập nhật status:

```java
@PutMapping("/orders")
public ResponseEntity<ResOrderDTO> updateOrder(@RequestBody @Valid ReqUpdateOrderStatusDTO order)
        throws IdInvalidException {
    return ResponseEntity.ok().body(this.orderService.updateOrderStatus(order));
}
```

Service validate status nằm trong danh sách:

```java
String status = req.getStatus().trim().toUpperCase();
List<String> allowedStatus = Arrays.asList("PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED");
if (!allowedStatus.contains(status)) {
    throw new IdInvalidException(...);
}
order.setStatus(status);
return this.convertToResOrderDTO(this.orderRepository.save(order));
```

Gửi email:

```java
@PostMapping("/orders/{id}/send-email")
public void sendOrderEmail(@PathVariable long id) throws IdInvalidException {
    this.orderService.sendOrderEmail(id);
}
```

`OrderService.sendOrderEmail` lấy order detail vì dùng template `order`:

```java
this.emailService.sendEmailFromTemplateSync(
        currentOrder.getUser().getEmail(),
        "...",
        "order",
        orderEmailDTO
);
```

### 9.3 Lưu ý vì status

Trong `hansport_v2fe/src/utils/constants.js`, frontend có khai báo thêm `CONFIRMED`:

```js
export const ORDER_STATUS = {
  PENDING: ...,
  CONFIRMED: ...,
  PROCESSING: ...,
  SHIPPING: ...,
  COMPLETED: ...,
  CANCELLED: ...,
};
```

Trong `MyOrdersPage.jsx` cũng có filter `CONFIRMED`. Tuy nhien:

- Backend `allowedStatus` không có `CONFIRMED`.
- Admin `STATUS_LIST` trong `orderWorkflow.js` không có `CONFIRMED`.

Theo source hiện tại, `CONFIRMED` là status có label trên frontend nhưng không được tạo/cập nhật bởi backend admin flow.

## 10. User xem đơn hàng của mình

### 10.1 Frontend

File `hansport_v2fe/src/pages/client/MyOrdersPage.jsx`.

Fetch orders:

```js
orderApi.getMyOrders()
  .then((res) => {
    const data = res.data?.data?.result || res.data?.data || [];
    setOrders(Array.isArray(data) ? data : []);
  });
```

API:

```js
getMyOrders: () => axiosInstance.get("/api/v1/orders/my"),
```

Filter status ở client:

```js
const filteredOrders = activeFilter === "ALL"
  ? orders
  : orders.filter((order) => order.status === activeFilter);
```

Mo rỗng order để xem item, địa chỉ, phone, status. User chỉ thấy nut huy khi `order.status === "PENDING"`:

```js
{order.status === "PENDING" && (
  <button onClick={() => setCancelTarget(order)}>
    ...
  </button>
)}
```

Hủy đơn trong UI gửi DELETE:

```js
await orderApi.deleteOrder(cancelTarget.id);
fetchOrders();
```

### 10.2 Backend

Controller:

```java
@GetMapping("/orders/my")
public ResponseEntity<ResultPaginationDTO> getMyOrders(Pageable pageable) throws IdInvalidException {
    String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
            SecurityUtil.getCurrentUserLogin().get() : "";
    return ResponseEntity.status(HttpStatus.OK).body(this.orderService.fetchMyOrders(email, pageable));
}
```

Service:

```java
User currentUser = this.userRepository.findByEmail(email)
        .orElseThrow(() -> new IdInvalidException(...));
Page<Order> orders = this.orderRepository.findByUser(currentUser, pageable);
return this.convertToPaginationDTO(orders, pageable);
```

Repository:

```java
Page<Order> findByUser(User user, Pageable pageable);
```

Delete order:

```java
boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
if (isAdmin) {
    order = this.orderRepository.findById(id)
            .orElseThrow(() -> new IdInvalidException(...));
} else {
    order = this.orderRepository.findByUserAndId(currentUser, id)
            .orElseThrow(() -> new IdInvalidException(...));
}
this.orderRepository.delete(order);
```

Lưu ý:

- `deleteOrder` là xóa record order, không phải update status `CANCELLED`.
- Service không kiểm tra status PENDING khi user delete; UI chỉ hiển thị nút khi PENDING, nhưng backend cho user xóa bất kỳ order của mình nếu gửi API trực tiếp.
- Xóa/cancel đơn không hoàn khó vì không trừ lại `sold`.

## 11. Giải thích các file được yêu cầu

| File | Vai trò | Logic quan trọng | Module liên quan |
|---|---|---|---|
| `hansport_v2be/src/main/java/com/javaweb/controller/CartController.java` | REST controller cart | Add/view/update/delete cart detail, lấy email từ `SecurityUtil` | `CartService`, JWT auth |
| `hansport_v2be/src/main/java/com/javaweb/service/CartService.java` | Nghiệp vụ cart | Tạo cart, validate product option, merge item cùng product/color/size, check stock khi add/update, owner check khi update/delete | `CartRepository`, `CartDetailRepository`, `UserRepository`, `ProductRepository` |
| `hansport_v2be/src/main/java/com/javaweb/controller/OrderController.java` | REST controller order | Place order, admin update/list, user my orders, delete order | `OrderService`, Spring Filter, Pageable |
| `hansport_v2be/src/main/java/com/javaweb/service/OrderService.java` | Nghiệp vụ order | Checkout, trừ kho, tạo order/order detail, remove cart items, list orders, update status, send email, delete order | `OrderRepository`, `OrderDetailRepository`, `CartRepository`, `ProductRepository`, `EmailService` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Cart.java` | Entity `carts` | One cart per user, `sum`, one-to-many cart details | `users`, `cart_detail` |
| `hansport_v2be/src/main/java/com/javaweb/domain/CartDetail.java` | Entity `cart_detail` | Quantity, price snapshot, selected color/size, product link | `carts`, `products` |
| `hansport_v2be/src/main/java/com/javaweb/domain/Order.java` | Entity `orders` | Receiver info, total price, status, user, order details | `users`, `order_detail` |
| `hansport_v2be/src/main/java/com/javaweb/domain/OrderDetail.java` | Entity `order_detail` | Quantity, price snapshot, selected color/size, product link | `orders`, `products` |
| `hansport_v2fe/src/pages/client/CartPage.jsx` | Trang giỏ hàng | Load cart, sẽlect items, update quantity, delete item, tính tạm tính/shipping UI | `cartApi`, `useCartStore`, settings |
| `hansport_v2fe/src/pages/client/CheckoutPage.jsx` | Trang checkout | Lấy selected cart items, nhập receiver info, tạo order, hiển thị success | `orderApi`, `useCartStore` |
| `hansport_v2fe/src/pages/admin/OrdersAdminPage.jsx` | Trang admin order | Metrics, filter status, table, detail panel, update status, delete order | `useOrdersAdmin`, `OrderTable`, `OrderDetailPanel` |

## 12. DTO và API wrapper

### 12.1 Cart API frontend

`hansport_v2fe/src/api/cartApi.js`:

```js
export const cartApi = {
  getCart: () => axiosInstance.get("/api/v1/carts"),
  addToCart: (productId, quantity = 1, options = {}) => axiosInstance.post("/api/v1/carts/add", {...}),
  removeFromCart: (cartDetailId) => axiosInstance.delete(`/api/v1/carts/${cartDetailId}`),
  updateQuantity: (cartDetailId, quantity) => axiosInstance.put(`/api/v1/carts/${cartDetailId}`, { quantity }),
};
```

### 12.2 Order API frontend

`hansport_v2fe/src/api/orderApi.js`:

```js
export const orderApi = {
  createOrder: (data) => axiosInstance.post("/api/v1/orders", data),
  getMyOrders: () => axiosInstance.get("/api/v1/orders/my"),
  getAllOrders: (params) => axiosInstance.get("/api/v1/orders", { params }),
  updateOrder: (data) => axiosInstance.put("/api/v1/orders", data),
  deleteOrder: (id) => axiosInstance.delete(`/api/v1/orders/${id}`),
  sendOrderEmail: (id) => axiosInstance.post(`/api/v1/orders/${id}/send-email`),
};
```

### 12.3 Order response

`ResOrderDTO.java`:

```java
public class ResOrderDTO {
    private long id;
    private long totalPrice;
    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String status;
    private UserOrder user;
    private List<ResOrderDetailDTO> orderDetails;
    private Instant createdAt;
    private Instant updatedAt;
}
```

`ResOrderDetailDTO.java`:

```java
public class ResOrderDetailDTO {
    private long id;
    private long quantity;
    private long price;
    private String selectedColor;
    private String selectedSize;
    private ProductOrderDetail product;
}
```

## 13. Logic trừ tồn kho vì rủi ro oversell

### 13.1 Cart không trừ tồn kho

Khi add/update cart:

- Backend kiểm tra quantity không vượt `product.quantity`.
- Không trừ `products.quantity`.
- Không reserve stock.

Điều này hợp là cho giỏ hàng, nhưng cart có thể stale nếu user A thêm hàng vào cart, user B checkout trước.

### 13.2 Checkout có chống oversell bằng conditional update

Trong `OrderService.placeOrder`, service kiểm tra tồn kho trước:

```java
if (product.getQuantity() < cd.getQuantity()) {
    throw new IdInvalidException(...);
}
```

Sau đó trừ khó bằng update có điều kiện:

```java
int affectedRows = this.productRepository.decrementStockIfAvailable(product.getId(), cartDetail.getQuantity());
if (affectedRows == 0) {
    throw new IdInvalidException(...);
}
```

Query:

```java
update Product p
set p.quantity = p.quantity - :quantity,
    p.sold = p.sold + :quantity
where p.id = :productId
  and p.quantity >= :quantity
```

Danh giá:

- Đây là điểm tốt: query update có điều kiện trên DB giúp ngắn oversell khi nhiều checkout đồng thời.
- `@Transactional` giúp rollback order/order_detail/stock nếu bất kỳ item nao trong checkout thất bại.

### 13.3 Rủi ro còn lỗi

1. Hủy/xóa đơn không hoàn kho.

`deleteOrder` chỉ:

```java
this.orderRepository.delete(order);
```

Không cong lỗi `products.quantity`, không trừ `products.sold`.

2. Update status sang `CANCELLED` không hoàn kho.

`updateOrderStatus` chỉ set status:

```java
order.setStatus(status);
```

Không có logic nếu status mới là `CANCELLED` thứ restore stock.

3. Backend không enforce workflow status.

Frontend chỉ hiển thị transition hợp lệ, nhưng backend chấp nhận bất kỳ status trong allowed list. Vì đã gửi API trực tiếp có thể chuyển `PENDING` sang `COMPLETED`.

4. User delete order không check status.

UI chỉ hiển thị cancel khi `PENDING`, nhưng backend cho user xóa bất kỳ order của mình vì `deleteOrder` không check status.

5. `CONFIRMED` bị lệch giữa frontend và backend.

Frontend constants/MyOrders có `CONFIRMED`, nhưng backend allowed status và admin workflow không có.

6. Shipping/note chỉ ở frontend.

Checkout UI tính shipping và có note, nhưng backend order entity/DTO/request hiện không lưu shipping fee hoặc note. `Order.totalPrice` chỉ là tổng tiền hàng.

7. Cart DTO không tra product stock.

CartPage có logic UI chặn max quantity bảng `item.product?.quantity`, nhưng `ProductCartDetail` không có `quantity`; UI fallback `999`. Backend vẫn chặn, nhưng UX có thể chỉ báo lỗi sau khi gửi API.

8. Add cart cho product inactive.

`CartService.addProductToCart` dùng `productRepository.findById`, không check `product.active`. Nếu biết id product an, user authenticated có thể add vào cart qua API.

## 14. Mermaid sẽquence diagram checkout

```mermaid
sequenceDiagram
    actor User
    participant CartPage as CartPage.jsx
    participant Store as useCartStore
    participant Checkout as CheckoutPage.jsx
    participant API as orderApi
    participant Controller as OrderController
    participant Service as OrderService
    participant CartRepo as CartRepository
    participant ProductRepo as ProductRepository
    participant OrderRepo as OrderRepository
    participant OrderDetailRepo as OrderDetailRepository
    participant DB as MySQL

    User->>CartPage: Chọn cart items
    CartPage->>Store: selectedIds = cartDetail ids
    User->>CartPage: Bam đặt hàng ngay
    CartPage->>Checkout: navigate /checkout
    User->>Checkout: Nhập thông tin giao hàng
    Checkout->>API: createOrder(receiver..., cartDetailIds)
    API->>Controller: POST /api/v1/orders
    Controller->>Service: placeOrder(email, ReqOrderDTO)
    Service->>CartRepo: findByUser(currentUser)
    CartRepo->>DB: SELECT carts + cart_detail
    DB-->>CartRepo: Cart
    CartRepo-->>Service: Cart
    Service->>Service: Lọc cartDetails theo cartDetailIds
    Service->>Service: Kiểm tra product.quantity >= cartDetail.quantity
    Service->>OrderRepo: save(Order status PENDING)
    OrderRepo->>DB: INSERT orders
    DB-->>OrderRepo: Order id
    loop Mới cart detail được chọn
        Service->>ProductRepo: decrementStockIfAvailable(productId, quantity)
        ProductRepo->>DB: UPDATE products WHERE quantity >= requested
        DB-->>ProductRepo: affectedRows
        alt affectedRows == 0
            ProductRepo-->>Service: 0
            Service-->>Controller: Throw IdInvalidException, transaction rollback
            Controller-->>Checkout: Error response
        elsẽ affectedRows == 1
            ProductRepo-->>Service: 1
            Service->>OrderDetailRepo: save(OrderDetail)
            OrderDetailRepo->>DB: INSERT order_detail
        end
    end
    Service->>CartRepo: save cart còn item hoặc delete cart nếu het item
    CartRepo->>DB: UPDATE/DELETE carts/cart_detail
    Service-->>Controller: ResOrderDTO
    Controller-->>Checkout: 200 OK
    Checkout->>Store: removeSelectedItems()
    Checkout-->>User: Hiện đặt hàng thành công
```

## 15. Tổng kết theo luồng chức năng

| Luồng | Frontend | API | Service | Database | Response |
|---|---|---|---|---|---|
| Thêm vào giỏ | `ProductDetailPage.jsx`, `ShopPage.jsx`, `HomePage.jsx`, `ProductCard.jsx` | `POST /api/v1/carts/add` | `CartService.addProductToCart` | `carts`, `cart_detail`, `products` | `ResCartDTO` |
| Xem giỏ | `CartPage.jsx` | `GET /api/v1/carts` | `CartService.getCart` | `carts`, `cart_detail`, `products` | `ResCartDTO` |
| Cập nhật quantity | `CartPage.jsx` | `PUT /api/v1/carts/{id}` | `CartService.updateCartDetailQuantity` | `cart_detail`, `products` | `ResCartDTO` |
| Xóa item cart | `CartPage.jsx` | `DELETE /api/v1/carts/{id}` | `CartService.deleteCartDetail` | `cart_detail`, có thể xóa `carts` | `Void` |
| Checkout | `CheckoutPage.jsx` | `POST /api/v1/orders` | `OrderService.placeOrder` | `orders`, `order_detail`, `products`, `carts`, `cart_detail` | `ResOrderDTO` |
| Admin list/filter order | `OrdersAdminPage.jsx`, `useOrdersAdmin.js` | `GET /api/v1/orders` | `OrderService.fetchAllOrders` | `orders`, `order_detail` | `ResultPaginationDTO` |
| Admin update status | `OrderStatusActions.jsx` | `PUT /api/v1/orders` | `OrderService.updateOrderStatus` | `orders` | `ResOrderDTO` |
| User xem đơn | `MyOrdersPage.jsx` | `GET /api/v1/orders/my` | `OrderService.fetchMyOrders` | `orders`, `order_detail` | `ResultPaginationDTO` |
| Gửi email order | `useOrdersAdmin.js` | `POST /api/v1/orders/{id}/send-email` | `OrderService.sendOrderEmail` | `orders`, `order_detail` | `void` |

