package com.javaweb.domain.response.cartdetail;

import com.javaweb.domain.Cart;
import com.javaweb.domain.Product;
import com.javaweb.domain.response.role.ResRoleDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResCartDetailDTO {
    private long id;
    private long quantity;
    private double price;
    private ProductCartDetail product;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductCartDetail {
        private long id;
        private String name;
        private double price;
        private String image;
    }
}
