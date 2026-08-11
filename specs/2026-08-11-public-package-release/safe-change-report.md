# 安全变更报告：首个 npm 公共包

## 候选与边界

- 候选版本：`agent-engineering-foundation@0.1.0`，当前分支为 `codex/public-release-0.1.0`。
- 目标：发布 npm 公共包、提供 Agent 安装入口，并从 Tag 构建可核对 Provenance 的唯一 tarball。
- 非目标：GitHub Release、自动修改采用项目业务代码、通用包管理 Runtime 或新增 Host 抽象层。
- 外部动作：本次仅获授权 Commit/Push；Tag、npm Publish 与 GitHub Release 均不在本次授权范围内。

## 影响与风险

| 路径 | 消费者/契约 | 主要风险 | 防护与 Evidence |
| --- | --- | --- | --- |
| `package.json`、包文件表 | npm 使用者 | 发到内部 Registry、遗漏运行时文件 | 固定 npmjs.org/public/provenance；pack 文件表与隔离安装 |
| `Install.md`、README | 人类与 Coding Agent | 不固定版本、越权写项目 | 固定 `0.1.0`；分离只读计划与授权写入；静态测试 |
| `release-package.mjs` | 发布 Workflow | 脏工作区或非公共候选进入制品 | 成功与拒绝路径单测；Manifest 绑定 Source Revision/integrity |
| `release.yml`、发布脚本 | npm Registry | 重试覆盖同版本、凭证泄漏 | 相同 integrity 才跳过；冲突失败关闭；只引用 Secret 名 |
| `harness.mjs`、CLI | 已采用项目与受管 Skill | 降级、覆盖用户修改、未安装误用或版本比较错误 | 精确版本驱动；复用 Distribution；升级/迁移/noop/预发布版本与负例测试；Apply 后 Verify |
| Docs/Knowledge/Spec | 维护者与后续 Agent | GitHub Release 与 npm 状态混淆 | 明确 npm-only；Knowledge Projection 与仓库门禁 |

## 增量覆盖矩阵

| 场景 | Evidence | 结果 |
| --- | --- | --- |
| 公共候选与失败门禁 | 发布构建器/Workflow 聚焦测试 6/6 | pass |
| 真实包文件与源码仓外接入 | pack dry-run；临时目录 tarball 安装与 CLI/Distribution/Doctor 闭环 | pass |
| 全仓回归 | 全量 119/119；规模 2/2；Repository、Doctor、Distribution、Knowledge、Specflow | pass |
| 项目级 Upgrade | 合成 1.0.0→2.0.0、预发布 SemVer、迁移/noop、未安装/降级/用户修改阻断；打包后 CLI Upgrade | pass |
| Workflow YAML 与重试语义 | Repository YAML 子集检查；publish/skip/mismatch 单测 | pass |
| npm Registry 与 Provenance | 实际包仍为 E404；仓库 Secret 已配置，真实 Workflow Run 尚未执行 | pending |

## 回滚与停止条件

- npm 发布前可回滚候选或删除未推送 Tag；不会产生 Registry 残留。
- npm `0.1.0` 一旦公开，不覆盖、不重发不同内容；修复使用新版本。
- 包名被占用、Registry 不是 npmjs.org、Tag/版本/Manifest 不一致、测试失败或 integrity 冲突时停止。
- Upgrade Plan 有任一冲突时不写入；每项 Skill 更新沿用临时目录与备份恢复，完成后的降级不由 Upgrade 自动执行。
- Token 不进入仓库、日志、Spec 或聊天；首发完成后迁移 Trusted Publishing 并撤销首发 Token。

## 当前状态

- `local-verified / publish-pending`：公共包与 Upgrade 的本地、合成跨版本和源码仓外验证已完成，仓库 Secret 已配置；本轮未获 Commit/Push/Tag/npm 发布授权，工作区保持未提交。
