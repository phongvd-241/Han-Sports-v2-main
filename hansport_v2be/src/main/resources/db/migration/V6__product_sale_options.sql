ALTER TABLE products
    ADD COLUMN original_price BIGINT NULL AFTER price,
    ADD COLUMN color_options VARCHAR(500) NULL AFTER active,
    ADD COLUMN size_options VARCHAR(255) NULL AFTER color_options;

ALTER TABLE cart_detail
    ADD COLUMN selected_color VARCHAR(100) NULL AFTER price,
    ADD COLUMN selected_size VARCHAR(50) NULL AFTER selected_color;

ALTER TABLE order_detail
    ADD COLUMN selected_color VARCHAR(100) NULL AFTER price,
    ADD COLUMN selected_size VARCHAR(50) NULL AFTER selected_color;
