package com.javaweb.domain.response.email;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderEmailDTO {
    private String customerName;
    private String address;
    private String phone;
    private double totalPrice;
    private List<OrderItemEmailDTO> items;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemEmailDTO {
        private String productName;
        private long quantity;
        private double price;

    }
}
