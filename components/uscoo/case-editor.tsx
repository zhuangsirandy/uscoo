'use client';
import Link from 'next/link';
import { useI18n } from './language';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CRITERIA, GATES, type RecordItem } from '@/lib/case-domain';
export function Choice({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (s: string) => void;
  label?: string;
}) {
  const { t, f } = useI18n();
  return (
    <Select
      value={value || null}
      onValueChange={(v) => onChange(String(v || ''))}
    >
      <SelectTrigger
        className="w-full min-h-11 text-sm"
        aria-label={t(label || '选择')}
      >
        <SelectValue>
          {t(options.find((x) => x[0] === value)?.[1] || '请选择')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {t(
          options.map(([id, title]) => (
            <SelectItem key={id} value={id}>
              {t(title)}
            </SelectItem>
          )),
        )}
      </SelectContent>
    </Select>
  );
}
export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  children: React.ReactNode;
}) {
  const { t, f } = useI18n();
  return (
    <label className="check-line">
      <Checkbox checked={checked} onCheckedChange={(x) => onChange(!!x)} />
      <span>{t(children)}</span>
    </label>
  );
}
const states = [
  ['lead', '待核验'],
  ['reviewed', '已核对摘录'],
  ['conflict', '存在冲突'],
  ['unsupported', '目前不支持'],
  ['withdrawn', '已撤回'],
] as const;
export const STATE_LABEL: Record<string, string> = {
  lead: '待核验',
  reviewed: '已核对',
  conflict: '存在冲突',
  unsupported: '目前不支持',
  withdrawn: '已撤回',
  todo: '待开始',
  doing: '处理中',
  waiting: '等待回复',
  done: '已完成',
  cancelled: '已取消',
  working: '起草中',
  canonical: '已定稿',
  frozen: '已冻结',
};
const filingOptions = [
  ['prepared', '已打印 / 备妥'],
  ['dispatched', '已寄出'],
  ['delivered', '承运商已送达'],
  ['received', 'USCIS 已受理'],
  ['processing', 'USCIS 审理中'],
  ['rfe', 'USCIS RFE 补件'],
  ['noid', 'USCIS NOID 拟拒'],
  ['approved', 'I-129 已批准'],
  ['denied', 'USCIS 拒绝'],
  ['returned', 'USCIS 退件'],
  ['interview', '领馆面谈'],
  ['221g', '领馆 221(g)'],
  ['visa', '签证已签发'],
  ['entry', '已入境'],
  ['i94', '核对 I-94'],
  ['work-change', '工作 / 公司变化'],
  ['renewal', '续期准备'],
] as const;
export function RecordEditor({
  item,
  records,
  projectId,
  error,
  busy,
  onClose,
  onSave,
  onHistory,
  extracted,
}: {
  item: {
    kind: string;
    id?: string;
    body: any;
  };
  records: RecordItem[];
  projectId: string;
  error: string;
  busy: boolean;
  onClose: () => void;
  onSave: (body: any) => void;
  onHistory: (id: string) => void;
  extracted?: string;
}) {
  const { t, f } = useI18n();
  const [b, setB] = useState<any>(() => ({
    title: '',
    notes: '',
    sourceIds: [],
    criteria: [],
    ...(item.kind === 'event' ? { confirmed: false, hypothesis: false } : {}),
    ...(item.kind === 'evidence'
      ? {
          status: 'lead',
          independence: 'unknown',
          translation: 'needed',
          extraction: 'manual',
          authenticity: 'unverified',
          modelAllowed: false,
          confirmed: false,
          excerpt: extracted || '',
        }
      : {}),
    ...(item.kind === 'task'
      ? { track: 'evidence', state: 'todo', dependsOn: [] }
      : {}),
    ...(item.kind === 'document'
      ? { state: 'working', confirmed: false, reviewedFacts: false }
      : {}),
    ...(item.kind === 'gate'
      ? { result: '', source: '', version: '', basis: '', confirmed: false }
      : {}),
    ...(item.kind === 'filing'
      ? {
          event: 'prepared',
          date: new Date().toISOString().slice(0, 10),
          confirmed: false,
          deadlineConfirmed: false,
        }
      : {}),
    ...item.body,
  }));
  const set = (key: string, value: any) =>
    setB((old: any) => ({ ...old, [key]: value }));
  const field = (
    key: string,
    title: string,
    multi = false,
    type = 'text',
    help?: string,
  ) => (
    <label className="field" key={key}>
      <span>{t(title)}</span>
      {t(
        multi ? (
          <Textarea
            value={b[key] || ''}
            onChange={(e) => set(key, e.target.value)}
            rows={key === 'content' ? 20 : key === 'excerpt' ? 10 : 3}
          />
        ) : (
          <Input
            type={type}
            value={b[key] || ''}
            onChange={(e) => set(key, e.target.value)}
          />
        ),
      )}
      {t(' ')}
      {t(help && <small>{t(help)}</small>)}
    </label>
  );
  const sources = records.filter(
    (r) => r.kind === 'evidence' && r.id !== item.id,
  );
  const toggle = (key: string, id: string, value: boolean) =>
    set(
      key,
      value
        ? [...new Set([...(b[key] || []), id])]
        : (b[key] || []).filter((x: string) => x !== id),
    );
  const clean = () => {
    const copy = { ...b };
    if (!['event', 'evidence'].includes(item.kind)) delete copy.criteria;
    for (const k of [
      'file',
      'replaces',
      'stale',
      'generatedAt',
      'profileRevision',
    ])
      delete copy[k];
    if (item.kind === 'gate') {
      const note = [
        ['实际结果', b.result],
        ['核对出处', b.source],
        ['版本或费用', b.version],
        ['授权依据', b.basis],
      ]
        .filter(([, value]) => String(value || '').trim())
        .map(([label, value]) => `${label}：${String(value).trim()}`)
        .join('\n');
      return {
        gate: b.gate,
        confirmed: !!b.confirmed,
        result: b.result || '',
        source: b.source || '',
        version: b.version || '',
        basis: b.basis || '',
        note: note || b.note || '',
        reviewedOn: b.reviewedOn || new Date().toISOString().slice(0, 10),
        sourceIds: b.sourceIds || [],
      };
    }
    if (item.kind === 'consent')
      return { purpose: 'research', granted: !!b.granted };
    return copy;
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="editor-dialog max-h-[92vh] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>
            {t(item.id ? '核对与修改' : '添加')}
            {t(
              (
                {
                  event: '经历',
                  evidence: '材料',
                  task: '任务',
                  document: '文档',
                  gate: '递交检查',
                  filing: '案件事件',
                  comment: '批注',
                } as any
              )[item.kind],
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              item.kind === 'evidence'
                ? '保留原件，明确这段材料能支持什么。'
                : '保存后会留下修改记录；影响申请内容的变化需要重新核对。',
            )}
          </DialogDescription>
        </DialogHeader>
        {t(
          error && (
            <div className="notice error" role="alert">
              {t(error)}
            </div>
          ),
        )}
        {t(
          item.kind === 'evidence' && item.body.file && (
            <div className="source-file">
              <div>
                <strong>{t(item.body.file.name)}</strong>
                <p>
                  {t((item.body.file.size / 1024).toFixed(0))}
                  {t('KB \u00B7 原件已保存')}
                </p>
              </div>
              <a
                href={`/api/uscoo/projects/${projectId}/files/${item.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('下载原件 \u2197')}
              </a>
              {t(
                ['application/pdf', 'image/png', 'image/jpeg'].includes(
                  item.body.file.mime,
                ) && (
                  <a
                    href={`/api/uscoo/projects/${projectId}/files/${item.id}?inline=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('并排打开原件 \u2197')}
                  </a>
                ),
              )}
            </div>
          ),
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(clean());
          }}
        >
          {t(item.kind !== 'gate' && field('title', '标题'))}
          {t(
            item.kind === 'event' && (
              <>
                <div className="form-grid">
                  {t(field('date', '发生时间'))}
                  {t(field('role', '你当时的角色'))}
                </div>
                {t(field('action', '你本人具体做了什么？', true))}
                {t(field('result', '后来产生了什么结果？', true))}
                {t(field('team', '团队完成了哪些部分？', true))}
                <Check
                  checked={!!b.hypothesis}
                  onChange={(v) => set('hypothesis', v)}
                >
                  {t('这是一项推测或反事实，不作为已发生事实')}
                </Check>
                <Check
                  checked={!!b.confirmed}
                  onChange={(v) => set('confirmed', v)}
                >
                  {t('我已核对这段经历的事实与个人贡献边界')}
                </Check>
              </>
            ),
          )}
          {t(
            item.kind === 'evidence' && (
              <>
                <div className="form-grid">
                  {t(field('issuer', '出具人 / 机构'))}
                  {t(field('date', '材料日期'))}
                  {t(
                    field(
                      'page',
                      '原文页码 / 段落',
                      false,
                      'text',
                      '如：第 2 页第 3 段；DOCX 可写章节与段落',
                    ),
                  )}
                  {t(field('url', '来源网址（如有）'))}
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>{t('材料语言')}</span>
                    <Choice
                      value={b.language || '中文'}
                      options={[
                        ['中文', '中文'],
                        ['英文', '英文'],
                        ['其他', '其他'],
                      ]}
                      onChange={(v) => set('language', v)}
                    />
                  </label>
                  <label className="field">
                    <span>{t('来源关系')}</span>
                    <Choice
                      value={b.independence}
                      options={[
                        ['independent', '独立第三方'],
                        ['related', '有关联的第三方'],
                        ['self', '本人 / 本公司'],
                        ['unknown', '待确认'],
                      ]}
                      onChange={(v) => set('independence', v)}
                    />
                  </label>
                </div>
                {t(
                  field(
                    'excerpt',
                    '逐字摘录与页段',
                    true,
                    'text',
                    '文字提取未核验真伪。扫描件请对照原页手工录入；系统目前未启用 OCR。',
                  ),
                )}
                <Check
                  checked={!!b.confirmed}
                  onChange={(v) => set('confirmed', v)}
                >
                  {t('我已对照原件核对摘录、数字和页段')}
                </Check>
                <div className="form-grid">
                  <label className="field">
                    <span>{t('当前判断')}</span>
                    <Choice
                      value={b.status}
                      options={states}
                      onChange={(v) => set('status', v)}
                    />
                  </label>
                  <label className="field">
                    <span>{t('真实性核查')}</span>
                    <Choice
                      value={b.authenticity}
                      options={[
                        ['unverified', '尚未独立核实'],
                        ['checked', '已另行核实来源'],
                        ['concern', '存在疑问'],
                      ]}
                      onChange={(v) => set('authenticity', v)}
                    />
                  </label>
                  <label className="field">
                    <span>{t('翻译状态')}</span>
                    <Choice
                      value={b.translation}
                      options={[
                        ['not-needed', '无需翻译'],
                        ['needed', '待翻译'],
                        ['draft', '已有译文，待核对'],
                        ['certified', '真实译者已签署认证'],
                      ]}
                      onChange={(v) => set('translation', v)}
                    />
                  </label>
                </div>
                <Check
                  checked={!!b.modelAllowed}
                  onChange={(v) => set('modelAllowed', v)}
                >
                  {t(
                    '允许分析这份材料的摘录；我已先删除其中的证件号、签名、地址及银行信息',
                  )}
                </Check>
              </>
            ),
          )}
          {t(
            ['event', 'evidence'].includes(item.kind) && (
              <fieldset className="criteria-picker">
                <legend>{t('可能相关的标准（只记录方向）')}</legend>
                {t(
                  CRITERIA.map((k) => (
                    <Check
                      key={k.id}
                      checked={(b.criteria || []).includes(k.id)}
                      onChange={(v) => toggle('criteria', k.id, v)}
                    >
                      {t(k.title)}
                    </Check>
                  )),
                )}
              </fieldset>
            ),
          )}
          {t(
            item.kind === 'task' && (
              <>
                <div className="form-grid">
                  <label className="field">
                    <span>{t('路线')}</span>
                    <Choice
                      value={b.track}
                      options={[
                        ['company', '公司准备'],
                        ['evidence', '个人材料'],
                      ]}
                      onChange={(v) => set('track', v)}
                    />
                  </label>
                  <label className="field">
                    <span>{t('状态')}</span>
                    <Choice
                      value={b.state}
                      options={[
                        ['todo', '待开始'],
                        ['doing', '处理中'],
                        ['waiting', '等待回复'],
                        ['done', '已完成'],
                        ['cancelled', '已取消'],
                      ]}
                      onChange={(v) => set('state', v)}
                    />
                  </label>
                  {t(
                    b.owner && b.owner !== '本人'
                      ? field('owner', '负责人')
                      : null,
                  )}
                  {t(field('due', '到期日期', false, 'date'))}
                  {t(field('cost', '费用 / 是否已支付'))}
                  {t(field('hours', '预计本人用时（自行估计）'))}
                  {t(field('basis', '要求依据：法定 / 表格 / 个案 / 经营'))}
                  {t(field('url', '官方或服务机构链接'))}
                </div>
                {t(field('receipt', '完成凭证或等待情况', true))}
                <details>
                  <summary>{t('依赖任务')}</summary>
                  {t(
                    records
                      .filter((x) => x.kind === 'task' && x.id !== item.id)
                      .map((r) => (
                        <Check
                          key={r.id}
                          checked={(b.dependsOn || []).includes(r.id)}
                          onChange={(v) => toggle('dependsOn', r.id, v)}
                        >
                          {t(r.body.title)}
                        </Check>
                      )),
                  )}
                </details>
              </>
            ),
          )}
          {t(
            item.kind === 'document' && (
              <>
                {t(field('content', '文档正文', true))}
                <label className="field">
                  <span>{t('文档状态')}</span>
                  <Choice
                    value={b.state}
                    options={[
                      ['working', '起草中'],
                      ['reviewed', '已复核，待定稿'],
                      ['canonical', '确认定稿'],
                    ]}
                    onChange={(v) => set('state', v)}
                  />
                </label>
                <Check
                  checked={!!b.reviewedFacts}
                  onChange={(v) => set('reviewedFacts', v)}
                >
                  {t('我已逐项核对事实、数字、引用与适用条款')}
                </Check>
                <Check
                  checked={!!b.confirmed}
                  onChange={(v) => set('confirmed', v)}
                >
                  {t('所有待补内容已处理；需要的专业复核已完成')}
                </Check>
              </>
            ),
          )}
          {t(
            item.kind === 'gate' && (
              <>
                <h3>{t(GATES.find((g) => g[0] === b.gate)?.[1])}</h3>
                <p>{t(GATES.find((g) => g[0] === b.gate)?.[2])}</p>
                <div className="form-grid gate-fields">
                  {t(field('result', '实际核对结果'))}
                  {t(field('source', '核对出处或凭证'))}
                  {t(field('version', '表格版本或费用金额'))}
                  {t(field('basis', '签字人或授权依据'))}
                </div>
                {t(field('reviewedOn', '实际核验日', false, 'date'))}
                <Check
                  checked={!!b.confirmed}
                  onChange={(v) => set('confirmed', v)}
                >
                  {t('我已完成这项核验，并关联了核验凭证')}
                </Check>
              </>
            ),
          )}
          {t(
            item.kind === 'filing' && (
              <>
                <label className="field">
                  <span>{t('事件类型')}</span>
                  <Choice
                    value={b.event}
                    options={filingOptions}
                    onChange={(v) => set('event', v)}
                  />
                </label>
                <div className="form-grid">
                  {t(field('date', '发生日期', false, 'date'))}
                  {t(field('reference', '追踪号 / 收据号 / 参考信息'))}
                  {t(
                    field('deadline', '通知上的截止日（如有）', false, 'date'),
                  )}
                </div>
                <label className="field">
                  <span>{t('对应的实际申请包')}</span>
                  <Choice
                    value={b.packetId || 'none'}
                    options={[
                      ['none', '暂未关联'],
                      ...records
                        .filter((r) => r.kind === 'packet')
                        .map((r) => [r.id, r.body.title] as const),
                    ]}
                    onChange={(v) => set('packetId', v === 'none' ? '' : v)}
                  />
                </label>
                <Check
                  checked={!!b.deadlineConfirmed}
                  onChange={(v) => set('deadlineConfirmed', v)}
                >
                  {t('如填写了期限，我已对照通知原文核对')}
                </Check>
                <Check
                  checked={!!b.confirmed}
                  onChange={(v) => set('confirmed', v)}
                >
                  {t('我已核对事件、凭证和实际包版本；打印不等于寄出或受理')}
                </Check>
              </>
            ),
          )}
          {t(
            item.kind !== 'gate' &&
              field(
                'notes',
                item.kind === 'filing'
                  ? '通知逐项要求 / 处理记录'
                  : '具体问题、补充信息与下一步',
                true,
              ),
          )}
          <details className="source-picker" open={item.kind === 'gate'}>
            <summary>
              {t('关联原始来源 \u00B7')}
              {t((b.sourceIds || []).length)}
              {t('份')}
            </summary>
            {t(
              sources.length ? (
                sources.map((r) => (
                  <Check
                    key={r.id}
                    checked={(b.sourceIds || []).includes(r.id)}
                    onChange={(v) => toggle('sourceIds', r.id, v)}
                  >
                    {t(r.body.title)}
                    {t(' ')}
                    <small>· {t(STATE_LABEL[r.body.status] || '待核验')}</small>
                  </Check>
                ))
              ) : (
                <p>
                  {t(
                    '先到\u201C双轨准备\u201D上传原件，或添加有网址与页段的来源记录。',
                  )}
                </p>
              ),
            )}
          </details>
          <div className="editor-actions">
            {t(
              item.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onHistory(item.id!)}
                >
                  {t('查看修订记录')}
                </Button>
              ),
            )}
            <span />
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              {t('取消')}
            </Button>
            <Button type="submit" disabled={busy}>
              {t(busy ? '正在保存…' : '保存并更新项目')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
