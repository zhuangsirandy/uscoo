'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from './language';
import type { CaseData } from '@/lib/case-domain';
export default function PreparationChoice({
  data,
  onData,
}: {
  data: CaseData;
  onData: (next: CaseData) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function choose(mode: 'diy' | 'counsel') {
    if (data.project.profile.preparationMode === mode) {
      if (mode === 'counsel')
        document
          .getElementById('counsel-package')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else
        window.location.assign(
          `/prepare?project=${encodeURIComponent(data.project.id)}&step=path`,
        );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const base = `/api/uscoo/projects/${data.project.id}`;
      const r = await fetch(base + '/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revision: data.project.revision,
          profile: { ...data.project.profile, preparationMode: mode },
        }),
      });
      const b = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(b.error || t('操作未完成，请重试。'));
      if (mode === 'diy') {
        window.location.assign(
          `/prepare?project=${encodeURIComponent(data.project.id)}&step=path`,
        );
        return;
      }

      // This selection stays on the same page. Reload the project state before
      // revealing the counsel package; a same-document hash navigation alone
      // leaves React rendering the previous choice and looks like a frozen page.
      const refreshed = await fetch(base, { cache: 'no-store' });
      const next = (await refreshed.json()) as CaseData & { error?: string };
      if (!refreshed.ok)
        throw Error(next.error || t('已保存选择，但页面刷新失败，请重试。'));
      onData(next);
      window.history.replaceState(
        null,
        '',
        `/lawyer?project=${encodeURIComponent(data.project.id)}#counsel-package`,
      );
      setBusy(false);
      window.setTimeout(
        () =>
          document
            .getElementById('counsel-package')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        0,
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section
      className="journey-decision"
      id="preparation-options"
      aria-busy={busy}
    >
      <p className="founder-eyebrow">
        {t('第 5 步 · 申请方式', 'Step 5 · Application method')}
      </p>
      <h2>
        {t(
          '选择自主申请，或委托律所。',
          'Choose self-filing or work with a law firm.',
        )}
      </h2>
      <p>
        {t(
          '律所不是必经环节。两种方式都使用同一份项目记录，后续可以切换；选择律所后，系统才生成并开放律所沟通资料包与分享链接。',
          'A law firm is not a required product step. Both methods use the same project record and you can switch later. The counsel brief and sharing tools open only after you choose law firm collaboration.',
        )}
      </p>
      <div className="founder-dual">
        <article data-selected={data.project.profile.preparationMode === 'diy'}>
          <span className="method-label">
            {data.project.profile.preparationMode === 'diy'
              ? t('当前选择', 'Current choice')
              : t('方式 A', 'Method A')}
          </span>
          <h3>{t('自主申请', 'Self-filing')}</h3>
          <p>
            {t(
              '由你确认事实、内容和最终签字；USCOO 工作台帮助你管理清单、证据来源、材料版本、组卷与申请进度。处理到需要深入核对的材料时，再选择 Agent 协助即可。',
              'You control the facts, approvals and signatures. The USCOO workspace helps manage checklists, evidence sources, document versions, packaging and progress. Optional assistance can be selected later at the relevant work step.',
            )}
          </p>
          <Button disabled={busy} onClick={() => choose('diy')}>
            {busy
              ? t('正在切换…', 'Switching…')
              : data.project.profile.preparationMode === 'diy'
                ? t('进入 O-1A 工作台', 'Open O-1A workspace')
                : t('选择自主申请', 'Choose self-filing')}
          </Button>
        </article>
        <article
          data-selected={data.project.profile.preparationMode === 'counsel'}
        >
          <span className="method-label">
            {data.project.profile.preparationMode === 'counsel'
              ? t('当前选择', 'Current choice')
              : t('方式 B', 'Method B')}
          </span>
          <h3>{t('委托律所', 'Work with a law firm')}</h3>
          <p>
            {t(
              '选择后生成八节律所沟通包，可预览、下载或按章节生成只读分享链接。你自行联系并委托律所；USCOO 继续作为材料备份、协作记录和进度系统。',
              'After selection, USCOO creates an eight-section counsel brief for preview, download, or selected-section read-only sharing. You contact and retain the firm; USCOO remains the material backup, collaboration record and progress system.',
            )}
          </p>
          <Button disabled={busy} onClick={() => choose('counsel')}>
            {busy
              ? t('正在切换…', 'Switching…')
              : data.project.profile.preparationMode === 'counsel'
                ? t('查看或生成律所资料包', 'Open counsel brief')
                : t('选择委托律所', 'Choose a law firm')}
          </Button>
        </article>
      </div>
      <p>
        {t(
          '选择申请方式不会删除已有材料，也不会自动向外发送、签署或递交任何内容。',
          'Choosing a method does not delete records or automatically send, sign or file anything.',
        )}
      </p>
      {error && (
        <p role="alert" className="founder-error">
          {t(error)}
        </p>
      )}
    </section>
  );
}
