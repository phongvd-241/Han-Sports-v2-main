package com.javaweb.repository;

import com.javaweb.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product,Long>, JpaSpecificationExecutor<Product> {
    boolean existsByName(String name);
    Optional<Product> findByName(String name);
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);
    long countByQuantityLessThanEqual(long quantity);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.quantity = p.quantity - :quantity, p.sold = p.sold + :quantity where p.id = :productId and p.quantity >= :quantity")
    int decrementStockIfAvailable(@Param("productId") long productId, @Param("quantity") long quantity);
}
