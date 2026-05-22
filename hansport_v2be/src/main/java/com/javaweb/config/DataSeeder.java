package com.javaweb.config;

import com.javaweb.domain.Product;
import com.javaweb.domain.Role;
import com.javaweb.domain.User;
import com.javaweb.repository.ProductRepository;
import com.javaweb.repository.RoleRepository;
import com.javaweb.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import com.javaweb.domain.ProductImage;
import com.javaweb.repository.ProductImageRepository;

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
            if (!seedEnabled) {
                return;
            }

            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseGet(() -> roleRepository.save(createRole("ADMIN", "Quản trị hệ thống")));
            Role userRole = roleRepository.findByName("USER")
                    .orElseGet(() -> roleRepository.save(createRole("USER", "Khách hàng")));

            if (!userRepository.existsByEmail("admin@hansport.local")) {
                User admin = createUser("admin@hansport.local", "Admin@123", "HanSport Admin",
                        "Hà Nội", "0900000001", adminRole, passwordEncoder);
                userRepository.save(admin);
            }

            // Map existing image files in upload/product to products if empty
            productRepository.findAll().forEach(product -> {
                if (!productImageRepository.existsByProductId(product.getId())) {
                    String imgName = null;
                    switch ((int) product.getId()) {
                        case 1:
                            imgName = "1779380718207-1777975941237-11play-2.jpg";
                            break;
                        case 2:
                            imgName = "z7807609191141_f25aa0bfde8db1a316cebcd849ab308e.jpg";
                            break;
                        case 3:
                            imgName = "z7807609223261_1b77c2026c1fc594ed6ac292331054a2.jpg";
                            break;
                        case 4:
                            imgName = "z7807609230054_3d48f6a8e35e80585cd37b83055a1293.jpg";
                            break;
                        case 5:
                            imgName = "z7807609232829_5f55e72b19870f5e64d44eac2f634bf8.jpg";
                            break;
                        case 6:
                            imgName = "z7807609269260_845dbcb270cfdcb82da6d8c6e6abc61a.jpg";
                            break;
                        case 7:
                            imgName = "z7807609322265_fb06fb3c742ee14a2a5288e545810a51.jpg";
                            break;
                        case 8:
                            imgName = "z7807609347401_fe09cc383d53518eabacc280305fe273.jpg";
                            break;
                        case 9:
                            imgName = "z7807609355308_3a84539a21720abcbee2df807b49fbf4.jpg";
                            break;
                        case 10:
                            imgName = "z7807609384640_16c826aaa02b8e6f4c7c73bd0b604165.jpg";
                            break;
                        case 11:
                            imgName = "z7807609411807_a35c32b076c49b091eb34b0d346e540a.jpg";
                            break;
                        case 12:
                            imgName = "z7807609429737_6f0eac1838eb3b5e2fbd42291367ee47.jpg";
                            break;
                        default:
                            imgName = "1779380718207-1777975941237-11play-2.jpg";
                            break;
                    }
                    ProductImage pImg = new ProductImage();
                    pImg.setImageUrl(imgName);
                    pImg.setProduct(product);
                    productImageRepository.save(pImg);
                }
            });
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

    private void seedProduct(ProductRepository productRepository, String name, double price,
                             String detailDesc, String shortDesc, long quantity,
                             String brand, String target, List<String> images) {
        if (productRepository.existsByName(name)) {
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
        productRepository.save(product);
    }
}
