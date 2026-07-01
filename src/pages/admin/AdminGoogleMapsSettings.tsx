/**
 * Google Maps — Settings
 * /admin/settings/google-maps
 *
 * Позволяет ввести и сохранить собственный Google Maps API key для myuno.app.
 * Ключ хранится в public.system_config (key='GOOGLE_MAPS_API_KEY') и подхватывается
 * runtime-кодом (src/lib/googleMaps.ts) через fetchGoogleMapsKey().
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ExternalLink, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CONFIG_KEY = 'GOOGLE_MAPS_API_KEY';
const KEY_REGEX = /^AIza[0-9A-Za-z_-]{20,}$/;

const MASK = (v: string) => (v.length < 12 ? '***' : `${v.slice(0, 6)}…${v.slice(-4)} (len=${v.length})`);

export default function AdminGoogleMapsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [reveal, setReveal] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_config')
      .select('value, updated_at')
      .eq('key', CONFIG_KEY)
      .maybeSingle();
    if (error) {
      toast.error(`Не удалось загрузить: ${error.message}`);
    } else if (data) {
      setCurrentValue(data.value ?? '');
      setUpdatedAt(data.updated_at ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const validFormat = input.length === 0 || KEY_REGEX.test(input.trim());

  const save = async () => {
    const value = input.trim();
    if (!value) {
      toast.error('Введите ключ');
      return;
    }
    if (!KEY_REGEX.test(value)) {
      toast.error('Ключ не похож на Google API key (должен начинаться с AIza…)');
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('system_config')
      .upsert(
        {
          key: CONFIG_KEY,
          value,
          updated_by: userRes.user?.id ?? null,
          description: 'Custom Google Maps API key for myuno.app custom domain (see /admin/diagnostics/google-maps).',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );
    setSaving(false);
    if (error) {
      toast.error(`Ошибка сохранения: ${error.message}`);
      return;
    }
    toast.success('Ключ сохранён. Перезагрузите страницы с картами, чтобы применить.');
    setInput('');
    await load();
  };

  const clear = async () => {
    if (!confirm('Удалить сохранённый ключ? Приложение вернётся к env-переменной / managed key.')) return;
    setSaving(true);
    const { error } = await supabase.from('system_config').delete().eq('key', CONFIG_KEY);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Ключ удалён');
    setCurrentValue('');
    setUpdatedAt(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Google Maps — Настройки ключа</h1>
        <p className="text-sm text-muted-foreground">
          Собственный API-ключ для custom-домена (<code>myuno.app</code>). Ключ хранится в{' '}
          <code>public.system_config</code> и загружается на клиенте через{' '}
          <code>fetchGoogleMapsKey()</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Текущий сохранённый ключ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
            </div>
          ) : currentValue ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Значение</span>
                <span className="flex items-center gap-2 font-mono text-xs">
                  <span>{reveal ? currentValue : MASK(currentValue)}</span>
                  <button
                    onClick={() => setReveal((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="reveal"
                  >
                    {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Обновлён</span>
                <span className="font-mono text-xs">
                  {updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Формат</span>
                {KEY_REGEX.test(currentValue) ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> AIza… OK
                  </Badge>
                ) : (
                  <Badge variant="destructive">не похож на Google key</Badge>
                )}
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={clear} disabled={saving}>
                  Удалить сохранённый ключ
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Ключ ещё не сохранён — приложение использует env / managed key.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentValue ? 'Обновить ключ' : 'Сохранить ключ'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gmaps-key">API key</Label>
            <Input
              id="gmaps-key"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="AIzaSy…"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            {!validFormat && (
              <p className="text-xs text-destructive">
                Ожидается формат <code>AIza…</code> ≥ 24 символов.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Ключ должен быть создан в вашем Google Cloud проекте с включёнными Maps JavaScript API,
              Geocoding API, Places API (New) и добавленными HTTP-referrer'ами:{' '}
              <code>https://myuno.app/*</code>, <code>https://*.myuno.app/*</code>,{' '}
              <code>http://localhost:*/*</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving || !input.trim() || !validFormat}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Сохранить
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/diagnostics/google-maps">
                Открыть диагностику
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Как получить ключ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Google Cloud Console → Credentials
              </a>
              — создайте API key в проекте с включённым биллингом.
            </li>
            <li>
              <strong>API restrictions:</strong> Maps JavaScript API, Geocoding API, Places API (New).
            </li>
            <li>
              <strong>Website restrictions (HTTP referrers):</strong> <code>https://myuno.app/*</code>,{' '}
              <code>https://www.myuno.app/*</code>, <code>https://*.myuno.app/*</code>,{' '}
              <code>http://localhost:*/*</code>.
            </li>
            <li>Скопируйте ключ (<code>AIza…</code>) и вставьте в поле выше.</li>
            <li>После сохранения откройте диагностику и запустите Live-проверки.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
