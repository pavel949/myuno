# RLS Scanner - Report

**Target:** `/home/user/myuno/supabase`

## Summary
- Tables scanned: 551
- Policies scanned: 1486
- Total Findings: 2217
- Critical: 356
- High: 1039
- Medium: 424
- Low: 162
- Warning: 236

## Vulnerabilities

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurant_menu_categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurant_menu_categories`
- **Policy:** `Menu categories are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurant_menu_categories`
- **Policy:** `Menu categories are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurant_menu_categories`
- **Policy:** `Providers can manage their menu categories`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_key_assignments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_key_assignments`
- **Policy:** `Users can manage keys for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_key_assignments`
- **Policy:** `Users can manage keys for their properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_ai_recommendations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_ai_recommendations`
- **Policy:** `Admin manages ai recommendations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `locations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `locations`
- **Policy:** `Anyone can view locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `locations`
- **Policy:** `Anyone can view locations`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `returning_guests`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `returning_guests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `returning_guests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `returning_guests`
- **Policy:** `Owners can update their returning guests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `signature_request_signers`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `signature_request_signers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_request_signers`
- **Policy:** `MC members view request signers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_request_signers`
- **Policy:** `MC members manage signers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `signature_request_signers`
- **Policy:** `MC members manage signers`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_request_signers`
- **Policy:** `MC members update signers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `signature_request_signers`
- **Policy:** `MC members update signers`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_categories`
- **Policy:** `Anyone can view active marketplace categories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_categories`
- **Policy:** `Anyone can view active marketplace categories`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `marketplace_categories`
- **Policy:** `UNO Team can manage marketplace categories`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `email_subscriptions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `email_subscriptions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `email_subscriptions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `email_subscriptions`
- **Policy:** `Anyone can subscribe`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `email_subscriptions`
- **Policy:** `Anyone can subscribe`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `owner_reports`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `owner_reports`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `owner_reports`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `owner_reports`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `owner_reports`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_reports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `realtime_stats`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `realtime_stats`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `realtime_stats`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_analytics_daily`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_analytics_daily`
- **Policy:** `daily_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `user_analytics_daily`
- **Policy:** `daily_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_analytics_daily`
- **Policy:** `analytics_admin_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `user_analytics_daily`
- **Policy:** `analytics_admin_only`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### LOW [RLS-006] DELETE policy missing

- **Table:** `event_bookings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `event_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `event_bookings`
- **Policy:** `Users can update their own event bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `flower_shops`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `flower_shops`
- **Policy:** `Anyone can view active flower shops`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `flower_shops`
- **Policy:** `Anyone can view active flower shops`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `flower_shops`
- **Policy:** `Providers can manage their flower shops`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `flower_shops`
- **Policy:** `Admins can manage all flower shops`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `staff_profiles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `staff_profiles`
- **Policy:** `Anyone can view active staff`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `staff_profiles`
- **Policy:** `Anyone can view active staff`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `staff_profiles`
- **Policy:** `Staff can update own profile`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `staff_profiles`
- **Policy:** `Admins manage staff profiles`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `staff_profiles`
- **Policy:** `Admins manage staff profiles`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_nurture_queue`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can view nurture queue`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can view nurture queue`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can insert nurture queue`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can insert nurture queue`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can update nurture queue`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can update nurture queue`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_nurture_queue`
- **Policy:** `Company members can update nurture queue`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_context_switch_grants`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_campaigns`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_campaigns`
- **Policy:** `Admins can manage campaigns`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_tasks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_tasks`
- **Policy:** `Company members can create crm_tasks`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_tasks`
- **Policy:** `Company members can update crm_tasks`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_financial_models`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_financial_models`
- **Policy:** `Owners update their financial models`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pharmacy_orders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `pharmacy_orders`
- **Policy:** `Users can update their own pharmacy orders`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `pharmacy_orders`
- **Policy:** `Admins can manage all pharmacy orders`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_funnel_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_funnel_events`
- **Policy:** `Admins can manage funnel events`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_magnets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `lead_magnets`
- **Policy:** `Active magnets are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lead_magnets`
- **Policy:** `Active magnets are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `lead_magnets`
- **Policy:** `Admins manage magnets`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `deal_field_changes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `deal_field_changes`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_field_changes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_field_changes`
- **Policy:** `Company members can view deal changes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_item_flower_details`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_item_flower_details`
- **Policy:** `Users can insert own flower order details`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `order_item_flower_details`
- **Policy:** `Admins can manage all flower order details`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `order_item_flower_details`
- **Policy:** `UNO team can manage all flower order details`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `salons`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `salons`
- **Policy:** `Salons are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `salons`
- **Policy:** `Salons are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `salons`
- **Policy:** `Providers can manage own salons`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `salons`
- **Policy:** `Anyone can view approved salons or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-003] SELECT policy missing

- **Table:** `project_units`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `project_units`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `project_units`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_opportunities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_opportunities`
- **Policy:** `investment_opportunities_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_opportunities`
- **Policy:** `investment_opportunities_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `catalog_life_map`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `catalog_life_map`
- **Policy:** `Catalog mappings are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `catalog_life_map`
- **Policy:** `Catalog mappings are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `catalog_life_map`
- **Policy:** `Admins can insert catalog mappings`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `catalog_life_map`
- **Policy:** `Admins can update catalog mappings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transfer_operators`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transfer_operators`
- **Policy:** `Authenticated can read active operators`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transfer_operators`
- **Policy:** `Authenticated can read active operators`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_addresses`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `webhook_deliveries`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `webhook_deliveries`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `webhook_deliveries`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `webhook_deliveries`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `webhook_deliveries`
- **Policy:** `MC members can view webhook deliveries`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `currencies`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `currencies`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `currencies`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `currencies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `currencies`
- **Policy:** `Anyone can view currencies`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `currencies`
- **Policy:** `Anyone can view currencies`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vertical_life_tasks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vertical_life_tasks`
- **Policy:** `vertical_life_tasks_read_all`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `vertical_life_tasks`
- **Policy:** `vertical_life_tasks_read_all`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vertical_life_tasks`
- **Policy:** `vertical_life_tasks_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `management_terms_activity`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `management_terms_activity`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `management_terms_activity`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `management_terms_activity`
- **Policy:** `Directors can insert terms activity`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `management_terms_activity`
- **Policy:** `Directors can insert terms activity`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_intake_sessions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `ai_intake_sessions`
- **Policy:** `Admins manage intake sessions`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `ai_intake_sessions`
- **Policy:** `Admins manage intake sessions`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_parties`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `deal_parties`
- **Policy:** `deal_parties_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `deal_parties`
- **Policy:** `deal_parties_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_wellness_streaks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_wellness_streaks`
- **Policy:** `Users can manage their own streaks`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `lifeos_governance`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lifeos_governance`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lifeos_governance`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `lifeos_governance`
- **Policy:** `Admins can update governance config`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `sys_lead_configs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `sys_lead_configs`
- **Policy:** `Anyone can read active lead configs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `sys_lead_configs`
- **Policy:** `Anyone can read active lead configs`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `sys_lead_configs`
- **Policy:** `Admins can manage lead configs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `sys_lead_configs`
- **Policy:** `Admins can manage lead configs`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_funnels`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_funnels`
- **Policy:** `Admins can manage funnels`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `outreach_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `outreach_messages`
- **Policy:** `outreach_messages_author_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `outreach_messages`
- **Policy:** `outreach_messages_mc_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `outreach_messages`
- **Policy:** `outreach_messages_mc_read`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_recommendations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `platform_recommendations`
- **Policy:** `read_active_recs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `platform_recommendations`
- **Policy:** `read_active_recs`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-030] Policy uses comparison operators without auth check

- **Table:** `platform_recommendations`
- **Policy:** `read_active_recs`
- **Description:** Policy uses comparison operators (>, <, >=, <=) without auth.uid() verification. May allow unauthorized access.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column operator value)

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `platform_recommendations`
- **Policy:** `read_active_recs`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `platform_recommendations`
- **Policy:** `read_active_recs`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `platform_recommendations`
- **Policy:** `admins_manage_recs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `platform_recommendations`
- **Policy:** `admins_manage_recs`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_documents`
- **Policy:** `Owners manage vendor docs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `wellness_content`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `wellness_content`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `wellness_content`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `wellness_content`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `wellness_content`
- **Policy:** `Wellness content is publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `wellness_content`
- **Policy:** `Wellness content is publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_relationships`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `contact_relationships`
- **Policy:** `contact_relationships_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `contact_relationships`
- **Policy:** `contact_rels_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `contact_relationships`
- **Policy:** `contact_rels_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `water_activities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `water_activities`
- **Policy:** `Admins can manage all water activities`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `water_activities`
- **Policy:** `Providers can manage their own water activities`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `water_activities`
- **Policy:** `Anyone can view approved water activities or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### LOW [RLS-006] DELETE policy missing

- **Table:** `thai_chats`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_chats`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `thai_chats`
- **Policy:** `thai_chats_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `thai_chats`
- **Policy:** `thai_chats_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `services`
- **Policy:** `Anyone can view approved services or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ledger_entries`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `ledger_entries`
- **Policy:** `Vendors view org ledger entries`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `ledger_entries`
- **Policy:** `Account owners view own ledger entries`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `ledger_entries`
- **Policy:** `MC members can view MC ledger entries`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `ledger_entries`
- **Policy:** `MC members can view MC ledger entries`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_documents`
- **Policy:** `Anyone can view public documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_documents`
- **Policy:** `Anyone can view public documents`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `investment_documents`
- **Policy:** `Anyone can view public documents`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `investment_documents`
- **Policy:** `Anyone can view public documents`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### HIGH [RLS-026] OR with subquery without justification

- **Table:** `investment_documents`
- **Policy:** `Anyone can view public documents`
- **Description:** Policy uses OR with a subquery without justification. This may allow unauthorized access through the subquery branch.
- **Remediation:** Review and justify the OR with subquery pattern or rewrite to use a more secure approach with proper auth checks.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_documents`
- **Policy:** `Users with interest can view restricted documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `investment_documents`
- **Policy:** `Admins can manage documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_documents`
- **Policy:** `Admins can manage documents`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `commission_agreements`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `commission_agreements`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `commission_agreements`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `commission_agreements`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `commission_agreements`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `commission_agreements`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_passports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `cancellation_policy_rules`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `cancellation_policy_rules`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `cancellation_policy_rules`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cancellation_policy_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cancellation_policy_rules`
- **Policy:** `Anyone can view cancellation policies`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cancellation_policy_rules`
- **Policy:** `Anyone can view cancellation policies`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `chat_violation_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `chat_violation_history`
- **Policy:** `Staff can manage violations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `chat_violation_history`
- **Policy:** `Staff can manage violations`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `chat_violation_history`
- **Policy:** `Admins manage violations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `calendar_sync_logs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `calendar_sync_logs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `calendar_sync_logs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_meter_readings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `booking_meter_readings`
- **Policy:** `Owners can manage meter readings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `trust_badges`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `trust_badges`
- **Policy:** `Anyone can view active trust badges`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `trust_badges`
- **Policy:** `Anyone can view active trust badges`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `trust_badges`
- **Policy:** `Admins can manage trust badges`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `moderation_queue`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `moderation_queue`
- **Policy:** `Team can view moderation queue`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `moderation_queue`
- **Policy:** `Team can update moderation queue`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `moderation_queue`
- **Policy:** `Team can update moderation queue`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `moderation_queue`
- **Policy:** `Admins manage moderation queue`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `terms_acceptances`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `terms_acceptances`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `terms_acceptances`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mc_onboarding_progress`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mc_onboarding_progress`
- **Policy:** `MC members can view onboarding`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mc_onboarding_progress`
- **Policy:** `MC admins can manage onboarding`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `mc_onboarding_progress`
- **Policy:** `MC admins can manage onboarding`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mc_onboarding_progress`
- **Policy:** `MC admins can manage onboarding`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `role_context_policy`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `role_context_policy`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `role_context_policy`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `role_context_policy`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `role_context_policy`
- **Policy:** `role_context_policy_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `role_context_policy`
- **Policy:** `role_context_policy_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_assignment_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_assignment_rules`
- **Policy:** `crm_assignment_rules_mc_access`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### LOW [RLS-006] DELETE policy missing

- **Table:** `profiles`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `profiles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_custom_fields`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_fields`
- **Policy:** `MC members can view custom fields`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_fields`
- **Policy:** `MC members can view custom fields`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_fields`
- **Policy:** `MC managers can manage custom fields`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_fields`
- **Policy:** `MC managers can manage custom fields`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `platform_impersonation_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `platform_impersonation_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_impersonation_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_budgets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_budgets`
- **Policy:** `Owners manage their budgets`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_budgets`
- **Policy:** `Delegates view budgets`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `trust_accounts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `trust_accounts`
- **Policy:** `MC directors manage trust`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `trust_accounts`
- **Policy:** `MC directors manage trust`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `mcc_state_history`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `mcc_state_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `mcc_state_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_state_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `marketplace_international_shipping`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `marketplace_international_shipping`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_international_shipping`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_international_shipping`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_international_shipping`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_international_shipping`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transport_destinations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transport_destinations`
- **Policy:** `Destinations are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transport_destinations`
- **Policy:** `Destinations are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `transport_destinations`
- **Policy:** `Admins can manage destinations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `staff_members`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `staff_members`
- **Policy:** `Users can manage their own staff`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `staff_members`
- **Policy:** `mc_members_view_company_staff`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `staff_members`
- **Policy:** `mc_members_view_company_staff`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cancellation_policies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cancellation_policies`
- **Policy:** `Anyone can view cancellation policies`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cancellation_policies`
- **Policy:** `Anyone can view cancellation policies`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `cancellation_policies`
- **Policy:** `Admins can manage cancellation policies`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `consultation_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `consultation_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `consultation_requests`
- **Policy:** `Users can update own pending requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `consultation_requests`
- **Policy:** `Anonymous users can create requests`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `consultation_requests`
- **Policy:** `Admins can update all consultation requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `push_subscriptions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `push_subscriptions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_contact_links`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_contact_links`
- **Policy:** `Company members can insert contact links`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_contact_links`
- **Policy:** `Company members can update contact links`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `airport_suppliers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `airport_suppliers`
- **Policy:** `Admins can manage airport suppliers`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `airport_suppliers`
- **Policy:** `Admins can manage airport suppliers`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_inspections`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_inspections`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_inspections`
- **Policy:** `Owners can update their inspections`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `vertical_metrics`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `vertical_metrics`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `vertical_metrics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vertical_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_passport_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_passport_events`
- **Policy:** `Owner can manage passport events`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `developer_impersonation_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `developer_impersonation_log`
- **Policy:** `Admins manage impersonation log`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `tax_filings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `tax_filings`
- **Policy:** `MC directors update tax filings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `lead_score_events_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lead_score_events_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_score_events_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lead_score_events_log`
- **Policy:** `Read score log for contacts you can see`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `analytics_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `analytics_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `analytics_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `analytics_events`
- **Policy:** `Anyone can insert analytics events`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `tours`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `tours`
- **Policy:** `Admins can manage all tours`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `tours`
- **Policy:** `Providers can manage their own tours`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `tours`
- **Policy:** `Anyone can view approved tours or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `user_wellness_logs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_wellness_logs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_wellness_logs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `disputes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `disputes`
- **Policy:** `Admins can update disputes`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `disputes`
- **Policy:** `Admins manage disputes`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_leads`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `nb_leads`
- **Policy:** `Developer read own nb_leads`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_leads`
- **Policy:** `Admin manage nb_leads`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_addresses`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_addresses`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_addresses`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_addresses`
- **Policy:** `Create addresses`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `currency_rates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `currency_rates`
- **Policy:** `currency_rates_public_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `currency_rates`
- **Policy:** `currency_rates_public_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `currency_rates`
- **Policy:** `currency_rates_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `currency_rates`
- **Policy:** `currency_rates_admin_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `poi_claim_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `poi_claim_requests`
- **Policy:** `claims_insert_public`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `poi_claim_requests`
- **Policy:** `claims_insert_public`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `developer_users`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `developer_users`
- **Policy:** `Admins manage developer users`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `babysitters`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `babysitters`
- **Policy:** `Babysitters are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `babysitters`
- **Policy:** `Babysitters are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `babysitters`
- **Policy:** `Providers can manage own babysitters`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `babysitters`
- **Policy:** `Anyone can view approved babysitters or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_inquiries`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_inquiries`
- **Policy:** `Users can update their own inquiries`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_inquiries`
- **Policy:** `Admins can manage all inquiries`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_inquiries`
- **Policy:** `Providers can update inquiries for their properties`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-021] Policy uses ANY with function call

