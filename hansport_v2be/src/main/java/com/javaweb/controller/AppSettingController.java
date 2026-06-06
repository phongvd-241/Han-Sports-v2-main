package com.javaweb.controller;

import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.domain.request.ReqSiteSettingsDTO;
import com.javaweb.service.AppSettingService;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import jakarta.validation.Valid;
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
        return ResponseEntity.ok(appSettingService.getPublicSettings());
    }

    @PutMapping("/settings/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update bulk settings")
    public ResponseEntity<Void> updateBulkSettings(@RequestBody @Valid List<@Valid ReqSettingUpdateDTO> updates)
            throws IdInvalidException {
        appSettingService.updateBulkSettings(updates);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Get admin system settings")
    public ResponseEntity<Map<String, String>> getAdminSettings() {
        return ResponseEntity.ok(appSettingService.getAllSettings());
    }

    @PutMapping("/admin/settings/site")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update site settings")
    public ResponseEntity<Void> updateSiteSettings(@RequestBody @Valid ReqSiteSettingsDTO settings)
            throws IdInvalidException {
        appSettingService.updateSiteSettings(settings);
        return ResponseEntity.ok().build();
    }
}
