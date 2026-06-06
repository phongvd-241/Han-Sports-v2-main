package com.javaweb.repository;

import com.javaweb.domain.SiteBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteBannerRepository extends JpaRepository<SiteBanner, Long> {
    List<SiteBanner> findAllByOrderBySortOrderAscIdAsc();

    List<SiteBanner> findByActiveTrueOrderBySortOrderAscIdAsc();
}
