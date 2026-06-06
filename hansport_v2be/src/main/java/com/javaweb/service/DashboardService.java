package com.javaweb.service;

import com.javaweb.domain.response.dashboard.ResDashboardSummaryDTO;
import com.javaweb.repository.OrderRepository;
import com.javaweb.repository.ProductRepository;
import com.javaweb.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class DashboardService {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public DashboardService(ProductRepository productRepository, UserRepository userRepository,
                            OrderRepository orderRepository, OrderService orderService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    @Transactional(readOnly = true)
    public ResDashboardSummaryDTO getSummary() {
        Instant recentBoundary = Instant.now().minus(30, ChronoUnit.DAYS);

        ResDashboardSummaryDTO summary = new ResDashboardSummaryDTO();
        summary.setTotalProducts(this.productRepository.count());
        summary.setTotalUsers(this.userRepository.count());
        summary.setTotalOrders(this.orderRepository.count());
        summary.setRevenueTotal(this.orderRepository.sumTotalPrice());
        summary.setRevenueRecent(this.orderRepository.sumTotalPriceSince(recentBoundary));
        summary.setLowStockCount(this.productRepository.countByQuantityLessThanEqual(5));
        summary.setRecentOrders(this.orderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(this.orderService::convertToResOrderDTO)
                .toList());
        return summary;
    }
}
