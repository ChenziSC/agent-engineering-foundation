# Plan：Foundation 自举采用、持续交付与采用方回归闭环

## 技术决策

### D-01 复用 minimal Preset，区分生产者 Source 模式与消费者复制模式

本仓继续使用 schemaVersion 2 Integration Manifest、`open-agent` Host Adapter 和同一 Distribution Manifest，但通过 Host Integration 的受控 `configRef` 声明生产者 Source 模式。该模式仅在目标项目就是当前 Foundation 源码根时成立，`.agents/skills` 必须是指向同仓 `skills/` 的精确相对目录链接；采用项目保持复制模式。`skills/` 始终是唯一源码，Source 模式不扩展为通用链接跟随或新的 Runtime。

### D-01A Source Link 安全与降级

Harness 只接受 `.agents/skills -> ../skills` 这一条仓内链接，并分别校验声明、目标、安装状态和 Manifest 源摘要；其他 Symlink 继续失败关闭。生产者模式不要求每次源码修改后 Apply，正式 Repository/Distribution 检查仍要求发布摘要与当前源内容一致。若 Host 实测不能发现或刷新该链接，回滚为复制模式，不以放宽路径安全换取热更新。

### D-02 Doctor 复用治理索引解析能力

`loadGovernanceIndexes` 已确定性选择 `registry` 与 `code-entry-map` 的 JSON/YAML/YML 文件。Doctor 的必需文件检查改为复用这一结果，不新增 Manifest 字段，也不复制 YAML/JSON Registry。

### D-03 Continuous 与 Delivery 分层

Continuous 验证代码、治理结构、安装镜像与规模基线；Delivery 在同一 Source SHA 上复核 Specflow Receipt 和显式 Required Check。实际 Required Check 保护能力属于 Git Provider 设置，无法配置时必须保留限制说明。

### D-04 发布先固化不可变契约，再选择渠道

CLI 消费者必须固定 SemVer、不可变制品和摘要。GitHub Release 或 npm Registry 的具体写操作需要独立授权；本事项先实现可验证的产物元数据、模板和测试，不擅自发布。

### D-05 fwwb 使用独立事项

Foundation 仓完成包与模板后，在 fwwb 新建采用方 Spec，升级受管 Skill 与安装记录，接入其真实 GitHub CI。Foundation Spec 只记录跨仓验证结果，不把两个仓库伪装成原子事务。

## 实施阶段

1. 本仓 Starter/Doctor/Distribution/Host 自接入。
2. 本仓生产者 Source 模式与消费者复制模式分流。
3. Continuous CI 与 Change Gate Delivery 联调。
4. 不可变包交付约定与 fwwb 持续升级。
5. Skill Replay 与规模回归基线收口。

## Replay 运行配置

- 对缺少正式 Replay 的 5 个 Skill 各执行一次独立会话；会话之间不共享历史 Trace、评分或业务仓库上下文。
- Host 使用 Codex CLI `0.147.0-alpha.6.5`，模型固定为 `gpt-5.6-sol`、推理强度 `high`，只读沙箱、临时会话，不访问网络、Git 历史或真实业务仓库。
- 每个会话只读取目标 Skill、必要 Reference、Rubric 和合成 Case；保存脱敏行为 Evidence 后，由确定性 Eval Runner 校验引用、阈值与阻断项。
- Replay 只证明所列合成 Case 的行为，不证明浏览器运行态、真实消费者或生产效果，也不据此自动调整成熟度。

## 验证策略

- 每阶段先增加确定性测试，再修改实现或配置。
- 本仓直接执行 Doctor、Distribution Verify、Context、Knowledge、Specflow、Repository Check、99 项回归和规模回归。
- CI 使用合成负向候选证明门禁会失败，不能只验证成功路径。
- fwwb 分别执行 Doctor 与 Distribution Verify，并核对业务代码 Diff 为空。
- 发布只以本地可复现 pack 与不可变元数据证明；未实际发布时不得声称可公开安装。

## 风险与缓解

- 采用项目的 `.agents/skills` 会形成文件镜像：明确生成物身份并由 Distribution Verify 阻断漂移；Foundation 本仓不保留该副本。
- Source Link 依赖 Host 与文件系统支持目录链接：先用合成目录验证即时读取，再由本仓新会话验证真实 Host 发现；失败时回滚到复制模式。
- Source 模式若错误开放给采用方会绕过不可变升级：同时绑定精确 `configRef`、Foundation 源码根和固定仓内目标，消费者测试继续验证普通复制。
- CI 同时执行多条治理命令可能重复工作：先保持显式、可诊断命令，出现稳定性能问题后再考虑聚合入口。
- Delivery Check 可能形成自依赖：Required Check 只能指向已完成的 Continuous Job，Delivery Job 不检查自身。
- GitHub 当前套餐可能无法启用保护规则：区分“检查真实失败”与“平台强制阻止合并”。
