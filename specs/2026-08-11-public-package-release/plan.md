# Plan：发布首个 npm 公共包

## 对应 Spec

- 事项 ID：`2026-08-11-public-package-release`
- Spec：`./spec.md`

## 方案摘要

保留现有一个 Package、一个 CLI 和一个制品构建器。公共元数据由 `package.json` 持有；`release-package.mjs` 在本地确定性验证公开发布前置条件并生成唯一 tarball/Manifest；GitHub Actions 只负责编排 Tag 校验、回归、npm 发布、Provenance 和 Registry integrity 回读，不创建 GitHub Release。`Install.md` 是面向 Agent 的薄导航层，权威行为继续位于 CLI、Harness 文档和 Bootstrap Skill。升级能力作为现有项目级 Distribution 的窄包装：调用者先用 npm 或 Host 选择精确的新版本 CLI，`upgrade plan/apply` 只负责版本方向、受管状态、冲突与应用后 Verify，不自行承担 Registry 解析或宿主生命周期。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | `main`、`origin/main` 与工作区均干净，HEAD 为 `965f78e` | Git 只读审计 |
| Evidence | npmjs.org 上包名未发布；本机 npmjs 未认证 | `npm view/whoami --registry=https://registry.npmjs.org/` |
| Evidence | GitHub 仓库公开且当前无 Release | `gh repo view`、`gh release list` |
| Evidence | 已有构建器生成 tarball、SHA-256、npm integrity/shasum 和 Source Revision | `release-package.mjs` 与测试 |
| Evidence | Distribution 已保存 `foundationVersion`，按 Manifest 摘要更新受管 Skill，并阻断用户修改、未知文件和 Symlink | `harness.mjs` 与现有 Distribution/Update 测试 |
| Baseline | npm/Host 已能选择并运行一个精确包版本，但不会理解本仓项目级安装状态、整套 Skill 摘要与降级风险 | `npm exec --package=<exact-version>` 与仓库宿主边界 |
| Evidence | npm 官方要求首个公共发布显式 `--access public`；GitHub Actions 可用 `--provenance` | npm 官方文档，2026-08-11 复核 |
| Assumption | 首发继续使用现有未占用包名和 `0.1.0` | 用户未要求改名或改版本；发布前重新验证 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| npm 公共包 | 公共契约 | 包名、版本、Registry、许可、公开访问、文件边界 | 当前 `package.json`、npm 官方契约 | Spec / Plan |
| npm 发布 Workflow | 交付契约 | Tag 与版本一致、唯一制品、Provenance、重试不覆盖 | 现有 Workflow、npm 官方行为 | Plan / Tasks |
| `Install.md` | 产品行为 | 目标仓/源码仓分流、写授权、安装不等于就绪 | Bootstrap Skill、Harness 文档 | Spec / Plan |
| 发布验证 | 稳定契约 | 干净 Commit、不可覆盖 Manifest、真实隔离安装 | 现有构建器和回归 | Plan / Tasks |
| 项目升级 | 公共 CLI 契约 | 精确目标版本、只读 Plan、拒绝降级、受管副本保护、Apply 后 Verify | 安装状态与 Distribution Manifest | Spec / Plan |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `package.json` | npm 公共元数据、文件白名单、发布配置 | 修改 |
| `Install.md` | Agent 首次接入入口与停止边界 | 新增 |
| `README.md` | 人类快速开始和 Agent 导航 | 修改 |
| `release-package.mjs` | 确定性拒绝非公共发布候选并生成 Manifest | 修改 |
| `release.yml` | npm 公共发布与 Provenance 编排 | 修改 |
| `publish-npm-release.mjs` | 校验 Tag/Manifest、处理幂等重试并回读 Registry integrity | 新增 |
| `harness.mjs` | 组合版本比较与既有 Distribution，生成并应用项目升级计划 | 修改 |
| `agent-foundation.mjs` | 暴露 `upgrade plan/apply` 公共 CLI | 修改 |
| `docs/不可变包交付.md` | 发布与恢复权威说明 | 修改 |
| Harness/Install/README | 说明精确版本升级入口、授权与停止条件 | 修改 |
| 测试 | 元数据、Workflow、制品、升级正常/幂等/迁移/冲突路径 | 修改 |

## 数据流或调用流

```text
干净 Source Commit + v0.1.0 Tag
→ 回归与公共元数据校验
→ npm pack 生成唯一 tarball
→ Release Manifest 固定 SHA-256 / integrity / Source Revision
→ npmjs.org 发布该 tarball并生成 Provenance
→ 回读并核对 Registry integrity
→ 保存 npm 外部 Evidence
```

