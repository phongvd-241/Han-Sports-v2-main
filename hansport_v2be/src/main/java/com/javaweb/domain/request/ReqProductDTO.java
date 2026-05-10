package com.javaweb.domain.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqProductDTO {
    private long id;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotNull(message = "Price không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Price phải lớn hơn 0")
    private Double price;

    @NotBlank(message = "Mô tả chi tiết không được để trống")
    private String detailDesc;

    @NotBlank(message = "Mô tả ngắn không được để trống")
    private String shortDesc;

    @Min(value = 0, message = "Số lượng không được âm")
    private long quantity;

    private long sold;
    private String brand;
    private String target;
    private String category;
    private String image;
}
