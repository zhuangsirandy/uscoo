'use client';
import { useState } from 'react';
import { Link2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Choice } from './case-editor';
import { useI18n } from './language';
import { buildLawyerBrief } from '@/lib/lawyer-brief';
import type { CaseData } from '@/lib/case-domain';
export default function LawyerShare({
  data,
  onRefresh,
}: {
  data: CaseData;
  onRefresh: () => Promise<void>;
}) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState([0, 7]),
    [days, setDays] = useState('7'),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [url, setUrl] = useState(''),
    [message, setMessage] = useState('');
  const sections = buildLawyerBrief(data, language);
  const base = `/api/uscoo/projects/${data.project.id}`;
  async function create() {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(`${base}/lawyer-shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revision: data.project.revision,
          sections: selected,
          days: Number(days),
          confirmed: consent,
        }),
      });
      const b: any = await r.json();
      if (!r.ok)
        throw new Error(
          b.error ||
            t(
              '分享未完成，请重试。',
              'Unable to create the share. Please try again.',
            ),
        );
      setUrl(new URL(b.url, window.location.origin).href);
      await onRefresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    try {
      const r = await fetch(`${base}/shares/${id}`, { method: 'DELETE' });
      if (!r.ok)
        throw new Error(
          t(
            '撤回未完成，请重试。',
            'Unable to revoke this link. Please try again.',
          ),
        );
      setUrl('');
      await onRefresh();
      setMessage(t('链接已撤回。', 'The link has been revoked.'));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Link2 size={16} />
        {t('分享给律师', 'Share with counsel')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="founder-app share-dialog">
          <DialogHeader>
            <DialogTitle>
              {t(
                '先选择分享内容，再创建链接',
                'Choose what to share before creating a link',
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                '分享的是创建时的只读快照，不含原始文件或后续修改。持有链接并有本站访问权限的人可以查看；你可以随时撤回。',
                'Creates a read-only snapshot, excluding original files and later edits. Anyone with the link and site access can view it. You can revoke it at any time.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="share-section-options">
            {sections.map((s, i) => (
              <label key={s.title}>
                <Checkbox
                  checked={selected.includes(i)}
                  onCheckedChange={(v) => {
                    setSelected((old) =>
                      v ? [...old, i] : old.filter((x) => x !== i),
                    );
                    setConsent(false);
                  }}
                />
                <span>
                  {i + 1}. {t(s.title)}
                </span>
              </label>
            ))}
          </div>
          <label>
            {t('有效期', 'Link expires after')}
            <Choice
              value={days}
              onChange={setDays}
              options={[
                ['1', t('1 天', '1 day')],
                ['7', t('7 天', '7 days')],
                ['30', t('30 天', '30 days')],
              ]}
            />
          </label>
          <details className="share-preview">
            <summary>
              {t('预览实际分享的内容', 'Preview the exact shared content')}
            </summary>
            {sections
              .filter((_, i) => selected.includes(i))
              .map((s) => (
                <section key={s.title}>
                  <h3>{t(s.title)}</h3>
                  {s.items.length ? (
                    s.items.map((x, n) => (
                      <div key={n}>
                        <strong>{t(x.label)}</strong>
                        <small>{t(x.status)}</small>
                        <p>{t(x.detail)}</p>
                      </div>
                    ))
                  ) : (
                    <p>{t('尚无记录', 'No records yet')}</p>
                  )}
                </section>
              ))}
          </details>
          <label className="founder-consent">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
            />
            <span>
              {t(
                '我已检查选中章节，确认可以通过此链接分享。',
                'I reviewed the selected sections and approve sharing them through this link.',
              )}
            </span>
          </label>
          <p className="share-access-note">
            {t(
              '当前站点为私有内测。律师还需由站点所有者授予访问权限；创建链接不会自动开放整个站点。也可以下载资料后自行交接。',
              'This site is currently private. The site owner must also grant your lawyer access. Creating a link does not make the site public. You can also hand over a downloaded copy.',
            )}
          </p>
          <Button
            disabled={!selected.length || !consent || busy}
            onClick={create}
          >
            {busy
              ? t('正在处理…', 'Working…')
              : t('创建只读分享链接', 'Create read-only link')}
          </Button>
          {url && (
            <div className="share-url">
              <Input
                aria-label={t('分享链接', 'Share link')}
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setMessage(t('链接已复制。', 'Link copied.'));
                  } catch {
                    setMessage(
                      t(
                        '请选中链接后手动复制。',
                        'Select the link and copy it manually.',
                      ),
                    );
                  }
                }}
              >
                <Copy size={16} />
                {t('复制', 'Copy')}
              </Button>
            </div>
          )}
          {message && <p role="status">{t(message)}</p>}
          <div className="existing-shares">
            <h3>{t('已有分享', 'Existing links')}</h3>
            {data.shares
              .filter((s) => s.kind === 'lawyer')
              .map((s) => (
                <div key={s.id}>
                  <span>
                    {s.created.slice(0, 10)} · {t('到期', 'Expires')}{' '}
                    {s.expires.slice(0, 10)}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={
                      busy ||
                      !!s.revoked ||
                      s.expires < new Date().toISOString()
                    }
                    onClick={() => revoke(s.id)}
                  >
                    {s.revoked
                      ? t('已撤回', 'Revoked')
                      : s.expires < new Date().toISOString()
                        ? t('已过期', 'Expired')
                        : t('撤回链接', 'Revoke link')}
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
