-- The day a reminder is about (the occurrence date), so the app can open the event on that day.
ALTER TABLE notifications ADD COLUMN ref_date DATE;
