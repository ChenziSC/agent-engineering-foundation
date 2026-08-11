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

### 4. 独立计划并安装完整 Skill 集合

先只读运行：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution plan --target /absolute/path/to/target-project
```

存在冲突时停止。只有维护者再次明确授权后，才运行：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation distribution apply --target /absolute/path/to/target-project
```

完整接入默认使用 Distribution；不要用若干单项 `skill install` 冒充完整底座。

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

## TODO

- [ ] 确认目标项目和固定包版本
- [ ] 运行只读 `init plan`
- [ ] 对存量项目完成 Bootstrap 候选审核
- [ ] 分别取得 Init 与 Distribution Apply 授权
- [ ] 运行 Verify、Doctor 和 Host 新会话观察
- [ ] 输出分层状态与下一动作，然后停止

该清单只用于当前执行编排，不是项目状态、批准或安装记录的事实来源。
