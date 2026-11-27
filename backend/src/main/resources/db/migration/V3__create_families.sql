-- Phase 4b: families, their members (with per-family roles) and invitation codes.

CREATE TABLE families (
    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                      VARCHAR(100) NOT NULL,
    description               VARCHAR(500),
    avatar_url                VARCHAR(500),
    member_can_create_events  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by                BIGINT       NOT NULL REFERENCES users (id),
    deleted_at                TIMESTAMPTZ, -- soft delete: events keep their history
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE family_members (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    family_id   BIGINT      NOT NULL REFERENCES families (id),
    user_id     BIGINT      NOT NULL REFERENCES users (id),
    role        VARCHAR(16) NOT NULL,
    status      VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    nickname    VARCHAR(50), -- how the family calls them: "Bố", "Bà nội"
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at     TIMESTAMPTZ,
    CONSTRAINT family_members_role_check CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    CONSTRAINT family_members_status_check CHECK (status IN ('ACTIVE', 'LEFT', 'REMOVED')),
    CONSTRAINT family_members_left_check CHECK ((status = 'ACTIVE') = (left_at IS NULL))
);

-- A person is an active member of a family at most once (old LEFT/REMOVED rows are kept as history).
CREATE UNIQUE INDEX family_members_active_uk ON family_members (family_id, user_id) WHERE status = 'ACTIVE';
-- Exactly one active OWNER per family: the database itself refuses a second one.
CREATE UNIQUE INDEX family_members_one_owner_uk ON family_members (family_id) WHERE role = 'OWNER' AND status = 'ACTIVE';
-- "my families"
CREATE INDEX family_members_user_active_idx ON family_members (user_id) WHERE status = 'ACTIVE';

CREATE TABLE family_invitations (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    family_id     BIGINT      NOT NULL REFERENCES families (id),
    code          VARCHAR(12) NOT NULL,
    default_role  VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
    max_uses      INT         NOT NULL,
    used_count    INT         NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_by    BIGINT      NOT NULL REFERENCES users (id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT family_invitations_role_check CHECK (default_role IN ('ADMIN', 'MEMBER')),
    CONSTRAINT family_invitations_uses_check CHECK (max_uses > 0 AND used_count BETWEEN 0 AND max_uses)
);

CREATE UNIQUE INDEX family_invitations_code_uk ON family_invitations (code);
CREATE INDEX family_invitations_family_idx ON family_invitations (family_id);