- **Table:** `property_inquiries`
- **Policy:** `Providers can update inquiries for their properties`
- **Description:** Policy uses ANY with a function call that may be evaluated for each row. Consider using array with select wrapper.
- **Remediation:** Use array with select wrapper: team_id = ANY(array(select user_teams())) instead of team_id = ANY(user_teams())

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_inquiries`
- **Policy:** `Providers can update inquiries for their properties`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `buyers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `buyers`
- **Policy:** `Brokers manage own buyers`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `uno_team_permissions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `airport_booking_addons`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `airport_booking_addons`
- **Policy:** `Users can manage addons for own bookings`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_message_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `booking_message_rules`
- **Policy:** `Owners manage their rules`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `company_category_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `company_category_settings`
- **Policy:** `Members can view category settings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `company_category_settings`
- **Policy:** `Members can view category settings`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `company_category_settings`
- **Policy:** `Managers can manage category settings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `company_category_settings`
- **Policy:** `Managers can manage category settings`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_agent_knowledge`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `ai_agent_knowledge`
- **Policy:** `Published knowledge is viewable for active agents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `ai_agent_knowledge`
- **Policy:** `Published knowledge is viewable for active agents`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `ai_agent_knowledge`
- **Policy:** `Admins can manage all knowledge`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `ai_agent_knowledge`
- **Policy:** `Admins can manage all knowledge`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_projects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_projects`
- **Policy:** `Anyone can view active investment projects`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `investment_projects`
- **Policy:** `Anyone can view active investment projects`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `investment_projects`
- **Policy:** `Anyone can view active investment projects`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `investment_projects`
- **Policy:** `Admins can manage investment projects`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_projects`
- **Policy:** `Admins can manage investment projects`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `legal_acceptances`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `legal_acceptances`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `legal_acceptances`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `legal_acceptances`
- **Policy:** `MC admins can read company acceptances`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_web_forms`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_web_forms`
- **Policy:** `crm_web_forms_mc_access`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `offer_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_prospects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_prospects`
- **Policy:** `Admins can manage vendor prospects`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `vendor_prospects`
- **Policy:** `Assigned managers can update their prospects`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_participants`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_participants`
- **Policy:** `deal_participants_select`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_participants`
- **Policy:** `deal_participants_insert`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_participants`
- **Policy:** `deal_participants_update`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `deal_participants`
- **Policy:** `deal_participants_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_participants`
- **Policy:** `deal_participants_delete`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `life_scenarios`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `life_scenarios`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `life_scenarios`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `life_scenarios`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `life_scenarios`
- **Policy:** `life_scenarios_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `life_scenarios`
- **Policy:** `life_scenarios_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `google_place_cache`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `google_place_cache`
- **Policy:** `google_place_cache_service_only`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `google_place_cache`
- **Policy:** `google_place_cache_service_only`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-013] Policy targets service_role

- **Table:** `google_place_cache`
- **Policy:** `google_place_cache_service_only`
- **Description:** Policy targets service_role which bypasses RLS automatically. This creates warnings and is unnecessary.
- **Remediation:** Remove service_role from TO clause. Service role bypasses RLS automatically, no policy needed.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `google_place_cache`
- **Policy:** `google_place_cache_service_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `agent_deals`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `agent_deals`
- **Policy:** `Company members can update deals`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `agent_deals`
- **Policy:** `Company owner/admin can delete deals`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `agent_deals`
- **Policy:** `Company owner/admin can delete deals`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_compliance_obligations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transfer_meeting_points`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transfer_meeting_points`
- **Policy:** `Anyone can read active meeting points`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transfer_meeting_points`
- **Policy:** `Anyone can read active meeting points`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurant_hours`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurant_hours`
- **Policy:** `Public can read restaurant hours`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurant_hours`
- **Policy:** `Public can read restaurant hours`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `restaurant_hours`
- **Policy:** `Admin can manage restaurant hours`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurant_hours`
- **Policy:** `Admin can manage restaurant hours`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `juristic_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `juristic_documents`
- **Policy:** `Admins manage juristic docs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_addresses`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_addresses`
- **Policy:** `Users can update own addresses`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_custom_field_values`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_field_values`
- **Policy:** `MC members can view field values`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_field_values`
- **Policy:** `MC members can view field values`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_field_values`
- **Policy:** `MC members can manage field values`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_field_values`
- **Policy:** `MC members can manage field values`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_achievements`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `team_achievements`
- **Policy:** `Anyone can view achievements`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `team_achievements`
- **Policy:** `Anyone can view achievements`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_achievements`
- **Policy:** `Admins can manage achievements`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `team_achievements`
- **Policy:** `Admins can manage achievements`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_ownership_invites`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-017] Policy uses auth.jwt() without select wrapper

