-- Phase 6a: reminder settings, the planned reminder queue, and in-app notifications.

-- One row per (event, person): user_id NULL is the family-wide setting of that event, a user id is that
-- person's own setting. offset_days lists "days before"; an empty list means "no reminder".
-- No row at all: the app default (7 and 1 days before, 08:00 Vietnam time).
CREATE TABLE event_reminders (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id     BIGINT      NOT NULL REFERENCES family_events (id) ON DELETE CASCADE,
    user_id      BIGINT      REFERENCES users (id),
    offset_days  INTEGER[]   NOT NULL,
    remind_time  TIME        NOT NULL DEFAULT '08:00',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT event_reminders_offsets_check CHECK (
        cardinality(offset_days) <= 5 AND 0 <= ALL (offset_days) AND 30 >= ALL (offset_days))
);
-- NULLS NOT DISTINCT (PostgreSQL 15+): only one family-wide row per event, too
CREATE UNIQUE INDEX event_reminders_uk ON event_reminders (event_id, user_id) NULLS NOT DISTINCT;

-- The planner writes what should be sent; the dispatcher sends it. The unique key makes planning
-- idempotent: running the planner twice never queues the same reminder twice.
CREATE TABLE reminder_schedules (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id         BIGINT      NOT NULL REFERENCES family_events (id) ON DELETE CASCADE,
    user_id          BIGINT      NOT NULL REFERENCES users (id),
    occurrence_date  DATE        NOT NULL,
    offset_days      SMALLINT    NOT NULL,
    fire_at          TIMESTAMPTZ NOT NULL,
    status           VARCHAR(12) NOT NULL DEFAULT 'PENDING',
    sent_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT reminder_schedules_status_check CHECK (status IN ('PENDING', 'SENT', 'CANCELLED')),
    CONSTRAINT reminder_schedules_uk UNIQUE (event_id, user_id, occurrence_date, offset_days)
);
-- the dispatcher's query every minute: what is due?
CREATE INDEX reminder_schedules_due_idx ON reminder_schedules (fire_at) WHERE status = 'PENDING';

CREATE TABLE notifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id),
    family_id   BIGINT       REFERENCES families (id),
    type        VARCHAR(32)  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        VARCHAR(500) NOT NULL,
    ref_type    VARCHAR(32),
    ref_id      BIGINT,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;
