ALTER TABLE products
    ADD COLUMN sku VARCHAR(100) NULL AFTER id,
    ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER category;

CREATE UNIQUE INDEX uk_products_sku ON products (sku);
CREATE INDEX idx_products_active ON products (active);
