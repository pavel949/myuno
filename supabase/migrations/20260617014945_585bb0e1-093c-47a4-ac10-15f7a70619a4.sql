
-- Step 5: tighten realtime topic policy — drop public:% wildcard, keep only user:{uid} scoped channels
DROP POLICY IF EXISTS "Authenticated users subscribe to own + public channels" ON realtime.messages;

CREATE POLICY "Authenticated users subscribe to own user channel"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('user:' || (auth.uid())::text)
    OR realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%')
  );
