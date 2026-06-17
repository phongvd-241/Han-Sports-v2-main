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
    private List<DailyOrders> dailyOrders;
    private List<MonthlyRevenue> monthlyRevenue;
    private List<TopProduct> topProducts;
    private List<StatusCount> statusDistribution;

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

    @Getter
    @Setter
    public static class DailyOrders {
        private String date;
        private long count;

        public DailyOrders(String date, long count) {
            this.date = date;
            this.count = count;
        }
    }

    @Getter
    @Setter
    public static class MonthlyRevenue {
        private String month;
        private long revenue;

        public MonthlyRevenue(String month, long revenue) {
            this.month = month;
            this.revenue = revenue;
        }
    }

    @Getter
    @Setter
    public static class TopProduct {
        private String name;
        private long quantity;

        public TopProduct(String name, long quantity) {
            this.name = name;
            this.quantity = quantity;
        }
    }

    @Getter
    @Setter
    public static class StatusCount {
        private String status;
        private long count;

        public StatusCount(String status, long count) {
            this.status = status;
            this.count = count;
        }
    }
}
