package com.javaweb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.Order;
import com.javaweb.domain.AppSetting;
import com.javaweb.domain.Product;
import com.javaweb.domain.Role;
import com.javaweb.domain.User;
import com.javaweb.domain.request.ReqAddProductToCartDTO;
import com.javaweb.domain.request.ReqChangePasswordDTO;
import com.javaweb.domain.request.ReqOrderDTO;
import com.javaweb.domain.request.ReqProductDTO;
import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.domain.request.ReqSiteSettingsDTO;
import com.javaweb.domain.response.ResLoginDTO;
import com.javaweb.domain.response.product.ResProductImportDTO;
import com.javaweb.domain.response.role.ResRoleDTO;
import com.javaweb.repository.OrderRepository;
import com.javaweb.repository.AppSettingRepository;
import com.javaweb.repository.ProductImageRepository;
import com.javaweb.repository.ProductRepository;
import com.javaweb.repository.RoleRepository;
import com.javaweb.repository.SiteBannerRepository;
import com.javaweb.repository.SiteCategoryRepository;
import com.javaweb.repository.SiteNavigationItemRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.AppSettingService;
import com.javaweb.service.CartService;
import com.javaweb.service.EmailService;
import com.javaweb.service.FileService;
import com.javaweb.service.OrderService;
import com.javaweb.service.ProductService;
import com.javaweb.service.ProductImportService;
import com.javaweb.util.SecurityUtil;
import com.javaweb.util.error.IdInvalidException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:hansport;MODE=MySQL;DATABASE_TO_UPPER=false;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.flyway.enabled=false",
		"spring.jpa.show-sql=false",
		"app.seed.enabled=true",
		"app.seed.admin.enabled=true",
		"app.seed.admin.password=Admin@123",
		"hansport.upload-file.base-path=target/test-upload"
})
@AutoConfigureMockMvc
class HansportApplicationTests {

	@DynamicPropertySource
	static void dynamicProperties(DynamicPropertyRegistry registry) {
		registry.add("hansport.jwt.base64-secret", HansportApplicationTests::testJwtSecret);
		registry.add("spring.security.oauth2.client.registration.google.client-id", () -> "test-google-client-id");
		registry.add("spring.security.oauth2.client.registration.google.client-secret", () -> "test-google-client-secret");
		registry.add("spring.mail.username", () -> "test@example.invalid");
		registry.add("spring.mail.password", () -> "test-mail-password");
	}

