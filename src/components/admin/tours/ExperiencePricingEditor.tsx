import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExperiencePricing, ExperiencePricingOption } from '@/hooks/useExperiencePricing';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  experienceId: string;
}

interface PricingRow {
  id?: string;
  price_name: string;
  price_type: string;
  min_pax: number | null;
  max_pax: number | null;
  price_thb: number;
  price_notes: string;
}

const emptyRow = (): PricingRow => ({
  price_name: '',
  price_type: 'per_person',
  min_pax: null,
  max_pax: null,
  price_thb: 0,
  price_notes: '',
});

export function ExperiencePricingEditor({ experienceId }: Props) {
  const { data: existing = [], isLoading } = useExperiencePricing(experienceId);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing.length > 0) {
      setRows(existing.map(e => ({
        id: e.id,
        price_name: e.price_name,
        price_type: e.price_type,
        min_pax: e.min_pax,
        max_pax: e.max_pax,
        price_thb: e.price_thb,
        price_notes: e.price_notes || '',
      })));
    } else if (!isLoading) {
      setRows([emptyRow()]);
    }
  }, [existing, isLoading]);

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof PricingRow, value: unknown) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const save = async () => {
    const valid = rows.filter(r => r.price_name.trim() && r.price_thb > 0);
    if (valid.length === 0) {
      toast.error('Add at least one pricing option');
      return;
    }
    setSaving(true);
    try {
      // Delete all existing
      await supabase.from('experience_pricing').delete().eq('experience_id', experienceId);
      // Insert new
      const { error } = await supabase.from('experience_pricing').insert(
        valid.map(r => ({
          experience_id: experienceId,
          price_name: r.price_name,
          price_type: r.price_type,
          min_pax: r.min_pax,
          max_pax: r.max_pax,
          price_thb: r.price_thb,
          price_notes: r.price_notes || null,
        }))
      );
      if (error) throw error;
      toast.success('Pricing saved');
      queryClient.invalidateQueries({ queryKey: ['experience-pricing', experienceId] });
    } catch (err) {
      toast.error('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading pricing...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Pricing Options</Label>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded-none p-2">
          <div className="col-span-3">
            <Label className="text-xs">Name</Label>
            <Input
              value={row.price_name}
              onChange={e => updateRow(idx, 'price_name', e.target.value)}
              placeholder="Adult"
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Type</Label>
            <Select value={row.price_type} onValueChange={v => updateRow(idx, 'price_type', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="per_person">Per person</SelectItem>
                <SelectItem value="per_child">Per child</SelectItem>
                <SelectItem value="per_group">Per group</SelectItem>
                <SelectItem value="per_day">Per day</SelectItem>
                <SelectItem value="addon">Add-on</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">THB</Label>
            <Input
              type="number"
              value={row.price_thb || ''}
              onChange={e => updateRow(idx, 'price_thb', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-4">
            <Label className="text-xs">Notes</Label>
            <Input
              value={row.price_notes}
              onChange={e => updateRow(idx, 'price_notes', e.target.value)}
              className="h-8 text-sm"
              placeholder="Optional notes"
            />
          </div>
          <div className="col-span-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeRow(idx)}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Button onClick={save} disabled={saving} size="sm">
        {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        Save Pricing
      </Button>
    </div>
  );
}
