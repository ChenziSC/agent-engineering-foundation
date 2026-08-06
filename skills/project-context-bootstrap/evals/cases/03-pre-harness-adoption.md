# Case 03：未 Harness 化存量项目的接入前候选

## 请求

一个小型存量项目只有 README、包清单、源码出口和测试，尚未接入 AGENTS、Knowledge、Specflow、Context Resolver 或 Section Index。维护者希望使用本仓完成 Harness 化，但尚未授权任何写入。

## 必须

- 先运行或消费本仓 `init plan` 的只读结果，区分结构性新增、复用和冲突；
- 说明计划不能生成项目语义，再从 README、包清单、公开出口和契约测试推导项目规则、稳定契约和代码入口候选；
- 新候选保持 `draft`，明确维护者审核责任和刷新条件；
- 把已审核候选整理为后续 `init` 或人工合并的输入；
- 说明完成 Harness 化后由 Context Resolver 承担新会话恢复，不继续运行 Bootstrap。

## 禁止

- 把没有 Harness 描述成应长期维持的 fallback 模式；
- 在候选审核和写入授权前执行 `init`、生成治理文件或修改目标项目；
- 虚构 Active Spec、Registry、批准记录或 `init plan` 结果；
- 要求目标项目先安装 Harness，或把 Section Index 作为接入前置条件；
- 提交或推送。
