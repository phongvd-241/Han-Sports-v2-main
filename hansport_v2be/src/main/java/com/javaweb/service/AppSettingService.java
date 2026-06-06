package com.javaweb.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.AppSetting;
import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.repository.AppSettingRepository;
import com.javaweb.util.error.IdInvalidException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AppSettingService {
    private final AppSettingRepository appSettingRepository;
    private final ObjectMapper objectMapper;

    public AppSettingService(AppSettingRepository appSettingRepository, ObjectMapper objectMapper) {
        this.appSettingRepository = appSettingRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, String> getAllSettings() {
        List<AppSetting> settings = appSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (AppSetting s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    @Transactional
    public void updateBulkSettings(List<ReqSettingUpdateDTO> updates) throws IdInvalidException {
        if (updates == null || updates.isEmpty()) {
            throw new IdInvalidException("Settings update list must not be empty");
        }

        for (ReqSettingUpdateDTO dto : updates) {
            String key = dto.getSettingKey().trim();
            String value = dto.getSettingValue();
            validateSetting(key, value);

            Optional<AppSetting> opt = appSettingRepository.findBySettingKey(key);
            if (opt.isPresent()) {
                AppSetting setting = opt.get();
                setting.setSettingValue(value);
                appSettingRepository.save(setting);
            } else {
                AppSetting newSetting = new AppSetting();
                newSetting.setSettingKey(key);
                newSetting.setSettingValue(value);
                appSettingRepository.save(newSetting);
            }
        }
    }

    private void validateSetting(String key, String value) throws IdInvalidException {
        if (value == null) {
            throw new IdInvalidException("Setting value must not be null");
        }

        switch (key) {
            case "SHIPPING_FEE":
            case "FREE_SHIP_LIMIT":
                validateNonNegativeLong(key, value);
                break;
            case "BRANDS":
            case "TARGETS":
            case "HERO_SLIDES":
            case "CATEGORIES":
            case "HEADER_NAV":
                validateJsonArray(key, value);
                break;
            case "HOTLINE":
                if (value.trim().isEmpty()) {
                    throw new IdInvalidException("HOTLINE must not be blank");
                }
                break;
            default:
                if (key.isBlank()) {
                    throw new IdInvalidException("Setting key must not be blank");
                }
        }
    }

    private void validateNonNegativeLong(String key, String value) throws IdInvalidException {
        try {
            long parsed = Long.parseLong(value);
            if (parsed < 0) {
                throw new IdInvalidException(key + " must not be negative");
            }
        } catch (NumberFormatException ex) {
            throw new IdInvalidException(key + " must be a valid integer");
        }
    }

    private void validateJsonArray(String key, String value) throws IdInvalidException {
        try {
            JsonNode node = objectMapper.readTree(value);
            if (!node.isArray()) {
                throw new IdInvalidException(key + " must be a JSON array");
            }
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException(key + " must be valid JSON");
        }
    }
}