- **Table:** `property_ownership_invites`
- **Policy:** `invites_access`
- **Description:** Policy uses auth.jwt() without (select ...) wrapper. This causes performance issues.
- **Remediation:** Wrap auth.jwt() in select: USING ((select auth.jwt()->>'key') = value)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_ownership_invites`
- **Policy:** `invites_access`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `visa_records`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_custom_options`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_options`
- **Policy:** `Company members can view CRM options`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_options`
- **Policy:** `Company members can view CRM options`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_options`
- **Policy:** `Company members can insert CRM options`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_options`
- **Policy:** `Company members can insert CRM options`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_options`
- **Policy:** `Company members can update CRM options`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_options`
- **Policy:** `Company members can update CRM options`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_custom_options`
- **Policy:** `Company members can update CRM options`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_custom_options`
- **Policy:** `Company members can delete CRM options`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_custom_options`
- **Policy:** `Company members can delete CRM options`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `product_resource_links`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `product_resource_links`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `product_resource_links`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `product_resource_links`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `product_resource_links`
- **Policy:** `Anyone can view product links`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `product_resource_links`
- **Policy:** `Anyone can view product links`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cohort_analytics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `cohort_analytics`
- **Policy:** `cohort_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `cohort_analytics`
- **Policy:** `cohort_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `cohort_analytics`
- **Policy:** `analytics_admin_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `cohort_analytics`
- **Policy:** `analytics_admin_only`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_leads`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_leads`
- **Policy:** `Admins can manage leads`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mcc_leads`
- **Policy:** `Anyone can create leads`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_leads`
- **Policy:** `Anyone can create leads`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_management_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_management_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_management_requests`
- **Policy:** `Users can update their received requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_complexes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_complexes`
- **Policy:** `Users can manage their own complexes`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_complexes`
- **Policy:** `Public can view active complexes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_complexes`
- **Policy:** `Public can view active complexes`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_complexes`
- **Policy:** `Owner can manage complexes`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_complexes`
- **Policy:** `MC members can manage company complexes`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `property_complexes`
- **Policy:** `MC members can manage company complexes`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_complexes`
- **Policy:** `MC members can manage company complexes`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_complexes`
- **Policy:** `Admins manage all complexes`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_payments`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_payments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `booking_payments`
- **Policy:** `Only service role can insert payments`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `booking_payments`
- **Policy:** `Only service role can update payments`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `booking_payments`
- **Policy:** `Only service role can update payments`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `notification_preferences`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `notification_preferences`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `notification_preferences`
- **Policy:** `Users can update their own preferences`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `guest_loyalty_tiers`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `guest_loyalty_tiers`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `guest_loyalty_tiers`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `guest_loyalty_tiers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `guest_loyalty_tiers`
- **Policy:** `Guest tiers are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `guest_loyalty_tiers`
- **Policy:** `Guest tiers are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_decisions_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_analytics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_analytics`
- **Policy:** `Admins can manage vendor analytics`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `profile_details`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `profile_details`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `profile_details`
- **Policy:** `Users can update own profile details`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `magnet_landings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `magnet_landings`
- **Policy:** `Public can view published magnet landings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `service_order_status_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `service_order_status_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `service_order_status_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `service_order_status_history`
- **Policy:** `View order history`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `service_order_status_history`
- **Policy:** `Insert order history by authorized users`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `service_order_status_history`
- **Policy:** `Insert order history by authorized users`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `flower_addons`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `flower_addons`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `flower_addons`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `flower_addons`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `flower_addons`
- **Policy:** `Flower addons are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `flower_addons`
- **Policy:** `Flower addons are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_project_updates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `nb_project_updates`
- **Policy:** `Public read nb_project_updates`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `nb_project_updates`
- **Policy:** `Public read nb_project_updates`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_project_updates`
- **Policy:** `Admin manage nb_project_updates`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `nb_project_updates`
- **Policy:** `Project updates are publicly viewable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `nb_project_updates`
- **Policy:** `Project updates are publicly viewable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can insert updates`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can insert updates`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can insert updates`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can update updates`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can update updates`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can update updates`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can delete updates`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `nb_project_updates`
- **Policy:** `Developer team can delete updates`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `project_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `project_documents`
- **Policy:** `Public can view public project documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `project_documents`
- **Policy:** `Public can view public project documents`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `project_documents`
- **Policy:** `Authenticated can view kyc documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `project_documents`
- **Policy:** `Authenticated can view kyc documents`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `project_documents`
- **Policy:** `Authenticated can view kyc documents`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `project_documents`
- **Policy:** `Developer can insert own project documents`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `project_documents`
- **Policy:** `Developer can update own project documents`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `taxonomy_normalization`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `taxonomy_normalization`
- **Policy:** `taxonomy_normalization_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `taxonomy_normalization`
- **Policy:** `taxonomy_normalization_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `taxonomy_normalization`
- **Policy:** `taxonomy_normalization_admin_write`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `taxonomy_normalization`
- **Policy:** `taxonomy_normalization_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_businesses`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `thai_businesses`
- **Policy:** `thai_businesses_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `founder_daily_brief`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `subscription_plans`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `subscription_plans`
- **Policy:** `Anyone can view active subscription plans`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `subscription_plans`
- **Policy:** `Anyone can view active subscription plans`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `subscription_plans`
- **Policy:** `Admins can manage subscription plans`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `juristic_contacts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `juristic_contacts`
- **Policy:** `Anyone can view juristic contacts for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `juristic_contacts`
- **Policy:** `Admins can manage juristic contacts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `entity_classification_hints`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `entity_classification_hints`
- **Policy:** `classification_hints_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `entity_classification_hints`
- **Policy:** `classification_hints_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `entity_classification_hints`
- **Policy:** `classification_hints_admin_write`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `entity_classification_hints`
- **Policy:** `classification_hints_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `catalog_hygiene_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `catalog_hygiene_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `catalog_hygiene_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `catalog_hygiene_log`
- **Policy:** `hygiene_log_read`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `catalog_hygiene_log`
- **Policy:** `hygiene_log_admin_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `catalog_hygiene_log`
- **Policy:** `hygiene_log_admin_insert`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `reconciliation_alerts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `reconciliation_alerts`
- **Policy:** `Authenticated users can view reconciliation alerts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `reconciliation_alerts`
- **Policy:** `Authenticated users can view reconciliation alerts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `reconciliation_alerts`
- **Policy:** `Authenticated users can update reconciliation alerts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `reconciliation_alerts`
- **Policy:** `Authenticated users can update reconciliation alerts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `reconciliation_alerts`
- **Policy:** `Authenticated users can update reconciliation alerts`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `reconciliation_alerts`
- **Policy:** `Allow insert reconciliation alerts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `reconciliation_alerts`
- **Policy:** `Allow insert reconciliation alerts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `reconciliation_alerts`
- **Policy:** `Admins manage reconciliation alerts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cleaning_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cleaning_services`
- **Policy:** `Cleaning services are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cleaning_services`
- **Policy:** `Cleaning services are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `cleaning_services`
- **Policy:** `Providers can manage own cleaning services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cleaning_services`
- **Policy:** `Anyone can view approved cleaning services or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_delivery_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_delivery_settings`
- **Policy:** `Anyone can view active delivery settings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_delivery_settings`
- **Policy:** `Anyone can view active delivery settings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `marketplace_delivery_settings`
- **Policy:** `UNO Team can manage delivery settings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `inventory_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `inventory_listings`
- **Policy:** `il_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `inventory_listings`
- **Policy:** `il_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_contacts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_contacts`
- **Policy:** `capital_contacts_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `ota_sync_logs`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `ota_sync_logs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `ota_sync_logs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ota_sync_logs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `capital_intro_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_intro_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_intro_requests`
- **Policy:** `Admins can update capital requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `bookings`
- **Policy:** `Users can update their own bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_price_offers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_price_offers`
- **Policy:** `Managers can manage price offers`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_price_offers`
- **Policy:** `Managers can manage price offers`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `relocation_articles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `relocation_articles`
- **Policy:** `Anyone can read published relocation articles`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `relocation_articles`
- **Policy:** `Anyone can read published relocation articles`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `relocation_articles`
- **Policy:** `Admins manage relocation articles`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `relocation_articles`
- **Policy:** `Admins manage relocation articles`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `relocation_articles`
- **Policy:** `Admins manage relocation articles`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `listings`
- **Policy:** `listings_public_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `listings`
- **Policy:** `listings_public_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `listings`
- **Policy:** `listings_admin_full`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `listings`
- **Policy:** `listings_admin_full`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `listings`
- **Policy:** `listings_provider_select`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `listings`
- **Policy:** `listings_provider_insert`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `listings`
- **Policy:** `listings_provider_update`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `listings`
- **Policy:** `listings_provider_delete`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_active_context`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_active_context`
- **Policy:** `Users manage own context`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_active_context`
- **Policy:** `Users can update own context`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `experience_categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `experience_categories`
- **Policy:** `Anyone can view active categories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `experience_categories`
- **Policy:** `Anyone can view active categories`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_scheduled_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_scheduled_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `booking_scheduled_messages`
- **Policy:** `Owners can cancel their messages`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_quotes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_quotes`
- **Policy:** `crm_quotes_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_quotes`
- **Policy:** `crm_quotes_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_quotes`
- **Policy:** `crm_quotes_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `crm_score_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `crm_score_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_score_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_score_log`
- **Policy:** `MC members can view score log`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_score_log`
- **Policy:** `MC members can view score log`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_score_log`
- **Policy:** `MC members can insert score log`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_score_log`
- **Policy:** `MC members can insert score log`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_pipeline`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_pipeline`
- **Policy:** `capital_pipeline_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `contact_identity_links`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `contact_identity_links`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `contact_identity_links`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_identity_links`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_report_preferences`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `ota_synced_listings`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `ota_synced_listings`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `ota_synced_listings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ota_synced_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_operational_tasks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_operational_tasks`
- **Policy:** `owners_and_mc_manage_operational_tasks`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_operational_tasks`
- **Policy:** `owners_and_mc_manage_operational_tasks`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_operational_tasks`
- **Policy:** `mc_members_manage_tasks`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `funnel_analytics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `funnel_analytics`
- **Policy:** `funnel_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `funnel_analytics`
- **Policy:** `funnel_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `funnel_analytics`
- **Policy:** `analytics_admin_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `funnel_analytics`
- **Policy:** `analytics_admin_only`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `intro_requests`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `intro_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `intro_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `intro_requests`
- **Policy:** `intro_requests_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `intro_requests`
- **Policy:** `intro_requests_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `service_orders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `service_orders`
- **Policy:** `Guests can update pending orders`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `service_orders`
- **Policy:** `Staff can update assigned orders`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `service_orders`
- **Policy:** `Admins full access to orders`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `service_orders`
- **Policy:** `Admins full access to orders`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `provider_payout_methods`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `provider_payout_methods`
- **Policy:** `Providers can view own payout methods`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `provider_payout_methods`
- **Policy:** `Providers can create own payout methods`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `provider_payout_methods`
- **Policy:** `Providers can update own payout methods`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `provider_payout_methods`
- **Policy:** `Providers can update own payout methods`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `provider_payout_methods`
- **Policy:** `Providers can delete own payout methods`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `provider_payout_methods`
- **Policy:** `Admins can manage payout methods`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `insurance_providers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `insurance_providers`
- **Policy:** `Vendors can manage their insurance providers`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `insurance_providers`
- **Policy:** `Vendors can manage their insurance providers`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `insurance_providers`
- **Policy:** `Anyone can view approved insurance providers or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_reminders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_reminders`
- **Policy:** `crm_reminders_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `salon_services`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `salon_services`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `salon_services`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `salon_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `salon_services`
- **Policy:** `Salon services are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `salon_services`
- **Policy:** `Salon services are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_scheduled_activities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can view activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can create activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can create activities`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can update activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can update activities`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_scheduled_activities`
- **Policy:** `Company members can delete activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ledger_accounts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `ledger_accounts`
- **Policy:** `MC members can view MC ledger accounts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `ledger_accounts`
- **Policy:** `MC members can view MC ledger accounts`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_outreach_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_outreach_templates`
- **Policy:** `Admins can manage outreach templates`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurants`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurants`
- **Policy:** `Restaurants are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurants`
- **Policy:** `Restaurants are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurants`
- **Policy:** `Providers can manage their restaurants`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurants`
- **Policy:** `Anyone can view approved restaurants or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `messages`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `messages`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_reviews`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_reviews`
- **Policy:** `Anyone can view approved reviews`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_reviews`
- **Policy:** `Anyone can view approved reviews`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `marketplace_reviews`
- **Policy:** `Users can update own reviews`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_personas`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_personas`
- **Policy:** `Users can update own personas`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `orgs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `orgs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `orgs`
- **Policy:** `Anyone can view active orgs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `orgs`
- **Policy:** `Anyone can view active orgs`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `orgs`
- **Policy:** `Org admins can update their org`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `orgs`
- **Policy:** `Org admins can update their org`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `project_drive_sources`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_prospect_activity`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_prospect_activity`
- **Policy:** `Admins can manage prospect activity`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `order_items`
- **Policy:** `View order items via order`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_items`
- **Policy:** `Create order items`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `order_items`
- **Policy:** `Vendors view own org order items`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `persona_detection_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `persona_detection_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `persona_detection_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `persona_detection_log`
- **Policy:** `persona_detection_log_anon_insert`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `yacht_pricing_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `yacht_pricing_rules`
- **Policy:** `Anyone can view active pricing rules`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `yacht_pricing_rules`
- **Policy:** `Anyone can view active pricing rules`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `yacht_pricing_rules`
- **Policy:** `Yacht owners can manage pricing rules`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_inventory_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_inventory_items`
- **Policy:** `Owners can manage their property inventory`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_inventory_items`
- **Policy:** `MC members manage company property inventory`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_inventory_items`
- **Policy:** `MC members manage company property inventory`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_inventory_items`
- **Policy:** `MC members manage company property inventory`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `pipeline_stage_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `pipeline_stage_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pipeline_stage_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `whatsapp_send_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `whatsapp_send_log`
- **Policy:** `No direct access to whatsapp_send_log`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `whatsapp_send_log`
- **Policy:** `No direct access to whatsapp_send_log`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_campaign_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_campaign_rules`
- **Policy:** `Admin manages campaign rules`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_ab_tests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_ab_tests`
- **Policy:** `Admins can manage AB tests`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mcc_ab_tests`
- **Policy:** `Public can read active AB tests`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_ab_tests`
- **Policy:** `Public can read active AB tests`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `review_helpful`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `review_helpful`
- **Policy:** `Anyone can view helpful votes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `review_helpful`
- **Policy:** `Anyone can view helpful votes`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `review_helpful`
- **Policy:** `Users can update their own votes`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_artifacts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `ai_artifacts`
- **Policy:** `Admins can manage AI artifacts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `data_provenance`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `data_provenance`
- **Policy:** `Admin can manage data provenance`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `data_provenance`
- **Policy:** `Admin can manage data provenance`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_scoring_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_scoring_rules`
- **Policy:** `MC members can view scoring rules`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_scoring_rules`
- **Policy:** `MC members can view scoring rules`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_scoring_rules`
- **Policy:** `MC managers can manage scoring rules`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_scoring_rules`
- **Policy:** `MC managers can manage scoring rules`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### LOW [RLS-006] DELETE policy missing

- **Table:** `pricing_recommendations`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pricing_recommendations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `pricing_recommendations`
- **Policy:** `Owner can update pricing recommendations`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `pricing_recommendations`
- **Policy:** `Owner can insert pricing recommendations`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `wallets`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `wallets`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `wallets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_channel_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_channel_metrics`
- **Policy:** `Admins can manage channel metrics`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `yacht_availability`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `yacht_availability`
- **Policy:** `Yacht owners can view own availability`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `yacht_availability`
- **Policy:** `Yacht owners can insert own availability`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `yacht_availability`
- **Policy:** `Yacht owners can update own availability`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `yacht_availability`
- **Policy:** `Yacht owners can update own availability`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `yacht_availability`
- **Policy:** `Yacht owners can delete own availability`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `yacht_availability`
- **Policy:** `Admins can manage all yacht availability`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `yacht_availability`
- **Policy:** `Public can view yacht availability`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `yacht_availability`
- **Policy:** `Public can view yacht availability`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `yacht_availability`
- **Policy:** `Public can view yacht availability`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `yacht_availability`
- **Policy:** `Public can view yacht availability`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### LOW [RLS-006] DELETE policy missing

