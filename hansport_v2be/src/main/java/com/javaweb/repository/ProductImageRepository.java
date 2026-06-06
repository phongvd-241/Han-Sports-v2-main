package com.javaweb.repository;

import com.javaweb.domain.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage,Long>, JpaSpecificationExecutor<ProductImage> {
    boolean existsByProductId(long productId);
    List<ProductImage> findByProductId(long productId);
    long countByImageUrl(String imageUrl);
}
