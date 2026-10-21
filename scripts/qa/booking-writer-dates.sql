-- Synthetic SELECT only. Mirrors live RPC date predicates, without invoking RPCs.
WITH cases(label, check_in, check_out, blocked, existing_in, existing_out, expected) AS (
  VALUES
    ('back_to_back', DATE '2026-10-13', DATE '2026-10-15', NULL::date, DATE '2026-10-10', DATE '2026-10-13', true),
    ('checkout_block', DATE '2026-10-10', DATE '2026-10-13', DATE '2026-10-13', NULL::date, NULL::date, true),
    ('occupied_block', DATE '2026-10-10', DATE '2026-10-13', DATE '2026-10-12', NULL::date, NULL::date, false),
    ('one_night', DATE '2026-10-10', DATE '2026-10-11', DATE '2026-10-11', NULL::date, NULL::date, true),
    ('month_boundary', DATE '2026-01-31', DATE '2026-02-01', DATE '2026-02-01', NULL::date, NULL::date, true),
    ('year_boundary', DATE '2026-12-31', DATE '2027-01-02', DATE '2027-01-01', NULL::date, NULL::date, false),
    ('leap_boundary', DATE '2028-02-29', DATE '2028-03-01', DATE '2028-02-29', NULL::date, NULL::date, false)
), evaluated AS (
  SELECT *, NOT (COALESCE(blocked >= check_in AND blocked < check_out, false)
    OR COALESCE(existing_in < check_out AND existing_out > check_in, false)) AS actual
  FROM cases
)
SELECT label, actual, expected, actual = expected AS passed FROM evaluated ORDER BY label;

-- No timestamp contract is changed. These fixtures demonstrate divergent dates.
SELECT label, (instant AT TIME ZONE 'UTC')::date AS utc_date,
  (instant AT TIME ZONE 'Asia/Bangkok')::date AS bangkok_date
FROM (VALUES
  ('local_midnight', TIMESTAMPTZ '2026-10-13 00:00:00+07'),
  ('same_instant_z', TIMESTAMPTZ '2026-10-12 17:00:00Z'),
  ('late_clock_mislabeled_z', TIMESTAMPTZ '2026-10-13 23:00:00Z'),
  ('late_clock_offset', TIMESTAMPTZ '2026-10-13 23:00:00+07')
) AS fixture(label, instant);