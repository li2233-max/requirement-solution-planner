import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createWorkflowDependencies, redact, renderReport, runReview, validateReview } from './pr-ai-review.mjs';

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

test('DeepSeek 的 PASS JSON 生成可更新的报告', async () => {
  let comment = '';
  const result = await runReview({
    getPullRequest: async () => ({ ...baseContext, isFork: false, changedFiles: ['docs/guide.md'] }),
    getDiff: async () => 'diff --git a/docs/guide.md b/docs/guide.md',
    readPolicy: async () => '# PR 安全审查门禁',
    callModel: async request => {
      assert.match(request.prompt, /PR 安全审查门禁/);
      assert.match(request.prompt, /docs\/guide\.md/);
      return review();
    },
    upsertComment: async markdown => { comment = markdown; },
  });

  assert.equal(result.conclusion, 'PASS');
  assert.match(comment, /判定结果：PASS/);
});

test('模型调用失败会产生 BLOCK 而不是 PASS', async () => {
  let comment = '';
  const result = await runReview({
    getPullRequest: async () => ({ ...baseContext, isFork: false, changedFiles: ['docs/guide.md'] }),
    getDiff: async () => 'diff --git a/docs/guide.md b/docs/guide.md',
    readPolicy: async () => '# PR 安全审查门禁',
    callModel: async () => { throw new Error('429'); },
    upsertComment: async markdown => { comment = markdown; },
  });

  assert.equal(result.conclusion, 'BLOCK');
  assert.match(comment, /AI 审查不可用或输出无效/);
});

test('fork PR 不读取 diff 也不调用模型', async () => {
  const result = await runReview({
    getPullRequest: async () => ({ ...baseContext, isFork: true, changedFiles: [] }),
    getDiff: async () => { throw new Error('不应读取 diff'); },
    readPolicy: async () => { throw new Error('不应读取规则'); },
    callModel: async () => { throw new Error('不应调用模型'); },
    upsertComment: async () => {},
  });

  assert.equal(result.conclusion, 'BLOCK');
  assert.match(result.markdown, /fork PR/);
});

test('工作流依赖使用 GitHub API 和 DeepSeek，并更新已有报告评论', async () => {
  const event = {
    number: 8,
    pull_request: {
      title: '修复审查流程',
      head: { ref: 'feature/review', sha: 'abc1234', repo: { fork: false } },
      user: { login: 'li2233-max' },
    },
  };
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/pulls/8') && options.headers?.accept === 'application/vnd.github.v3.diff') {
      return new Response('diff --git a/a.md b/a.md');
    }
    if (url.endsWith('/issues/8/comments?per_page=100')) {
      return new Response(JSON.stringify([{ id: 11, body: '<!-- pr-security-gate-report -->\n旧报告' }]));
    }
    if (url.endsWith('/issues/comments/11')) {
      return new Response(JSON.stringify({ id: 11 }));
    }
    if (url === 'https://api.deepseek.com/chat/completions') {
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review()) } }] }));
    }
    throw new Error(`未预期请求：${url}`);
  };
  const dependencies = createWorkflowDependencies({
    event,
    env: { GITHUB_REPOSITORY: 'li2233-max/requirement-solution-planner', GITHUB_TOKEN: 'github-token', DEEPSEEK_API_KEY: 'deepseek-key' },
    fetchImpl,
    readFileImpl: async () => '# PR 安全审查门禁',
    policyRoot: '/policy',
  });

  const raw = await dependencies.callModel({ model: 'deepseek-v4-pro', prompt: '审查 diff' });
  const diff = await dependencies.getDiff();
  await dependencies.upsertComment('<!-- pr-security-gate-report -->\n新报告');

  assert.equal(raw.conclusion, 'PASS');
  assert.match(diff, /diff --git/);
  const deepSeekCall = calls.find(call => call.url === 'https://api.deepseek.com/chat/completions');
  assert.equal(deepSeekCall.options.method, 'POST');
  assert.equal(deepSeekCall.options.headers.authorization, 'Bearer deepseek-key');
  assert.equal(JSON.parse(deepSeekCall.options.body).model, 'deepseek-v4-pro');
  const commentCall = calls.find(call => call.url.endsWith('/issues/comments/11'));
  assert.equal(commentCall.options.method, 'PATCH');
});

test('工作流只使用目标分支定义、检出 base SHA 且不执行依赖安装', async () => {
  const yaml = await readFile(new URL('../workflows/pr-ai-review.yml', import.meta.url), 'utf8');

  assert.match(yaml, /pull_request_target:/);
  assert.doesNotMatch(yaml, /\npull_request:/);
  assert.match(yaml, /branches:\s*\[dev, main\]/);
  assert.match(yaml, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(yaml, /persist-credentials: false/);
  assert.doesNotMatch(yaml, /github\.event\.pull_request\.head/);
  assert.doesNotMatch(yaml, /npm (ci|install)|pnpm install|yarn install/);
});

test('管理员文档包含 Secret、首次验证与必需检查配置', async () => {
  const setup = await readFile(new URL('../../docs/pr-ai-review-setup.md', import.meta.url), 'utf8');

  assert.match(setup, /DEEPSEEK_API_KEY/);
  assert.match(setup, /pr-security-gate/);
  assert.match(setup, /Branch protection rules/);
  assert.match(setup, /pull_request_target/);
});
