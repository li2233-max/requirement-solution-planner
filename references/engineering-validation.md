# Engineering Validation

Use this reference when the plan leads to code, UI, bug fixing, refactoring, performance work, or release work.

## Default validation ladder

Pick the tightest signal available:

1. Unit test for isolated logic.
2. Integration test for module boundaries.
3. End-to-end or browser test for user workflows.
4. CLI / HTTP script for service behavior.
5. Manual self-test checklist when automation is not practical.

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
