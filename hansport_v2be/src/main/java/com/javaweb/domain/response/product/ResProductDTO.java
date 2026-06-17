package com.javaweb.domain.response.product;

import jakarta.persistence.Column;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResProductDTO {
    private long id;
    private String sku;
    private String name;
    private long price;
    private Long originalPrice;


    private String detailDesc;

    private String shortDesc;
    private long quantity;
    private long sold;
    private String brand;
    private String target;
    private String category;
    private boolean active;
    private List<String> images;
    private List<String> colorOptions;
    private List<String> sizeOptions;

    private Instant createdAt;
    private Instant updatedAt;
}
