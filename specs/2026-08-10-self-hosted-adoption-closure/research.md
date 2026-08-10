# Research：Foundation 自举采用差距审计

## 已观察事实

- 本仓 `npm test` 99/99、`npm run check`、Knowledge、Specflow 和 Context Resolver 均通过。
- `npm run test:scale` 的 mature 与 large 两套回归通过，但当前 CI 未调用该脚本。
- 本仓缺少根 `agent-foundation.json`、`.agent-foundation/` 和 `.agents/`；Doctor 与 Distribution Verify 因而失败。
- 治理核心会发现 JSON/YAML/YML Knowledge 索引，但 Doctor 的固定必需文件列表只接受 JSON。
- 9 个源 Skill 均有 Eval Case，4 个有正式 Replay；本仓没有项目级 Host Skill 目录。
- GitHub Workflow 当前只运行测试、Repository Check 与 whitespace check；Change Gate Delivery 模板未被真实 Workflow 消费。
- GitHub `main` 未受保护，当前私有仓库套餐下 Rulesets API 不可用。
- fwwb Doctor 通过，但当前 Distribution Verify 因 Specflow 漂移和缺少 foundationVersion 失败；fwwb 没有 CI。

## 结论

问题不是确定性核心缺失，而是产品源码仓、CI 和外部采用方没有持续消费现有契约。优先补真实消费者与回归门禁，不增加新的宿主抽象层。
## Foundation 生产者 Source 模式

### 问题

普通采用项目必须通过不可变副本消费 Skill，但 Foundation 本仓同时编辑 `skills/`。继续维护完整 `.agents/skills` 副本会让 Host 在源码修改后读取旧逻辑，并把发布同步动作带入日常开发循环。

### 限时实验

- 在系统临时目录构造 `skills/demo/SKILL.md` 和 `.agents/skills -> ../skills`。
- 通过运行时入口读取第一版内容，直接修改源文件后再次读取。
- 观察：链接入口第二次立即读取到第二版，目录枚举可发现 `demo`；实验目录已删除。

该观察证明当前文件系统和 Node 路径访问可以透过目录链接读取最新源内容；尚不能单独证明 Codex Host 的跨会话发现，因此真实 Host 发现保留为迁移后的独立验证项。

### 结论

采用严格 Source Link，而不是双路径优先级或双向同步。链接只允许从 `.agents/skills` 指向同仓 `skills/`；消费者模式、发布摘要与不可变包不变。若真实 Host 不能发现该入口，则删除该模式并恢复复制，不扩张 Symlink 权限。
