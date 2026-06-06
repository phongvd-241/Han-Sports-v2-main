package com.javaweb.controller;

import com.javaweb.domain.response.dashboard.ResDashboardSummaryDTO;
import com.javaweb.service.DashboardService;
import com.javaweb.util.annotation.ApiMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @ApiMessage("get admin dashboard summary")
    public ResponseEntity<ResDashboardSummaryDTO> getSummary() {
        return ResponseEntity.ok(this.dashboardService.getSummary());
    }
}
