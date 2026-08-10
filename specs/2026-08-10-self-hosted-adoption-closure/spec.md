# Spec：Foundation 自举采用、持续交付与采用方回归闭环

## 背景与目标

本仓既是帮助其他项目快速接入 AI 工程治理的 Foundation，也是这套治理骨架的首要采用方。当前 Specflow、Knowledge、Context Resolver、Repository Check 和测试已经在本仓真实运行，但 Starter、Doctor、Distribution、Host Skill 发现、Continuous/Delivery CI、不可变发布与采用方持续升级尚未形成同一条可重复闭环。

目标是让本仓和采用方都通过公开的同一套接入契约获得可验证结果，消除“模板存在、源码测试通过，但仓库自身没有正式接入”的特殊豁免。

## 主流 Host 与现有基线

- Agent Host 已负责项目级规则读取、工具执行和标准 Skill 发现；本仓不建设平行 Runtime。
- `open-agent` Host Adapter 已把项目级 Skill 目录固定为 `.agents/skills`。
- Starter、Doctor、Distribution、Context、Specflow、Knowledge、Change Gate 和 GitHub Actions Provider 已有确定性实现及合成测试。
- `npm pack` 已证明源码仓外可以运行 CLI；fwwb 已证明一次性 Starter、Distribution 和 Host 发现可用。

## 增量缺口

1. 本仓没有 `agent-foundation.json`、安装状态和 `.agents/skills`，无法通过自身 Doctor 与 Distribution Verify。
2. Doctor 固定要求 JSON Knowledge 索引，而治理核心实际支持 JSON/YAML/YML，本仓使用 YAML。
3. 当前 CI 没有执行本仓采用方级 Doctor、Distribution Verify 和大型规模回归；Delivery Change Gate 只存在模板和本地命令。
4. 包可打包但没有不可变发布约定，采用方无法稳定固定版本并持续升级。
5. fwwb 的结构 Doctor 通过，但 Distribution 已发生 Specflow 漂移，且没有 Continuous/Delivery CI。
6. 9 个 Skill 虽都有 Eval Case，但只有 4 个存在正式 Replay。
7. 本仓同时是 Skill 生产者；当前仍像采用方一样把运行时文件复制到 `.agents/skills`，导致修改 `skills/` 后 Host 继续读取旧副本，必须先更新摘要并 Apply 才能验证新逻辑。

## 直接消费者

- 本仓维护者与本仓 CI：持续验证 Foundation 是否仍能采用自身公开契约。
- fwwb：验证从一次接入升级为持续接入。
- 后续采用项目：复用相同 Starter、Distribution、CI 模板和平台路由，不依赖本仓特例。

## 行为契约与完成条件

- AC-001：本仓根目录存在合法 Integration Manifest，并通过与普通采用方相同的 `doctor`。
- AC-002：Doctor 接受治理核心已支持的 JSON/YAML/YML Knowledge 索引，且不要求复制两套事实。
- AC-003：本仓通过 Distribution 安装状态和 `.agents/skills` 真实暴露全部已发布 Skill；`skills/` 仍是唯一源码，镜像漂移会失败。
- AC-004：本仓 `distribution verify --target .`、Knowledge、Specflow、Context 和 Repository Check 均通过。
- AC-005：Continuous CI 执行单元测试、Repository Check、Doctor、Distribution Verify 和规模回归。
- AC-006：Delivery CI 使用同一不可变 Source SHA，在 Continuous 完成后执行 Change Gate；Active/未归档事项的负向候选失败关闭。
- AC-007：平台由 Git Remote 和 Registry 决定；只为真实消费者实现 Provider，未知平台明确阻断。
- AC-008：定义可复核的不可变 Foundation 包交付约定，采用方固定确切版本与摘要。
- AC-009：fwwb 完成当前版本升级并接入与仓库平台匹配的 Continuous/Delivery 验证，业务代码不因治理接入而变化。
- AC-010：大型规模回归进入 CI；缺少正式 Replay 的 Skill 补充可重复基线，成熟度只按真实证据声明。
- AC-011：本仓使用受限生产者 Source 模式，`.agents/skills` 只允许指向同仓 `skills/`；修改 Skill 源后下次 Host 读取可见，不要求先复制，采用项目仍使用摘要约束的不可变副本。

## 非目标

- 不把 Web、Design、埋点、组件或 Checkpoint 等可选领域能力强行应用到不相关的本仓变更。
- 不预先实现没有真实消费者的 GitLab、Gitee、Bitbucket 或内部平台 Adapter。
- 不建设新的通用 Agent Runtime、Skill 选择器、Capability Registry 或用户级安装系统。
- 不把 Check 成功等同于 Branch Protection、审批、合入、部署或发布成功。
- 不让普通采用项目启用 Source 模式，不允许仓外链接、任意 Symlink、双向同步或把 `.agents/skills` 变为第二源码。

## 删除条件

- 若 Agent Host 不再消费 `.agents/skills`，删除对应生成镜像并按真实 Host 契约调整薄 Adapter。
- 若 Doctor 的多格式索引支持不能被本仓或外部采用方直接消费，回退该兼容逻辑。
- 若某项 CI、发布或 Replay 产物没有本仓或 fwwb 的直接消费者，不进入默认必需路径。
- 若目标 Host 不能稳定读取严格仓内目录链接，删除 Source Link 模式并退回显式开发同步命令；不得放宽为任意 Symlink。
