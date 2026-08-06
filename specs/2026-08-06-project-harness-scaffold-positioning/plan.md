# Plan：澄清通用项目 Harness 化脚手架定位

## 对应 Spec

- 事项 ID：`2026-08-06-project-harness-scaffold-positioning`
- Spec：`./spec.md`

## 方案摘要

沿用 `knowledge/repository-positioning.md` 的稳定事实，不创建新的定位体系。README 负责一句话定位和边界速览；能力地图统一术语；目标仓库设计解释接入阶段和职责分界；成熟度文档约束“参考实现”的可推断范围。README 作为 Knowledge 权威来源发生变化后，由本事项通过 Knowledge Projection 刷新 Registry 来源摘要和复核指纹。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | 仓库面向其他公司、团队和个人项目，并以 Framework/Knowledge、采用资产、确定性执行三层组织 | `README.md`、`knowledge/repository-positioning.md` |
| Evidence | Starter、Harness、开放 Host 和 Adapter Registry 已有最小参考实现 | `docs/01-能力地图.md`、`docs/02-目标仓库设计.md`、测试 |
| Evidence | 真实外部 Adapter、用户级 Host 和多项运行时能力尚未提供 | `docs/01-能力地图.md`、`docs/05-交付形态与成熟度.md` |
| Assumption | “项目级 Harness 化脚手架”是对既有能力组合的准确概括，不代表新增能力 | 通过跨文档事实对照和人工 Review 验证 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| 仓库公开定位表达 | 稳定契约的入口表达 | 不能把参考底座写成完整 Runtime 或企业平台 | `repository-positioning` 的稳定事实 | Spec / README / Docs |
| Harness 化接入路径 | 技术路径说明 | Starter 初始化不等于完整接入完成 | 现有 Starter、Harness、Adapter 职责 | Plan / Docs |
| 当前成熟度边界 | 纯验证与事实说明 | 不能从局部测试外推未实现能力 | 当前资产和测试证据 | Tasks / Validation Report |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `README.md` | 对外一句话定位、提供项与非提供项 | 修改 |
| `docs/01-能力地图.md` | 统一确定性层术语和能力边界 | 修改 |
| `docs/02-目标仓库设计.md` | 说明项目 Harness 化接入阶段与采用方职责 | 修改 |
| `docs/05-交付形态与成熟度.md` | 限定参考实现成熟度的适用范围 | 修改 |
| `knowledge/repository-positioning.md` | 继续作为既有长期定位事实源 | 不变 |
| `knowledge/registry.yaml` | 刷新 README 对应来源摘要，以及本事项复核的 Knowledge 指纹 | 修改 |

## 数据流或调用流

```text
长期定位事实
→ README 一句话定位与边界速览
→ 能力地图统一术语
→ 目标设计给出接入路径
→ 成熟度约束能力声明
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 使用“通用项目级 Agent Harness 化脚手架与参考底座” | 继续只使用“Agent 工程治理骨架” | 直接回答用户和采用方最关心的产品形态，同时保留“参考底座”避免过度承诺 | 需要在多份入口文档统一术语 |
| 不修改 Knowledge 正文，只执行 `still-valid` Projection | 把新术语写入 Knowledge 稳定事实 | 核心语义未变化，新术语只是既有事实的入口概括；Projection 可机械刷新 README 来源摘要 | 新术语不是长期事实源中的逐字标签，Registry 会产生可复核更新 |
| 用接入阶段表达职责边界 | 仅列功能清单 | 能说明 Starter、通用治理、外部集成和业务验证之间的完成关系 | 文档增加少量篇幅 |

## Agent、程序与人工分工

- Agent：对照既有事实，收敛定位用语、能力边界和接入路径。
- 确定性程序：执行 Specflow、仓库结构/链接检查、测试和差异格式检查。
- 人工确认：决定是否接受定位表述，以及后续是否归档、提交或发布。

## 兼容与迁移

- 向后兼容：不改变命令、配置、Schema、目录或安装行为。
- 数据或配置迁移：无。
- 回退方式：删除新增说明并恢复原术语即可，不涉及状态或数据迁移。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001 | README 增加定位和职责表 | 文本 Review、Markdown 链接检查 | 交叉验证 |
| AC-002 | 能力地图统一术语，目标设计增加接入路径 | 跨文档术语搜索与人工 Review | 交叉验证 |
| AC-003 | 成熟度表和边界说明限定推断范围 | 文本 Review 与现有能力证据对照 | 交叉验证 |
| AC-004 | 保留完整 Specflow 产物、复核 Knowledge Projection 结果并运行检查 | `knowledge check`、`specflow check`、`npm run check`、`npm test`、`git diff --check`、Git 状态 | 执行观察 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 多个近义术语继续并存 | 中 | 使用方仍难判断关系 | 首次出现时定义“治理骨架”与“接入内核”的层级关系 |
| 文档边界落后于后续实现 | 中 | 成熟度声明过时 | 在 Meta 中登记 Starter/Harness/Adapter 边界变化为刷新触发器 |

## 未决问题

- [ ] 用户是否认可最终定位措辞并授权事项归档。
