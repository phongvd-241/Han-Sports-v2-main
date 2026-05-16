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
    private String name;
    private double price;

    private String detailDesc;

    private String shortDesc;
    private long quantity;
    private long sold;
    private String brand;
    private String target;
    private String category;
    private List<String> images;

    private Instant createdAt;
}
