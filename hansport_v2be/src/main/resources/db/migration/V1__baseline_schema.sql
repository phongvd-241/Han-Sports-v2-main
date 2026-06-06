CREATE TABLE IF NOT EXISTS roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    decription VARCHAR(255),
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(255),
    role_id BIGINT,
    refresh_token MEDIUMTEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_role_id (role_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price BIGINT NOT NULL,
    detail_desc MEDIUMTEXT NOT NULL,
    short_desc VARCHAR(255) NOT NULL,
    quantity BIGINT NOT NULL,
    sold BIGINT NOT NULL,
    brand VARCHAR(255),
    target VARCHAR(255),
    category VARCHAR(255),
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    image_url VARCHAR(255),
    product_id BIGINT,
    PRIMARY KEY (id),
    KEY idx_product_images_product_id (product_id),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS carts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sum INT NOT NULL,
    user_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_carts_user_id (user_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS cart_detail (
    id BIGINT NOT NULL AUTO_INCREMENT,
    quantity BIGINT NOT NULL,
    price BIGINT NOT NULL,
    cart_id BIGINT,
    product_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_cart_detail_cart_id (cart_id),
    KEY idx_cart_detail_product_id (product_id),
    CONSTRAINT fk_cart_detail_cart FOREIGN KEY (cart_id) REFERENCES carts (id),
    CONSTRAINT fk_cart_detail_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    total_price BIGINT NOT NULL,
    receiver_name VARCHAR(255),
    receiver_address VARCHAR(255),
    receiver_phone VARCHAR(255),
    status VARCHAR(255),
    user_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_orders_user_id (user_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS order_detail (
    id BIGINT NOT NULL AUTO_INCREMENT,
    quantity BIGINT NOT NULL,
    price BIGINT NOT NULL,
    order_id BIGINT,
    product_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_order_detail_order_id (order_id),
    KEY idx_order_detail_product_id (product_id),
    CONSTRAINT fk_order_detail_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_order_detail_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS settings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_settings_setting_key (setting_key)
);