- **Table:** `checklist_completions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `checklist_completions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `checklist_completions`
- **Policy:** `Users can update own completions`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `featured_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `featured_listings`
- **Policy:** `Vendors can create featured listings for their entities`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `featured_listings`
- **Policy:** `Admins can manage all featured listings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_documents`
- **Policy:** `Company members can view documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_documents`
- **Policy:** `Company members can insert documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_documents`
- **Policy:** `Company members can insert documents`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_documents`
- **Policy:** `Company members can update documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_documents`
- **Policy:** `Company members can update documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_documents`
- **Policy:** `Company members can update documents`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_documents`
- **Policy:** `Uploaders or admins can delete documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_documents`
- **Policy:** `Uploaders or admins can delete documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `stores`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `stores`
- **Policy:** `Anyone can view active stores`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `stores`
- **Policy:** `Anyone can view active stores`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `stores`
- **Policy:** `Providers can manage their stores`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `stores`
- **Policy:** `Admins can manage all stores`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `bouquets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `bouquets`
- **Policy:** `Anyone can view active bouquets`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `bouquets`
- **Policy:** `Anyone can view active bouquets`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `bouquets`
- **Policy:** `Providers can manage their bouquets`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `team_gamification`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_gamification`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_gamification`
- **Policy:** `System can update gamification`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `wallet_transactions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `wallet_transactions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `wallet_transactions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `wallet_transactions`
- **Policy:** `Only service role can insert transactions`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_property_assignments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_property_assignments`
- **Policy:** `Owners manage vendor assignments`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `webhook_endpoints`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `webhook_endpoints`
- **Policy:** `MC admins can manage webhooks`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `webhook_endpoints`
- **Policy:** `MC admins can manage webhooks`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `webhook_endpoints`
- **Policy:** `MC admins can manage webhooks`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `webhook_endpoints`
- **Policy:** `MC owners/admins can view webhooks`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-021] Policy uses ANY with function call

- **Table:** `webhook_endpoints`
- **Policy:** `MC owners/admins can view webhooks`
- **Description:** Policy uses ANY with a function call that may be evaluated for each row. Consider using array with select wrapper.
- **Remediation:** Use array with select wrapper: team_id = ANY(array(select user_teams())) instead of team_id = ANY(user_teams())

### LOW [RLS-006] DELETE policy missing

- **Table:** `help_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `help_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `help_requests`
- **Policy:** `Anyone can create help requests`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `help_requests`
- **Policy:** `Anyone can create help requests`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_conflicts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `booking_conflicts`
- **Policy:** `Owners can view their property conflicts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `booking_conflicts`
- **Policy:** `Owners can view their property conflicts`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `booking_conflicts`
- **Policy:** `Owners can update their property conflicts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `booking_conflicts`
- **Policy:** `Owners can update their property conflicts`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `booking_conflicts`
- **Policy:** `Owners can update their property conflicts`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `booking_conflicts`
- **Policy:** `System can insert conflicts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `booking_conflicts`
- **Policy:** `System can insert conflicts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_fees`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `platform_fees`
- **Policy:** `Anyone can view active platform fees`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `platform_fees`
- **Policy:** `Anyone can view active platform fees`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `platform_fees`
- **Policy:** `Admins can manage platform fees`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `owner_notifications`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `owner_notifications`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_notifications`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lifecycle_executions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cities`
- **Policy:** `Cities are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cities`
- **Policy:** `Cities are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `cities`
- **Policy:** `Admins can manage cities`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `unit_holds`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `unit_holds`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `unit_holds`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `unit_holds`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `unit_holds`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `unit_holds`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `lead_attributions`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `lead_attributions`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `lead_attributions`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `lead_attributions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lead_attributions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_attributions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `compliance_obligation_types`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `compliance_obligation_types`
- **Policy:** `Anyone can read obligation catalog`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `compliance_obligation_types`
- **Policy:** `Anyone can read obligation catalog`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `team_activity_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `team_activity_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_activity_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_activity_log`
- **Policy:** `View team activity`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-021] Policy uses ANY with function call

- **Table:** `team_activity_log`
- **Policy:** `View team activity`
- **Description:** Policy uses ANY with a function call that may be evaluated for each row. Consider using array with select wrapper.
- **Remediation:** Use array with select wrapper: team_id = ANY(array(select user_teams())) instead of team_id = ANY(user_teams())

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `visa_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `visa_services`
- **Policy:** `Anyone can view visa services`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `visa_services`
- **Policy:** `Anyone can view visa services`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `visa_services`
- **Policy:** `Vendors can manage their visa services`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `visa_services`
- **Policy:** `Vendors can manage their visa services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `market_comparables`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `market_comparables`
- **Policy:** `Anyone reads market comparables`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `market_comparables`
- **Policy:** `Anyone reads market comparables`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `market_comparables`
- **Policy:** `Admins manage market comparables`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_prospects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `translations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `translations`
- **Policy:** `Anyone can read translations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `translations`
- **Policy:** `Anyone can read translations`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `translations`
- **Policy:** `Admins can update translations`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_services`
- **Policy:** `Anyone can view active vendor services`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `vendor_services`
- **Policy:** `Anyone can view active vendor services`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_services`
- **Policy:** `Providers can manage their services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `concierge_sessions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `concierge_sessions`
- **Policy:** `Anon can create anon session`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `lifecycle_stage_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lifecycle_stage_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lifecycle_stage_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_member_permissions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_chat_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_chat_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_chat_messages`
- **Policy:** `Users can mark messages as read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_portal_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_segments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_segments`
- **Policy:** `segments_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `user_segments`
- **Policy:** `segments_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `user_segments`
- **Policy:** `analytics_admin_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `user_segments`
- **Policy:** `analytics_admin_only`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `owner_performance_metrics`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `owner_performance_metrics`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `owner_performance_metrics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_performance_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_payout_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `property_payout_rules`
- **Policy:** `Users can manage payout rules for their properties`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_payout_rules`
- **Policy:** `Users can manage payout rules for their properties`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_payout_rules`
- **Policy:** `Users can manage payout rules for their properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_manager_assignments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_manager_assignments`
- **Policy:** `Owners can manage assignments for their properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_manager_assignments`
- **Policy:** `Admins can manage all assignments`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_manager_assignments`
- **Policy:** `Admins can manage all assignments`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurant_menus`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurant_menus`
- **Policy:** `Public can read restaurant menus`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurant_menus`
- **Policy:** `Public can read restaurant menus`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `restaurant_menus`
- **Policy:** `Admin can manage restaurant menus`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurant_menus`
- **Policy:** `Admin can manage restaurant menus`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `orders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `orders`
- **Policy:** `Order owners can update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `orders`
- **Policy:** `Vendors can update own org orders`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `orders`
- **Policy:** `orders_update_own`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `orders`
- **Policy:** `orders_admin_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `location_knowledge`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `location_knowledge`
- **Policy:** `Anyone can view published knowledge content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `location_knowledge`
- **Policy:** `Anyone can view published knowledge content`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `location_knowledge`
- **Policy:** `Admins can manage knowledge content`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `location_knowledge`
- **Policy:** `Admins can manage knowledge content`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_listings`
- **Policy:** `Users can update their own listings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `payment_schedules`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `payment_schedules`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `payment_schedules`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `payment_schedules`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `payment_schedules`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `payment_schedules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_pipelines`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_pipelines`
- **Policy:** `MC members can view pipelines`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_pipelines`
- **Policy:** `MC members can view pipelines`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_pipelines`
- **Policy:** `MC managers can manage pipelines`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_pipelines`
- **Policy:** `MC managers can manage pipelines`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `outreach_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_read`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_write`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_write`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_update`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_update`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `outreach_templates`
- **Policy:** `outreach_templates_mc_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `ai_agent_logs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `ai_agent_logs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_agent_logs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `user_referrals`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_referrals`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_referrals`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `task_entity_map`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `task_entity_map`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `task_entity_map`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `task_entity_map`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `task_entity_map`
- **Policy:** `task_entity_map_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `task_entity_map`
- **Policy:** `task_entity_map_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `admin_notes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `admin_notes`
- **Policy:** `admin_notes_admin_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `favorites`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `favorites`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `lead_activity_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lead_activity_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_activity_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_promotions`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_promotions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_promotions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_promotions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_promotions`
- **Policy:** `Promotions are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_promotions`
- **Policy:** `Promotions are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `user_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `city_content`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `city_content`
- **Policy:** `city_content public read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `city_content`
- **Policy:** `city_content public read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `property_booking_status_history`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `property_booking_status_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_booking_status_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_booking_status_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_booking_status_history`
- **Policy:** `View property booking history`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `events`
- **Policy:** `Events are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `events`
- **Policy:** `Events are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `events`
- **Policy:** `Providers can manage their events`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `events`
- **Policy:** `Providers can manage their events`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `events`
- **Policy:** `Anyone can view approved events or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `partner_applications`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `partner_applications`
- **Policy:** `Users can update their own pending applications`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `partner_applications`
- **Policy:** `Admins can manage all applications`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `partner_applications`
- **Policy:** `Users can update own pending applications`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transfer_night_surcharge_config`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transfer_night_surcharge_config`
- **Policy:** `Anyone reads night surcharge`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transfer_night_surcharge_config`
- **Policy:** `Anyone reads night surcharge`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `event_occurrences`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `event_occurrences`
- **Policy:** `Public can read event occurrences`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `event_occurrences`
- **Policy:** `Public can read event occurrences`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `event_occurrences`
- **Policy:** `Admin can manage event occurrences`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `event_occurrences`
- **Policy:** `Admin can manage event occurrences`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `reviews`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `reviews`
- **Policy:** `Anyone can view approved reviews`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `reviews`
- **Policy:** `Anyone can view approved reviews`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `reviews`
- **Policy:** `Users can update their own reviews`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `reviews`
- **Policy:** `Admins can manage all reviews`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_tax_profile`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_subscriptions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_subscriptions`
- **Policy:** `Admins can manage all subscriptions`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `management_company_members`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `management_company_members`
- **Policy:** `Admins can manage all memberships`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `management_company_members`
- **Policy:** `Company admins can manage members`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `management_company_members`
- **Policy:** `Members can view their company colleagues`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `management_company_members`
- **Policy:** `Members can view their company colleagues`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_subcategories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_subcategories`
- **Policy:** `Anyone can view active subcategories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_subcategories`
- **Policy:** `Anyone can view active subcategories`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_subcategories`
- **Policy:** `UNO Team can manage subcategories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `marketplace_subcategories`
- **Policy:** `UNO Team can manage subcategories`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `qa_multi_role_auto_config`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `qa_multi_role_auto_config`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `qa_multi_role_auto_config`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `qa_multi_role_auto_config`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `qa_multi_role_auto_config`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `qa_multi_role_auto_config`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_payment_stages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_payment_stages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `order_payment_stages`
- **Policy:** `Owners can update payment stages for their properties`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_payment_stages`
- **Policy:** `Users can insert own payment stages`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `order_payment_stages`
- **Policy:** `Users can update own payment stages`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_vault_files`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `owner_vault_files`
- **Policy:** `Owners manage own vault files`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `owner_vault_files`
- **Policy:** `Public read via share token`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-030] Policy uses comparison operators without auth check

- **Table:** `owner_vault_files`
- **Policy:** `Public read via share token`
- **Description:** Policy uses comparison operators (>, <, >=, <=) without auth.uid() verification. May allow unauthorized access.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column operator value)

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `owner_vault_files`
- **Policy:** `Public read via share token`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `owner_vault_files`
- **Policy:** `Public read via share token`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_utility_schedules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_utility_schedules`
- **Policy:** `Users can manage utility schedules for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_utility_schedules`
- **Policy:** `Users can manage utility schedules for their properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_accounting_policies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_accounting_policies`
- **Policy:** `Members can view company policies`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_accounting_policies`
- **Policy:** `Members can manage company policies`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `development_units`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `development_units`
- **Policy:** `Anyone can view development units`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `development_units`
- **Policy:** `Anyone can view development units`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `development_units`
- **Policy:** `Admin can manage development units`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `development_units`
- **Policy:** `development_units public read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `development_units`
- **Policy:** `development_units public read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `data_quality_issues`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `data_quality_issues`
- **Policy:** `Admin can manage quality issues`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `data_quality_issues`
- **Policy:** `Admin can manage quality issues`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `referrals`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `referrals`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `referrals`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_sequence_steps`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_sequence_steps`
- **Policy:** `crm_sequence_steps_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_sequence_steps`
- **Policy:** `crm_sequence_steps_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_sequence_steps`
- **Policy:** `crm_sequence_steps_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_viewings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_viewings`
- **Policy:** `deal_viewings_select`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_viewings`
- **Policy:** `deal_viewings_insert`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_viewings`
- **Policy:** `deal_viewings_update`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `deal_viewings`
- **Policy:** `deal_viewings_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_viewings`
- **Policy:** `deal_viewings_delete`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_workflows`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_workflows`
- **Policy:** `crm_workflows_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_workflows`
- **Policy:** `crm_workflows_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_workflows`
- **Policy:** `crm_workflows_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `legal_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `legal_services`
- **Policy:** `Legal services are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `legal_services`
- **Policy:** `Legal services are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `legal_services`
- **Policy:** `Providers can manage own legal services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `legal_services`
- **Policy:** `Anyone can view approved legal services or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `mcc_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `mcc_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_deals`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_deals`
- **Policy:** `admins manage all deals`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-030] Policy uses comparison operators without auth check

- **Table:** `investment_deals`
- **Policy:** `anyone can submit investment deal`
- **Description:** Policy uses comparison operators (>, <, >=, <=) without auth.uid() verification. May allow unauthorized access.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column operator value)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_deals`
- **Policy:** `authenticated can view published deals`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_deals`
- **Policy:** `authenticated can view published deals`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_deals`
- **Policy:** `Anon can view published deals (public columns)`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_deals`
- **Policy:** `Anon can view published deals (public columns)`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `view_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `view_history`
- **Policy:** `Users can update their own history`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `catalog_facet_definitions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `catalog_facet_definitions`
- **Policy:** `facet_definitions_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `catalog_facet_definitions`
- **Policy:** `facet_definitions_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `catalog_facet_definitions`
- **Policy:** `facet_definitions_admin_write`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `catalog_facet_definitions`
- **Policy:** `facet_definitions_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `inventory_inspections`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `inventory_inspections`
- **Policy:** `Owners can create inspections`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `inventory_inspections`
- **Policy:** `MC members can update inspections`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `inventory_inspections`
- **Policy:** `MC admins can delete inspections`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `inventory_inspections`
- **Policy:** `MC admins can delete inspections`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `inventory_inspections`
- **Policy:** `Admins manage inspections`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transport_vehicle_types`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transport_vehicle_types`
- **Policy:** `Vehicle types are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transport_vehicle_types`
- **Policy:** `Vehicle types are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `transport_vehicle_types`
- **Policy:** `Admins can manage vehicle types`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_order_status_history`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_order_status_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_order_status_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_order_status_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deposit_vault_photos`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `deposit_vault_photos`
- **Policy:** `Owners manage their vault photos`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `social_content_calendar`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `category_groups`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `category_groups`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `category_groups`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `category_groups`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `category_groups`
- **Policy:** `Category groups are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `category_groups`
- **Policy:** `Category groups are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_sessions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_sessions`
- **Policy:** `Anyone can insert sessions`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_sessions`
- **Policy:** `Admin manages sessions`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `company_storefronts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `company_storefronts`
- **Policy:** `Anyone can read active storefronts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `company_storefronts`
- **Policy:** `Anyone can read active storefronts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `company_storefronts`
- **Policy:** `MC members can manage own storefronts`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `company_storefronts`
- **Policy:** `MC members can manage own storefronts`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `company_storefronts`
- **Policy:** `Admins can manage all storefronts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `company_storefronts`
- **Policy:** `Admins can manage all storefronts`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `notification_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `tour_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `tour_bookings`
- **Policy:** `Users can update their own tour bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `tour_bookings`
- **Policy:** `Admins can manage all tour bookings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurant_availability`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurant_availability`
- **Policy:** `Anyone can read restaurant availability`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurant_availability`
- **Policy:** `Anyone can read restaurant availability`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurant_availability`
- **Policy:** `Providers can manage their restaurant availability`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `booking_messages`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `booking_messages`
- **Policy:** `Users can send messages on their bookings`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `official_news`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `official_news`
- **Policy:** `Public can read official news`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `official_news`
- **Policy:** `Public can read official news`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `official_news`
- **Policy:** `Service role manages official news`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-022] Policy uses auth.role() without verification

- **Table:** `official_news`
- **Policy:** `Service role manages official news`
- **Description:** Policy uses auth.role() without proper verification. May allow unauthorized role-based access.
- **Remediation:** Ensure auth.role() is properly verified against allowed roles or use auth.jwt()->>'app_metadata' for role checks.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `official_news`
- **Policy:** `Service role manages official news`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lifecycle_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `lifecycle_templates`
- **Policy:** `Admins can manage lifecycle_templates`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `rln_events`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `rln_events`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `rln_events`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `rln_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `rln_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `rln_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `relocation_plans`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `airport_services`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `airport_services`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `airport_services`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `airport_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `airport_services`
- **Policy:** `Anyone can view active airport services`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `airport_services`
- **Policy:** `Anyone can view active airport services`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `life_situations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `life_situations`
- **Policy:** `Life situations are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `life_situations`
- **Policy:** `Life situations are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `life_situations`
- **Policy:** `Admins can manage life situations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_payouts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `owner_payouts`
- **Policy:** `MC members update payouts`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_products`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_products`
- **Policy:** `Anyone can view active marketplace products`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_products`
- **Policy:** `Anyone can view active marketplace products`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `marketplace_products`
- **Policy:** `UNO Team can manage marketplace products`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `marketplace_products`
- **Policy:** `Vendors can insert own products`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `marketplace_products`
- **Policy:** `Vendors can update own products`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `marketplace_products`
- **Policy:** `Vendors can update own products`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `marketplace_products`
- **Policy:** `Vendors can delete own products`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_products`
- **Policy:** `Vendors can view own products`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `marketplace_products`
- **Policy:** `Vendors can view own products`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `staff_property_assignments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `staff_property_assignments`
- **Policy:** `Users can manage their staff assignments`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `admin_audit_logs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `admin_audit_logs`
- **Policy:** `Only service role can create audit logs`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `admin_audit_logs`
- **Policy:** `audit_logs_admin_only`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `admin_audit_logs`
- **Policy:** `audit_logs_admin_only`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `crm_web_form_submissions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `crm_web_form_submissions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_web_form_submissions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_web_form_submissions`
- **Policy:** `crm_web_form_submissions_read`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_web_form_submissions`
- **Policy:** `crm_web_form_submissions_insert`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_web_form_submissions`
- **Policy:** `crm_web_form_submissions_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_web_form_submissions`
- **Policy:** `Public can submit web forms`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `crm_web_form_submissions`
- **Policy:** `Public can submit web forms`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_web_form_submissions`
- **Policy:** `Public can submit web forms`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `transfers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `transfers`
- **Policy:** `Transfers are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `transfers`
- **Policy:** `Transfers are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `transfers`
- **Policy:** `Providers can manage their transfers`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `transfers`
- **Policy:** `Providers can manage their transfers`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_landing_registry`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_landing_registry`
- **Policy:** `Admins can manage landing registry`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mcc_landing_registry`
- **Policy:** `Public can read active landings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_landing_registry`
- **Policy:** `Public can read active landings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_analytics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_analytics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_analytics`
- **Policy:** `Owners can view analytics for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_analytics`
- **Policy:** `Admins can update analytics`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `yacht_external_calendars`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `yacht_external_calendars`
- **Policy:** `Providers can update their yacht calendars`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `referral_codes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `referral_codes`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `referral_codes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `referral_codes`
- **Policy:** `Anyone can lookup referral codes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `referral_codes`
- **Policy:** `Anyone can lookup referral codes`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `stays_subscription_tiers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `stays_subscription_tiers`
- **Policy:** `Authenticated users can read stays tiers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `stays_subscription_tiers`
- **Policy:** `Authenticated users can read stays tiers`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `stays_subscription_tiers`
- **Policy:** `Read stays tiers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `stays_subscription_tiers`
- **Policy:** `Read stays tiers`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_campaigns`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_campaigns`
- **Policy:** `capital_campaigns_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_participants`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `ai_task_suggestions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_task_suggestions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_business_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `thai_business_services`
- **Policy:** `thai_services_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `thai_business_services`
- **Policy:** `thai_services_write`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `thai_business_services`
- **Policy:** `thai_services_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vertical_subscriptions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `vertical_subscriptions`
- **Policy:** `Users can update their own vertical subscriptions`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_external_calendars`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_external_calendars`
- **Policy:** `Owners can update their own external calendars`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_team_members`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_team_members`
- **Policy:** `Anyone can view team of active projects`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `investment_team_members`
- **Policy:** `Anyone can view team of active projects`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `investment_team_members`
- **Policy:** `Anyone can view team of active projects`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### HIGH [RLS-026] OR with subquery without justification

