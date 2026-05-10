package com.javaweb.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReqOrderDTO {
    @NotBlank(message = "Tên không được để trống")
    String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    String receiverPhone;

    @NotBlank(message = "Địa chỉ không được để trống")
    String receiverAddress;

    List<Long> cartDetailIds;
}
