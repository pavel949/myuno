> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Agent Knowledge Versioning
## Content Management System for Agent Prompts

---

## Database Schema

### ai_agents Table
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,        -- 'support-chat'
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,                        -- Lucide icon name
  model TEXT DEFAULT 'google/gemini-3-flash-preview',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  tone TEXT,                        -- 'professional', 'friendly', 'concise'
  target_audience TEXT[],           -- ['user', 'guest', 'owner']
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ai_agent_knowledge Table
```sql
CREATE TABLE ai_agent_knowledge (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,         -- Auto-increment per agent
  system_prompt TEXT NOT NULL,      -- The actual prompt
  knowledge_base TEXT,              -- Injected via {{KNOWLEDGE_BASE}}
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agent_id, version)
);
```

---

## Version Lifecycle

```
┌─────────┐     ┌─────────┐     ┌───────────┐     ┌────────────┐
│  DRAFT  │────▶│ TESTING │────▶│ PUBLISHED │────▶│ SUPERSEDED │
└─────────┘     └─────────┘     └───────────┘     └────────────┘
     │               │                │                  │
     │               │                │                  │
   Create         Preview          Live             Archived
   Version         Mode           Traffic            (Read-only)
```

### State Definitions

| State | is_published | published_at | Usage |
|-------|--------------|--------------|-------|
| Draft | false | null | Being edited |
| Testing | false | null | Preview only |
| Published | true | timestamp | Live traffic |
| Superseded | false | timestamp (historical) | Archived |

---

## Version Management Rules

### Rule 1: Single Published Version
Only one version per agent can have `is_published = true`.
Publishing a new version automatically unpublishes the previous.

```sql
-- Publishing trigger
CREATE OR REPLACE FUNCTION publish_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    -- Unpublish all other versions
    UPDATE ai_agent_knowledge 
    SET is_published = false 
    WHERE agent_id = NEW.agent_id AND id != NEW.id;
    
    -- Set published timestamp
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Rule 2: Auto-Increment Version
New versions get the next version number automatically.

```sql
-- Version auto-increment
CREATE OR REPLACE FUNCTION next_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
  FROM ai_agent_knowledge
  WHERE agent_id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Rule 3: Immutable Published Versions
Once published, a version cannot be edited (create new version instead).

```sql
-- Prevent editing published versions
CREATE OR REPLACE FUNCTION prevent_edit_published()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_published = true AND (
    OLD.system_prompt != NEW.system_prompt OR 
    OLD.knowledge_base != NEW.knowledge_base
  ) THEN
    RAISE EXCEPTION 'Cannot edit published version. Create a new version instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Admin Workflow

### Creating a New Version

```typescript
// 1. Fetch current published version as template
const { data: current } = await supabase
  .from('ai_agent_knowledge')
  .select('*')
  .eq('agent_id', agentId)
  .eq('is_published', true)
  .single();

// 2. Create new draft version
const { data: draft } = await supabase
  .from('ai_agent_knowledge')
  .insert({
    agent_id: agentId,
    system_prompt: current?.system_prompt || '',
    knowledge_base: current?.knowledge_base || '',
    created_by: userId,
    // version is auto-generated
    // is_published defaults to false
  })
  .select()
  .single();

// 3. Navigate to editor
navigate(`/admin/ai-agents/${agentId}/knowledge/${draft.id}`);
```

### Testing a Draft

```typescript
// Call ai-agent with version override (admin only)
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    agentSlug: 'support-chat',
    messages: testMessages,
    // Admin-only: override version for testing
    _testVersion: draftVersionId,
  }),
});
```

### Publishing a Version

```typescript
// Publish (automatically unpublishes previous)
const { error } = await supabase
  .from('ai_agent_knowledge')
  .update({ is_published: true })
  .eq('id', versionId);

if (!error) {
  toast.success('Version published successfully');
}
```

### Rolling Back

```typescript
// Republish a previous version
const { error } = await supabase
  .from('ai_agent_knowledge')
  .update({ is_published: true })
  .eq('id', previousVersionId);

// This automatically unpublishes current version
```

---

## Version History UI

### List View

| Version | Created | Author | Status | Actions |
|---------|---------|--------|--------|---------|
| v3 | 2 hours ago | admin@uno.com | 🟢 Published | View |
| v2 | 3 days ago | admin@uno.com | Superseded | View, Republish |
| v1 | 1 week ago | admin@uno.com | Superseded | View, Republish |

### Diff View

Compare any two versions side-by-side:

```
┌─────────────────────────────┬─────────────────────────────┐
│ Version 2                   │ Version 3                   │
├─────────────────────────────┼─────────────────────────────┤
│ Ты — myUNO Assistant...     │ Ты — myUNO Assistant...     │
│                             │                             │
│ - Помощь с бронированием    │ + Помощь с бронированием    │
│                             │ + туров и экскурсий         │
│                             │                             │
│ Контакты: WhatsApp          │ Контакты: WhatsApp          │
│ +66922407355                │ +66922407355                │
└─────────────────────────────┴─────────────────────────────┘
```

---

## Best Practices

### Prompt Structure

```markdown
# System Prompt Template

## Identity
[Who the agent is]

## Capabilities
[What the agent can do]

## Rules
[Behavioral constraints]

## Knowledge Injection Point
{{KNOWLEDGE_BASE}}

## Language Preference
Respond in: {{LANGUAGE}}
```

### Knowledge Base Structure

```markdown
# Platform Information
[Facts about UNO]

# FAQ
Q: [Question]
A: [Answer]

# Services
- [Category]: [Description]

# Contact
[Support channels]
```

### Change Documentation

When publishing a new version, add a comment explaining what changed:

```typescript
await supabase.from('ai_agent_knowledge').insert({
  ...newVersion,
  // Store change notes in a separate audit table or metadata
});

// Log the change
await supabase.from('admin_audit_logs').insert({
  action: 'ai_agent_knowledge_published',
  entity_type: 'ai_agent_knowledge',
  entity_id: versionId,
  new_data: { version: newVersion.version, change_notes: 'Added TM30 FAQ' },
  admin_id: userId,
});
```