- **Table:** `investment_team_members`
- **Policy:** `Anyone can view team of active projects`
- **Description:** Policy uses OR with a subquery without justification. This may allow unauthorized access through the subquery branch.
- **Remediation:** Review and justify the OR with subquery pattern or rewrite to use a more secure approach with proper auth checks.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `investment_team_members`
- **Policy:** `Admins can manage team members`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_team_members`
- **Policy:** `Admins can manage team members`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vertical_commission_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `portal_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `portal_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `portal_messages`
- **Policy:** `Owner sends portal messages`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `portal_messages`
- **Policy:** `Owner updates read status`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### LOW [RLS-006] DELETE policy missing

- **Table:** `owner_statement_approvals`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_statement_approvals`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `owner_statement_approvals`
- **Policy:** `MC members view company approvals`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `owner_statement_approvals`
- **Policy:** `MC members create approvals`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `owner_statement_approvals`
- **Policy:** `MC members create approvals`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `owner_statement_approvals`
- **Policy:** `MC admins update approvals`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `owner_statement_approvals`
- **Policy:** `MC admins update approvals`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `owner_statement_approvals`
- **Policy:** `MC admins update approvals`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `due_diligence_rooms`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `due_diligence_rooms`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `due_diligence_rooms`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `due_diligence_rooms`
- **Policy:** `due_diligence_rooms_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `due_diligence_rooms`
- **Policy:** `due_diligence_rooms_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `user_loyalty_status`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `user_loyalty_status`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_loyalty_status`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_loyalty_status`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `deal_stage_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `deal_stage_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_stage_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `deal_stage_history`
- **Policy:** `deal_stage_history_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_project_reports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `nb_project_reports`
- **Policy:** `Public read nb_project_reports`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `nb_project_reports`
- **Policy:** `Public read nb_project_reports`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_project_reports`
- **Policy:** `Admin manage nb_project_reports`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `categories`
- **Policy:** `Anyone can view active categories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `categories`
- **Policy:** `Anyone can view active categories`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `guest_check_in_data`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `guest_check_in_data`
- **Policy:** `Users can manage their own check-in data`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `guest_check_in_data`
- **Policy:** `Property owners can update check-in status`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_listing_scores`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_listing_scores`
- **Policy:** `Owners can view listing scores`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_listing_scores`
- **Policy:** `Anyone can read listing scores`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_listing_scores`
- **Policy:** `Anyone can read listing scores`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_listing_scores`
- **Policy:** `Admins can manage listing scores`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `property_listing_scores`
- **Policy:** `Admins can manage listing scores`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `service_promotions`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `service_promotions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `service_promotions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `service_promotions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `service_promotions`
- **Policy:** `Public read access`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `service_promotions`
- **Policy:** `Public read access`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `project_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `project_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `project_requests`
- **Policy:** `Admins can update requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vehicles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vehicles`
- **Policy:** `Vehicles are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `vehicles`
- **Policy:** `Vehicles are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vehicles`
- **Policy:** `Providers can manage own vehicles`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vehicles`
- **Policy:** `Anyone can view approved vehicles or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `simulation_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `simulation_events`
- **Policy:** `Admins can manage simulation events`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `simulation_events`
- **Policy:** `Admins can manage simulation events`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `suppressed_emails`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `suppressed_emails`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `suppressed_emails`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `suppressed_emails`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `suppressed_emails`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `suppressed_emails`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_sequences`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_sequences`
- **Policy:** `crm_sequences_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_sequences`
- **Policy:** `crm_sequences_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_sequences`
- **Policy:** `crm_sequences_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `simulation_runs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `simulation_runs`
- **Policy:** `Admins can manage simulation runs`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `simulation_runs`
- **Policy:** `Admins can manage simulation runs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `crm_access_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `crm_access_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_access_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_access_log`
- **Policy:** `Company admins can view access logs`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_members`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_members`
- **Policy:** `Team members can update own profile`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `team_members`
- **Policy:** `Admins can insert team members`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_members`
- **Policy:** `Admins can insert team members`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_members`
- **Policy:** `Admins can delete team members`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_locations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_locations`
- **Policy:** `Vendors can view own locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_locations`
- **Policy:** `Vendors can view own locations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_locations`
- **Policy:** `Vendors can insert own locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_locations`
- **Policy:** `Vendors can insert own locations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_locations`
- **Policy:** `Vendors can update own locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_locations`
- **Policy:** `Vendors can update own locations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `vendor_locations`
- **Policy:** `Vendors can update own locations`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_locations`
- **Policy:** `Vendors can delete own locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_locations`
- **Policy:** `Vendors can delete own locations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_locations`
- **Policy:** `Public can view approved locations`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `vendor_locations`
- **Policy:** `Public can view approved locations`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_locations`
- **Policy:** `Admins have full access to vendor locations`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_locations`
- **Policy:** `Admins have full access to vendor locations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_visa_status`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `payment_intents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `payment_intents`
- **Policy:** `Create payment intents`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `provider_badges`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `provider_badges`
- **Policy:** `Anyone can view provider badges`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `provider_badges`
- **Policy:** `Anyone can view provider badges`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `provider_badges`
- **Policy:** `Admins can manage provider badges`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_maintenance_schedules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_maintenance_schedules`
- **Policy:** `Owners manage own maintenance schedules`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_maintenance_schedules`
- **Policy:** `Owners manage own maintenance schedules`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_maintenance_schedules`
- **Policy:** `Delegates can view maintenance schedules`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `user_achievements`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `user_achievements`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_achievements`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_achievements`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `medical_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `medical_services`
- **Policy:** `Medical services are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `medical_services`
- **Policy:** `Medical services are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `medical_services`
- **Policy:** `Clinic providers can manage services`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `medical_services`
- **Policy:** `Clinic providers can manage services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_tags`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `contact_tags`
- **Policy:** `Company members can view tags`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `contact_tags`
- **Policy:** `Company members can view tags`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `contact_tags`
- **Policy:** `Company members can create tags`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `contact_tags`
- **Policy:** `Company members can create tags`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `contact_tags`
- **Policy:** `Company members can update tags`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `contact_tags`
- **Policy:** `Company members can update tags`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `contact_tags`
- **Policy:** `Company members can update tags`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `contact_tags`
- **Policy:** `Company members can delete tags`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `contact_tags`
- **Policy:** `Company members can delete tags`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `order_item_property_details`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_item_property_details`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_item_property_details`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_item_property_details`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `providers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `providers`
- **Policy:** `Anyone can view active providers`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `providers`
- **Policy:** `Anyone can view active providers`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `crm_oauth_states`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `crm_oauth_states`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `crm_oauth_states`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `crm_oauth_states`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `crm_oauth_states`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_oauth_states`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `financial_categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `financial_categories`
- **Policy:** `MC members can read own categories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `financial_categories`
- **Policy:** `MC members can read own categories`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `financial_categories`
- **Policy:** `MC directors/managers can manage categories`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `financial_categories`
- **Policy:** `MC directors/managers can manage categories`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_management_terms`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_management_terms`
- **Policy:** `Users can view terms they manage or own`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_management_terms`
- **Policy:** `Users can insert terms for properties they own or manage`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_management_terms`
- **Policy:** `Users can update terms they manage or own`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_management_terms`
- **Policy:** `Users can update terms they manage or own`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_management_terms`
- **Policy:** `Users can delete terms they manage or own`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_management_terms`
- **Policy:** `Directors can update terms`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_properties`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `owner_properties`
- **Policy:** `Owners can update their properties`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `owner_properties`
- **Policy:** `Admins and UNO Team can update owner properties`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-014] OR without proper auth check

- **Table:** `owner_properties`
- **Policy:** `Delegates and org members can access properties`
- **Description:** Policy uses OR operator without proper auth.uid() check on all branches. An attacker may bypass authentication through the OR condition.
- **Remediation:** Ensure all branches of OR include auth.uid() checks: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### MEDIUM [RLS-024] OR without auth.uid() check

