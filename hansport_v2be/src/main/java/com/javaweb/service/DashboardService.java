package com.javaweb.service;

import com.javaweb.domain.Order;
import com.javaweb.domain.response.dashboard.ResDashboardSummaryDTO;
import com.javaweb.repository.OrderRepository;
import com.javaweb.repository.ProductRepository;
import com.javaweb.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

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

        // Calculate daily revenue for the last 7 days (including today)
        List<ResDashboardSummaryDTO.DailyRevenue> dailyList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM")
                .withZone(ZoneId.systemDefault());

        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(ZoneId.systemDefault());
        for (int i = 6; i >= 0; i--) {
            java.time.ZonedDateTime day = now.minusDays(i);
            Instant dayStart = day.toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);

            long dayRevenue = this.orderRepository.findAllByStatusAndCreatedAtBetween("COMPLETED", dayStart, dayEnd)
                    .stream()
                    .mapToLong(Order::getTotalPrice)
                    .sum();

            String dateStr = formatter.format(dayStart);
            dailyList.add(new ResDashboardSummaryDTO.DailyRevenue(dateStr, dayRevenue));
        }
        summary.setDailyRevenue(dailyList);

        return summary;
    }
}
