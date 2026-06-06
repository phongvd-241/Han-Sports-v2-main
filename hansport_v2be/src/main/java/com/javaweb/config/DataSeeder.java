package com.javaweb.config;

import com.javaweb.domain.Role;
import com.javaweb.domain.User;
import com.javaweb.repository.RoleRepository;
import com.javaweb.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

@Configuration
public class DataSeeder {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String USER_ROLE = "USER";
    private static final String LOCAL_ADMIN_EMAIL = "admin@hansport.local";

    @Value("${app.seed.required.enabled:true}")
    private boolean requiredSeedEnabled;

    @Value("${app.seed.admin.enabled:false}")
    private boolean adminSeedEnabled;

    @Value("${app.seed.admin.password:}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedSystemData(RoleRepository roleRepository,
                                     UserRepository userRepository,
                                     PasswordEncoder passwordEncoder) {
        return args -> {
            if (requiredSeedEnabled) {
                seedRequiredRoles(roleRepository);
            }

            if (adminSeedEnabled) {
                seedLocalAdmin(roleRepository, userRepository, passwordEncoder);
            }
        };
    }

    private void seedRequiredRoles(RoleRepository roleRepository) {
        findOrCreateRole(roleRepository, ADMIN_ROLE, "System administrator");
        findOrCreateRole(roleRepository, USER_ROLE, "Customer user");
    }

    private void seedLocalAdmin(RoleRepository roleRepository,
                                UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        Role adminRole = findOrCreateRole(roleRepository, ADMIN_ROLE, "System administrator");
        if (userRepository.existsByEmail(LOCAL_ADMIN_EMAIL)) {
            return;
        }

        if (!StringUtils.hasText(adminPassword)) {
            throw new IllegalStateException("app.seed.admin.password must be set when admin seeding is enabled");
        }

        User admin = new User();
        admin.setEmail(LOCAL_ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setFullName("HanSport Local Admin");
        admin.setAddress("Local development");
        admin.setPhone("0900000001");
        admin.setRole(adminRole);
        userRepository.save(admin);
    }

    private Role findOrCreateRole(RoleRepository roleRepository, String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(name);
                    role.setDecription(description);
                    return roleRepository.save(role);
                });
    }
}
