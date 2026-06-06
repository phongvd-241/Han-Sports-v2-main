package com.javaweb.domain.request;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateCartDetailDTO {
    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;
}
