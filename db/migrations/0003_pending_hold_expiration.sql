BEGIN;

UPDATE reservations
SET expires_at = created_at + INTERVAL '15 minutes'
WHERE status = 'pending'
  AND expires_at IS NULL;

COMMIT;