- **Table:** `owner_properties`
- **Policy:** `Delegates and org members can access properties`
- **Description:** Policy uses OR operator without auth.uid() check. This may allow unauthorized access through the OR branch.
- **Remediation:** Add auth.uid() check to all branches of OR: USING (auth.uid() = user_id OR auth.uid() = admin_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `org_members`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `org_members`
- **Policy:** `Org owners can manage members`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_saved_searches`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `nb_saved_searches`
- **Policy:** `Users update own saved searches`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_meters`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_meters`
- **Policy:** `Owners can manage their property meters`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_meters`
- **Policy:** `MC members can update meters`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_meters`
- **Policy:** `MC admins can delete meters`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_meters`
- **Policy:** `MC admins can delete meters`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `property_booking_status_log`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `property_booking_status_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_booking_status_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_booking_status_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `nb_alert_log`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `nb_alert_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `nb_alert_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_alert_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_owners`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_owners`
- **Policy:** `po_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_owners`
- **Policy:** `po_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `legal_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `legal_documents`
- **Policy:** `Anyone can read active legal documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `legal_documents`
- **Policy:** `Anyone can read active legal documents`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `legal_documents`
- **Policy:** `Admins can manage legal documents`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `legal_documents`
- **Policy:** `Admins can manage legal documents`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `thai_chat_messages`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `thai_chat_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_chat_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `thai_chat_messages`
- **Policy:** `thai_chat_messages_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `notifications`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `notifications`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `notifications`
- **Policy:** `Users can update their own notifications`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `payout_runs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `payout_runs`
- **Policy:** `MC members update runs`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_reviews`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_reviews`
- **Policy:** `MC members manage company property reviews`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_reviews`
- **Policy:** `MC members manage company property reviews`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_reviews`
- **Policy:** `MC members manage company property reviews`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_contacts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_contacts`
- **Policy:** `Company members can update contacts`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_contacts`
- **Policy:** `Company admins can delete contacts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_contacts`
- **Policy:** `Company admins can delete contacts`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mc_property_slots`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mc_property_slots`
- **Policy:** `MC members can view slots`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mc_property_slots`
- **Policy:** `MC directors can manage slots`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `mc_property_slots`
- **Policy:** `MC directors can manage slots`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mc_property_slots`
- **Policy:** `MC directors can manage slots`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `life_tasks`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `life_tasks`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `life_tasks`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `life_tasks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `life_tasks`
- **Policy:** `life_tasks_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `life_tasks`
- **Policy:** `life_tasks_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `co_investment_matches`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `co_investment_matches`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `co_investment_matches`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `co_investment_matches`
- **Policy:** `co_investment_matches_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `co_investment_matches`
- **Policy:** `co_investment_matches_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `co_investment_matches`
- **Policy:** `co_investment_matches_insert_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `co_investment_matches`
- **Policy:** `co_investment_matches_insert_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `approval_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `approval_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_requests`
- **Policy:** `req_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_requests`
- **Policy:** `req_insert`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `approval_requests`
- **Policy:** `req_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_requests`
- **Policy:** `req_update`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `approval_requests`
- **Policy:** `req_update`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `approval_requests`
- **Policy:** `req_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_email_accounts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_inventory_reports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `booking_inventory_reports`
- **Policy:** `Owners can manage inventory reports`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_user_states`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_user_states`
- **Policy:** `Admins can manage user states`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `staff_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `staff_documents`
- **Policy:** `Owners manage staff docs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_checklist_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_checklist_templates`
- **Policy:** `Directors can manage checklist templates`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_checklist_templates`
- **Policy:** `Directors can manage checklist templates`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `reservations`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `reservations`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `reservations`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `reservations`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `reservations`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `reservations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_management_companies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_management_companies`
- **Policy:** `PM companies viewable by all authenticated users`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_management_companies`
- **Policy:** `PM companies viewable by all authenticated users`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_management_companies`
- **Policy:** `Admins can manage PM companies`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `property_management_companies`
- **Policy:** `Admins can manage PM companies`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### LOW [RLS-006] DELETE policy missing

- **Table:** `juristic_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `juristic_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `juristic_requests`
- **Policy:** `Users can view their own juristic requests`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `juristic_requests`
- **Policy:** `Users can view their own juristic requests`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `juristic_requests`
- **Policy:** `Users can create juristic requests for their properties`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `juristic_requests`
- **Policy:** `Users can create juristic requests for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `juristic_requests`
- **Policy:** `Users can create juristic requests for their properties`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `juristic_requests`
- **Policy:** `Users can update their own draft requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `communities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `communities`
- **Policy:** `communities_public_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `communities`
- **Policy:** `communities_public_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_documents`
- **Policy:** `Owners can manage their property documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `property_documents`
- **Policy:** `Owners can manage their property documents`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_documents`
- **Policy:** `Owners can manage their property documents`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_documents`
- **Policy:** `MC members and owners can insert documents`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_documents`
- **Policy:** `MC admins and owners can update documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_documents`
- **Policy:** `MC admins and owners can update documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_documents`
- **Policy:** `MC admins and owners can update documents`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_documents`
- **Policy:** `MC admins and owners can delete documents`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_documents`
- **Policy:** `MC admins and owners can delete documents`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `knowledge_pillars`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `knowledge_pillars`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `knowledge_pillars`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `knowledge_pillars`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `knowledge_pillars`
- **Policy:** `Anyone can read knowledge pillars`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `knowledge_pillars`
- **Policy:** `Anyone can read knowledge pillars`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clearview_categories`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `clearview_categories`
- **Policy:** `clearview_categories public read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `clearview_categories`
- **Policy:** `clearview_categories public read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clearview_categories`
- **Policy:** `clearview_categories admin write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `contact_disclosure_events`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `contact_disclosure_events`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `contact_disclosure_events`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `contact_disclosure_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `contact_disclosure_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_disclosure_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pet_profiles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `pet_profiles`
- **Policy:** `Users can update their own pets`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `city_areas`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `city_areas`
- **Policy:** `city_areas public read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `city_areas`
- **Policy:** `city_areas public read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `venues`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `venues`
- **Policy:** `Venues are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `venues`
- **Policy:** `Venues are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `venues`
- **Policy:** `Admins can manage venues`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `venues`
- **Policy:** `Admins can manage venues`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `business_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `business_listings`
- **Policy:** `Public can view published listings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `business_listings`
- **Policy:** `Owners can update own listings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `business_listings`
- **Policy:** `Admins can update all listings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_stays_subscriptions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_attachments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_attachments`
- **Policy:** `Owner inserts own order attachments`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `tags`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `tags`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `tags`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `tags`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `tags`
- **Policy:** `Anyone can view tags`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `tags`
- **Policy:** `Anyone can view tags`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pharmacies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `pharmacies`
- **Policy:** `Admins can manage all pharmacies`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `pharmacies`
- **Policy:** `Anyone can view approved pharmacies or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `personal_reminders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `personal_reminders`
- **Policy:** `Users can update own reminders`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `support_tickets`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `support_tickets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `support_tickets`
- **Policy:** `Users can update their own tickets`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `support_tickets`
- **Policy:** `Admins can update all tickets`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `ticket_messages`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `ticket_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ticket_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `ticket_messages`
- **Policy:** `Users can add messages to their tickets`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `ticket_messages`
- **Policy:** `System can add messages`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `failed_notifications`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `failed_notifications`
- **Policy:** `Service role only for failed_notifications`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `failed_notifications`
- **Policy:** `Service role only for failed_notifications`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `service_jtbd_clusters`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `service_jtbd_clusters`
- **Policy:** `Public read service-jtbd map`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `service_jtbd_clusters`
- **Policy:** `Public read service-jtbd map`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `service_jtbd_clusters`
- **Policy:** `Admins manage service-jtbd map`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `platform_events`
- **Policy:** `read_active_events`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `platform_events`
- **Policy:** `read_active_events`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `platform_events`
- **Policy:** `admins_manage_events`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `platform_events`
- **Policy:** `admins_manage_events`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lookup_values`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `lookup_values`
- **Policy:** `Anyone can read lookup values`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lookup_values`
- **Policy:** `Anyone can read lookup values`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `lookup_values`
- **Policy:** `Admins can manage lookup values`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `product_availability`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `product_availability`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `product_availability`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `product_availability`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `product_availability`
- **Policy:** `Anyone can view availability`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `product_availability`
- **Policy:** `Anyone can view availability`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_documents`
- **Policy:** `Users can update own documents`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_documents`
- **Policy:** `Admins can update documents for verification`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `message_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `message_templates`
- **Policy:** `Owners can manage their own templates`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clearview_bundle_slots`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clearview_bundle_slots`
- **Policy:** `Admins manage bundle slots`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cluster_life_situations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cluster_life_situations`
- **Policy:** `Cluster life situation map is publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cluster_life_situations`
- **Policy:** `Cluster life situation map is publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `cross_sell_metrics`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `cross_sell_metrics`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `cross_sell_metrics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cross_sell_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `commission_events`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `commission_events`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `commission_events`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `commission_events`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `commission_events`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `commission_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `security_audit_log`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `security_audit_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `security_audit_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `security_audit_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `funding_rounds`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `funding_rounds`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `funding_rounds`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `funding_rounds`
- **Policy:** `funding_rounds_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `funding_rounds`
- **Policy:** `funding_rounds_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `funding_rounds`
- **Policy:** `funding_rounds_insert_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `funding_rounds`
- **Policy:** `funding_rounds_insert_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `pwa_installs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `pwa_installs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pwa_installs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `pwa_installs`
- **Policy:** `Admins can view installs`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_availability`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_availability`
- **Policy:** `Owners can insert own property availability`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_availability`
- **Policy:** `Owners can update own property availability`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_availability`
- **Policy:** `Admins can manage all availability`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_availability`
- **Policy:** `Public can view availability for active properties`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_availability`
- **Policy:** `Public can view availability for active properties`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `booking_status_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_status_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_status_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `booking_status_history`
- **Policy:** `Booking participants add status history`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-048] Policy may create infinite loop

- **Table:** `booking_status_history`
- **Policy:** `Booking participants add status history`
- **Description:** The policy may create an infinite loop due to self-referencing without proper termination.
- **Remediation:** Review the policy logic for self-referencing patterns. Add proper termination conditions or rewrite the query.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_automation_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_automation_rules`
- **Policy:** `Admins can manage automation rules`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deposit_vaults`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `deposit_vaults`
- **Policy:** `Owners manage their vault`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `thai_business_reviews`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `thai_business_reviews`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_business_reviews`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `thai_business_reviews`
- **Policy:** `thai_reviews_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `thai_business_reviews`
- **Policy:** `thai_reviews_select`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `order_item_yacht_details`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_item_yacht_details`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_item_yacht_details`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_item_yacht_details`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_status_history`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_status_history`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_status_history`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_status_history`
- **Policy:** `Users can insert status for own orders`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `drive_import_jobs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cart_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `cart_items`
- **Policy:** `Users can update their own cart items`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `due_diligence_reports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `due_diligence_reports`
- **Policy:** `Public reads published DD reports`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `due_diligence_reports`
- **Policy:** `Public reads published DD reports`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `due_diligence_reports`
- **Policy:** `Public reads published DD reports`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `due_diligence_reports`
- **Policy:** `Public reads published DD reports`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `due_diligence_reports`
- **Policy:** `Developers read own DD reports`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `due_diligence_reports`
- **Policy:** `Admins manage DD reports`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `due_diligence_reports`
- **Policy:** `Paid users can read published DD reports`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_message_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_message_templates`
- **Policy:** `capital_message_templates_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_invoices`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `owner_invoices`
- **Policy:** `Company members can create invoices`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `owner_invoices`
- **Policy:** `Company members can update invoices`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `api_keys`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `api_keys`
- **Policy:** `MC members can view api keys`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `api_keys`
- **Policy:** `MC admins can manage api keys`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `api_keys`
- **Policy:** `MC admins can manage api keys`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `api_keys`
- **Policy:** `MC admins can manage api keys`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_wishlist`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_wishlist`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_emails`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_emails`
- **Policy:** `crm_emails_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_emails`
- **Policy:** `crm_emails_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_emails`
- **Policy:** `crm_emails_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `vendor_bookings`
- **Policy:** `Providers can update their bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `vendor_bookings`
- **Policy:** `Bookings can be linked to vendors`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_bookings`
- **Policy:** `Admins can manage vendor bookings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `order_item_transport_details`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_item_transport_details`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_item_transport_details`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_item_transport_details`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_channels`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_channels`
- **Policy:** `Admins can manage channels`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `team_channels`
- **Policy:** `Admins can manage channels`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_entity_notes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_entity_notes`
- **Policy:** `Users can update own notes`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_promotions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_promotions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_promotions`
- **Policy:** `Owners can update their promotions`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_workflow_actions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_workflow_actions`
- **Policy:** `crm_workflow_actions_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_workflow_actions`
- **Policy:** `crm_workflow_actions_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_workflow_actions`
- **Policy:** `crm_workflow_actions_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `yachts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `yachts`
- **Policy:** `Anyone can view approved yachts`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `yachts`
- **Policy:** `Anyone can view approved yachts`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `yachts`
- **Policy:** `Providers can manage their yachts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `yachts`
- **Policy:** `Admins can manage all yachts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pet_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `pet_services`
- **Policy:** `Pet services are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `pet_services`
- **Policy:** `Pet services are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `pet_services`
- **Policy:** `Providers can manage own pet services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `pet_services`
- **Policy:** `Anyone can view approved pet services or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### LOW [RLS-006] DELETE policy missing

- **Table:** `thai_partner_leads`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_partner_leads`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `thai_partner_leads`
- **Policy:** `thai_partner_leads_insert`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `thai_partner_leads`
- **Policy:** `thai_partner_leads_insert`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `listing_applications`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `listing_applications`
- **Policy:** `Users update own draft applications`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `listing_applications`
- **Policy:** `Admin update all applications`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investor_inquiries`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investor_inquiries`
- **Policy:** `admins manage all inquiries`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investor_inquiries`
- **Policy:** `anyone can submit inquiry`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `investor_inquiries`
- **Policy:** `anyone can submit inquiry`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-030] Policy uses comparison operators without auth check

- **Table:** `investor_inquiries`
- **Policy:** `anyone can submit inquiry`
- **Description:** Policy uses comparison operators (>, <, >=, <=) without auth.uid() verification. May allow unauthorized access.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column operator value)

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `email_send_state`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `email_send_state`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `email_send_state`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `email_send_state`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `email_send_state`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `email_send_state`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `taxonomy_definitions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `taxonomy_definitions`
- **Policy:** `Anyone can read taxonomy definitions`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `taxonomy_definitions`
- **Policy:** `Anyone can read taxonomy definitions`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `taxonomy_definitions`
- **Policy:** `Admins can manage taxonomy definitions`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_properties`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `contact_properties`
- **Policy:** `contact_properties_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `email_send_log`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `email_send_log`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `email_send_log`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `email_send_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `email_send_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `email_send_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_news`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `platform_news`
- **Policy:** `read_active_news`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `platform_news`
- **Policy:** `read_active_news`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `platform_news`
- **Policy:** `admins_manage_news`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `platform_news`
- **Policy:** `admins_manage_news`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_vendors`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_vendors`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_vendors`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_vendors`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_vendors`
- **Policy:** `Vendors are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_vendors`
- **Policy:** `Vendors are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_promo_usage`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_promo_usage`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_promo_usage`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_landing_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_landing_events`
- **Policy:** `Admins can read all landing events`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_landing_events`
- **Policy:** `Anyone can insert events with required fields`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `mcc_landing_events`
- **Policy:** `Anyone can insert events`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `mcc_landing_events`
- **Policy:** `Anyone can insert events`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `task_comments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `task_comments`
- **Policy:** `Users can update own comments`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `agent_deal_activities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `agent_deal_activities`
- **Policy:** `Company members can view activities`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `agent_deal_activities`
- **Policy:** `Company members can insert activities`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `agent_deal_activities`
- **Policy:** `Company members can update their own activities`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_product_attributes`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_product_attributes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_product_attributes`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_product_attributes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_product_attributes`
- **Policy:** `Anyone can read product attributes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_product_attributes`
- **Policy:** `Anyone can read product attributes`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_performance_reviews`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `vendor_performance_reviews`
- **Policy:** `Company members can create vendor reviews`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `vendor_performance_reviews`
- **Policy:** `Company members can update own reviews`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_sequence_enrollments`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_sequence_enrollments`
- **Policy:** `crm_sequence_enrollments_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_sequence_enrollments`
- **Policy:** `crm_sequence_enrollments_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_sequence_enrollments`
- **Policy:** `crm_sequence_enrollments_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `booking_notifications_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_notifications_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_notifications_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `booking_notifications_log`
- **Policy:** `Authenticated users can insert notifications for their bookings`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `booking_notifications_log`
- **Policy:** `MC members can view booking notifications`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### LOW [RLS-006] DELETE policy missing

- **Table:** `team_timesheets`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_timesheets`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `team_timesheets`
- **Policy:** `ts_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_timesheets`
- **Policy:** `ts_select`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `team_timesheets`
- **Policy:** `ts_insert_self`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `team_timesheets`
- **Policy:** `ts_insert_self`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_timesheets`
- **Policy:** `ts_update_self`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `social_posts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `property_activity_log`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_activity_log`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_activity_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_activity_log`
- **Policy:** `Delegates can view property activity`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_activity_log`
- **Policy:** `MC directors can view company property activity`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_activity_log`
- **Policy:** `MC directors can view company property activity`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_meetings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_meetings`
- **Policy:** `crm_meetings_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_meetings`
- **Policy:** `crm_meetings_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_meetings`
- **Policy:** `crm_meetings_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `experience_media`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `experience_media`
- **Policy:** `Public can read experience media`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `experience_media`
- **Policy:** `Public can read experience media`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `experience_media`
- **Policy:** `Admins can manage experience media`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `experience_media`
- **Policy:** `Admins can manage experience media`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_payouts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `vendor_payouts`
- **Policy:** `Providers can request payouts`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_payouts`
- **Policy:** `Admins can manage vendor payouts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `geographic_metrics`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `geographic_metrics`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `geographic_metrics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `geographic_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `airport_bookings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `airport_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `airport_bookings`
- **Policy:** `Users can update own airport bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clearview_purchases`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clearview_purchases`
- **Policy:** `Admins manage clearview purchases`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `thai_bookings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `thai_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `thai_bookings`
- **Policy:** `thai_bookings_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `property_service_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_service_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_service_requests`
- **Policy:** `Owners can update their service requests`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `crm_contact_notes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_contact_notes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `crm_contact_notes`
- **Policy:** `Company members can insert contact notes`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `owner_commission_tiers`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `owner_commission_tiers`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `owner_commission_tiers`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_commission_tiers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `owner_commission_tiers`
- **Policy:** `Owner commission tiers are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `owner_commission_tiers`
- **Policy:** `Owner commission tiers are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `resources`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `resources`
- **Policy:** `Anyone can view resources`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `resources`
- **Policy:** `Anyone can view resources`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `resources`
- **Policy:** `Org members can manage resources`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_agents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `ai_agents`
- **Policy:** `Public agents are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `ai_agents`
- **Policy:** `Public agents are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `ai_agents`
- **Policy:** `Admins can manage all agents`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `ai_agents`
- **Policy:** `Admins can manage all agents`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `purchase_orders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `purchase_orders`
- **Policy:** `po_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `purchase_orders`
- **Policy:** `po_modify`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `purchase_orders`
- **Policy:** `po_modify`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `purchase_orders`
- **Policy:** `po_modify`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_message_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_message_log`
- **Policy:** `Admin manages message log`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `mcc_creatives`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `mcc_creatives`
- **Policy:** `Admins can manage creatives`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `store_products`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `store_products`
- **Policy:** `Anyone can view active store products`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `store_products`
- **Policy:** `Anyone can view active store products`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `store_products`
- **Policy:** `Providers can manage their store products`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_activities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_activities`
- **Policy:** `MC members can view activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_activities`
- **Policy:** `MC members can view activities`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_activities`
- **Policy:** `MC members can manage activities`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_activities`
- **Policy:** `MC members can manage activities`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_articles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_articles`
- **Policy:** `Public can view published articles`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_articles`
- **Policy:** `Public can view published articles`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_articles`
- **Policy:** `Admins can manage articles`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `developers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `developers`
- **Policy:** `Admins can manage developers`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `developers`
- **Policy:** `Developers viewable by authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `developers`
- **Policy:** `Developers viewable by authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `approval_workflows`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_workflows`
- **Policy:** `wf_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_workflows`
- **Policy:** `wf_modify`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `approval_workflows`
- **Policy:** `wf_modify`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `approval_workflows`
- **Policy:** `wf_modify`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ota_listing_connections`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `ota_listing_connections`
- **Policy:** `Owners can update their OTA connections`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `water_activity_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `water_activity_bookings`
- **Policy:** `Users can update their own water activity bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `water_activity_bookings`
- **Policy:** `Admins can manage all water activity bookings`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `team_user_achievements`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `team_user_achievements`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_user_achievements`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_notes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `products`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `products`
- **Policy:** `Anyone can view active products`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `products`
- **Policy:** `Anyone can view active products`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `products`
- **Policy:** `Org members can manage products`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `lead_magnet_submissions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_magnet_submissions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `lead_magnet_submissions`
- **Policy:** `Anyone can submit a magnet form`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lead_magnet_submissions`
- **Policy:** `Anyone can submit a magnet form`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_operations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `booking_operations`
- **Policy:** `Owners can manage booking operations`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `booking_cross_sell_offers`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `booking_cross_sell_offers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `booking_cross_sell_offers`
- **Policy:** `Guest can update cross-sell status`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `booking_cross_sell_offers`
- **Policy:** `Owner can insert cross-sell offers`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_companies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `crm_companies`
- **Policy:** `crm_companies_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_companies`
- **Policy:** `crm_companies_delete`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_companies`
- **Policy:** `crm_companies_delete`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### LOW [RLS-006] DELETE policy missing

- **Table:** `user_sessions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_sessions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_sessions`
- **Policy:** `Update own sessions`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `order_translations`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_translations`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_translations`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_translations`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `phuket_osm_pois`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_public_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_public_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_service_write`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_service_write`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-013] Policy targets service_role

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_service_write`
- **Description:** Policy targets service_role which bypasses RLS automatically. This creates warnings and is unnecessary.
- **Remediation:** Remove service_role from TO clause. Service role bypasses RLS automatically, no policy needed.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `phuket_osm_pois`
- **Policy:** `phuket_osm_pois_service_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `pharmacy_products`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `pharmacy_products`
- **Policy:** `Anyone can view active pharmacy products`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `pharmacy_products`
- **Policy:** `Anyone can view active pharmacy products`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `pharmacy_products`
- **Policy:** `Admins can manage all pharmacy products`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_bookings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_bookings`
- **Policy:** `Owners can update their property bookings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_bookings`
- **Policy:** `mc_members_view_property_bookings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_bookings`
- **Policy:** `mc_members_view_property_bookings`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `veterinary_clinics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `veterinary_clinics`
- **Policy:** `Public read access for veterinary_clinics`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `veterinary_clinics`
- **Policy:** `Public read access for veterinary_clinics`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `veterinary_clinics`
- **Policy:** `Providers can manage own veterinary_clinics`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `veterinary_clinics`
- **Policy:** `Providers can manage own veterinary_clinics`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `sys_intake_configs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `sys_intake_configs`
- **Policy:** `Anyone can read active intake configs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `sys_intake_configs`
- **Policy:** `Anyone can read active intake configs`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `sys_intake_configs`
- **Policy:** `Admins can manage intake configs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `sys_intake_configs`
- **Policy:** `Admins can manage intake configs`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `platform_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-017] Policy uses auth.jwt() without select wrapper

- **Table:** `platform_metrics`
- **Policy:** `System can manage platform metrics`
- **Description:** Policy uses auth.jwt() without (select ...) wrapper. This causes performance issues.
- **Remediation:** Wrap auth.jwt() in select: USING ((select auth.jwt()->>'key') = value)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `platform_metrics`
- **Policy:** `System can manage platform metrics`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_pipeline_stages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_pipeline_stages`
- **Policy:** `MC members can view stages`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_pipeline_stages`
- **Policy:** `MC members can view stages`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_pipeline_stages`
- **Policy:** `MC managers can manage stages`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_pipeline_stages`
- **Policy:** `MC managers can manage stages`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `signature_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_requests`
- **Policy:** `MC members view company sigreqs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_requests`
- **Policy:** `MC members create sigreqs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `signature_requests`
- **Policy:** `MC members create sigreqs`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_requests`
- **Policy:** `MC members update sigreqs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `signature_requests`
- **Policy:** `MC members update sigreqs`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `signature_requests`
- **Policy:** `MC admins delete sigreqs`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `signature_requests`
- **Policy:** `MC admins delete sigreqs`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `properties`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `properties`
- **Policy:** `Admins can manage all properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `properties`
- **Policy:** `Providers can manage their own properties`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `properties`
- **Policy:** `Anyone can view approved properties or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `properties`
- **Policy:** `public_view_active`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `properties`
- **Policy:** `public_view_active`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `properties`
- **Policy:** `owner_update_own`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `properties`
- **Policy:** `provider_update_own`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `properties`
- **Policy:** `manager_update_assigned`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `properties`
- **Policy:** `mc_member_delete_company_properties_v2`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `properties`
- **Policy:** `mc_member_delete_company_properties_v2`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `properties`
- **Policy:** `mc_member_insert_company_properties_v2`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `properties`
- **Policy:** `mc_member_insert_company_properties_v2`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `properties`
- **Policy:** `mc_member_insert_company_properties_v2`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_alert_preferences`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `nb_alert_preferences`
- **Policy:** `Users update own nb alert prefs`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `marketplace_promo_codes`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `marketplace_promo_codes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `marketplace_promo_codes`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `marketplace_promo_codes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `marketplace_promo_codes`
- **Policy:** `Anyone can view active promo codes`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `marketplace_promo_codes`
- **Policy:** `Anyone can view active promo codes`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `experience_pricing`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `experience_pricing`
- **Policy:** `Public can read experience pricing`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `experience_pricing`
- **Policy:** `Public can read experience pricing`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `experience_pricing`
- **Policy:** `Admins can manage experience pricing`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `experience_pricing`
- **Policy:** `Admins can manage experience pricing`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_special_terms`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `nb_special_terms`
- **Policy:** `Public read nb_special_terms`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `nb_special_terms`
- **Policy:** `Public read nb_special_terms`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_special_terms`
- **Policy:** `Admin manage nb_special_terms`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `education_providers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `education_providers`
- **Policy:** `Education providers are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `education_providers`
- **Policy:** `Education providers are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `education_providers`
- **Policy:** `Providers can manage own education`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `education_providers`
- **Policy:** `Anyone can view approved education providers or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `dispute_packs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `dispute_packs`
- **Policy:** `Owners manage their dispute packs`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_rate_seasons`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_rate_seasons`
- **Policy:** `MC members manage rate seasons`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_documents_vault`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `simulation_entity_links`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `simulation_entity_links`
- **Policy:** `Admins can manage simulation entity links`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `simulation_entity_links`
- **Policy:** `Admins can manage simulation entity links`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `floor_plans`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `floor_plans`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `floor_plans`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `floor_plans`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `floor_plans`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `floor_plans`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### LOW [RLS-006] DELETE policy missing

- **Table:** `team_messages`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_messages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_messages`
- **Policy:** `Users can update own messages`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `gyms`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `gyms`
- **Policy:** `Gyms are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `gyms`
- **Policy:** `Gyms are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `gyms`
- **Policy:** `Providers can manage own gyms`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `gyms`
- **Policy:** `Anyone can view approved gyms or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `provider_input_rules`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `provider_input_rules`
- **Policy:** `input_rules_read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `provider_input_rules`
- **Policy:** `input_rules_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `provider_input_rules`
- **Policy:** `input_rules_admin_write`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `provider_input_rules`
- **Policy:** `input_rules_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `promoted_listings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `promoted_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `promoted_listings`
- **Policy:** `Admins can update promoted listings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clearview_scores`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `clearview_scores`
- **Policy:** `clearview_scores follow project`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clearview_scores`
- **Policy:** `clearview_scores admin write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `cashback_settings`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `cashback_settings`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `cashback_settings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cashback_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `cashback_settings`
- **Policy:** `Anyone can view active cashback settings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `cashback_settings`
- **Policy:** `Anyone can view active cashback settings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_financials`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_financials`
- **Policy:** `mc_members_crud_property_financials`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_financials`
- **Policy:** `mc_members_crud_property_financials`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_financials`
- **Policy:** `mc_members_crud_property_financials`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `approval_steps`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `approval_steps`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_steps`
- **Policy:** `steps_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `approval_steps`
- **Policy:** `steps_insert`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `approval_steps`
- **Policy:** `steps_insert`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `approval_steps`
- **Policy:** `steps_update_own`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `goods_receipts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `goods_receipts`
- **Policy:** `gr_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `goods_receipts`
- **Policy:** `gr_modify`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `goods_receipts`
- **Policy:** `gr_modify`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `goods_receipts`
- **Policy:** `gr_modify`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `insurance_plans`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `insurance_plans`
- **Policy:** `Anyone can view insurance plans`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `insurance_plans`
- **Policy:** `Anyone can view insurance plans`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `insurance_plans`
- **Policy:** `Vendors can manage their insurance plans`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `insurance_plans`
- **Policy:** `Vendors can manage their insurance plans`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `referral_settings`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `referral_settings`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `referral_settings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `referral_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `referral_settings`
- **Policy:** `Anyone can view active referral settings`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `referral_settings`
- **Policy:** `Anyone can view active referral settings`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `team_shifts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `team_shifts`
- **Policy:** `shifts_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `team_shifts`
- **Policy:** `shifts_modify`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `team_shifts`
- **Policy:** `shifts_modify`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `team_shifts`
- **Policy:** `shifts_modify`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `team_shifts`
- **Policy:** `shifts_self_update_status`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `cohort_metrics`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `cohort_metrics`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `cohort_metrics`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `cohort_metrics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `vendor_location_services`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_location_services`
- **Policy:** `Vendors can manage location services`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_location_services`
- **Policy:** `Vendors can manage location services`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_location_services`
- **Policy:** `Vendors can manage location services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `vendor_location_services`
- **Policy:** `Public can view active location services`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `vendor_location_services`
- **Policy:** `Public can view active location services`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `vendor_location_services`
- **Policy:** `Admins have full access to location services`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `vendor_location_services`
- **Policy:** `Admins have full access to location services`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `restaurant_menu_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `restaurant_menu_items`
- **Policy:** `Menu items are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `restaurant_menu_items`
- **Policy:** `Menu items are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `restaurant_menu_items`
- **Policy:** `Providers can manage their menu items`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### LOW [RLS-006] DELETE policy missing

- **Table:** `trust_account_movements`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `trust_account_movements`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `trust_account_movements`
- **Policy:** `MC directors update trust movements`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_projects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_projects`
- **Policy:** `Anyone can view active projects`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `property_projects`
- **Policy:** `Anyone can view active projects`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_projects`
- **Policy:** `Users can update their own projects`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `quick_listings`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `quick_listings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `quick_listings`
- **Policy:** `Users can update own pending listings`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `quick_listings`
- **Policy:** `Admins can update any quick listing`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `compliance_filings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `qa_test_runs`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `qa_test_runs`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `qa_test_runs`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `crm_comm_templates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `crm_comm_templates`
- **Policy:** `crm_comm_templates_mc`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `crm_comm_templates`
- **Policy:** `crm_comm_templates_mc`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `crm_comm_templates`
- **Policy:** `crm_comm_templates_mc`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `banks`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `banks`
- **Policy:** `Public read access for banks`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `banks`
- **Policy:** `Public read access for banks`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `banks`
- **Policy:** `Providers can manage own banks`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `banks`
- **Policy:** `Providers can manage own banks`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_interests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `investment_interests`
- **Policy:** `Admins can manage interests`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `investment_interests`
- **Policy:** `Admins can manage interests`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `guest_referral_codes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_roles`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `owner_service_vendors`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `owner_service_vendors`
- **Policy:** `Owners manage own vendors`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `owner_service_vendors`
- **Policy:** `MC members access company vendors`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `owner_service_vendors`
- **Policy:** `MC members access company vendors`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `owner_service_vendors`
- **Policy:** `MC members access company vendors`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contract_analyses`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_delegates`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_delegates`
- **Policy:** `Property owners can manage delegates`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_payment_methods`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_payment_methods`
- **Policy:** `Users can update own payment methods`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `ai_knowledge_documents`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `resale_properties`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `resale_properties`
- **Policy:** `Anyone can view active resale properties`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `resale_properties`
- **Policy:** `Admin can manage resale properties`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `resale_properties`
- **Policy:** `resale_properties public read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `resale_properties`
- **Policy:** `resale_properties public read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `masked_channels`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `masked_channels`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `masked_channels`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `masked_channels`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `masked_channels`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `masked_channels`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `airport_passengers`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `airport_passengers`
- **Policy:** `Users can manage passengers for own bookings`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `investment_entities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `investment_entities`
- **Policy:** `investment_entities_select_authenticated`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `investment_entities`
- **Policy:** `investment_entities_select_authenticated`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_projects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_projects`
- **Policy:** `capital_projects_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-004] INSERT policy missing

