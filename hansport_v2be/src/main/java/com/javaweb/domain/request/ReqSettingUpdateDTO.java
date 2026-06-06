package com.javaweb.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReqSettingUpdateDTO {
    @NotBlank(message = "Setting key must not be blank")
    private String settingKey;

    @NotNull(message = "Setting value must not be null")
    private String settingValue;

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }
}
