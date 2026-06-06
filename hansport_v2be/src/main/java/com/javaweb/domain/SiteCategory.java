package com.javaweb.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "site_categories")
@Getter
@Setter
public class SiteCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;
    private String icon;
    private String path;
    private String color;
    private int sortOrder;
    private boolean active = true;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreated() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdated() {
        this.updatedAt = Instant.now();
    }
}
