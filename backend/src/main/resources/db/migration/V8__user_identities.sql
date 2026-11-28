-- Phase 7e: sign-in with Google (Facebook later). An account may have no password at all.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Which outside account (Google "sub") belongs to which Famora account.
CREATE TABLE user_identities (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider          VARCHAR(16)  NOT NULL,
    provider_user_id  VARCHAR(255) NOT NULL,
    email             VARCHAR(254),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT user_identities_provider_check CHECK (provider IN ('GOOGLE', 'FACEBOOK')),
    CONSTRAINT user_identities_uk UNIQUE (provider, provider_user_id)
);

CREATE INDEX user_identities_user_idx ON user_identities (user_id);
