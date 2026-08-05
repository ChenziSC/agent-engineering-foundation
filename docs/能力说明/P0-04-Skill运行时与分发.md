# P0-04 Skill 运行时与分发

## 定位

给定符合开放目录规范的 Skill 源码、目标 Agent 宿主和安装范围，产出可审计的安装或更新计划、执行结果及机器可读能力清单，同时避免破坏未知文件和链接源目录。

## 交付形态

- Blueprint：`designed`；
- 项目级参考子集：`reference-implemented`；
- 已提供：CLI、发现、校验、计划、安装、安全更新、开放 Host 和可注入 Adapter Registry；
- 尚未提供：Distribution Manifest 执行、用户级安装、动态插件加载和远端能力服务。

当前产物：[Skill 运行时与分发 Blueprint 与模板](../../blueprints/skill-runtime/README.md)、[项目基建 Adapter Blueprint](../../blueprints/infrastructure-adapters/README.md)和 `packages/harness/` 参考实现。

## 调用与不调用条件

应该调用：

- 需要发现和校验 Skill；
- 需要安装到项目级或用户级目录；
- 需要更新已安装 Skill；
- 需要为不同 Agent 宿主生成统一能力清单。

不应调用：

- 用户只是想运行某个 Skill；
- Skill 来源和目标宿主都不明确；
- 目标目录包含无法判断归属的文件且用户没有确认处理策略。

全局安装、覆盖和清理属于外部写操作，必须在执行前展示计划并遵循宿主授权策略。

## 输入

必需输入：

- Skill 源目录；
- 项目 Integration Manifest；
- 目标 Host；
- 安装范围：项目级或用户级；
- 操作模式：检查、安装或更新。

可选输入：

- Host Target Adapter 配置；
- 允许处理的 Legacy Alias；
- Dry-run；
- 文件冲突策略。

## 输出契约

- `DiscoveryResult`：发现的 Skill 和结构问题；
- `InstallPlan`：将新增、更新、保留或拒绝处理的路径；
- `ExecutionResult`：实际变更和失败项；
- `CapabilityRegistry`：机器可读能力、触发描述和版本；
- `SafetyReport`：Symlink、未知文件、权限和来源风险；
- `status`：`valid`、`blocked`、`planned`、`installed` 或 `updated`。

检查模式不得产生文件写入。阻塞状态必须保持目标目录不变。

## 职责划分

Agent 负责：

- 理解用户希望安装到哪个宿主和范围；
- 解释冲突、兼容性和风险；
- 在目标不明确时请求确认。

程序负责：

- 扫描 Skill 目录；
- 校验 Frontmatter、目录结构和 Manifest；
- 生成确定性的差异计划；
- 检查 Symlink 和文件归属；
- 执行已授权的安装或更新；
- 生成能力注册表。

用户负责授权用户级安装、覆盖冲突文件和删除旧内容。

## 依赖与状态所有权

- Skill 源目录是 Skill 内容的唯一事实来源；
- Integration Manifest 是项目 Adapter 选择的权威输入；Distribution Manifest 启用后必须和实际 Skill 目录一致；
- 已安装目录是派生副本，不允许反向静默修改 Skill 源码；
- Host Target Adapter 只描述目标目录和宿主差异；
- Runtime 不执行 Skill，也不依赖具体业务 Skill。

## 非目标与安全边界

- 不执行 Skill 本身；
- 不静默安装 Manifest 中不存在的 Skill；
- 不沿 Symlink 修改链接源目录；
- 不删除无法确认归属的文件；
- 默认不上传使用数据；
- 不处理 npm、编辑器插件或远端 Marketplace 的完整发布流程；
- 不把用户级安装默认为已授权。

## 当前资源

- Blueprint：开放目录、Host 差异、安全更新和兼容规则；
- 模板：Manifest、Host Target、安装计划和能力注册表；
- 合成案例：项目级安装、用户级授权、Symlink 和 Manifest 冲突；
- 自动化测试：覆盖默认 Host、自定义注入 Host、冲突、Symlink、用户修改和失败安全。

## 合成应用案例

1. 合成项目级安装无冲突，应先生成计划再执行。
2. 合成用户级安装未获授权，必须停止在 planned。
3. 合成目标路径是指向源目录的 Symlink，更新不得沿链接修改源文件。
4. 合成 Manifest 声明了不存在的 Skill，必须阻断并报告一致性错误。

## 当前验收

- 描述至少一种开放目录规范和自定义 Host 的扩展方式；
- 明确检查模式、Dry-run 和执行模式的边界；
- 项目级、用户级安装和更新流程完整；
- Symlink、未知 Host、未知 Skill 和未知文件都有安全处理规则；
- Manifest 与实际目录的一致性要求明确；
- 四个合成案例可以按 Blueprint 走查。

## 后续可选工程化

- Manifest 一致性测试。
- 用户级安装授权；
- 能力注册表投影与版本迁移；
