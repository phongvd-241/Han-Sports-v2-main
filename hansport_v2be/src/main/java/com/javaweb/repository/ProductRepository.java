package com.javaweb.repository;

import com.javaweb.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product,Long>, JpaSpecificationExecutor<Product> {
    boolean existsByName(String name);
    Optional<Product> findByName(String name);
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);
    long countByQuantityLessThanEqual(long quantity);

    @Query("""
            select p.category, p.brand, count(p)
            from Product p
            where p.active = true
              and p.category is not null
              and p.category <> ''
              and p.brand is not null
              and p.brand <> ''
            group by p.category, p.brand
            order by p.category asc, count(p) desc, p.brand asc
            """)
    List<Object[]> findActiveCatalogNavigation();

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.quantity = p.quantity - :quantity, p.sold = p.sold + :quantity where p.id = :productId and p.quantity >= :quantity")
    int decrementStockIfAvailable(@Param("productId") long productId, @Param("quantity") long quantity);
}
