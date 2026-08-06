# 项目组件治理与维护框架

## 定位

本框架用于管理一个项目中组件的发现、复用、放置、准入、迁移、废弃和验证。

它覆盖页面本地组件、应用共享组件、项目共享组件和项目标准组件。共享组件包只是其中一个可能的落点。

## 不解决什么

- 不生成设计稿对应的 UI 代码；
- 不规定 React、Vue、Web Components 或其他技术栈；
- 不要求项目必须有独立组件包；
- 不把所有组件都提升到共享层；
- 不替代设计系统、测试框架或 Package 发布工具；
- 不根据目录位置自动断言组件具有通用价值。

## 两个独立维度

### 放置层级

```text
页面本地
  ↓ 页面内出现稳定复用
应用共享
  ↓ 多个应用实际复用且依赖可共同消费
项目共享
  ↓ 契约、索引、兼容和验证要求完整
项目标准
```

层级描述复用范围和治理承诺，不是组件质量排名。单页面业务编排即使实现精良，也可能应该停留在页面本地。

### 生命周期

```text
candidate → active → deprecated → retired
                ↘ migrating ↗
```

- `candidate`：候选或试验实现；
- `active`：当前可使用并有维护入口；
- `migrating`：位置或实现正在变更，兼容尚未收口；
- `deprecated`：保留兼容，但不应新增调用；
- `retired`：已经从公开入口移除。

放置层级和生命周期不能混为一套状态。例如，应用共享组件和项目标准组件都可以处于 `deprecated`。

## 核心对象

| 对象 | 职责 |
| --- | --- |
| `ComponentAsset` | 一个可发现的组件实现及其稳定标识 |
| `ComponentSource` | 页面、应用、项目共享包或外部依赖等来源 |
| `ComponentContract` | 用途、边界、公开 API、示例、依赖和验证约定 |
| `RegistryEntry` | 用于检索的摘要、位置、层级、状态和契约入口 |
| `Candidate` | 与当前需求可能匹配的组件及其证据 |
| `GovernanceDecision` | `reuse`、`wrap`、`extend`、`new-local` 或 `promote` |
| `Consumer` | 组件的已知调用方和使用版本 |
| `Validation` | 构建、类型、Story、测试或消费方验证结果 |
| `MigrationPlan` | 源目标差异、兼容策略、步骤和回滚条件 |
| `DeprecationRecord` | 替代项、迁移窗口和删除条件 |

## 决策

### `reuse`

现有组件的语义、状态和交互已经满足需求，差异能通过公开配置解决。

### `wrap`

现有组件覆盖核心能力，仅需要消费方提供数据转换、默认值、上下文或局部布局。

### `extend`

现有组件缺少一个可复用且能向后兼容的能力，应扩展而不是创建近似组件。

### `new-local`

需要新建，但尚未证明跨场景复用，或组件明显依赖当前业务流程。

### `promote`

本地组件已有多个独立使用场景，公开边界和依赖稳定，可以提升到更高层级。

这些决策描述当前证据下的行动，不是组件的永久类型。新证据出现后可以重新评估。

## 唯一事实来源

| 信息 | 唯一事实来源 | 其他位置如何使用 |
| --- | --- | --- |
| 当前层级、状态、位置、契约入口 | 组件 Registry | 文档和工具引用 Registry |
| 公开 API 与使用边界 | 组件 Contract | Story、示例和调用方遵循 Contract |
| 当前运行行为 | 源码与可重复验证 | Contract 不得覆盖冲突行为 |
| 单次治理结论 | Decision Report | 不回写为永久事实 |
| 迁移进度 | Migration Plan 或项目任务系统 | Registry 只记录当前状态和入口 |

Registry 不复制完整 Props 和示例；Contract 不维护第二份组件位置清单。

## 职责划分

### Agent

- 理解需求语义和关键状态；
- 搜索并比较候选；
- 判断复用价值、放置层级和抽象边界；
- 设计迁移、废弃和风险匹配的验证；
- 明确事实、程序检查和推断。

### 确定性程序

- 解析目录、Registry、Contract 和公开导出；
- 检查路径、命名、链接和深路径引用；
- 运行构建、类型检查和测试；
- 比较迁移前后的公开结构；
- 在 Git Hook 或 CI 中执行结构门禁。

### 人工

- 确认争议性抽象边界和维护责任；
- 批准破坏性公开 API 变化；
- 决定大范围迁移、删除和发布；
- 处理跨团队所有权与版本策略。

程序通过不表示组件值得进入标准层；Agent 建议也不能代替发布授权。

## 最小闭环

一个项目首期只需要：

1. 可搜索的组件 Registry；
2. 标准或共享组件的 Contract；
3. 仓库级组件治理指令；
4. 一份治理决策报告；
5. 与风险匹配的验证；
6. 可选的确定性结构门禁；本仓已提供 Registry Validator 参考实现。

不需要先建设独立 Package、CLI、指标平台或文档站。

## 合成案例

### 案例一：配置差异

现有异步表格已经覆盖加载、空态和错误态，新页面只改变列和文案。决策为 `reuse`。

### 案例二：业务数据适配

现有人员选择器满足交互，新接口字段不同。决策为 `wrap`，数据转换留在消费方。

### 案例三：稳定跨应用能力

两个独立应用存在近似文件预览卡片。可以评估 `promote`，但必须先统一语义、依赖、契约、索引和验证。

### 案例四：历史迁移

旧日期选择器存在深路径调用，目标实现改变默认时区。迁移必须包含兼容入口、调用方扫描和回滚，不能只移动目录。

## 失败模式

- 只搜索共享包，忽略项目本地组件；
- 以视觉相似代替 API 与状态证据；
- 把“可能复用”当作标准准入依据；
- 维护多份相互漂移的组件清单；
- 用目录门禁代替语义判断；
- 只移动源码，不处理消费方和构建边界；
- 废弃组件时没有替代项和删除条件。

## 配套资产

- [项目组件治理与维护 Skill](../../skills/project-component-governance/SKILL.md)
- [可复制模板](../../templates/project-component-governance/README.md)
- [仓库接入 Blueprint](../../blueprints/project-component-governance/README.md)

## 已提供的确定性子集

将[配置示例](../../templates/project-component-governance/component-governance.config.example.yaml)和 [Registry 示例](../../templates/project-component-governance/component-registry.example.yaml)接入项目后，可以运行：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs component check --target <project-root>
```

当前参考实现检查结构、路径、Source 归属、标准目录登记、Contract、稳定入口、废弃替代项和代码深路径导入。显式启用 `language_analysis` 后，还会解析 JavaScript/TypeScript 静态命名导入导出，检查 Registry `exports`、公共入口、已知消费者和兼容性基线。它不根据目录或字段自动判断组件抽象是否合理，也不执行发布或迁移。

语言级检查不是完整编译器。`export *`、动态加载、条件导出、构建别名、类型系统兼容性和其他语言必须由专用 Parser 或人工复核；出现未解析的星号导出时只报告警告，不伪装成完整覆盖。

## 未来可选工程化

只有多个项目出现相同需求时，再考虑：

- Contract 正文语义与其他语言的公开导出解析器；
- 基于编译器或构建图的完整调用方与类型兼容差异扫描器；
- Registry 生成器；
- 组件相似候选检索；
- 迁移比较器；
- 本地优先、隐私受控的治理指标。
