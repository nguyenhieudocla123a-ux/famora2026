-- Phase 5b: family events. A recurring event stores its rule, never its occurrences:
-- the dates in a requested range are computed in memory (OccurrenceCalculator).
CREATE TABLE family_events (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    family_id         BIGINT       NOT NULL REFERENCES families (id),
    created_by        BIGINT       NOT NULL REFERENCES users (id),
    type              VARCHAR(32)  NOT NULL,
    title             VARCHAR(150) NOT NULL,
    description       VARCHAR(2000),
    location          VARCHAR(200),
    calendar_type     VARCHAR(8)   NOT NULL,
    -- SOLAR: the original date. LUNAR with a known year: the solar date of that lunar date.
    solar_date        DATE,
    lunar_day         SMALLINT,
    lunar_month       SMALLINT,
    lunar_year        INT,         -- NULL = a yearly lunar date whose first year is unknown (old giỗ)
    lunar_leap_month  BOOLEAN      NOT NULL DEFAULT FALSE,
    start_time        TIME,        -- NULL = all day
    recurrence        VARCHAR(8)   NOT NULL DEFAULT 'NONE',
    deleted_at        TIMESTAMPTZ,
    version           INT          NOT NULL DEFAULT 0, -- optimistic lock: two people editing at once
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT family_events_type_check CHECK (type IN ('BIRTHDAY', 'DEATH_ANNIVERSARY', 'WEDDING_ANNIVERSARY',
                                                         'FAMILY_EVENT', 'IMPORTANT_DAY', 'HOLIDAY')),
    CONSTRAINT family_events_calendar_check CHECK (calendar_type IN ('SOLAR', 'LUNAR')),
    CONSTRAINT family_events_recurrence_check CHECK (recurrence IN ('NONE', 'YEARLY')),
    CONSTRAINT family_events_solar_check CHECK (calendar_type <> 'SOLAR' OR solar_date IS NOT NULL),
    CONSTRAINT family_events_lunar_check CHECK (calendar_type <> 'LUNAR' OR (
        lunar_day BETWEEN 1 AND 30 AND lunar_month BETWEEN 1 AND 12)),
    -- a one-off lunar event needs its year; only yearly ones may leave it out
    CONSTRAINT family_events_lunar_once_check CHECK (calendar_type <> 'LUNAR' OR recurrence = 'YEARLY'
        OR (lunar_year IS NOT NULL AND solar_date IS NOT NULL))
);

-- one-off events by date range; yearly ones are all loaded per family (a few dozen at most)
CREATE INDEX family_events_range_idx ON family_events (family_id, recurrence, solar_date) WHERE deleted_at IS NULL;
