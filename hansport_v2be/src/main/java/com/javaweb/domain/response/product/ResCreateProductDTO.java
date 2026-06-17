package com.javaweb.domain.response.product;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.Instant;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResCreateProductDTO {
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
}
