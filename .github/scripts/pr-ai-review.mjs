const SURFACE_NAMES = ['接口', '认证', '鉴权', '权限', '数据', '文件', '配置', '依赖', 'CI'];
const RISK_LEVELS = new Map([
  ['P0', 'HIGH'],
  ['P1', 'MEDIUM'],
  ['P2', 'LOW'],
]);
const RISK_FIELDS = ['title', 'location', 'type', 'basis', 'path', 'impact', 'recommendation'];

export class ReviewGateError extends Error {}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReviewGateError(`${label} 必须是对象`);
  }
  return value;
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ReviewGateError(`${label} 必须是非空文本`);
  }
  return value.trim();
}

function requireTextArray(value, label) {
  if (!Array.isArray(value)) {
    throw new ReviewGateError(`${label} 必须是数组`);
  }
  return value.map((item, index) => requireText(item, `${label}[${index}]`));
}

function normalizeSurfaces(value) {
  const source = requireObject(value, 'sensitiveSurfaces');
  return Object.fromEntries(SURFACE_NAMES.map(name => {
    const item = requireObject(source[name], `sensitiveSurfaces.${name}`);
    const status = requireText(item.status, `sensitiveSurfaces.${name}.status`);
    if (!['涉及', '未涉及', '无法判断'].includes(status)) {
      throw new ReviewGateError(`sensitiveSurfaces.${name}.status 无效`);
    }
    return [name, { status, reason: requireText(item.reason, `sensitiveSurfaces.${name}.reason`) }];
  }));
}

function normalizeRisk(value, index) {
  const risk = requireObject(value, `risks[${index}]`);
  const level = requireText(risk.level, `risks[${index}].level`);
  if (!RISK_LEVELS.has(level)) {
    throw new ReviewGateError(`risks[${index}].level 无效`);
  }
  const normalized = { level };
  for (const field of RISK_FIELDS) {
    normalized[field] = requireText(risk[field], `risks[${index}].${field}`);
  }
  return normalized;
}

export function redact(value) {
  return String(value)
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/g, '[REDACTED]')
    .replace(/\b(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s'"`]+/gi, '$1=[REDACTED]');
}

export function validateReview(raw, context = {}) {
  const source = requireObject(raw, 'review');
  const requestedConclusion = requireText(source.conclusion, 'conclusion');
  if (!['PASS', 'BLOCK'].includes(requestedConclusion)) {
    throw new ReviewGateError('conclusion 只能是 PASS 或 BLOCK');
  }

  const risks = (Array.isArray(source.risks) ? source.risks : (() => { throw new ReviewGateError('risks 必须是数组'); })())
    .map(normalizeRisk);
  const technicalDebtCount = source.technicalDebtCount;
  if (!Number.isInteger(technicalDebtCount) || technicalDebtCount < 0) {
    throw new ReviewGateError('technicalDebtCount 必须是非负整数');
  }
  const debtCount = risks.filter(risk => risk.level === 'P1' || risk.level === 'P2').length;
  if (technicalDebtCount !== debtCount) {
    throw new ReviewGateError('technicalDebtCount 必须等于 P1/P2 风险数量');
  }

  const hasP0 = risks.some(risk => risk.level === 'P0');
  const insufficientSensitiveEvidence = context.sensitiveChanged === true && context.evidenceForSensitivePath !== true;
  return {
    conclusion: requestedConclusion === 'BLOCK' || hasP0 || insufficientSensitiveEvidence ? 'BLOCK' : 'PASS',
    summary: requireText(source.summary, 'summary'),
    positives: requireTextArray(source.positives, 'positives'),
    sensitiveSurfaces: normalizeSurfaces(source.sensitiveSurfaces),
    evidence: requireTextArray(source.evidence, 'evidence'),
    risks,
    technicalDebtCount,
  };
}

function bulletList(items, emptyText) {
  return items.length === 0 ? `- 无：${emptyText}` : items.map(item => `- ${redact(item)}`).join('\n');
}

function renderRisks(risks) {
  if (risks.length === 0) {
    return '- 无：未发现 P0、P1 或 P2 问题。';
  }
  return risks.map(risk => {
    const severity = RISK_LEVELS.get(risk.level);
    const blocked = risk.level === 'P0' ? '是' : '否';
    return [
      `- [${risk.level}] [${severity}] ${redact(risk.title)}`,
      `  - 位置：${redact(risk.location)}`,
      `  - 类型：${redact(risk.type)}`,
      `  - 依据或变更前后行为：${redact(risk.basis)}`,
      `  - 攻击路径或失败路径：${redact(risk.path)}`,
      `  - 影响范围：${redact(risk.impact)}`,
      `  - 修复建议：${redact(risk.recommendation)}`,
      `  - 是否阻塞合并：${blocked}`,
      '  - 状态：未解决',
    ].join('\n');
  }).join('\n');
}

export function renderReport(context, review) {
  const surfaceLines = SURFACE_NAMES.map(name => {
    const surface = review.sensitiveSurfaces[name];
    return `- ${name}：${surface.status}；${redact(surface.reason)}`;
  }).join('\n');
  const evidenceLines = bulletList(review.evidence, '未提供。');
  const mergeAction = review.conclusion === 'BLOCK' ? '禁止合并' : '可合并';
  const reviewMode = context.reviewMode ?? '未提供';

  return [
    '<!-- pr-security-gate-report -->',
    'Code Review 完成',
    `仓库：${redact(context.repository ?? '未提供')}`,
    `分支：${redact(context.branch ?? '未提供')}`,
    `提交：${redact(context.commit ?? '未提供')}`,
    `提交信息：${redact(context.commitMessage ?? '未提供')}`,
    `提交者：${redact(context.author ?? '未提供')}`,
    `Review 模式：${redact(reviewMode)}`,
    '',
    `判定结果：${review.conclusion}`,
    `合并动作：${mergeAction}`,
    `结论依据：${redact(review.summary)}`,
    '',
    '审查范围：',
    `- 本次范围：${redact(context.scope ?? '未提供')}`,
    `- 未审查范围：${redact(context.unreviewedScope ?? '未提供')}`,
    '',
    '审查摘要：',
    redact(review.summary),
    '',
    '值得肯定：',
    bulletList(review.positives, '无。'),
    '',
    '变更的敏感面：',
    surfaceLines,
    '',
    '已验证证据：',
    evidenceLines,
    '',
    '需关注的问题：',
    renderRisks(review.risks),
    '',
    `技术债：${review.technicalDebtCount} 项`,
  ].join('\n');
}
