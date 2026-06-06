CREATE TABLE IF NOT EXISTS site_banners (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    cta VARCHAR(100),
    cta_link VARCHAR(255),
    image VARCHAR(255),
    image_folder VARCHAR(100),
    alt_text VARCHAR(255),
    bg VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_site_banners_sort_order (sort_order),
    KEY idx_site_banners_active_sort_order (active, sort_order)
);

CREATE TABLE IF NOT EXISTS site_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    color VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_site_categories_sort_order (sort_order),
    KEY idx_site_categories_active_sort_order (active, sort_order)
);

CREATE TABLE IF NOT EXISTS site_navigation_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    label VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_site_navigation_items_sort_order (sort_order),
    KEY idx_site_navigation_items_active_sort_order (active, sort_order)
);
