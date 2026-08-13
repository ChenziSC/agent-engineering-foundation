# Tasks：受管 Skill 触发时自动更新

## 执行规则

- 更新逻辑只实现一次；Skill 仅携带统一短声明。
- 生产者模式不执行 Registry 查询或自更新。
- 不自动 Commit、Push、Tag、发布或归档。

## 任务

### T-01 实现共享 Update Guard

- 状态：`completed`
- 对应：`AC-001`～`AC-004`
- 动作：实现生产者检测、TTL、稳定 SemVer、Registry 查询、精确版本 Upgrade、原子状态和紧凑失败结果。
- 验证：注入依赖覆盖 producer、cached、current、updated、degraded 与并发锁。

### T-02 接入 Distribution 与 Skill 契约

- 状态：`completed`
- 依赖：`T-01`
- 对应：`AC-005`、`AC-006`
- 动作：消费者安装/验证共享 Guard；为现存 Skill 增加统一前置声明；Repository Check 约束未来 Skill。
- 验证：copy/source-link 回归、全量 Skill 正例与缺失声明负例。

### T-03 收敛文档、Knowledge 与全量验证

- 状态：`completed`
- 依赖：`T-02`
- 对应：`AC-007`、`AC-008`
- 动作：更新安装说明、能力边界和长期知识，执行聚焦及全量验证。
- 验证：npm test、test:scale、check、Doctor、Distribution、Knowledge、Specflow。
