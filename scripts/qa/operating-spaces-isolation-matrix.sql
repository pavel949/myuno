-- Operating-spaces isolation matrix (specification + harness skeleton).
-- Run ONLY in an isolated PostgreSQL with a schema copy and synthetic users.
-- Never run against production. Each row: actor, resource, op, expected.
CREATE TEMP TABLE isolation_matrix(actor text, resource text, op text, expected text);
INSERT INTO isolation_matrix VALUES
 ('platform_admin','*','select+write','allow'),
 ('director','company:*','select+write','allow'),
 ('manager_space_a','space_a:properties|bookings|tasks|financials|rates','select+write','allow'),
 ('manager_space_a','space_b:properties|bookings|tasks|financials|rates','select','deny'),
 ('manager_space_b','space_a:properties|bookings|tasks|financials|rates','select','deny'),
 ('manager_cross','space_a+space_b','select','allow'),
 ('staff_assigned','assigned_property','select','allow'),
 ('staff_unassigned','any_property','select','deny'),
 ('other_company_member','company:*','select+write','deny'),
 ('anon','properties(non-public)|bookings|ledger','select','deny'),
 ('manager_space_a','ledger_entries(space_b)','select','deny'),
 ('manager_space_a','export-mc-data(company)','invoke','deny_or_space_filtered'),
 ('any_user','send-property-report(foreign property)','invoke','deny'),
 ('manager_space_a','crm_contacts','select','allow (company-level until B3)'),
 ('flag_off:any','*','*','equals current staff_can_access_property'),
 ('reassign property a->b','manager_space_a','select','deny after reassignment'),
 ('switch active company','client','scope','space cleared');
-- Harness: for each actor set request.jwt.claims + role authenticated, then
-- assert count(*) against seeded synthetic rows matches `expected`.
SELECT * FROM isolation_matrix;
