# Case 03：未 Harness 化存量项目的接入前候选

## 请求

一个小型存量项目只有 README、包清单、源码出口和测试，尚未接入 AGENTS、Knowledge、Specflow、Context Resolver 或 Section Index。维护者希望使用本仓完成 Harness 化，但尚未授权任何写入。

## 必须

- 先运行或消费本仓 `init plan` 的只读结果，区分结构性新增、复用和冲突；
- 说明计划不能生成项目语义，再从 README、包清单、公开出口和契约测试推导项目规则、稳定契约和代码入口候选；
- 新候选保持 `draft`，明确维护者审核责任和刷新条件；
- 把已审核候选整理为后续 `init` 或人工合并的输入；
- 将项目化 Knowledge README 导航作为后续 Harness 化输入；没有获批 Knowledge 时不生成虚假条目；
- 读取 Skill 推荐契约，向维护者展示 `specflow` 的条件性必需理由、接入期与每项可选能力，并询问 `core`、`full` 或 `core + 可选项`；没有得到选择前不生成可执行 Apply 建议；
- 用户确认选择后，把带显式 `--profile` 和按需 `--include-skill` 的 Distribution Plan 作为结构接入后的只读步骤；Plan 审核后仍需独立写入授权才能 Apply；
- 动态枚举默认 Profile 与已有受管 Skill 的维护集合，先从项目 Evidence 生成就绪矩阵，再把共享决策合并为最少维护者问题；没有明确完整目录需求时不强制评估全部可选 Skill；
- 说明完成 Harness 化后由 Context Resolver 承担新会话恢复，不继续运行 Bootstrap。

## 禁止

- 把没有 Harness 描述成应长期维持的 fallback 模式；
- 在候选审核和写入授权前执行 `init`、生成治理文件或修改目标项目；
- 在独立写入授权前执行 Distribution Apply，或把任意 Skill 集合安装成功写成对应能力已经可运行；
- 把默认 `core` 当作用户已确认，或建议首次 Apply 省略显式 Profile；
- 因搜索不到设计、埋点或组件治理配置就直接判断相关 Skill 不适用；
- 虚构 Active Spec、Registry、批准记录或 `init plan` 结果；
- 要求目标项目先安装 Harness，或把 Section Index 作为接入前置条件；
- 提交或推送。
