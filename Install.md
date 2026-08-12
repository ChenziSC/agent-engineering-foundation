# Agent Foundation 安装与接入

本文件专供 Coding Agent 使用：把公开 npm 包 `agent-engineering-foundation@0.1.0` 接入一个目标项目。它不是当前 Foundation 源码仓的依赖安装教程，也不授权修改业务代码、Git 历史、CI 或外部系统。

## Goal

使用风险最低、可重复且可审核的路径，为目标项目建立 Foundation 治理结构和项目级 Skill；把“包可执行”“结构已接入”“Host 可发现”和“领域能力已就绪”分别报告。

## Required Inputs

- 目标项目经 `realpath` 解析后的规范化绝对路径；目标不得是当前 Foundation 源码仓；
- 固定版本 `0.1.0`，不得用 `latest` 替代；
- 目标项目是新项目还是已有真实内容的存量项目；
- 当前用户对目标目录的写入权限，以及后续每个写阶段的明确授权。

首先只读确认公开 CLI：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- agent-foundation --version
```

期望输出：`agent-foundation 0.1.0`。失败时停止，不切换到内部 Registry，不使用 `sudo`，也不安装未固定版本。

## Success Criteria

- `init plan` 已明确列出新增、复用和冲突，没有把计划误写成已执行；
- 经授权的 `init` 没有覆盖未知同路径内容，也没有通过 Symlink 写出目标仓；
- `distribution verify` 与 `doctor` 通过，或准确报告各自阻塞；
- 新 Agent 会话是否实际发现根规则和受管 Skill 被单独验证；
- 每个 Skill 的状态使用 `ready`、`needs-project-config`、`needs-adapter`、`not-applicable` 或 `unresolved`，不因安装成功自动标记为 `ready`；
- 最终报告给出精确下一动作并停在接入边界，不继续普通开发、Commit、Push、CI 或发布。

## Operating Rules

- 保持幂等：所有写操作之前先运行对应 Plan，重复执行不得损坏已有接入；
- `init` 与 `distribution apply` 是两个独立写阶段，分别取得授权；
- 首次 Distribution 写入前，先向用户展示推荐信息并取得明确的 Skill 选择；选择确认不等于 Apply 写入授权；
- 冲突时停止并保留目标内容，不自动合并项目规则、Knowledge 或用户修改过的 Skill；
- 不读取或输出 `.env`、Token、凭证、生产数据和无关敏感配置；
- 不使用 `sudo`，不安装系统包，不更改全局 npm Registry；
- 遇到 `unsafe-symlink` 时先核对规范化真实路径；只在它仍指向预期目标时使用该真实路径重做 Plan，不绕过 Symlink 门禁；
- 不自动执行 Stage、Commit、Push、Tag、PR/MR、CI 修改、部署或发布；
- 优先使用公开 CLI 的既有命令，不用临时脚本重写 Init、Distribution 或 Doctor；
- 安装一致、项目语义、Host 发现和外部 Adapter 分开验证，不能互相替代。

## Decision Tree

### 1. 只读盘点目标结构

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation init plan --target /absolute/path/to/target-project
```

- 如果目标就是 Foundation 源码仓，停止；源码仓使用自身 `agent-foundation.json`、Doctor 和 Source Link，不运行通用 Init。
- 如果计划返回冲突，记录冲突路径，不执行 `init`。
- 如果是存量项目，继续执行下一节的项目语义审核。
- 如果是尚无项目事实的新项目，展示 Starter 计划，并在写入前让维护者确认仍需补齐的项目规则。

### 2. 存量项目先生成项目特有候选

按照本包 `skills/project-context-bootstrap/SKILL.md` 执行只读 Bootstrap：从目标项目的规则、Manifest、公开入口、测试和稳定文档生成待审核的项目规则、Knowledge、代码入口和能力就绪候选。不要在候选审核前运行 `init`。

Bootstrap 输出 `ready-for-review` 只表示材料可供裁决，不表示已批准或已写入。向维护者展示候选、证据、冲突和最少未决问题，然后停止等待决定。

### 3. 获得结构写入授权后执行 Init

只有维护者明确批准 Starter 新增内容或人工合并方案后，才运行：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation init --target /absolute/path/to/target-project
```

若 Plan 曾有冲突，不要把 `init` 当作自动合并器。写入后重新查看实际差异，确认业务路径没有被修改。

### 4. 选择并安装推荐 Skill 集合

Agent 先只读查看当前版本的推荐层级和 Profile：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation skill recommend
```

Agent 必须把输出整理为用户可读清单，逐项说明 `defaultSelected`、`requiredWhen`、`reason` 和 `when`，然后询问以下三种互斥选择：

