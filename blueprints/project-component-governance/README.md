# 项目组件治理与维护接入 Blueprint

## 目标

将[项目组件治理框架](../../frameworks/project-component-governance/README.md)接入一个已有项目，使 Agent 能发现和评估组件，程序能执行结构门禁，人工保留破坏性动作的决策权。

Blueprint 不要求项目使用固定框架、Monorepo 或独立组件包。

## 最小接入

```text
目标项目/
├── AGENTS.md
├── .component-governance/
│   └── registry.yaml
├── <应用组件目录>/
├── <项目共享组件目录>/
└── <稳定公开入口>
```

采用以下资产：

- [仓库指令模板](../../templates/project-component-governance/repository-instructions.template.md)
- [Registry 示例](../../templates/project-component-governance/component-registry.example.yaml)
- [组件 Contract 模板](../../templates/project-component-governance/component-contract.template.md)
- [准入检查清单](../../templates/project-component-governance/component-admission-checklist.md)

## 数据流

```text
需求或维护请求
  → Agent 读取仓库结构与 Registry
  → 检索 Contract、源码、导出、Story/Test 和调用方
  → 输出治理决策
  → 人工确认争议边界或破坏性动作
  → 实现变更
  → 确定性结构检查 + 风险匹配验证
  → 更新 Registry、Contract 或迁移记录
```

## 接入步骤

### 1. 发现真实组件来源

从 Workspace 配置、Package 清单、导入关系和目录结构识别：

- 页面或模块本地组件；
- 应用共享组件；
- 项目共享或标准组件；
- 已安装的解决方案和基础组件。

不要先创建一套理想目录再强迫历史代码迁入。

### 2. 选择唯一 Registry

可以使用 YAML、JSON、文档站或已有目录系统，但必须能提供：

- 稳定标识；
- 位置和来源；
- 放置层级；
- 生命周期状态；
- 用途与检索关键词；
- Contract 和公开入口；
- 已知消费方与验证入口。

若已有可靠 Registry，不要再创建第二份完整清单。

### 3. 渐进补充 Contract

优先为以下组件补 Contract：

- 新进入项目标准层的组件；
- 高频复用但容易误用的组件；
- 正在迁移或废弃的公开组件；
- API、依赖或状态模型复杂的组件。

不要求一次为全部历史组件补文档。

### 4. 写入 Agent 指令

将组件发现顺序、决策类型、标准层条件和授权边界放进根或模块级 `AGENTS.md`。详细规则由 Framework 和模板维护，项目指令只记录本仓库的真实入口。

### 5. 接入治理 Skill

使用 [`project-component-governance`](../../skills/project-component-governance/SKILL.md)处理：

- 新增组件前的复用与放置判断；
- 标准组件准入；
- 历史组件迁移；
- 公开组件废弃；
- 组件治理评审。

Skill 默认输出报告，不自动执行迁移或发布。

## 确定性门禁

项目把[校验配置示例](../../templates/project-component-governance/component-governance.config.example.yaml)复制为 `.component-governance/config.yaml` 后，可以直接运行本仓参考 Validator：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs component check --target <project-root>
```

### 建议检查

- 标准目录中的组件是否存在 Registry 条目和 Contract；
- Registry 路径、Contract 和公开入口是否存在；
- 是否出现禁止的深路径导入；
- 迁移后是否残留旧入口；
- 废弃组件是否声明替代项；
- 本次变更要求的构建、类型和测试是否通过。

### 不应交给检查器

- 组件是否真的具有跨场景价值；
- 两个视觉相似组件是否语义等价；
- 一次性业务编排是否值得抽象；
- API 扩展是否提供了更好的开发体验。

这些问题需要 Agent 基于证据判断，并由人工处理争议。

## Git Hook 与 CI

首期可以只在 CI 中运行，避免本地环境差异阻塞开发。规则稳定后再按项目需要接入 pre-commit。

逃生参数只能处理明确记录的迁移例外，不能绕过测试失败、未授权删除或破坏性变更确认。

## 渐进采用

### 阶段一：可发现

- 建立 Registry；
- 写入 Agent 发现规则；
- 不迁移历史组件。

### 阶段二：可治理

- 新标准组件必须有 Contract；
- 新增和迁移使用治理报告；
- 按风险补验证。

### 阶段三：可门禁

- 增加 Registry、Contract、导出和深路径检查；
- 在 CI 中执行；
- 用真实误报和漏报调整规则。

### 阶段四：可演进

- 管理废弃和替代关系；
- 支持跨目录迁移比较；
- 多个项目确有需要时再建设通用校验器。

## 安全与隐私

- Registry、Contract 和示例不记录内部账号、真实生产数据或稳定个人标识；
- 公开模板使用合成组件和包名；
- 外部文档站和设计平台通过不透明引用接入；
- 自动迁移、删除公开导出和发布制品需要显式授权。

## 生产化缺口

当前通用 CLI/Validator 只覆盖确定性结构子集。采用方仍需按技术栈选择或实现：

- 语言和目录解析方式；
- 公开导出模型；
- 深路径识别规则；
- 测试与构建命令；
- Git Hook、CI 或独立审计的执行位置。
