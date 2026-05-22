package com.javaweb.repository;

import com.javaweb.domain.Order;
import com.javaweb.domain.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductImageRepository extends JpaRepository<ProductImage,Long>, JpaSpecificationExecutor<ProductImage> {
    boolean existsByProductId(long productId);
}
