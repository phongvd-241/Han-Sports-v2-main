package com.javaweb.domain.response.dashboard;

import com.javaweb.domain.response.order.ResOrderDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResDashboardSummaryDTO {
    private long totalProducts;
    private long totalUsers;
    private long totalOrders;
    private long revenueTotal;
    private long revenueRecent;
    private long lowStockCount;
    private List<ResOrderDTO> recentOrders;
    private List<DailyRevenue> dailyRevenue;

    @Getter
    @Setter
    public static class DailyRevenue {
        private String date;
        private long revenue;

        public DailyRevenue(String date, long revenue) {
            this.date = date;
            this.revenue = revenue;
        }
    }
}
