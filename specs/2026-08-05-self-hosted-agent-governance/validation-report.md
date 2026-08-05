# Validation Report：将仓库升级为可快速接入的 Agent 工程治理骨架

## 结果

- 事项 ID：`2026-08-05-self-hosted-agent-governance`
- 检查日期：`2026-08-05`
- 结果：`pass`
- 发布状态：`not-authorized`

本报告记录当前进度，不构成归档或完成声明。

## 完成条件映射

| 完成条件 | Task | Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001 | T-03 | `specs/README.md`、当前事项目录和 `meta.yaml` | pass |
| AC-002 | T-03 | `knowledge/README.md`、Registry 和长期知识 | pass |
| AC-003 | T-03 | 根 `AGENTS.md` | pass |
| AC-004 | T-02/T-03 | `skills/specflow/` 和本事项 Plan/Tasks | pass |
| AC-005 | T-01/T-05 | README、能力地图、目标仓库设计、成熟度与发布清单 | pass |
| AC-006 | T-04 | Specflow Archive Reference、3 组契约模板与 JSON Schema、收口清单和 Case 07～12 | pass |
| AC-007 | T-06 | `starter/minimal/`、初始化/Doctor CLI 和临时项目自动化测试 | pass |
| AC-008 | T-06 | Skill 发现/检查/计划/安装/更新、内容摘要、受管状态和 `adapters/open-agent/` | pass |
| AC-009 | T-01/T-07 | 仓库检查、仓外已知词模式对工作区与现有 Git 历史的扫描均无命中 | pass |
| AC-010 | T-05/T-07/T-08 | 成熟度表、README、目标结构和本报告与真实实现及 12 个测试一致 | pass |
| AC-011 | T-03A | 迁移总览、独立重写规范、能力模板、根级规则和 `public-generalization-policy` Knowledge | pass |
| AC-012 | T-03B | 仓外私有覆盖台账和 `docs/08-能力问题图谱.md`；公开仓仅保存通用投影 | pass |
| AC-013 | T-08 | `adapters/registry.mjs`、Manifest v2、Infrastructure Adapter Blueprint、合成配置和自定义 Host 端到端测试 | pass |

## 结构与内容检查

- [x] 当前事项包含 Spec、Plan、Tasks、Meta 和 Validation Report。
- [x] ID 和相互引用一致。
- [x] Spec 有目标、非目标和可判定完成条件。
- [x] Plan 能追溯到当前仓库证据。
- [x] Tasks 有依赖、对应条件、产物和验证。
- [x] 未决问题和 Blocker 保持可见。
- [x] 全量盘点的私有来源映射与公开问题投影分离。
- [x] `npm run check` 动态校验真实目录、JSON/JSON Schema、YAML 子集、Markdown 链接、Skill/Eval 和高置信秘密格式。
- [x] 私有词表从仓外注入，命中结果只返回摘要，不回显词条。

## 生命周期检查

- [x] 当前事项保持 `In Progress`。
- [x] 没有从现有未提交改动、Commit 或 Push 推断归档授权。
- [x] 没有为历史提交伪造归档回执或验证证据。
- [ ] 终态和归档回执尚未进入验收范围。

## 已证明的最小实现范围

- Starter 可以初始化空的合成项目，并对既有项目中的 Starter 文件冲突整体阻断；
- Harness 可以向项目级 `.agents/skills` 安装和更新受管 Skill，保护未知目录、用户修改与 Symlink 目标；
- CLI、幂等执行、内容摘要、状态复核、仓库检查、Adapter 注入和失败保持目标不变由 12 个自动化测试覆盖；
- 采用方可以显式注入项目级 Host，默认 CLI 不动态加载未知代码；
- 未注册的非核心基建 Adapter 产生警告，未注册 Host、重复声明、非法配置引用和项目外路径会阻断。

## 尚未证明

- Archive Receipt 的确定性摘要计算、不可变写入和校验尚未实现；
- Knowledge Projection 和新鲜度检查尚不能由程序执行；
- 尚未提供 Specflow 生命周期语义、Knowledge 新鲜度和 Distribution Manifest 的程序校验；
- 各类真实基建 Adapter、认证和外部系统行为由采用方实现，本仓未作集成验证；
- 新定位下的完整行为 Eval 已通过；
- 正式公开发布所需权属确认已完成。

## 下一步

- 维护者人工复核私有覆盖台账、最终差异、二进制资源、权属和保密义务；
- 如维护者明确要求事项终态，再按 Specflow 归档契约收口；
- Commit、Push 和公开发布仍分别需要明确授权。
