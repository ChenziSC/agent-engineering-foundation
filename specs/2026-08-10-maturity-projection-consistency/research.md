# Research：成熟度投影一致性收敛

## 审计事实

- 全仓 9 个 Skill 均存在正式 `evals/replay.json`，共 50 个 Case；阻塞违规、未通过必需动作和发生的禁止动作均为 0。
- 正式回放得分：Design-to-Code 170/200、组件治理 700/700、Bootstrap 643/700、自然语言重构 700/700、安全变更 185/200、Specflow 1294/1300、埋点治理 180/200、首屏预请求 470/500、Web 性能评审 495/500。
- 唯一成熟度页面仍把 Bootstrap、安全变更、Design-to-Code 和埋点治理写为 `usable`，与正式回放准入规则不一致。
- 能力地图和能力问题图谱复制了成熟度标签；问题图谱还保留“当前职责版本独立回放待补”的过期描述。
- Bootstrap 的真实对照显示行为边界有增益、上下文成本未稳定下降。后者是采用效果限制，不应改写正式行为回放已经通过的事实。
- Foundation PR #2 Run `31378586240` 已在归档提交 `aa8ac3f` 上完成 Verify 与 Delivery 正向通过，并已合并；现有成熟度页面仍写为正向待验证。
- `templates/project-component-governance/component-contract.template.md` 的自然语言章节标题为英文，与中文优先约定不一致。

## 内容重构约束

- 保留能力、资产、证据、缺口和外推边界，不用删减事实来制造表面一致。
- 成熟度标签只在唯一投影和各资产自身的权威说明中出现；跨资产导航不再复制。
- 不修改已封存 Receipt、历史 Validation Report 或 Replay Evidence。
