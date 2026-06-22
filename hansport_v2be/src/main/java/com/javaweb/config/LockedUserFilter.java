package com.javaweb.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.User;
import com.javaweb.domain.response.RestResponse;
import com.javaweb.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class LockedUserFilter extends OncePerRequestFilter {
    private static final String ANONYMOUS_USER = "anonymousUser";

    private final UserService userService;
    private final ObjectMapper objectMapper;

    public LockedUserFilter(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String email = currentEmail();
        if (email == null) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = this.userService.getUserByUsername(email);
        if (user == null || user.isLocked()) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");

            RestResponse<Object> res = new RestResponse<>();
            res.setStatusCode(HttpStatus.FORBIDDEN.value());
            res.setError("Forbidden");
            res.setMessage("Tài khoản không còn tồn tại hoặc đã bị khóa");
            this.objectMapper.writeValue(response.getWriter(), res);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String value && !ANONYMOUS_USER.equals(value)) {
            return value;
        }
        return null;
    }
}
