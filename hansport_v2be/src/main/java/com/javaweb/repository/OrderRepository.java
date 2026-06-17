package com.javaweb.repository;

import com.javaweb.domain.Order;
import com.javaweb.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order,Long>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByUserAndId(User user, Long id);
    Page<Order> findByUser(User user, Pageable pageable);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    List<Order> findAllByStatusAndCreatedAtBetween(String status, Instant start, Instant end);

    @org.springframework.data.jpa.repository.Query("select coalesce(sum(o.totalPrice), 0) from Order o where o.status = 'COMPLETED'")
    long sumTotalPrice();

    @org.springframework.data.jpa.repository.Query("select coalesce(sum(o.totalPrice), 0) from Order o where o.status = 'COMPLETED' and o.createdAt >= :createdAt")
    long sumTotalPriceSince(Instant createdAt);
}
