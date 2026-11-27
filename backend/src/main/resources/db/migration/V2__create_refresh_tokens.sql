-- Phase 4a: refresh tokens. Only the SHA-256 of a token is stored, so a leaked database leaks no usable token.
-- Every token belongs to a "family" (one sign-in). Rotation keeps the family; reusing an old token revokes it all.
CREATE TABLE refresh_tokens (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL, -- hex SHA-256, always 64 characters
    token_family    UUID        NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    replaced_by_id  BIGINT      REFERENCES refresh_tokens (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX refresh_tokens_hash_uk ON refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (token_family);
-- "revoke every live token of this user" (password change) only scans live rows
CREATE INDEX refresh_tokens_user_live_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
