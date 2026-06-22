package com.javaweb.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUserLockDTO {
    @NotNull(message = "Trạng thái khóa không được để trống")
    private Boolean locked;
}
