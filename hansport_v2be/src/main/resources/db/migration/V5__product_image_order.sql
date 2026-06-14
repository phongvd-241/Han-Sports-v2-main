ALTER TABLE product_images
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

CREATE INDEX idx_product_images_product_order
    ON product_images (product_id, sort_order);