- **Table:** `lifeos_routes`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `lifeos_routes`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `lifeos_routes`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lifeos_routes`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `lifeos_routes`
- **Policy:** `Routes are publicly readable`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lifeos_routes`
- **Policy:** `Routes are publicly readable`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `system_config`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `system_config`
- **Policy:** `Public can read Google Maps browser key`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_guidebook`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `property_guidebook`
- **Policy:** `Property owners can manage their guidebooks`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `property_guidebook`
- **Policy:** `Guests view guidebook via user_id`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `purchase_order_items`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `purchase_order_items`
- **Policy:** `po_items_select`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `purchase_order_items`
- **Policy:** `po_items_modify`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `purchase_order_items`
- **Policy:** `po_items_modify`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `purchase_order_items`
- **Policy:** `po_items_modify`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `concierge_journeys`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `concierge_journeys`
- **Policy:** `Anyone can read journey for its session`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `concierge_journeys`
- **Policy:** `Insert journey for own session`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `concierge_journeys`
- **Policy:** `Anon insert journey for anon session`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `concierge_journeys`
- **Policy:** `Anon insert journey for anon session`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `concierge_journeys`
- **Policy:** `Anon insert journey for anon session`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### CRITICAL [RLS-002] No RLS policies defined

- **Table:** `email_unsubscribe_tokens`
- **Description:** RLS is enabled but no policies are defined. No one can access data, not even authenticated users.
- **Remediation:** Create at least one policy for the table. RLS with no policies means deny all access by default.

### HIGH [RLS-003] SELECT policy missing

- **Table:** `email_unsubscribe_tokens`
- **Description:** No SELECT policy is defined. Users cannot read data from this table.
- **Remediation:** Create a SELECT policy: CREATE POLICY name ON table FOR SELECT TO authenticated USING (condition);

### HIGH [RLS-004] INSERT policy missing

- **Table:** `email_unsubscribe_tokens`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `email_unsubscribe_tokens`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `email_unsubscribe_tokens`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `email_unsubscribe_tokens`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `capital_outreach`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `capital_outreach`
- **Policy:** `capital_outreach_update`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### LOW [RLS-006] DELETE policy missing

- **Table:** `category_suggestions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `category_suggestions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `category_suggestions`
- **Policy:** `Admins can update suggestions`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `provider_contracts`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `provider_contracts`
- **Policy:** `Admins can manage contracts`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `provider_contracts`
- **Policy:** `Admins can manage contracts`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `page_views`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `page_views`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `page_views`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `rate_limit_log`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `rate_limit_log`
- **Policy:** `Only service role can insert rate limits`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `rate_limit_log`
- **Policy:** `Only service role can update rate limits`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `rate_limit_log`
- **Policy:** `Only service role can update rate limits`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `rate_limit_log`
- **Policy:** `Only service role can delete rate limits`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `system_settings`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `system_settings`
- **Policy:** `system_settings_admin_write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-049] FOR ALL policy violates least privilege principle

