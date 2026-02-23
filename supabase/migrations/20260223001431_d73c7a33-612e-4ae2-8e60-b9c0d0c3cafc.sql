-- Add UPDATE and DELETE policies for agent_deal_activities
CREATE POLICY "Company members can update their own activities"
ON public.agent_deal_activities
FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_deals d
    WHERE d.id = agent_deal_activities.deal_id
    AND is_company_member(auth.uid(), d.company_id)
  )
);

CREATE POLICY "Company members can delete their own activities"
ON public.agent_deal_activities
FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_deals d
    WHERE d.id = agent_deal_activities.deal_id
    AND is_company_member(auth.uid(), d.company_id)
  )
);