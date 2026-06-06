package com.javaweb.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.response.RestResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    private static final Map<String, Integer> LIMITS = Map.of(
            "POST /api/v1/auth/login", 5,
            "POST /api/v1/auth/register", 3,
            "POST /api/v1/auth/google", 5,
            "GET /api/v1/auth/refresh", 30
    );

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Autowired
    public AuthRateLimitFilter(ObjectMapper objectMapper) {
        this(objectMapper, Clock.systemUTC());
    }

    AuthRateLimitFilter(ObjectMapper objectMapper, Clock clock) {
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String endpoint = request.getMethod() + " " + request.getRequestURI();
        Integer limit = LIMITS.get(endpoint);
        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + ":" + endpoint;
        long now = clock.millis();
        Counter counter = counters.compute(key, (ignored, current) -> {
            if (current == null || now - current.windowStartedAt >= WINDOW_MILLIS) {
                return new Counter(now, 1);
            }
            current.count++;
            return current;
        });

        if (counter.count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");

            RestResponse<Object> res = new RestResponse<>();
            res.setStatusCode(HttpStatus.TOO_MANY_REQUESTS.value());
            res.setError("Too Many Requests");
            res.setMessage("Qua nhieu yeu cau, vui long thu lai sau.");
            objectMapper.writeValue(response.getWriter(), res);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Counter {
        private final long windowStartedAt;
        private int count;

        private Counter(long windowStartedAt, int count) {
            this.windowStartedAt = windowStartedAt;
            this.count = count;
        }
    }
}
