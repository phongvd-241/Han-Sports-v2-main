-- V8: Fix FK constraints to allow product deletion
-- order_detail.product_id: ON DELETE SET NULL (preserve order history)
-- cart_detail.product_id:  ON DELETE CASCADE (remove stale cart items)

ALTER TABLE order_detail
    DROP FOREIGN KEY FKc7q42e9tu0hslx6w4wxgomhvn;

ALTER TABLE order_detail
    ADD CONSTRAINT FKc7q42e9tu0hslx6w4wxgomhvn
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL;

ALTER TABLE cart_detail
    DROP FOREIGN KEY FKclb1c0wg3mofxnpgidib1t987;

ALTER TABLE cart_detail
    ADD CONSTRAINT FKclb1c0wg3mofxnpgidib1t987
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE;
