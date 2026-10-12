BEGIN;

DO $$
BEGIN
  IF to_regclass('public.reservations') IS NOT NULL
     AND to_regclass('public.reservations_legacy') IS NULL THEN
    ALTER TABLE public.reservations RENAME TO reservations_legacy;
  END IF;
END
$$;

CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_date date NOT NULL,
  departure_date date NOT NULL,
  plan text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'blocked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (departure_date > arrival_date)
);

CREATE TABLE reservation_nights (
  reservation_date date PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE
);

CREATE INDEX reservations_pending_expiry_idx
  ON reservations (expires_at)
  WHERE status = 'pending';

DO $$
BEGIN
  IF to_regclass('public.reservations_legacy') IS NOT NULL THEN
    INSERT INTO reservations (id, arrival_date, departure_date, plan, status, expires_at, created_at)
    SELECT id, reservation_date, reservation_date + 1, plan, 'confirmed', NULL, created_at
    FROM reservations_legacy;

    INSERT INTO reservation_nights (reservation_date, reservation_id)
    SELECT reservation_date, id
    FROM reservations_legacy;

    DROP TABLE reservations_legacy;
  END IF;
END
$$;

COMMIT;
