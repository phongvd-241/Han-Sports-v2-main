package com.javaweb.repository;

import com.javaweb.domain.SiteCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteCategoryRepository extends JpaRepository<SiteCategory, Long> {
    List<SiteCategory> findAllByOrderBySortOrderAscIdAsc();

    List<SiteCategory> findByActiveTrueOrderBySortOrderAscIdAsc();
}
