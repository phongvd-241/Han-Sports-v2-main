package com.javaweb.repository;

import com.javaweb.domain.Cart;
import com.javaweb.domain.CartDetail;
import com.javaweb.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CartDetailRepository extends JpaRepository<CartDetail,Long>, JpaSpecificationExecutor<CartDetail> {
    CartDetail findByCartAndProduct(Cart cart, Product product);
    CartDetail findByCartAndProductAndSelectedColorAndSelectedSize(Cart cart, Product product, String selectedColor, String selectedSize);
    boolean existsById(long cartDetailId);
}
