package com.javaweb.controller;

import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.service.AppSettingService;
import com.javaweb.util.annotation.ApiMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AppSettingController {

    private final AppSettingService appSettingService;

    public AppSettingController(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    @GetMapping("/settings")
    @ApiMessage("Get all system settings")
    public ResponseEntity<Map<String, String>> getAllSettings() {
        return ResponseEntity.ok(appSettingService.getAllSettings());
    }

    @PutMapping("/settings/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update bulk settings")
    public ResponseEntity<Void> updateBulkSettings(@RequestBody List<ReqSettingUpdateDTO> updates) {
        appSettingService.updateBulkSettings(updates);
        return ResponseEntity.ok().build();
    }
}
