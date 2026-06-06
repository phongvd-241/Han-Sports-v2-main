package com.javaweb.repository;

import com.javaweb.domain.SiteNavigationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteNavigationItemRepository extends JpaRepository<SiteNavigationItem, Long> {
    List<SiteNavigationItem> findAllByOrderBySortOrderAscIdAsc();

    List<SiteNavigationItem> findByActiveTrueOrderBySortOrderAscIdAsc();
}
