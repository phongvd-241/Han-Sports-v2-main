package com.javaweb.domain.response.orderdetail;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.javaweb.domain.Order;
import com.javaweb.domain.Product;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResOrderDetailDTO {
    private long id;
    private long quantity;
    private long price;
    private ProductOrderDetail product;

    private Instant createdAt;

    private Instant updatedAt;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductOrderDetail {
        private long id;
        private String name;
        private String image;
    }
}
