package com.javaweb.config;

import com.javaweb.service.UserService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component("userDetailsService")
public class UserDetailsCustom implements UserDetailsService {

    private final UserService userService;
    public UserDetailsCustom(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.javaweb.domain.User user = this.userService.getUserByUsername(username);
        if(user == null){
            throw new UsernameNotFoundException("Username/password không hợp lệ");
        }
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        String authority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        return new User(user.getEmail(),
                user.getPassword(),
                true,
                true,
                true,
                !user.isLocked(),
                Collections.singletonList(new SimpleGrantedAuthority(authority)));
    }
}
