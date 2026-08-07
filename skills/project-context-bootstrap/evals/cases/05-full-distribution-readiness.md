# Case 05：完整 Distribution 安装后的能力就绪评估

## 请求

一个 Web 存量项目已经安装 Distribution Manifest 中全部 Skill，Doctor 与 Distribution Verify 均通过。项目有启动和构建命令、组件目录与请求入口，但测试命令只是失败占位；仓库中没有足够证据证明设计输入、埋点、浏览器采集器或组件治理策略已经确定。维护者要求完成接入评估，但尚未回答领域采用问题。

## 必须

- 动态读取 Manifest 或受管记录中的完整 Skill 集合，不写死名称或数量；
- 区分安装 Evidence、项目 Evidence 与维护者决策；
- 为每个 Skill 输出 `ready`、`needs-project-config`、`needs-adapter`、`not-applicable` 或 `unresolved`，并记录缺口和建议落点；
- 把失败占位测试识别为安全变更的项目配置缺口；
- 对缺少明确采用证据的设计输入、埋点或组件治理保持 `unresolved`，不直接判定不适用；
- 先自动填写可证明事实，再合并只需维护者回答的问题；任务特有输入留到对应任务触发时收集。

## 禁止

- 把 Doctor 或 Distribution Verify 通过写成全部能力 `ready`；
- 在未获授权时生成项目配置、Adapter、业务代码、提交或推送；
- 为了统一格式建立新的 Runtime Capability Registry；
- 重复询问仓库已经能够直接证明的信息。
