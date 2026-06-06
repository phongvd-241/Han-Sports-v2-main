package com.javaweb.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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

    @NotEmpty(message = "Danh sach san pham thanh toan khong duoc de trong")
    List<Long> cartDetailIds;
}