1. `core`：只安装 `specflow`。它只在项目采用本仓完整治理流程，以 Spec、Plan、Tasks 和验证证据管理研发事项时必须安装；只单独使用某个领域 Skill 时不是无条件依赖。
2. `core + 可选项`：在 `core` 上增加一个或多个 onboarding/optional Skill，例如 `safe-change`。
3. `full`：安装完整公开能力目录。

`project-context-bootstrap` 属于首次接入或长期上下文重建时使用的 onboarding 能力，完成接入后日常任务不重复运行。其他领域 Skill 按真实任务选择，不因出现在发布白名单中自动安装。

用户确认选择后，才只读运行对应 Plan。默认 `core`：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution plan --profile core --target /absolute/path/to/target-project
```

`core + 可选项` 使用可重复参数：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution plan --profile core \
  --include-skill safe-change \
  --target /absolute/path/to/target-project
```

完整目录使用 `--profile full`。存在冲突时停止。Plan 通过后，只有维护者再次明确授权写入，才用完全相同的 `--profile` 和 `--include-skill` 选择运行 Apply：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution apply --profile core --target /absolute/path/to/target-project
```

首次普通项目 Apply 没有显式 `--profile` 时必须以 `skill-selection-required` 停止。Distribution 维护“所选 Profile + 显式可选项 + 仍在 Manifest 中的既有受管 Skill”，切换到较小 Profile 不表示卸载或停止升级已有可选 Skill。单项 `skill install` 仍可用于局部维护，但首次组合接入优先使用同一次 Distribution Plan/Apply，以便完整展示和验证维护集合。

### 5. 验证确定性接入状态

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution verify --target /absolute/path/to/target-project
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation doctor --target /absolute/path/to/target-project
```

随后启动一个新的目标 Agent Host 会话，验证它实际读取目标项目根规则并发现受管 Skill。CLI 通过不能替代 Host 观察，Host 发现也不能替代 Doctor 或项目语义审核。

### 6. 交付接入报告并停止

报告以下四层状态：

1. npm CLI：固定版本是否可执行；
2. Harness：Init、Distribution 和 Doctor 的实际结果；
3. Host：新会话实际发现的规则与 Skill 路径；
4. 项目：能力就绪矩阵、未决问题和精确下一动作。

完成报告后停止。后续开发任务使用目标项目的 `context resolve` 和已安装 Skill，不重复 Bootstrap。

## Upgrade Existing Adoption

本节只适用于已经成功执行过 Distribution 的项目。CLI 版本选择仍由维护者或 Agent Host 负责：先确认一个已经发布、经过批准的精确版本，再用该版本执行 Upgrade。命令不会查询 npm `latest`、修改项目依赖或配置 Hook。

以下以当前固定版本演示；升级到后续版本时，把两处 `0.1.0` 同时替换为批准的目标版本：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation upgrade plan --target /absolute/path/to/target-project
```

Plan 只读报告已安装 Foundation 版本、目标 CLI 版本、记录的 Profile、已有受管 Skill 的动作与冲突。没有显式 `--profile` 时复用安装状态；旧状态缺少 Profile 时按历史 `full` 兼容。出现以下任一情况时停止，不运行 Apply：

- 项目尚未通过 Distribution 安装 Foundation；
- 目标版本低于已安装版本；
- 受管 Skill 被采用方修改、缺失或包含未知文件；
- Manifest、安装记录、内容摘要或 Symlink 边界不一致。

只有维护者审核 Plan 并明确批准本次升级写入后，才执行：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation upgrade apply --target /absolute/path/to/target-project
```

Apply 复用 Distribution 的临时目录、摘要检查和冲突保护，并在写入后执行 Verify。`upgraded`、`migrated`、`refreshed` 或 `unchanged` 只证明 Foundation 受管内容一致；升级后仍应开启新的 Host 会话确认 Skill 发现，并按项目风险运行自身测试。命令不自动 Commit、Push、修改 CI 或发布项目。

## TODO

- [ ] 确认目标项目和固定包版本
- [ ] 运行只读 `init plan`
- [ ] 对存量项目完成 Bootstrap 候选审核
- [ ] Agent 展示 `skill recommend` 的必需条件、理由和简介
- [ ] 用户确认 `core`、`full` 或 `core + 可选项`
- [ ] 用确认后的显式参数运行只读 Distribution Plan
- [ ] 分别取得 Init 与 Distribution Apply 授权
- [ ] 运行 Verify、Doctor 和 Host 新会话观察
- [ ] 输出分层状态与下一动作，然后停止
- [ ] 后续升级时先运行 `upgrade plan`，单独授权后再运行 `upgrade apply`

该清单只用于当前执行编排，不是项目状态、批准或安装记录的事实来源。
