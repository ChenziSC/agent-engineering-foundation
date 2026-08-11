# Spec：发布首个 npm 公共包

## 基本信息

- 事项 ID：`2026-08-11-public-package-release`
- 创建日期：`2026-08-11`
- 事项状态、关系和影响范围以本目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 发布 npm 公共包；明确取消 GitHub Release；为旧版采用项目实现 `upgrade plan/apply` | 2026-08-11 | 公开包、安装与升级入口 |
| 外部文档 | 用户提供的《Harness 101：专为 Agent 设计的 Install.md》；吸收执行契约思想，不复制原文 | 2026-08-11 | `Install.md` 结构与读者边界 |
| 仓库证据 | `package.json` 仍为 private；GitHub 仓库已公开；现有 Workflow 只创建 GitHub Release，不能发布 npm | `965f78e` | 当前发布缺口 |
| Registry 证据 | npmjs.org 上 `agent-engineering-foundation` 未发布；本机未登录 npmjs.org，默认 Registry 为内部源；仓库已配置短期 `NPM_TOKEN` Secret | 2026-08-11 | 包名与发布边界 |

## 背景与目标

本仓已经具备零运行时依赖 CLI、不可变 tarball、Release Manifest 和真实采用验证，但尚未形成公开 npm 包首发闭环。现有 GitHub Release Workflow 不再属于目标。首次接入说明散落在 README、Harness 文档和 Bootstrap Skill 中，外部 Coding Agent 缺少根级执行契约。

本事项发布 `agent-engineering-foundation@0.1.0`，由不可变 Source Commit 与 Release Manifest 固定 npm tarball；新增面向 Coding Agent 的根 `Install.md`，把既有只读计划、语义审核、授权写入、Distribution、Doctor 和 Host 发现串成安全接入路径。同时为已经完成项目级 Distribution 的采用项目提供 `upgrade plan/apply`，由用户选定的精确新版 CLI 比较已安装版本并安全更新整套受管 Skill。

## 非目标

- 不建设通用 Package Manager、Agent Runtime、Plugin 安装器或新的 Host 抽象层；
- 不把 `Install.md` 变成 README、Harness 文档或 Bootstrap Skill 的副本；
- 不创建 GitHub Release，不向 GitHub Release 上传 tarball 或 Manifest；
- 不在安装阶段自动修改业务代码、CI、Git 历史或外部平台；
- 不把 npm 发布、Doctor 通过或 Skill 已安装外推为项目业务、Adapter 或运行环境已经就绪；
- 不在首发前声称 Trusted Publishing 已配置；首发可使用最小权限 npm Granular Token，包创建后再迁移 OIDC。
- 不让 CLI 自动查询或选择 npm `latest`，不建设全局 Skill 安装器、Session Hook、后台更新服务或通用 Package Manager；版本选择继续由维护者或 Host 完成。

## 用户或调用场景

1. 使用者从 npmjs.org 固定 `0.1.0` 版本运行 `agent-foundation`，无需克隆源码才能执行确定性 CLI。
2. Coding Agent 从公开仓根 `Install.md` 开始，将 Foundation 安全接入一个新项目或存量项目，并在授权点停止。
3. 维护者从版本对应的不可变 Git Tag 构建唯一 tarball，通过 GitHub Actions 向 npmjs.org 发布并生成 Provenance，但不创建 GitHub Release。
4. 发布流程中断或重试时，维护者能够区分未发布与 npm 已发布；已存在同版本时只允许核对相同 integrity，不覆盖不同内容的版本。
5. 已采用旧版 Foundation 的项目使用一个明确的新版本 CLI 先预览升级，再经授权更新该版本声明的全部受管 Skill；未采用项目、降级请求和用户修改冲突均保持目标不变并给出可判定原因。

## 输出与行为契约

- npm 公共包名固定为 `agent-engineering-foundation`，首发版本为 `0.1.0`，Registry 固定为 `https://registry.npmjs.org/`。
- npm 发布 Workflow 必须从已存在且与 `package.json` 一致的 `v0.1.0` Tag 构建；Tag 仅固定源码版本，不创建 GitHub Release。
- npm 已存在同版本时，只允许在 Registry integrity 与本次 Manifest 一致时继续恢复；不一致时失败关闭。
- `Install.md` 的命令固定公开版本，区分 Foundation 源码仓与目标仓，写操作分别取得授权，并分开报告安装一致、Harness 健康、Host 发现和能力就绪。
- npm 发布失败时保留准确状态和最小恢复动作，不把 Workflow 启动或 Tag 存在写成发布成功。
- `upgrade plan` 只读比较项目安装状态中的 Foundation 版本、当前 CLI 版本和 Distribution 计划；未安装 Foundation、目标版本低于已安装版本、Skill 被用户修改或存在未知文件时失败关闭。
- `upgrade apply` 必须复用同一 Distribution 安全写入与摘要校验，应用后再次 Verify；它不联网解析版本、不修改项目的 npm 依赖、CI、Git 或 Host 配置。
- 当前版本已一致且受管内容一致时，Plan 返回 `noop`，Apply 返回 `unchanged`；旧版安装状态缺少版本但存在受管记录时允许作为 `migrate` 显式补齐版本来源。

## 完成条件

- [x] **AC-001** `package.json` 具备完整公共包元数据、明确 npmjs Registry、公开访问、固定文件白名单和 Apache-2.0 许可，`npm pack --dry-run` 只包含声明的运行时材料与必要入口。
- [x] **AC-002** 根 `Install.md` 包含读者、Goal、输入、成功标准、安全规则、接入决策树、授权点、停止条件和失败报告；不复制长期契约，不使用 `latest` 或不固定版本。
- [x] **AC-003** README 分开说明 npm 固定版本使用与源码开发入口，并把 Agent 接入导航到 `Install.md`。
- [x] **AC-004** npm 发布 Workflow 从版本 Tag 生成唯一 tarball/Manifest，以 npmjs.org 发布该 tarball、生成 Provenance 并回读核对 integrity；Workflow 不创建 GitHub Release。
- [x] **AC-005** 发布构建器拒绝 private 包、非公共 Registry、缺少许可或仓库来源的候选，并继续拒绝脏工作区和覆盖既有 Manifest。
- [x] **AC-006** 隔离环境验证 tarball 安装、CLI `--version`、`init plan`、Distribution、Doctor、重复执行和冲突阻断；全量、规模、Repository、Doctor、Distribution、Knowledge 与 Specflow 检查通过。
- [ ] **AC-007（外部交付条件，归档时未执行）** npmjs.org 实际存在 `agent-engineering-foundation@0.1.0`，其 integrity 与 Release Manifest 一致，并能查看来自公开仓 Workflow 的 Provenance。
- [x] **AC-008** 发布证据明确区分 Git Commit、Tag、npm、Provenance 和 Host/项目就绪，不从任一单项成功推断其他状态。
- [x] **AC-009** `upgrade plan/apply` 可由精确版本 CLI 对采用项目完成版本比较、整套 Skill 更新和 Verify；覆盖升级、幂等、旧状态迁移、未安装、降级、用户修改与未知文件阻断，且不触发 Registry、Git、CI 或 Host 外部写入。

## 约束

本事项的仓内实现与验证可以在 AC-007 尚未执行时归档，但 Receipt 不得把 AC-007 列为已完成条件。Tag、npm 发布和 Provenance 属于归档后的独立外部交付动作，仍需单独授权并回读真实结果；归档、Commit、Push 或合并到 `main` 均不代表 npm 已发布。

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
