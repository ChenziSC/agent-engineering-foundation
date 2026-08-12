# Validation Report：Skill 推荐安装 Profile 与增量 Distribution

## 结果

- 事项 ID：`2026-08-11-skill-install-recommendation-profiles`
- 检查日期：`2026-08-12`
- 基线：`origin/main` 的合并提交 `6487819`
- 结果：`pass`
- 生命周期：实现与验证已完成；维护者已明确授权归档、Commit、Push、创建并推送 `v0.2.0` Tag、触发 npm 发布，以及完整性验证通过后合并 `main`。

## 完成条件映射

| 完成条件 | 实现与 Evidence | 结果 |
| --- | --- | --- |
| AC-001 | 独立 `distribution/recommendations.json`；Repository 交叉校验；重复、遗漏、未发布 Skill、`core`/`full` 漂移负例 | pass |
| AC-002 | 新项目默认 `core`；显式 `full`；Plan/Verify 输出 Profile、来源、最小集合与实际维护集合 | pass |
| AC-003 | 旧状态无 Profile 按 `full`；Profile 与已有受管项取并集；core + 可选项经 Distribution、Upgrade 与 Verify 复核 | pass |
| AC-004 | 源码 CLI 与 npm pack 均覆盖 `skill recommend`、`--profile full` 和未知 Profile | pass |
| AC-005 | 全量回归覆盖 Source Link、用户修改、未知文件、Symlink、版本迁移、降级与 Upgrade 冲突 | pass |
| AC-006 | Install、README、Harness、Distribution、Blueprint、Bootstrap Skill/Eval、模板、Docs 与 Knowledge 术语一致 | pass |
| AC-007 | 全量、规模、Repository、Doctor、Distribution、Knowledge、Specflow、Eval 与源码仓外打包回归 | pass |
| AC-008 | `skill recommend` 输出三种选择方式、默认选择、条件性必需说明、理由与适用场景；`specflow` 明确限定为完整 Foundation 治理流程的条件性核心 | pass |
| AC-009 | 首次副本 Apply 未传 Profile 返回 `skill-selection-required`；只读 Plan、已有状态、Upgrade 与 Source Link 兼容用例通过 | pass |
| AC-010 | 可重复 `--include-skill` 覆盖同一次 Plan/Apply/Verify；未知、重复、Profile 内重复和 `full` 冗余组合均有失败关闭用例 | pass |
| AC-011 | Install 与 Bootstrap 固定 Recommend → 用户选择 → 只读 Plan → 单独写授权 → Apply；源码 CLI 与 npm pack 均覆盖该闭环 | pass |

## 验证明细

- Harness 聚焦测试：46/46 通过；覆盖推荐字段、首次写门禁、三种选择、组合错误与 npm pack。
- `npm test`：121/121 通过；包含新旧 Distribution 状态、可选 Skill 持续维护、CLI、Source Link、安全冲突和源码仓外 npm pack 闭环。
- `npm run test:scale`：2/2 通过。
- `npm run check` / `repository check`：通过；推荐契约显示默认 `core`、2 个 Profile、9 个发布 Skill。
- CLI、公共包、安装文档与源码仓 Distribution 状态统一为 `0.2.0`；`npm pack --dry-run --json` 生成 112 个文件的 `agent-engineering-foundation@0.2.0` 预览。
- `doctor --target .`：通过。
- `distribution verify --target .`：通过；Foundation 生产者模式为 `full`，9 个 Skill 均受管。
- `knowledge check --target .`：通过；相关长期 Knowledge 与来源摘要已刷新。
- `specflow check --target .`：通过。
- `eval run --skill project-context-bootstrap --target .`：7/7 通过，无阻塞违规，平均分 91.86。
- `git diff --check`：通过。

## 行为结论

- 新采用项目的默认推荐清单是 `core`，当前仅包含 `specflow`。
- `specflow` 只在项目采用本仓完整治理流程时是条件性核心；单独使用领域 Skill 或 CLI 子能力并不无条件依赖它。
- `project-context-bootstrap` 是 onboarding 接入期能力；其他领域 Skill 为按需选装。维护者可用 `skill recommend` 查看逐项必需条件、理由和适用场景。
- Agent 必须先展示推荐并询问 `core`、`full` 或 `core + 可选项`；用户确认后才运行只读 Plan，另行取得写入授权后才 Apply。CLI 不承担 TTY 对话。
- 首次普通副本 Apply 未显式传入 Profile 时返回 `skill-selection-required`，防止默认推荐被误当作静默写入授权。
- `--include-skill` 可重复表达 `core + 若干可选项`，并在同一次 Plan/Apply/Verify 中保持一致选择。
- `--profile full` 显式安装 Manifest 中全部公开 Skill。
- 已有受管 Skill 会继续被升级和验证；选择较小 Profile 不代表卸载授权。
- 旧 Distribution 状态缺少 Profile 时保持历史 `full`，下次 Apply/Upgrade 写入明确 Profile。
- Foundation 源码仓的 Source Link 固定为 `full`，保持 `skills/` 唯一源码。

## 尚未扩张的边界

- 未实现自动项目分类、依赖求解、领域组合 Profile、卸载、用户级安装或远端 Marketplace。
- 安装与摘要一致不证明项目配置、外部 Adapter、Host 缓存或领域能力已经就绪。
- 本报告冻结时尚未执行 Tag、npm 发布或 `main` 合并；这些外部交付动作在归档 Receipt 与不可变候选形成后，按维护者授权顺序单独验证。
