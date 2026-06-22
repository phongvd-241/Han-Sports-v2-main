package com.javaweb.repository;

import com.javaweb.domain.OrderDetail;
import com.javaweb.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail,Long>, JpaSpecificationExecutor<OrderDetail> {
    List<OrderDetail> findByProduct(Product product);
}
