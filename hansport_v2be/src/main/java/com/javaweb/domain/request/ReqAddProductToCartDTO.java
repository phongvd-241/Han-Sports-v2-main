package com.javaweb.domain.request;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAddProductToCartDTO {
    @Min(value = 1, message = "Product id không hợp lệ")
    private long productId;

    @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
    private long quantity;
    private String selectedColor;
    private String selectedSize;
}
