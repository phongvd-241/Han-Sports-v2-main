package com.javaweb.config;

import com.javaweb.domain.Product;
import com.javaweb.domain.ProductImage;
import com.javaweb.domain.Role;
import com.javaweb.domain.User;
import com.javaweb.repository.ProductImageRepository;
import com.javaweb.repository.ProductRepository;
import com.javaweb.repository.RoleRepository;
import com.javaweb.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder {

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Bean
    CommandLineRunner seedDemoData(RoleRepository roleRepository,
                                   UserRepository userRepository,
                                   ProductRepository productRepository,
                                   ProductImageRepository productImageRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println(">>> DATA SEEDER STARTED");
            System.out.println(">>> SEED ENABLED = " + seedEnabled);

            if (!seedEnabled) {
                System.out.println(">>> DATA SEEDER DISABLED");
                return;
            }

            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseGet(() -> roleRepository.save(createRole("ADMIN", "Quản trị hệ thống")));

            roleRepository.findByName("USER")
                    .orElseGet(() -> roleRepository.save(createRole("USER", "Khách hàng")));

            if (!userRepository.existsByEmail("admin@hansport.local")) {
                User admin = createUser(
                        "admin@hansport.local",
                        "Admin@123",
                        "HanSport Admin",
                        "Hà Nội",
                        "0900000001",
                        adminRole,
                        passwordEncoder
                );

                userRepository.save(admin);
                System.out.println(">>> SEEDED ADMIN USER");
            } else {
                System.out.println(">>> ADMIN USER ALREADY EXISTS");
            }

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Vợt cầu lông Yonex Astrox 99",
                    3500000,
                    "Vợt cầu lông Yonex Astrox 99 là dòng vợt thiên công, phù hợp người chơi thích đập cầu mạnh và kiểm soát tốt.",
                    "Vợt thiên công mạnh mẽ, thiết kế cao cấp.",
                    20,
                    "Yonex",
                    "Unisex",
                    "Vợt cầu lông",
                    List.of("1779380718207-1777975941237-11play-2.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Vợt cầu lông Yonex Nanoray 72 Light",
                    1200000,
                    "Vợt cầu lông nhẹ, dễ điều khiển, phù hợp người mới chơi hoặc người thích lối đánh linh hoạt.",
                    "Vợt nhẹ, dễ đánh, linh hoạt.",
                    35,
                    "Yonex",
                    "Unisex",
                    "Vợt cầu lông",
                    List.of("z7807609191141_f25aa0bfde8db1a316cebcd849ab308e.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Cước cầu lông Yonex BG65Ti",
                    180000,
                    "Cước cầu lông Yonex BG65Ti có độ bền cao, âm đánh chắc, phù hợp nhiều trình độ người chơi.",
                    "Cước bền, kiểm soát tốt.",
                    100,
                    "Yonex",
                    "Unisex",
                    "Cước cầu lông",
                    List.of("z7807609223261_1b77c2026c1fc594ed6ac292331054a2.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Cước cầu lông Yonex Exbolt 63",
                    220000,
                    "Cước Yonex Exbolt 63 cho cảm giác đánh nảy, phản hồi nhanh, phù hợp người chơi tốc độ.",
                    "Cước nảy, phản hồi nhanh.",
                    80,
                    "Yonex",
                    "Unisex",
                    "Cước cầu lông",
                    List.of("z7807609230054_3d48f6a8e35e80585cd37b83055a1293.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Cước cầu lông Yonex Exbolt 68",
                    230000,
                    "Cước Yonex Exbolt 68 cân bằng giữa độ bền, lực đánh và khả năng kiểm soát cầu.",
                    "Cước bền, lực tốt.",
                    75,
                    "Yonex",
                    "Unisex",
                    "Cước cầu lông",
                    List.of("z7807609232829_5f55e72b19870f5e64d44eac2f634bf8.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Quả cầu lông Yonex AS-50",
                    850000,
                    "Quả cầu lông Yonex AS-50 chất lượng cao, đường bay ổn định, phù hợp thi đấu và tập luyện chuyên nghiệp.",
                    "Cầu lông cao cấp, bay ổn định.",
                    50,
                    "Yonex",
                    "Unisex",
                    "Quả cầu lông",
                    List.of("z7807609269260_845dbcb270cfdcb82da6d8c6e6abc61a.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Vợt cầu lông Victor Auraspeed",
                    2400000,
                    "Vợt Victor Auraspeed phù hợp lối đánh nhanh, phản tạt tốt, dễ xoay trở trong đánh đôi.",
                    "Vợt tốc độ, phản tạt nhanh.",
                    25,
                    "Victor",
                    "Unisex",
                    "Vợt cầu lông",
                    List.of("z7807609322265_fb06fb3c742ee14a2a5288e545810a51.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Vợt cầu lông Lining Turbo Charging",
                    2100000,
                    "Vợt Lining Turbo Charging hỗ trợ lực tốt, phù hợp người chơi phong trào và bán chuyên.",
                    "Vợt trợ lực, dễ kiểm soát.",
                    30,
                    "Lining",
                    "Unisex",
                    "Vợt cầu lông",
                    List.of("z7807609347401_fe09cc383d53518eabacc280305fe273.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Giày cầu lông Yonex SHB",
                    1650000,
                    "Giày cầu lông Yonex SHB có độ bám sân tốt, hỗ trợ di chuyển linh hoạt và ổn định.",
                    "Giày bám sân, êm chân.",
                    40,
                    "Yonex",
                    "Unisex",
                    "Giày cầu lông",
                    List.of("z7807609355308_3a84539a21720abcbee2df807b49fbf4.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Balo cầu lông Yonex",
                    750000,
                    "Balo cầu lông Yonex thiết kế tiện dụng, có ngăn đựng vợt, giày và phụ kiện.",
                    "Balo thể thao tiện dụng.",
                    45,
                    "Yonex",
                    "Unisex",
                    "Phụ kiện cầu lông",
                    List.of("z7807609384640_16c826aaa02b8e6f4c7c73bd0b604165.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Quấn cán vợt cầu lông",
                    35000,
                    "Quấn cán vợt giúp tăng độ bám tay, thấm mồ hôi tốt và cải thiện cảm giác cầm vợt.",
                    "Quấn cán bám tay tốt.",
                    200,
                    "Khác",
                    "Unisex",
                    "Phụ kiện cầu lông",
                    List.of("z7807609411807_a35c32b076c49b091eb34b0d346e540a.jpg")
            );

            seedProduct(
                    productRepository,
                    productImageRepository,
                    "Túi đựng vợt cầu lông",
                    450000,
                    "Túi đựng vợt cầu lông nhiều ngăn, phù hợp mang vợt, quần áo và phụ kiện khi đi tập.",
                    "Túi đựng vợt nhiều ngăn.",
                    60,
                    "Khác",
                    "Unisex",
                    "Phụ kiện cầu lông",
                    List.of("z7807609429737_6f0eac1838eb3b5e2fbd42291367ee47.jpg")
            );

            System.out.println(">>> PRODUCT COUNT = " + productRepository.count());
            System.out.println(">>> DATA SEEDER FINISHED");
        };
    }

    private Role createRole(String name, String description) {
        Role role = new Role();
        role.setName(name);
        role.setDecription(description);
        return role;
    }

    private User createUser(String email, String password, String fullName, String address,
                            String phone, Role role, PasswordEncoder passwordEncoder) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setAddress(address);
        user.setPhone(phone);
        user.setRole(role);
        return user;
    }

    private void seedProduct(ProductRepository productRepository,
                             ProductImageRepository productImageRepository,
                             String name,
                             double price,
                             String detailDesc,
                             String shortDesc,
                             long quantity,
                             String brand,
                             String target,
                             String category,
                             List<String> images) {

        if (productRepository.existsByName(name)) {
            System.out.println(">>> PRODUCT ALREADY EXISTS: " + name);
            return;
        }

        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        product.setDetailDesc(detailDesc);
        product.setShortDesc(shortDesc);
        product.setQuantity(quantity);
        product.setSold(0);
        product.setBrand(brand);
        product.setTarget(target);
        product.setCategory(category);

        Product savedProduct = productRepository.save(product);

        if (images != null && !images.isEmpty()) {
            for (String imageName : images) {
                ProductImage productImage = new ProductImage();
                productImage.setImageUrl(imageName);
                productImage.setProduct(savedProduct);
                productImageRepository.save(productImage);
            }
        }

        System.out.println(">>> SEEDED PRODUCT: " + name);
    }
}