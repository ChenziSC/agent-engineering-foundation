# Tasks：发布首个 npm 公共包

## 执行规则

- 每个任务关联 Spec 完成条件并保留执行 Evidence。
- npm、Commit、Push、Tag 和归档分别记录真实状态。
- 外部动作失败时不重写或隐藏已成功渠道。

## 任务

### T-01 建立公共包与安装契约

- 状态：`done`
- 依赖：无
- 对应：`AC-001`、`AC-002`、`AC-003`、`AC-005`
- 输入：当前 package、README、Harness/Bootstrap 契约和 npm 官方发布规则。
- 动作：更新 package 元数据和构建门禁；新增 `Install.md`；收敛 README/发布文档权威关系。
- 产物：`package.json`、`Install.md`、README、发布文档、构建器和测试。
- 验证：聚焦单测、pack 文件表、版本/链接/规范性术语复查。
- 阻塞条件：包名或版本需要改变。

### T-02 实现 npm 公共发布 Workflow

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-004`、`AC-008`
- 输入：现有 `release.yml` 与 Release Manifest。
- 动作：移除 GitHub Release 创建，增加 npmjs 配置、Provenance、唯一 tarball 发布、已存在版本保护与 integrity 回读。
- 产物：npm 发布 Workflow 与静态契约测试。
- 验证：Workflow 测试和本地可执行命令检查。
- 阻塞条件：无法在不暴露 Token 的情况下表达认证契约。

### T-03 隔离验证并形成不可变候选

- 状态：`done`
- 依赖：`T-01`、`T-02`
- 对应：`AC-006`
- 输入：完成的代码、文档和 Specflow 产物。
- 动作：执行聚焦、全量、规模、Repository、Doctor、Distribution、Knowledge、Specflow、pack 与源码仓外安装验证。
- 产物：`validation-report.md`、`safe-change-report.md` 和可提交候选。
- 验证：每项完成条件有实际 Evidence，未覆盖外部状态保持可见。
- 阻塞条件：工作区含范围外变化或回归失败。

### T-04 收口并发布 0.1.0

- 状态：`in-progress`
- 依赖：`T-03`
- 对应：`AC-007`、`AC-008`
- 输入：干净不可变 Commit、终态授权、已配置的 npmjs Secret、GitHub 权限。
- 动作：生成 Receipt、提交并推送、创建并推送 `v0.1.0` Tag、触发 npm 发布 Workflow、核对 Registry 外部结果。
- 产物：npm `0.1.0`、Provenance 和外部 Evidence；不创建 GitHub Release。
- 验证：npm integrity、Provenance 与 Tag Source Revision 一致。
- 阻塞条件：终态或 Tag/npm 发布未授权、包名被占用或任一门禁失败。

## 验收任务

### V-01 完成条件复核

- 状态：`in-progress`
- 动作：逐项检查 Spec 的完成条件和 npm Registry 真实状态。
- 产物：完成条件复核与 `validation-report.md`。
- 验证：本地通过不替代 npm Registry 外部 Evidence，Workflow 启动不标记为发布完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
