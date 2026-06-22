ALTER TABLE users
    ADD COLUMN locked TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar;

CREATE INDEX idx_users_locked ON users (locked);
