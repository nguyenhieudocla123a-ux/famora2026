-- Phase 3: accounts. Family roles are not stored here (see family_members, Phase 4).
CREATE TABLE users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(254) NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    date_of_birth  DATE,
    avatar_url     VARCHAR(500),
    status         VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'LOCKED', 'DELETED')),
    -- the app stores emails lower-case; the check keeps anyone from slipping a mixed-case copy in
    CONSTRAINT users_email_lower_check CHECK (email = lower(email))
);

CREATE UNIQUE INDEX users_email_uk ON users (email);
