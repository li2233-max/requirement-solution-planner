# Requirement Solution Planner

一个面向 Codex / AI 助手的通用 skill，用来先做需求规划，再进入执行。

它的目标不是直接写代码，而是把模糊请求整理成可交付、可验证、可复核的结构化方案，适合“先出方案再实施”的工作流。

## 这个 skill 做什么

- 判断输入是单需求还是多需求
- 在写方案前先暴露假设、歧义和取舍
- 定义交付物、完成标准、错误判断标准、范围边界
- 把任务拆成单步可验证的执行切片
- 为每一步补上复核机制
- 多需求场景下按分批文件输出：先生成 `00-分批方案索引.md`，再按需生成 `R1-xxx方案.md`、`R2-xxx方案.md` 等独立方案文件
- 在需求不清时先追问，而不是硬写完整方案
- 把方案继续转成 PRD、issue brief、执行切片或 handoff
- 对长期项目沉淀 `CONTEXT.md` 和 ADR 建议
- 对功能、Bug、重构补上测试、复现或浏览器自测路径

## 核心原则

### 写方案前先思考

不要妄下断言，不要掩饰困惑，要坦诚权衡利弊。

- 明确陈述假设
- 有歧义时提出多种解释
- 必要时提出更简单的替代方案
- 困惑时停下来请求澄清

### 简单至上

用最少的方案解决当前问题，不做没有依据的推测。

- 不增加要求之外的功能
- 不为一次性事项设计抽象体系
- 不提供未要求的灵活性或可配置性
- 如果方案明显可以缩短，就重写成更简单版本

### 目标驱动型执行

先定义成功标准，再拆步骤。

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

宽松标准，例如“只要能运行就行”，会被改写成可验证目标。

### 可交接

方案不是最终产物时，可以继续转成：

- PRD
- issue brief
- 单个 R 项执行任务
- 跨会话 handoff
- `CONTEXT.md` / ADR 更新建议

## 适用场景

- 产品需求拆解
- 功能设计与实施规划
- 技术方案与路线图
- 多项优化建议排序
- Bug 修复规划
- 重构计划整理
- 文档整理与项目推进计划
- PRD / issue / handoff 生成
- 功能开发前的验收路径设计
- Bug 修复与重构前的验证路径设计

## 强触发词

这类说法通常都应该触发这个 skill：

- “先别做，先帮我梳理一下”
- “先给我一份方案”
- “先分析再做”
- “先别写代码，先拆需求”
- “拆成可执行步骤”
- “给我一个实施方案 / 技术方案”
- “做个路线图 / 阶段计划 / 任务清单”
- “这些需求怎么排优先级 / 怎么分批 / 怎么排期”
- “拆成里程碑”
- “按总方案继续拆”

## 输出长什么样

单需求时，通常会输出：

- 需求模式判断
- 写方案前思考
- 交付物定义
- 完成标准与错误判断标准
- 任务切片
- 复核机制

多需求时，默认输出为多个文件：

```text
00-分批方案索引.md
R1-xxx方案.md
R2-xxx方案.md
R3-xxx方案.md
R4-xxx方案.md
```

`00-分批方案索引.md` 用来说明总目标、技术栈/前提、文件清单、推荐实施顺序和最小开发闭环。

默认先输出索引；当用户要求“展开全部”或指定某些 R 项时，再输出对应 `R*-xxx方案.md`。每个 R 文件只写对应事项自己的小需求、交付物、完成标准、错误判断标准、范围边界、复核方式和执行接力。

## 仓库结构

```text
.
├─ SKILL.md
├─ README.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ templates.md
│  ├─ karpathy-principles.md
│  ├─ examples.md
│  ├─ grilling-and-clarification.md
│  ├─ execution-bridge.md
│  ├─ context-and-adr.md
│  └─ engineering-validation.md
└─ chatgpt-vue3-user-improvement-solution.md
```

说明：

- `SKILL.md`：skill 主定义，给 AI 执行时使用
- `agents/openai.yaml`：UI 元数据
- `references/templates.md`：单需求 / 多需求模板
- `references/karpathy-principles.md`：三条核心护栏的映射说明
- `references/examples.md`：高质量输入输出示例
- `references/grilling-and-clarification.md`：需求不清时的一问一答追问规则
- `references/execution-bridge.md`：方案转 PRD、issue、handoff 或执行切片
- `references/context-and-adr.md`：项目术语、上下文和架构决策沉淀
- `references/engineering-validation.md`：功能、Bug、重构、UI 的验证路径
- `README.md`：仓库说明，给人阅读

## 示例输入

```text
先别写代码，先帮我把这个需求拆成可执行步骤。
```

```text
我有首页改版、登录报错优化、夜间模式和文档整理，先帮我排优先级并给路线图。
```

```text
根据这份总方案继续拆，把 R1 到 R3 分别展开成独立实施方案。
```

```text
这是多需求，帮我放到 方案规划 目录下，每个 R 单独一个 md 文件。
```

```text
把 R2 转成一个可以交给另一个 agent 执行的 issue brief。
```

```text
这个方案里出现的新术语和架构决策，帮我整理成 CONTEXT.md 和 ADR 草案。
```
