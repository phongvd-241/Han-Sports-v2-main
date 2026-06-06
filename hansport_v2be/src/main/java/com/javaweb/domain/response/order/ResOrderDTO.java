package com.javaweb.domain.response.order;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.javaweb.domain.OrderDetail;
import com.javaweb.domain.User;
import com.javaweb.domain.response.orderdetail.ResOrderDetailDTO;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
public class ResOrderDTO {
    private long id;
    private long totalPrice;
    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String status;
    private UserOrder user;
    private List<ResOrderDetailDTO> orderDetails;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserOrder {
        private long id;
        private String email;
        private String name;
    }
}