	private static String testJwtSecret() {
		String key = "test-only-jwt-signing-key-for-hansport-application-tests-not-for-production-000000";
		return Base64.getEncoder().encodeToString(key.getBytes(StandardCharsets.UTF_8));
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private ProductImageRepository productImageRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private AppSettingRepository appSettingRepository;

	@Autowired
	private SiteBannerRepository siteBannerRepository;

	@Autowired
	private SiteCategoryRepository siteCategoryRepository;

	@Autowired
	private SiteNavigationItemRepository siteNavigationItemRepository;

	@Autowired
	private CartService cartService;

	@Autowired
	private OrderService orderService;

	@Autowired
	private AppSettingService appSettingService;

	@Autowired
	private FileService fileService;

	@Autowired
	private ProductService productService;

	@Autowired
	private ProductImportService productImportService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private SecurityUtil securityUtil;

	@MockBean
	private EmailService emailService;

	@Test
	void contextLoads() {
		Assertions.assertTrue(roleRepository.existsByName("ADMIN"));
		Assertions.assertTrue(roleRepository.existsByName("USER"));
		Assertions.assertTrue(userRepository.existsByEmail("admin@hansport.local"));
	}

	@Test
	void loginStoresHashedRefreshTokenAndRefreshRotatesIt() throws Exception {
		MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"admin@hansport.local","password":"Admin@123"}
								"""))
				.andExpect(status().isOk())
				.andReturn();

		Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");
		Assertions.assertNotNull(refreshCookie);

		User adminAfterLogin = userRepository.findByEmail("admin@hansport.local").orElseThrow();
		String firstHash = adminAfterLogin.getRefreshToken();
		Assertions.assertNotNull(firstHash);
		Assertions.assertFalse(firstHash.startsWith("eyJ"));

		mockMvc.perform(get("/api/v1/auth/refresh").cookie(refreshCookie))
				.andExpect(status().isOk());

		String rotatedHash = userRepository.findByEmail("admin@hansport.local").orElseThrow().getRefreshToken();
		Assertions.assertNotEquals(firstHash, rotatedHash);
	}

	@Test
	void accountProfileCanBeFetchedAndUpdatedWithoutChangingEmail() throws Exception {
		User user = createUser("profile-user@example.test", "User@123");
		user.setFullName("Profile User");
		user.setPhone("0900000001");
		user.setAddress("Old Address");
		userRepository.save(user);

		mockMvc.perform(get("/api/v1/auth/account")
						.header("Authorization", "Bearer " + accessTokenFor(user)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.user.email").value("profile-user@example.test"))
				.andExpect(jsonPath("$.data.user.fullName").value("Profile User"))
				.andExpect(jsonPath("$.data.user.phone").value("0900000001"))
				.andExpect(jsonPath("$.data.user.address").value("Old Address"));

		mockMvc.perform(put("/api/v1/auth/account")
						.header("Authorization", "Bearer " + accessTokenFor(user))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"fullName":"Updated Profile","phone":"0911111111","address":"New Address","email":"ignored@example.test"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.fullName").value("Updated Profile"))
				.andExpect(jsonPath("$.data.phone").value("0911111111"))
				.andExpect(jsonPath("$.data.address").value("New Address"));

		User updated = userRepository.findById(user.getId()).orElseThrow();
		Assertions.assertEquals("profile-user@example.test", updated.getEmail());
		Assertions.assertEquals("Updated Profile", updated.getFullName());
	}

	@Test
	void userCannotSendOrderEmailButAdminCan() throws Exception {
		User user = createUser("email-user@example.test", "User@123");
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();
		Order order = new Order();
		order.setUser(admin);
		order.setReceiverName("Test Receiver");
		order.setReceiverAddress("Test Address");
		order.setReceiverPhone("0900000000");
		order.setStatus("PENDING");
		order.setTotalPrice(1000);
		order = orderRepository.save(order);

		mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/send-email")
						.header("Authorization", "Bearer " + accessTokenFor(user)))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/send-email")
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isOk());
	}

	@Test
	void dashboardSummaryRequiresAdminRole() throws Exception {
		User user = createUser("dashboard-user@example.test", "User@123");
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();

		mockMvc.perform(get("/api/v1/admin/dashboard/summary")
						.header("Authorization", "Bearer " + accessTokenFor(user)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/admin/dashboard/summary")
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.totalProducts").exists())
				.andExpect(jsonPath("$.data.totalUsers").exists())
				.andExpect(jsonPath("$.data.totalOrders").exists())
				.andExpect(jsonPath("$.data.lowStockCount").exists())
				.andExpect(jsonPath("$.data.recentOrders").isArray());
	}

	@Test
	void adminCannotDeleteOwnAccount() throws Exception {
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();

		mockMvc.perform(delete("/api/v1/users/" + admin.getId())
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isBadRequest());

		Assertions.assertTrue(userRepository.existsByEmail(admin.getEmail()));
	}

	@Test
	void loginRateLimitReturnsTooManyRequests() throws Exception {
		for (int i = 0; i < 5; i++) {
			mockMvc.perform(post("/api/v1/auth/login")
							.header("X-Forwarded-For", "203.0.113.10")
							.contentType(MediaType.APPLICATION_JSON)
							.content("""
									{"username":"missing@example.test","password":"Wrong@123"}
									"""))
					.andExpect(status().isBadRequest());
		}

		mockMvc.perform(post("/api/v1/auth/login")
						.header("X-Forwarded-For", "203.0.113.10")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"missing@example.test","password":"Wrong@123"}
								"""))
				.andExpect(status().isTooManyRequests());
	}

	@Test
	void cartQuantityUpdateKeepsCartDetailAndRejectsOverStock() throws Exception {
		User user = createUser("cart-user@example.test", "User@123");
		Product product = createProduct("Cart Test Product", 2);

		ReqAddProductToCartDTO addReq = new ReqAddProductToCartDTO();
		addReq.setProductId(product.getId());
		addReq.setQuantity(1);
		cartService.addProductToCart(user.getEmail(), addReq);
		var cart = cartService.getCart(user.getEmail());
		long cartDetailId = cart.getCartDetails().get(0).getId();

		var updated = cartService.updateCartDetailQuantity(user.getEmail(), cartDetailId, 2);
		Assertions.assertEquals(cartDetailId, updated.getCartDetails().get(0).getId());
		Assertions.assertEquals(2, updated.getCartDetails().get(0).getQuantity());

		Assertions.assertThrows(IdInvalidException.class,
				() -> cartService.updateCartDetailQuantity(user.getEmail(), cartDetailId, 3));
	}

	@Test
	void cartAndOrderPreserveSelectedVariantOptions() throws Exception {
		User user = createUser("variant-user@example.test", "User@123");
		Product product = createProduct("Variant Test Product", 5);
		product.setColorOptions("Blue|Black");
		product.setSizeOptions("4U5|3U5");
		productRepository.save(product);

		ReqAddProductToCartDTO blueReq = new ReqAddProductToCartDTO();
		blueReq.setProductId(product.getId());
		blueReq.setQuantity(1);
		blueReq.setSelectedColor("Blue");
		blueReq.setSelectedSize("4U5");

		cartService.addProductToCart(user.getEmail(), blueReq);
		var cart = cartService.getCart(user.getEmail());
		var blueDetail = cart.getCartDetails().get(0);
		Assertions.assertEquals("Blue", blueDetail.getSelectedColor());
		Assertions.assertEquals("4U5", blueDetail.getSelectedSize());

		ReqAddProductToCartDTO blackReq = new ReqAddProductToCartDTO();
		blackReq.setProductId(product.getId());
		blackReq.setQuantity(1);
		blackReq.setSelectedColor("Black");
		blackReq.setSelectedSize("4U5");

		cartService.addProductToCart(user.getEmail(), blackReq);
		var variantCart = cartService.getCart(user.getEmail());
		Assertions.assertEquals(2, variantCart.getCartDetails().size());

		ReqAddProductToCartDTO invalidReq = new ReqAddProductToCartDTO();
		invalidReq.setProductId(product.getId());
		invalidReq.setQuantity(1);
		invalidReq.setSelectedColor("Green");
		invalidReq.setSelectedSize("4U5");
		Assertions.assertThrows(IdInvalidException.class,
				() -> cartService.addProductToCart(user.getEmail(), invalidReq));

		var order = orderService.placeOrder(user.getEmail(), orderRequest(List.of(blueDetail.getId())));
		Assertions.assertEquals("Blue", order.getOrderDetails().get(0).getSelectedColor());
		Assertions.assertEquals("4U5", order.getOrderDetails().get(0).getSelectedSize());
	}

	@Test
	void settingsRejectInvalidJsonArray() {
		ReqSettingUpdateDTO dto = new ReqSettingUpdateDTO();
		dto.setSettingKey("BRANDS");
		dto.setSettingValue("{bad-json");

		Assertions.assertThrows(IdInvalidException.class,
				() -> appSettingService.updateBulkSettings(List.of(dto)));
	}

	@Test
	void settingsRejectUnsupportedKey() {
		ReqSettingUpdateDTO dto = new ReqSettingUpdateDTO();
		dto.setSettingKey("UNKNOWN_SETTING");
		dto.setSettingValue("value");

		Assertions.assertThrows(IdInvalidException.class,
				() -> appSettingService.updateBulkSettings(List.of(dto)));
	}

	@Test
	void bulkSettingsRejectInvalidHeaderNavPath() {
		ReqSettingUpdateDTO dto = new ReqSettingUpdateDTO();
		dto.setSettingKey("HEADER_NAV");
		dto.setSettingValue("""
				[{"label":"Cửa hàng","path":"shop"}]
				""");

		Assertions.assertThrows(IdInvalidException.class,
				() -> appSettingService.updateBulkSettings(List.of(dto)));
	}

	@Test
	void adminCanUpdateTypedSiteSettingsAndUserCannot() throws Exception {
		User user = createUser("settings-user@example.test", "User@123");
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();

		ReqSiteSettingsDTO settings = siteSettingsRequest();

		mockMvc.perform(put("/api/v1/admin/settings/site")
						.header("Authorization", "Bearer " + accessTokenFor(user))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(settings)))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/admin/settings/site")
						.header("Authorization", "Bearer " + accessTokenFor(admin))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(settings)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/admin/settings")
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.HOTLINE").value("091 222 3333"))
				.andExpect(jsonPath("$.data.SHIPPING_FEE").value("25000"));
	}

	@Test
	void typedSiteSettingsRejectInvalidPath() {
		ReqSiteSettingsDTO settings = siteSettingsRequest();
		settings.getHeaderNav().get(0).setPath("shop");

		Assertions.assertThrows(IdInvalidException.class,
				() -> appSettingService.updateSiteSettings(settings));
	}

	@Test
	@Transactional
	void bannerSettingsAllowImageAndLinkWithoutOverlayText() throws Exception {
		ReqSiteSettingsDTO settings = siteSettingsRequest();
		ReqSiteSettingsDTO.HeroSlideDTO slide = settings.getHeroSlides().get(0);
		slide.setTitle("");
		slide.setSubtitle("");
		slide.setCta("");
		slide.setAltText("");

		appSettingService.updateSiteSettings(settings);

		var banner = siteBannerRepository.findAllByOrderBySortOrderAscIdAsc().get(0);
		Assertions.assertEquals("", banner.getTitle());
		Assertions.assertEquals("banner.png", banner.getImage());
		Assertions.assertEquals("/shop", banner.getCtaLink());
	}

	@Test
	void bannerSettingsRequireAnImage() {
		ReqSiteSettingsDTO settings = siteSettingsRequest();
		settings.getHeroSlides().get(0).setImage("");

		Assertions.assertThrows(IdInvalidException.class,
				() -> appSettingService.updateSiteSettings(settings));
	}

	@Test
	void publicSettingsHideInactiveItemsButAdminSettingsKeepThem() throws Exception {
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();
		ReqSiteSettingsDTO settings = siteSettingsRequest();

		ReqSiteSettingsDTO.HeroSlideDTO hiddenSlide = new ReqSiteSettingsDTO.HeroSlideDTO();
		hiddenSlide.setTitle("Banner ẩn");
		hiddenSlide.setSubtitle("Không hiển thị ngoài public");
		hiddenSlide.setCta("Xem");
		hiddenSlide.setCtaLink("/shop");
		hiddenSlide.setImage("hidden-banner.png");
		hiddenSlide.setImageFolder("banner");
		hiddenSlide.setAltText("Banner ẩn");
		hiddenSlide.setActive(false);
		settings.setHeroSlides(List.of(settings.getHeroSlides().get(0), hiddenSlide));

		ReqSiteSettingsDTO.NavigationItemDTO hiddenNav = new ReqSiteSettingsDTO.NavigationItemDTO();
		hiddenNav.setLabel("Menu ẩn");
		hiddenNav.setPath("/hidden");
		hiddenNav.setActive(false);
		settings.setHeaderNav(List.of(settings.getHeaderNav().get(0), hiddenNav));

		appSettingService.updateSiteSettings(settings);

		MvcResult publicResult = mockMvc.perform(get("/api/v1/settings"))
				.andExpect(status().isOk())
				.andReturn();
		var publicData = objectMapper.readTree(publicResult.getResponse().getContentAsString()).get("data");
		Assertions.assertEquals(1, objectMapper.readTree(publicData.get("HERO_SLIDES").asText()).size());
		Assertions.assertEquals(1, objectMapper.readTree(publicData.get("HEADER_NAV").asText()).size());

		MvcResult adminResult = mockMvc.perform(get("/api/v1/admin/settings")
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isOk())
				.andReturn();
		var adminData = objectMapper.readTree(adminResult.getResponse().getContentAsString()).get("data");
		Assertions.assertEquals(2, objectMapper.readTree(adminData.get("HERO_SLIDES").asText()).size());
		Assertions.assertEquals(2, objectMapper.readTree(adminData.get("HEADER_NAV").asText()).size());
	}

	@Test
	@Transactional
	void legacySiteContentIsReturnedUntilStructuredTablesArePopulated() {
		siteBannerRepository.deleteAll();
		siteCategoryRepository.deleteAll();
		siteNavigationItemRepository.deleteAll();
		saveLegacySetting("HERO_SLIDES", """
				[{"title":"Legacy banner","ctaLink":"/shop","active":true}]
				""");
		saveLegacySetting("CATEGORIES", """
				[{"name":"Legacy category","icon":"category","path":"/shop","color":"bg-white","active":true}]
				""");
		saveLegacySetting("HEADER_NAV", """
				[{"label":"Legacy menu","path":"/shop","active":true}]
				""");

		var settings = appSettingService.getAllSettings();

		Assertions.assertEquals("Legacy banner",
				readSettingArray(settings, "HERO_SLIDES").get(0).get("title").asText());
		Assertions.assertEquals("Legacy category",
				readSettingArray(settings, "CATEGORIES").get(0).get("name").asText());
		Assertions.assertEquals("Legacy menu",
				readSettingArray(settings, "HEADER_NAV").get(0).get("label").asText());
	}

	@Test
	void uploadRejectsNonImageContent() {
		MockMultipartFile file = new MockMultipartFile(
				"files",
				"not-image.txt",
				"text/plain",
				"hello".getBytes(StandardCharsets.UTF_8));

		Assertions.assertThrows(IllegalArgumentException.class,
				() -> fileService.validateImageFile(file, "product"));
	}

	@Test
	void productImportDryRunAndApplyCsvCreatesInactiveProduct() throws Exception {
		MockMultipartFile file = productImportFile("IMPORT-TEST-001", "Imported CSV Product");

		ResProductImportDTO dryRun = productImportService.importProducts(file, true);
		Assertions.assertTrue(dryRun.isDryRun());
		Assertions.assertFalse(dryRun.isApplied());
		Assertions.assertEquals(1, dryRun.getTotalRows());
		Assertions.assertEquals(0, dryRun.getErrorRows());
		Assertions.assertEquals(1, dryRun.getCreatedCount());
		Assertions.assertTrue(productRepository.findBySku("IMPORT-TEST-001").isEmpty());

		ResProductImportDTO applied = productImportService.importProducts(file, false);
		Assertions.assertTrue(applied.isApplied());
		Product imported = productRepository.findBySku("IMPORT-TEST-001").orElseThrow();
		Assertions.assertEquals("Imported CSV Product", imported.getName());
		Assertions.assertFalse(imported.isActive());
		Assertions.assertEquals(1, productImageRepository.findByProductId(imported.getId()).size());
	}

	@Test
	void productImportDryRunReadsXlsxPreferredSheet() throws Exception {
		MockMultipartFile file = productImportXlsxFile("IMPORT-XLSX-001", "Imported XLSX Product");

		ResProductImportDTO dryRun = productImportService.importProducts(file, true);

		Assertions.assertEquals("SanPham_ChuanHoa", dryRun.getMatchedSheet());
		Assertions.assertEquals(1, dryRun.getTotalRows());
		Assertions.assertEquals(0, dryRun.getErrorRows());
		Assertions.assertEquals(1, dryRun.getCreatedCount());
		Assertions.assertTrue(productRepository.findBySku("IMPORT-XLSX-001").isEmpty());
	}

	@Test
	void userCannotImportProductsButAdminCanDryRun() throws Exception {
		User user = createUser("import-user@example.test", "User@123");
		User admin = userRepository.findByEmail("admin@hansport.local").orElseThrow();

		mockMvc.perform(multipart("/api/v1/products/import")
						.file(productImportFile("IMPORT-API-001", "API Import Product"))
						.param("dryRun", "true")
						.header("Authorization", "Bearer " + accessTokenFor(user)))
				.andExpect(status().isForbidden());

		mockMvc.perform(multipart("/api/v1/products/import")
						.file(productImportFile("IMPORT-API-001", "API Import Product"))
						.param("dryRun", "true")
						.header("Authorization", "Bearer " + accessTokenFor(admin)))
				.andExpect(status().isOk());
	}

	@Test
	void productUpdateDeletesRemovedLocalImageFile() throws Exception {
		Product product = createProduct("Image Lifecycle Product", 3);
		Path imagePath = Path.of("target/test-upload/product/old-image.png");
		Files.createDirectories(imagePath.getParent());
		Files.write(imagePath, new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47});
		productService.addImage(List.of("old-image.png"), product);

		ReqProductDTO req = productRequest(product, List.of("new-image.png"));
		productService.handleUpdateProduct(req);

		Assertions.assertFalse(Files.exists(imagePath));
		Assertions.assertEquals(0, productImageRepository.countByImageUrl("old-image.png"));
		Assertions.assertEquals(1, productImageRepository.countByImageUrl("new-image.png"));
	}

	@Test
	void productSearchMatchesSkuBrandAndCategory() throws Exception {
		Product product = createProduct("Searchable Product", 8);
		product.setSku("SEARCH-SKU-2026");
		product.setBrand("SearchBrand");
		product.setCategory("SearchCategory");
		product.setTarget("Nam");
		product.setPrice(2_500_000);
		productRepository.save(product);

		mockMvc.perform(get("/api/v1/products").param("q", "search-sku-2026"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.result[0].id").value(product.getId()));

		mockMvc.perform(get("/api/v1/products").param("q", "searchbrand"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.result[0].id").value(product.getId()));

		mockMvc.perform(get("/api/v1/products").param("q", "searchcategory"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.result[0].id").value(product.getId()));

		mockMvc.perform(get("/api/v1/products")
						.param("brand", "searchbrand")
						.param("target", "nam")
						.param("category", "searchcategory")
						.param("minPrice", "2000000")
						.param("maxPrice", "3000000"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.meta.total").value(1))
				.andExpect(jsonPath("$.data.result[0].id").value(product.getId()));
	}

	@Test
	void productNavigationGroupsActiveBrandsByCategory() throws Exception {
		Product first = createProduct("Header Navigation One", 5);
		first.setCategory("Navigation Category");
		first.setBrand("Navigation Brand A");
		productRepository.save(first);

		Product second = createProduct("Header Navigation Two", 5);
		second.setCategory("Navigation Category");
		second.setBrand("Navigation Brand B");
		productRepository.save(second);

		mockMvc.perform(get("/api/v1/products/navigation"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.categories").isArray())
				.andExpect(jsonPath("$.data.categories[?(@.name == 'Navigation Category')].productCount")
						.value(2))
				.andExpect(jsonPath("$.data.categories[?(@.name == 'Navigation Category')].brands.length()")
						.value(2));
	}

	@Test
	void productImageOrderIsPreserved() throws Exception {
		Product product = createProduct("Ordered Images Product", 5);
		ReqProductDTO request = productRequest(product, List.of("main-image.png", "side-image.png", "detail-image.png"));

		productService.handleUpdateProduct(request);

		Assertions.assertEquals(
				List.of("main-image.png", "side-image.png", "detail-image.png"),
				productService.fetchProductById(product.getId()).getImages());

		request.setImages(List.of("detail-image.png", "main-image.png", "side-image.png"));
		productService.handleUpdateProduct(request);

		Assertions.assertEquals(
				List.of("detail-image.png", "main-image.png", "side-image.png"),
				productService.fetchProductById(product.getId()).getImages());
	}

	@Test
	void productSaleColorAndSizeOptionsAreReturned() throws Exception {
		Product product = createProduct("Sale Options Product", 5);
		ReqProductDTO request = productRequest(product, List.of("sale-main.png"));
		request.setPrice(1_200_000L);
		request.setOriginalPrice(1_440_000L);
		request.setColorOptions(List.of("Đen tím", "Xanh dương"));
		request.setSizeOptions(List.of("4U5", "3U5"));

		productService.handleUpdateProduct(request);

		var response = productService.fetchProductById(product.getId());
		Assertions.assertEquals(1_200_000L, response.getPrice());
		Assertions.assertEquals(1_440_000L, response.getOriginalPrice());
		Assertions.assertEquals(List.of("Đen tím", "Xanh dương"), response.getColorOptions());
		Assertions.assertEquals(List.of("4U5", "3U5"), response.getSizeOptions());
	}

	@Test
	void changePasswordRequiresCurrentPasswordAndRevokesRefreshToken() throws Exception {
		User user = createUser("password-user@example.test", "OldPass@123");
		user.setRefreshToken("stored-hash");
		userRepository.save(user);

		ReqChangePasswordDTO req = new ReqChangePasswordDTO();
		req.setCurrentPassword("OldPass@123");
		req.setNewPassword("NewPass@123");
		req.setConfirmPassword("NewPass@123");

		mockMvc.perform(post("/api/v1/auth/change-password")
						.header("Authorization", "Bearer " + accessTokenFor(user))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isOk());

		User updated = userRepository.findByEmail(user.getEmail()).orElseThrow();
		Assertions.assertTrue(passwordEncoder.matches("NewPass@123", updated.getPassword()));
		Assertions.assertNull(updated.getRefreshToken());
	}

	@Test
	void checkoutRejectsEmptyCartDetailIdsBeforeServiceLogic() throws Exception {
		User user = createUser("checkout-user@example.test", "User@123");

		mockMvc.perform(post("/api/v1/orders")
						.header("Authorization", "Bearer " + accessTokenFor(user))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"receiverName":"A","receiverPhone":"0900000000","receiverAddress":"Address","cartDetailIds":[]}
								"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void twoUsersCannotOversellSingleStockProduct() throws Exception {
		Product product = createProduct("Oversell Test Product", 1);
		User firstUser = createUser("oversell-one@example.test", "User@123");
		User secondUser = createUser("oversell-two@example.test", "User@123");

		long firstCartDetailId = addSingleItemToCart(firstUser, product);
		long secondCartDetailId = addSingleItemToCart(secondUser, product);

		ReqOrderDTO firstOrder = orderRequest(List.of(firstCartDetailId));
		ReqOrderDTO secondOrder = orderRequest(List.of(secondCartDetailId));
		CountDownLatch start = new CountDownLatch(1);
		var executor = Executors.newFixedThreadPool(2);

		try {
			Future<Boolean> first = executor.submit(() -> placeOrderWhenReleased(start, firstUser, firstOrder));
			Future<Boolean> second = executor.submit(() -> placeOrderWhenReleased(start, secondUser, secondOrder));
			start.countDown();

			long successCount = List.of(first.get(), second.get()).stream().filter(Boolean::booleanValue).count();
			Assertions.assertEquals(1, successCount);

			Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
			Assertions.assertEquals(0, updatedProduct.getQuantity());
			Assertions.assertEquals(1, updatedProduct.getSold());
		} finally {
			executor.shutdownNow();
		}
	}

	private User createUser(String email, String password) {
		return userRepository.findByEmail(email).orElseGet(() -> {
			Role role = roleRepository.findByName("USER").orElseThrow();
			User user = new User();
			user.setEmail(email);
			user.setPassword(passwordEncoder.encode(password));
			user.setFullName("Test User");
			user.setRole(role);
			return userRepository.save(user);
		});
	}

	private Product createProduct(String namePrefix, long quantity) {
		Product product = new Product();
		product.setName(namePrefix + "-" + System.nanoTime());
		product.setPrice(1000);
		product.setDetailDesc("Detail description");
		product.setShortDesc("Short description");
		product.setQuantity(quantity);
		product.setSold(0);
		product.setBrand("Test");
		product.setTarget("Unisex");
		return productRepository.save(product);
	}

	private long addSingleItemToCart(User user, Product product) throws IdInvalidException {
		ReqAddProductToCartDTO addReq = new ReqAddProductToCartDTO();
		addReq.setProductId(product.getId());
		addReq.setQuantity(1);
		cartService.addProductToCart(user.getEmail(), addReq);
		return cartService.getCart(user.getEmail()).getCartDetails().get(0).getId();
	}

	private ReqOrderDTO orderRequest(List<Long> cartDetailIds) {
		ReqOrderDTO req = new ReqOrderDTO();
		req.setReceiverName("Receiver");
		req.setReceiverPhone("0900000000");
		req.setReceiverAddress("Address");
		req.setCartDetailIds(cartDetailIds);
		return req;
	}

	private ReqProductDTO productRequest(Product product, List<String> images) {
		ReqProductDTO req = new ReqProductDTO();
		req.setId(product.getId());
		req.setSku(product.getSku());
		req.setName(product.getName());
		req.setPrice(product.getPrice());
		req.setDetailDesc(product.getDetailDesc());
		req.setShortDesc(product.getShortDesc());
		req.setQuantity(product.getQuantity());
		req.setSold(product.getSold());
		req.setBrand(product.getBrand());
		req.setTarget(product.getTarget());
		req.setCategory(product.getCategory());
		req.setActive(product.isActive());
		req.setImages(images);
		return req;
	}

	private MockMultipartFile productImportFile(String sku, String name) {
		String csv = """
				internal_sku_base,product_name,category,brand,current_price_vnd,quantity,publish_status,external_image_urls,short_description,detail_description_draft
				%s,%s,Vot cau long,Yonex,1200000,0,DRAFT,https://example.test/product.webp,Short import description,Detail import description
				""".formatted(sku, name);
		return new MockMultipartFile("file", "products.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
	}

	private MockMultipartFile productImportXlsxFile(String sku, String name) throws Exception {
		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("SanPham_ChuanHoa");
			Row header = sheet.createRow(0);
			List<String> headers = List.of(
					"internal_sku_base",
					"product_name",
					"category",
					"brand",
					"current_price_vnd",
					"quantity",
					"publish_status",
					"external_image_urls",
					"short_description",
					"detail_description_draft"
			);
			for (int i = 0; i < headers.size(); i++) {
				header.createCell(i).setCellValue(headers.get(i));
			}

			Row row = sheet.createRow(1);
			List<String> values = List.of(
					sku,
					name,
					"Vot cau long",
					"Yonex",
					"1300000",
					"5",
					"PUBLISHED",
					"https://example.test/product-xlsx.webp",
					"Short xlsx import description",
					"Detail xlsx import description"
			);
			for (int i = 0; i < values.size(); i++) {
				row.createCell(i).setCellValue(values.get(i));
			}
			workbook.write(output);
			return new MockMultipartFile(
					"file",
					"products.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					output.toByteArray()
			);
		}
	}

	private ReqSiteSettingsDTO siteSettingsRequest() {
		ReqSiteSettingsDTO settings = new ReqSiteSettingsDTO();
		settings.setHotline("091 222 3333");
		settings.setShippingFee(25000L);
		settings.setFreeShipLimit(600000L);
		settings.setBrands(List.of("Yonex", "Victor"));
		settings.setTargets(List.of("Nam", "Nữ"));

		ReqSiteSettingsDTO.HeroSlideDTO slide = new ReqSiteSettingsDTO.HeroSlideDTO();
		slide.setTitle("Ưu đãi mùa hè");
		slide.setSubtitle("Trang bị thể thao chính hãng");
		slide.setCta("Mua ngay");
		slide.setCtaLink("/shop");
		slide.setImage("banner.png");
		slide.setImageFolder("banner");
		slide.setAltText("Banner ưu đãi mùa hè");
		slide.setActive(true);
		settings.setHeroSlides(List.of(slide));

		ReqSiteSettingsDTO.CategoryDTO category = new ReqSiteSettingsDTO.CategoryDTO();
		category.setName("Vợt cầu lông");
		category.setIcon("sports_tennis");
		category.setPath("/shop?category=Vot cau long");
		category.setColor("bg-brand-blue-light text-brand-blue");
		category.setActive(true);
		settings.setCategories(List.of(category));

		ReqSiteSettingsDTO.NavigationItemDTO nav = new ReqSiteSettingsDTO.NavigationItemDTO();
		nav.setLabel("Cửa hàng");
		nav.setPath("/shop");
		nav.setActive(true);
		settings.setHeaderNav(List.of(nav));
		return settings;
	}

	private void saveLegacySetting(String key, String value) {
		AppSetting setting = appSettingRepository.findBySettingKey(key).orElseGet(AppSetting::new);
		setting.setSettingKey(key);
		setting.setSettingValue(value.strip());
		appSettingRepository.save(setting);
	}

	private com.fasterxml.jackson.databind.JsonNode readSettingArray(Map<String, String> settings, String key) {
		try {
			return objectMapper.readTree(settings.get(key));
		} catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
	}

	private boolean placeOrderWhenReleased(CountDownLatch start, User user, ReqOrderDTO req) throws InterruptedException {
		start.await();
		try {
			orderService.placeOrder(user.getEmail(), req);
			return true;
		} catch (IdInvalidException ex) {
			return false;
		}
	}

	private String accessTokenFor(User user) {
		ResLoginDTO dto = new ResLoginDTO();
		ResRoleDTO role = user.getRole() == null
				? null
				: new ResRoleDTO(user.getRole().getName(), user.getRole().getDecription());
		dto.setUser(new ResLoginDTO.UserLogin(user.getId(), user.getEmail(), user.getFullName(), role));
		return securityUtil.createAccessToken(user.getEmail(), dto);
	}
}
