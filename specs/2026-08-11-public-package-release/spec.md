# Spec：发布首个 npm 公共包

## 基本信息

- 事项 ID：`2026-08-11-public-package-release`
- 创建日期：`2026-08-11`
- 事项状态、关系和影响范围以本目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 发布 npm 公共包；明确取消 GitHub Release | 2026-08-11 | 公开包与安装入口 |
| 外部文档 | 用户提供的《Harness 101：专为 Agent 设计的 Install.md》；吸收执行契约思想，不复制原文 | 2026-08-11 | `Install.md` 结构与读者边界 |
| 仓库证据 | `package.json` 仍为 private；GitHub 仓库已公开；现有 Workflow 只创建 GitHub Release，不能发布 npm | `965f78e` | 当前发布缺口 |
| Registry 证据 | npmjs.org 上 `agent-engineering-foundation` 未发布；本机未登录 npmjs.org，默认 Registry 为内部源；仓库已配置短期 `NPM_TOKEN` Secret | 2026-08-11 | 包名与发布边界 |

## 背景与目标

本仓已经具备零运行时依赖 CLI、不可变 tarball、Release Manifest 和真实采用验证，但尚未形成公开 npm 包首发闭环。现有 GitHub Release Workflow 不再属于目标。首次接入说明散落在 README、Harness 文档和 Bootstrap Skill 中，外部 Coding Agent 缺少根级执行契约。

本事项发布 `agent-engineering-foundation@0.1.0`，由不可变 Source Commit 与 Release Manifest 固定 npm tarball；新增面向 Coding Agent 的根 `Install.md`，把既有只读计划、语义审核、授权写入、Distribution、Doctor 和 Host 发现串成安全接入路径。

## 非目标

- 不建设通用 Package Manager、Agent Runtime、Plugin 安装器或新的 Host 抽象层；
- 不把 `Install.md` 变成 README、Harness 文档或 Bootstrap Skill 的副本；
- 不创建 GitHub Release，不向 GitHub Release 上传 tarball 或 Manifest；
- 不在安装阶段自动修改业务代码、CI、Git 历史或外部平台；
- 不把 npm 发布、Doctor 通过或 Skill 已安装外推为项目业务、Adapter 或运行环境已经就绪；
- 不在首发前声称 Trusted Publishing 已配置；首发可使用最小权限 npm Granular Token，包创建后再迁移 OIDC。

## 用户或调用场景

1. 使用者从 npmjs.org 固定 `0.1.0` 版本运行 `agent-foundation`，无需克隆源码才能执行确定性 CLI。
2. Coding Agent 从公开仓根 `Install.md` 开始，将 Foundation 安全接入一个新项目或存量项目，并在授权点停止。
3. 维护者从版本对应的不可变 Git Tag 构建唯一 tarball，通过 GitHub Actions 向 npmjs.org 发布并生成 Provenance，但不创建 GitHub Release。
4. 发布流程中断或重试时，维护者能够区分未发布与 npm 已发布；已存在同版本时只允许核对相同 integrity，不覆盖不同内容的版本。

## 输出与行为契约

- npm 公共包名固定为 `agent-engineering-foundation`，首发版本为 `0.1.0`，Registry 固定为 `https://registry.npmjs.org/`。
- npm 发布 Workflow 必须从已存在且与 `package.json` 一致的 `v0.1.0` Tag 构建；Tag 仅固定源码版本，不创建 GitHub Release。
- npm 已存在同版本时，只允许在 Registry integrity 与本次 Manifest 一致时继续恢复；不一致时失败关闭。
- `Install.md` 的命令固定公开版本，区分 Foundation 源码仓与目标仓，写操作分别取得授权，并分开报告安装一致、Harness 健康、Host 发现和能力就绪。
- npm 发布失败时保留准确状态和最小恢复动作，不把 Workflow 启动或 Tag 存在写成发布成功。

## 完成条件

- [x] **AC-001** `package.json` 具备完整公共包元数据、明确 npmjs Registry、公开访问、固定文件白名单和 Apache-2.0 许可，`npm pack --dry-run` 只包含声明的运行时材料与必要入口。
- [x] **AC-002** 根 `Install.md` 包含读者、Goal、输入、成功标准、安全规则、接入决策树、授权点、停止条件和失败报告；不复制长期契约，不使用 `latest` 或不固定版本。
- [x] **AC-003** README 分开说明 npm 固定版本使用与源码开发入口，并把 Agent 接入导航到 `Install.md`。
- [x] **AC-004** npm 发布 Workflow 从版本 Tag 生成唯一 tarball/Manifest，以 npmjs.org 发布该 tarball、生成 Provenance 并回读核对 integrity；Workflow 不创建 GitHub Release。
- [x] **AC-005** 发布构建器拒绝 private 包、非公共 Registry、缺少许可或仓库来源的候选，并继续拒绝脏工作区和覆盖既有 Manifest。
- [x] **AC-006** 隔离环境验证 tarball 安装、CLI `--version`、`init plan`、Distribution、Doctor、重复执行和冲突阻断；全量、规模、Repository、Doctor、Distribution、Knowledge 与 Specflow 检查通过。
- [ ] **AC-007** npmjs.org 实际存在 `agent-engineering-foundation@0.1.0`，其 integrity 与 Release Manifest 一致，并能查看来自公开仓 Workflow 的 Provenance。
- [x] **AC-008** 发布证据明确区分 Git Commit、Tag、npm、Provenance 和 Host/项目就绪，不从任一单项成功推断其他状态。

## 约束

- 技术约束：Node.js 20+；包保持零运行时依赖；发布制品来自干净 Commit。
- 兼容约束：CLI 名称继续为 `agent-foundation`；现有源码调用方式保持可用。
- 权限与安全约束：npm 与 GitHub 凭证不进入仓库、日志、Spec 或聊天；外部发布只使用用户明确授权的 `0.1.0`。
- 数据与隐私约束：公开包、Manifest、Release Notes 和 Provenance 不包含内部 Registry、凭证、真实业务项目或个人稳定标识。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 包名在实际发布前仍可能被其他人抢占 | 首发失败 | 发布前重新查询；失败时停止并由维护者选择新名称 | open |
| Resolved | 本机未登录 npmjs.org，但仓库已配置短期 `NPM_TOKEN` Secret | 本机不直接发布；Workflow 可在后续授权后使用 Secret | Secret 值不进入源码、Spec、日志或聊天 | resolved |
| Question | 是否在首发后立即迁移 npm Trusted Publishing | 长期凭证治理 | 首发完成后单独配置 OIDC 并撤销首发 Token | open |

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 输出与行为契约 | npm/GitHub/Install 的稳定契约 | 实现与恢复发布时 |
| 完成条件 | 可判定验收边界 | 验证与收口时 |
| 风险、假设与待确认项 | 外部状态和凭证阻塞 | 执行发布前 |
