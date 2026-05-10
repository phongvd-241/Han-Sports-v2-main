package com.javaweb.service;

import com.javaweb.domain.AppSetting;
import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.repository.AppSettingRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AppSettingService {
    private final AppSettingRepository appSettingRepository;

    public AppSettingService(AppSettingRepository appSettingRepository) {
        this.appSettingRepository = appSettingRepository;
    }

    public Map<String, String> getAllSettings() {
        List<AppSetting> settings = appSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (AppSetting s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    public void updateBulkSettings(List<ReqSettingUpdateDTO> updates) {
        for (ReqSettingUpdateDTO dto : updates) {
            Optional<AppSetting> opt = appSettingRepository.findBySettingKey(dto.getSettingKey());
            if (opt.isPresent()) {
                AppSetting setting = opt.get();
                setting.setSettingValue(dto.getSettingValue());
                appSettingRepository.save(setting);
            } else {
                AppSetting newSetting = new AppSetting();
                newSetting.setSettingKey(dto.getSettingKey());
                newSetting.setSettingValue(dto.getSettingValue());
                appSettingRepository.save(newSetting);
            }
        }
    }
}
