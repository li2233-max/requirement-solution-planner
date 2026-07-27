import assert from 'node:assert/strict';
import test from 'node:test';
import { redact, renderReport, validateReview } from './pr-ai-review.mjs';

const surfaceNames = ['接口', '认证', '鉴权', '权限', '数据', '文件', '配置', '依赖', 'CI'];

function surfaces() {
  return Object.fromEntries(surfaceNames.map(name => [name, { status: '未涉及', reason: 'diff 未涉及' }]));
}

const baseContext = {
  repository: 'li2233-max/requirement-solution-planner',
  branch: 'feature/pr-ai-review-ci',
  commit: 'abc1234',
  commitMessage: '添加 AI 安全审查',
  author: 'li2233-max',
  reviewMode: 'incremental',
  scope: '1 个提交；.github/workflows/pr-ai-review.yml',
  unreviewedScope: '完整仓库未审查',
};

function risk(level, title) {
  return {
    level,
    title,
    location: 'backend/example.py:10',
    type: '正确性',
    basis: 'diff 显示异常被转换为空结果',
    path: '外部 API 临时失败',
    impact: '调用方无法区分失败和未匹配',
    recommendation: '区分失败、未匹配和成功结果',
  };
}

function review({ conclusion = 'PASS', risks = [], technicalDebtCount = risks.filter(item => item.level !== 'P0').length } = {}) {
  return {
    conclusion,
    summary: '已按规则审查实际 diff。',
    positives: ['已有边界测试。'],
    sensitiveSurfaces: surfaces(),
    evidence: ['Diff 审查：已提供实际 PR diff。'],
    risks,
    technicalDebtCount,
  };
}

test('P1 和 P2 返回 PASS 且技术债只显示计数', () => {
  const result = validateReview(review({ risks: [risk('P1', '错误语义'), risk('P2', '日志字段')] }), {
    sensitiveChanged: false,
    evidenceForSensitivePath: true,
  });
  const markdown = renderReport(baseContext, result);

  assert.equal(result.conclusion, 'PASS');
  assert.match(markdown, /技术债：2 项/);
  assert.doesNotMatch(markdown, /负责人：|Issue：|截止日期：|闭环状态：/);
});

test('P0、无效结论和敏感路径证据不足均阻断合并', () => {
  const p0 = validateReview(review({ risks: [risk('P0', '疑似密钥泄露')], technicalDebtCount: 0 }), {
    sensitiveChanged: false,
    evidenceForSensitivePath: true,
  });
  const insufficientEvidence = validateReview(review(), {
    sensitiveChanged: true,
    evidenceForSensitivePath: false,
  });

  assert.equal(p0.conclusion, 'BLOCK');
  assert.equal(insufficientEvidence.conclusion, 'BLOCK');
  assert.throws(() => validateReview({ conclusion: 'MAYBE' }, {}));
});

test('风险等级与技术债数量必须一致', () => {
  assert.throws(() => validateReview(review({ risks: [risk('P1', '错误语义')], technicalDebtCount: 0 }), {}));
});

test('报告不会暴露疑似凭据', () => {
  const original = 'token=sk-abcdefghijklmnopqrstuvwxyz123456';
  const redacted = redact(original);

  assert.doesNotMatch(redacted, /sk-abcdefghijklmnopqrstuvwxyz123456/);
  assert.match(redacted, /\[REDACTED\]/);
});