- **Table:** `system_settings`
- **Policy:** `system_settings_admin_write`
- **Description:** FOR ALL policy without auth checks violates the least privilege principle. Consider creating separate policies for each operation.
- **Remediation:** Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) with appropriate auth checks.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `system_settings`
- **Policy:** `system_settings_public_org_read`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-028] Policy uses IN without auth check

- **Table:** `system_settings`
- **Policy:** `system_settings_public_org_read`
- **Description:** Policy uses IN operator without auth.uid() verification. May allow unauthorized access to multiple rows.
- **Remediation:** Add auth.uid() verification: USING (auth.uid() = user_id AND column IN (values))

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `notification_deliveries`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `lead_score_events`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `lead_score_events`
- **Policy:** `Lead score events readable by authenticated users`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `lead_score_events`
- **Policy:** `Lead score events readable by authenticated users`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### LOW [RLS-006] DELETE policy missing

- **Table:** `manual_payment_requests`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `manual_payment_requests`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-004] INSERT policy missing

- **Table:** `achievement_definitions`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `achievement_definitions`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `achievement_definitions`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `achievement_definitions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `achievement_definitions`
- **Policy:** `Achievement definitions are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `achievement_definitions`
- **Policy:** `Achievement definitions are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `user_pins`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `user_pins`
- **Policy:** `Users can update their own PIN`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `deal_pipeline_stages`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_pipeline_stages`
- **Policy:** `Company members can view pipeline stages`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `deal_pipeline_stages`
- **Policy:** `Company admins can manage pipeline stages`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `deal_pipeline_stages`
- **Policy:** `Company admins can manage pipeline stages`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `deal_pipeline_stages`
- **Policy:** `Company admins can manage pipeline stages`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `management_companies`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `management_companies`
- **Policy:** `Admins can manage companies`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `management_companies`
- **Policy:** `Company directors can update their company`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `management_companies`
- **Policy:** `Company directors can update their company`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `management_companies`
- **Policy:** `Company directors can update their company`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `management_companies`
- **Policy:** `Members and admins can view their companies`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `management_companies`
- **Policy:** `Anon can view active companies (public columns)`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `management_companies`
- **Policy:** `Anon can view active companies (public columns)`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clinics`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `clinics`
- **Policy:** `Clinics are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `clinics`
- **Policy:** `Clinics are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `clinics`
- **Policy:** `Providers can manage their clinics`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clinics`
- **Policy:** `Providers can manage their clinics`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `clinics`
- **Policy:** `Anyone can view approved clinics or own content`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-004] INSERT policy missing

- **Table:** `contact_identities`
- **Description:** No INSERT policy is defined. Users cannot insert data into this table.
- **Remediation:** Create an INSERT policy: CREATE POLICY name ON table FOR INSERT TO authenticated WITH CHECK (condition);

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `contact_identities`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `contact_identities`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `contact_identities`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `document_reminders`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-005] UPDATE policy missing

- **Table:** `order_participants`
- **Description:** No UPDATE policy is defined. Users cannot update data in this table.
- **Remediation:** Create an UPDATE policy: CREATE POLICY name ON table FOR UPDATE TO authenticated USING (condition) WITH CHECK (condition);

### LOW [RLS-006] DELETE policy missing

- **Table:** `order_participants`
- **Description:** No DELETE policy is defined. Users cannot delete data from this table.
- **Remediation:** Create a DELETE policy: CREATE POLICY name ON table FOR DELETE TO authenticated USING (condition);

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `order_participants`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `order_participants`
- **Policy:** `Create participants`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `chat_message_flags`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `chat_message_flags`
- **Policy:** `Owners can view flags for their properties`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `chat_message_flags`
- **Policy:** `Staff can manage all flags`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `chat_message_flags`
- **Policy:** `Staff can manage all flags`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `chat_message_flags`
- **Policy:** `Admins manage chat flags`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `property_reports`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-011] UPDATE policy missing WITH CHECK clause

- **Table:** `property_reports`
- **Policy:** `Users can update their reports`
- **Description:** UPDATE policy has USING but no WITH CHECK. Users may update rows to values that violate the policy.
- **Remediation:** Add WITH CHECK clause: USING (condition) WITH CHECK (condition) to ensure updated rows comply with policy

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_reports`
- **Policy:** `Owners can view their reports`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `property_reports`
- **Policy:** `Owners and managers can create reports`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `property_reports`
- **Policy:** `Owners and managers can create reports`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `nb_promotions`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `nb_promotions`
- **Policy:** `Public read active nb_promotions`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-019] Policy uses EXISTS with join to source table

- **Table:** `nb_promotions`
- **Policy:** `Admin manage nb_promotions`
- **Description:** Policy uses EXISTS with a join to the source table. This causes performance issues due to row-by-row evaluation.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of EXISTS (SELECT 1 FROM table WHERE table.col = source.col)

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `clearview_projects`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `clearview_projects`
- **Policy:** `clearview_projects published read`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `clearview_projects`
- **Policy:** `clearview_projects admin write`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.

### HIGH [RLS-054] Missing FORCE ROW LEVEL SECURITY

- **Table:** `doctors`
- **Description:** RLS is enabled but FORCE ROW LEVEL SECURITY is not set. Table owners bypass RLS by default unless FORCE is enabled.
- **Remediation:** Add FORCE RLS: ALTER TABLE table_name FORCE ROW LEVEL SECURITY; This ensures even the table owner respects RLS policies.

### CRITICAL [RLS-025] Tautology or always-true expression detected

- **Table:** `doctors`
- **Policy:** `Doctors are viewable by everyone`
- **Description:** Policy contains an always-true expression (e.g., true, 1=1) that effectively disables row-level security for this operation.
- **Remediation:** Replace the always-true expression with a proper auth check: USING (auth.uid() = user_id) instead of USING (true)

### HIGH [RLS-008] Missing auth check in policy

- **Table:** `doctors`
- **Policy:** `Doctors are viewable by everyone`
- **Description:** Policy does not contain any authentication check (auth.uid(), auth.jwt(), auth.role()). All users may access all rows.
- **Remediation:** Add an authentication check to the policy: USING (auth.uid() = user_id) or WITH CHECK (auth.uid() = user_id)

### MEDIUM [RLS-020] Policy uses IN with subquery joining source table

- **Table:** `doctors`
- **Policy:** `Clinic providers can manage doctors`
- **Description:** Policy uses IN with a subquery that joins to the source table. This causes performance issues.
- **Remediation:** Rewrite to avoid join: col IN (SELECT col FROM table WHERE user_id = auth.uid()) instead of auth.uid() IN (SELECT user_id FROM table WHERE table.col = source.col)

### WARNING [RLS-015] Policy uses FOR ALL

- **Table:** `doctors`
- **Policy:** `Clinic providers can manage doctors`
- **Description:** Policy uses FOR ALL which applies to all operations. This may be too broad for security requirements.
- **Remediation:** Consider creating separate policies for each operation (SELECT, INSERT, UPDATE, DELETE) for more granular control.
