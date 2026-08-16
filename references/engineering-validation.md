# Engineering Validation

Use this reference when the plan leads to code, UI, bug fixing, refactoring, performance work, or release work.

## Default validation ladder

Pick the tightest signal available:

1. Unit test for isolated logic.
2. Integration test for module boundaries.
3. End-to-end or browser test for user workflows.
4. CLI / HTTP script for service behavior.
5. Manual self-test checklist when automation is not practical.

## Cross-cutting verification gates

Every plan that produces code must schedule these checks where applicable:

1. **Security review**: 认证/授权覆盖面、密钥硬编码扫描、PII 数据的下载/访问面。
2. **Data integrity**: 迁移与回填验证（历史数据可关联、唯一约束生效、回填脚本可重复执行）。
3. **Structure review**: 分层红线（视图无业务逻辑）、单文件规模、前端路由与统一请求层。

## Criteria-to-verification mapping (hard rule)

每条完成标准与错误判断标准必须对应至少一个复核动作；复核动作未覆盖某条标准时，该方案视为未完成。

```md
| 标准 | 对应复核动作 |
|---|---|
| 密钥不硬编码 | grep 检查代码无默认密钥；缺少 SECRET_KEY 启动报错 |
| 未认证返回 401 | curl 未带凭证访问业务接口 |
```

## Bug fix planning

Do not plan the fix before planning the reproduction signal.

```md
## Bug 验证路径

- 复现方式：
- 最小失败输入：
- 当前错误表现：
- 修复后通过条件：
- 回归测试位置：
```

## Refactor planning

Refactor plans must protect behavior before changing structure.

```md
## 重构保护

- 受保护行为：
- 当前测试覆盖：
- 需要补的测试：
- 每步后必须通过的检查：
- 回滚/返工条件：
```

## Feature planning

Feature plans must include the user path and acceptance signal.

```md
## 功能验收路径

- 用户入口：
- 主路径：
- 边界路径：
- 成功提示：
- 失败提示：
- 自动化检查：
- 浏览器自测：
```

## UI and interactive flows

For web UI, include a real user-path self-test:

- Open the relevant route.
- Perform the primary action.
- Check loading, success, empty, and error states.
- Check at least one mobile-sized viewport when the UI is user-facing.
- Record the final pass/fail result.

## Codebase design vocabulary

Use these terms in technical plans when useful:

- **Module**: anything with an interface and implementation.
- **Interface**: what callers must know to use the module correctly.
- **Seam**: the place where behavior can be swapped or tested.
- **Adapter**: a concrete implementation behind a seam.
- **Depth**: how much behavior sits behind a small interface.

Prefer plans that make modules deeper, interfaces smaller, and verification possible at the seam.

## Production readiness (production-bound systems)

上线形态为生产系统的方案，验证路径必须覆盖：

- prod 配置：非 runserver、DEBUG=0、强随机密钥、DB/Redis 端口不外露
- 健康检查：readiness/liveness 包含 DB/Redis 探活
- 迁移：启动期统一迁移或有明确的竞争规避方案
- 静态/媒体文件：PII 文件不走公开静态路径，下载需鉴权
