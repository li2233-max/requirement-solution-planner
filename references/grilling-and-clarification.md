# Grilling And Clarification

Use this reference when the request is too ambiguous to plan safely.

## When to pause and ask

Ask before producing the full plan when missing information would change any of these:

- Target user or owner
- Main deliverable
- Success standard
- Scope boundary
- Priority order
- Technical route
- Third-party platform feasibility

Do not ask for information that can be discovered from the repo or existing files. Explore first when local context can answer the question.

## Question style

- Ask one question at a time.
- Give a recommended answer with the trade-off.
- Prefer concrete choices over open-ended prompts.
- Stop asking once the remaining uncertainty can be handled as an explicit assumption.

## Output shape

```md
## 需要先确认的问题

- 当前阻塞点：
- 为什么会影响方案：
- 我的推荐答案：
- 如果按推荐答案继续，默认假设：

问题：
```

## Good questions

- "这个方案的第一交付对象是谁：最终用户、内部运营，还是开发团队？我建议先按最终用户主路径规划，因为它能倒推出最小闭环。"
- "这次是要先做可运行 MVP，还是先做完整长期架构？我建议先做 MVP，把长期扩展作为明确不包含项。"
- "第三方平台是否已经有可用账号和审核通过的应用？如果没有，我建议把通道验证作为 P0。"

## Stop conditions

Stop grilling and produce the plan when:

- The deliverable is clear.
- The single/multi-demand split is clear.
- The first execution batch can be validated.
- Remaining unknowns are documented as assumptions or risks.