```text
调用者选择精确的新版本 CLI
→ upgrade plan 读取目标项目安装状态
→ 比较 installedFoundationVersion 与当前包版本
→ 复用 Distribution Plan 检查整套 Skill 摘要和冲突
→ 经授权 upgrade apply
→ 复用 Distribution Apply 的安全写入与回滚
→ Distribution Verify 回读
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| Workflow 发布构建器生成的唯一 tarball | 直接在仓库根执行 `npm publish` | Registry integrity 可与 Manifest 精确复核 | Workflow 需显式解析 Manifest |
| 首发使用最小权限 `NPM_TOKEN` + Provenance | 本机直接发布；首发即 OIDC | 当前包尚不存在，先完成可审计首发；公开仓可生成 Provenance | 首发后需迁移 OIDC 并撤销 Token |
| `Install.md` 只编排既有契约 | 复制全部命令说明；新增 Adopt Runtime | 直接消费者明确，避免第二事实源和过度设计 | 读者仍需按链接进入 Bootstrap/Harness 细节 |
| README 与 Install 固定当前版本 | 使用 `latest` | 可复现、符合不可变采用边界 | 每次发版需由检查同步版本 |
| Upgrade 由目标版本 CLI 驱动 | 旧 CLI 自动查询 npm 并重启新版；内建 npm 下载器 | 版本选择与项目级安全迁移分层，不新增 Registry、网络、缓存或子进程供应链面 | 调用者仍需先选定精确版本 |
| `upgrade` 复用 Distribution | 建立第二套 Skill 更新状态机 | 受管摘要、冲突、Symlink 与回滚已有确定性实现和测试 | 输出包含嵌套 Distribution Evidence |
| 默认拒绝降级，允许带受管记录的旧状态迁移 | 任意版本切换；缺版本一律拒绝 | 避免意外回退，同时兼容早期未记录 Foundation 版本的真实采用状态 | 降级若未来需要必须建立独立显式契约 |

## Agent、程序与人工分工

- Agent：整理公共契约、实现文档与 Workflow、解释失败和恢复状态。
- 确定性程序：验证元数据、构建 tarball/Manifest、执行测试、核对 npm integrity 与 Git Tag。
- 人工确认：npmjs 认证与 Secret、终态归档、Commit/Push/Tag 和 npm 外部发布结果。

## 兼容与迁移

- 向后兼容：源码仓内 `node packages/harness/bin/agent-foundation.mjs` 入口不变；新 npm 入口是增量能力。
- 数据或配置迁移：无项目数据迁移；仓库 Secret 不进入源码。
- 回退方式：公开前可删除未推送 Tag 并恢复候选；npm 版本一旦公开不以覆盖或重发回退，修复使用新版本。
- 升级回退：Apply 在每个 Skill 更新时沿用现有临时目录与备份恢复；完成后的版本降级不由 `upgrade` 自动执行，需选择修复版本重新升级或人工恢复已审查的项目快照。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001/005 | package metadata + builder guard | 单测、`npm publish --dry-run --registry npmjs`、pack 文件表 | 执行观察 |
| AC-002/003 | Install/README | 版本与禁用命令静态检查、链接检查、人工契约复核 | 执行观察 + 交叉验证 |
| AC-004 | npm 发布 Workflow | 静态契约测试、YAML/命令检查、实际首发 Run | 执行观察 |
| AC-006 | 隔离安装 | 临时目录安装 tarball并运行 CLI/接入回归；全仓检查 | 执行观察 + 交叉验证 |
| AC-007/008 | 外部 Registry | npm view integrity/Provenance、Manifest 比对 | 交叉验证 |
| AC-009 | Upgrade + Distribution | 合成跨版本升级、CLI 端到端、冲突/降级/未安装负例、tarball 外采用回归 | 执行观察 + 交叉验证 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 内部 npm Registry 污染公共发布 | 高 | 发错渠道或误判包名 | package `publishConfig.registry`、Workflow `registry-url`、命令显式 `--registry` |
| Workflow 重试覆盖已发布版本 | 中 | 同版本内容冲突 | 发布前查询 Registry；只接受相同 integrity，否则失败关闭 |
| Install 与既有文档漂移 | 中 | Agent 执行错误 | 唯一权威链接、版本静态检查、定向术语复查 |
| Secret 暴露 | 低/高影响 | npm 供应链风险 | 只引用 Secret 名，不读取或输出值；首发后迁移 OIDC |
| Upgrade 被误解为自动追随 latest | 中 | 不可复现或意外行为漂移 | CLI 不访问 Registry；文档要求调用者固定精确版本并先 Plan |
| 新入口绕过 Distribution 保护 | 低/高影响 | 覆盖采用方修改 | 只组合公开 Distribution 函数；冲突与 Apply 后 Verify 回归 |

## 增量价值与删除条件

- 直接消费者：已通过本包 Distribution 接入的采用项目及其维护 Agent。
- 增量缺口：Host/npm 只能运行指定包版本，不能比较项目记录的 Foundation 版本、整套 Skill 摘要并以本仓冲突语义完成迁移。
- 验证：跨版本合成仓与真实 CLI/tarball 采用路径共同覆盖，不以命令存在作为完成证据。
- 删除或降级条件：若 Distribution 自身形成同等清晰的版本方向、迁移与一体化 Verify 契约，`upgrade` 应合并为别名；若主流 Host 原生消费本仓安装状态和 Manifest 并具备同等冲突保护，则移除该兼容入口。

## 未决问题

- [x] npmjs 账户已向仓库配置最小权限 `NPM_TOKEN`；Token 值未写入源码、Spec 或聊天。
- [ ] 首发完成后配置 npm Trusted Publisher 并撤销首发 Token。
