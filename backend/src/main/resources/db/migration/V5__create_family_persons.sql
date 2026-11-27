-- Phase 5c: relatives without an account (grandparents who passed away, small children), and which
-- relatives an event is about.
CREATE TABLE family_persons (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    family_id          BIGINT       NOT NULL REFERENCES families (id),
    member_id          BIGINT       REFERENCES family_members (id), -- set when this relative also has an account
    full_name          VARCHAR(100) NOT NULL,
    nickname           VARCHAR(50),  -- "Bà nội", "Bé An"
    gender             VARCHAR(8),
    birth_date_solar   DATE,
    is_deceased        BOOLEAN      NOT NULL DEFAULT FALSE,
    death_date_solar   DATE,
    death_lunar_day    SMALLINT,
    death_lunar_month  SMALLINT,
    death_lunar_leap   BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT family_persons_gender_check CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')),
    -- death details only for someone who has passed away
    CONSTRAINT family_persons_death_check CHECK (is_deceased OR (death_date_solar IS NULL
        AND death_lunar_day IS NULL AND death_lunar_month IS NULL)),
    -- the lunar death date is both day and month, or neither
    CONSTRAINT family_persons_lunar_check CHECK ((death_lunar_day IS NULL) = (death_lunar_month IS NULL)
        AND (death_lunar_day IS NULL OR (death_lunar_day BETWEEN 1 AND 30 AND death_lunar_month BETWEEN 1 AND 12)))
);

CREATE INDEX family_persons_family_idx ON family_persons (family_id) WHERE deleted_at IS NULL;
-- one profile per member account
CREATE UNIQUE INDEX family_persons_member_uk ON family_persons (member_id) WHERE member_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE event_persons (
    event_id   BIGINT NOT NULL REFERENCES family_events (id) ON DELETE CASCADE,
    person_id  BIGINT NOT NULL REFERENCES family_persons (id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, person_id)
);

CREATE INDEX event_persons_person_idx ON event_persons (person_id);
