# PR AI 安全审查配置

本仓库的 `pr-ai-review.yml` 使用 `pull_request`：它在以 `dev` 或 `main` 为目标的 PR 创建、更新或重新打开时，读取 diff，调用 DeepSeek `deepseek-v4-pro`，并更新一条固定格式的 Code Review 报告。

## 1. 配置 DeepSeek Secret

1. 如 API Key 曾出现在聊天、代码、Issue、PR 或日志中，先在 DeepSeek 控制台撤销并重新生成。
2. 进入仓库 `Settings → Secrets and variables → Actions → Secrets`。
3. 新建 repository secret，名称为 `DEEPSEEK_API_KEY`，值为新的 DeepSeek API Key。
4. 不要将 API Key 写入 `.yml`、代码、PR 描述、Issue 或测试数据。GitHub 只允许查看 Secret 名称，不能再次查看其值。

## 2. 使用 `pull_request` 的风险边界

当前模式会立即审查以 `dev` 或 `main` 为目标的 PR，无需先将工作流合并到默认分支。

但 `pull_request` 会使用 PR 分支提交的工作流定义。即使审查脚本只检出 `${{ github.event.pull_request.base.sha }}`，同仓库中能够创建分支或 PR 的成员仍可能修改 `.github/workflows/pr-ai-review.yml`，让 `DEEPSEEK_API_KEY` 泄露到外部。

因此只应在所有同仓库贡献者都受信任的仓库中使用本模式；不要向不受信任的同仓库成员开放写权限。来自 fork 的 PR 不会获得 `DEEPSEEK_API_KEY`，并应保持人工安全复核。

## 3. 配置 Actions 权限

进入 `Settings → Actions → General`，确保工作流具有读写仓库权限。工作流会声明 `pull-requests: write`，用于创建或更新 PR 报告评论。

## 4. 验证自动审查

1. 从 `dev` 创建一个内部测试分支，做一个无敏感信息的小文档修改。
2. 创建以 `dev` 为 base 的 PR。
3. 打开 PR 的 `Actions` 或 `Checks`，确认 job 名称为 `pr-security-gate`。
4. 在 PR Conversation 中确认出现以 `Code Review 完成` 开头的机器人评论。
5. 再推送一个提交，确认同一条机器人评论被更新，而不是新增多条评论。
6. 若结论是 `BLOCK`，检查模型/API、报告中的证据不足或风险项；修复后再次推送即可自动复审。

不要为测试而提交真实或看似真实的密钥。P0、P1/P2、无效模型输出和敏感路径证据不足的门禁行为已由本仓库的 Node 测试覆盖。

## 5. 设置必需检查

确认测试 PR 已成功跑出一次 `pr-security-gate` 后，进入 `Settings → Branches → Branch protection rules`，为 `dev` 和 `main` 分别新建或编辑规则：

1. 开启 **Require status checks to pass before merging**。
2. 在列表中选择 **pr-security-gate**。
3. 保存规则。

完成后：`BLOCK`、模型/API 故障、无效模型输出、diff 超限和敏感路径证据不足都会使 `pr-security-gate` 失败，GitHub 将不允许合并；仅 P1/P2 时检查成功，报告保留风险详情并只输出 `技术债：N 项`。
