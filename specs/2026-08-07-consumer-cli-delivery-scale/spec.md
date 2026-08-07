# Spec：消费级 CLI、交付门禁与规模回归

## 基本信息

- 事项 ID：`2026-08-07-consumer-cli-delivery-scale`
- 状态、影响范围和终态授权以同目录 `meta.yaml` 为唯一事实来源。

## 背景与增量缺口

前一事项已经证明本地 `npm pack` 产物可以从源码仓外完成治理命令闭环，并在维护者指定的小型存量项目上验证 Host 发现和业务代码零改动。对照成熟复杂项目后，仍有三个直接影响采用方的增量缺口：

1. CLI 缺少正常的 `--help`、`--version` 和非占位版本，采用方安装记录也不能说明由哪个 Foundation 版本生成；
2. 现有 CI 模板只覆盖持续结构检查，没有明确区分首次接入、日常检查和基于不可变 Git 候选的交付门禁；
3. 合成成熟夹具只覆盖少量对象，没有证明大量历史 Spec、Knowledge、Route 和深层规则下仍然确定、受预算控制并能发现尾部错误。

主流 Agent Host 已经负责会话、权限、Sandbox、Hook 和原生 Skill 发现。本事项不建设这些能力，也不复制采用项目的领域 CLI；增量只落在可固定的项目级治理工具契约、现有 Change Gate 的采用说明和可重复规模验证。

## 目标

- CLI 提供成功退出的帮助和版本入口；根包使用非占位的首个候选版本；
- Distribution 安装记录保存生成它的 Foundation 版本，Verify 能识别版本来源漂移但不把 CLI 正式发布作为前置条件；
- 文档和模板区分 Bootstrap、Continuous、Delivery，Delivery 复用现有只读 Change Gate；
- 参数化生成完全合成的大型项目，正常 Active Spec 数量固定在 0～3；
- 对大量历史 Spec、Knowledge、Route、嵌套规则和尾部错误进行确定性回归。

## 非目标

- 不执行 npm、Release、PR/MR 或其他外部发布；
- 不安装 Hook，不建设聚合 Runtime 或 Capability Registry；
- 不增加 Skill 选择、跨仓 Knowledge 或领域 Adapter；
- 不把 Active Spec 通常不超过 3 写成硬性仓库门禁；
- 不复制任何真实业务仓代码、规则、名称、配置或特有阈值；
- 不在本事项中进行 Harness 大规模重构。

## 直接消费者

- 使用本地 tarball、未来固定包版本或不可变 Commit 安装 CLI 的采用项目；
- 采用方的日常 CI 和交付 CI；
- Foundation 维护者在修改 Context、Specflow、Knowledge、Git Gate 时运行的回归测试。

## 完成条件

- [x] **AC-001** `agent-foundation --help` 与 `--version` 成功退出；版本与根 `package.json` 一致，既有非法参数仍返回结构化错误。
- [x] **AC-002** 从隔离 pack 安装的 CLI 返回相同版本；Distribution 安装记录包含 Foundation 版本并可由 Verify 复核。
- [x] **AC-003** 采用文档明确 Bootstrap、Continuous、Delivery 三阶段，Delivery 模板只使用不可变 Git 输入执行现有只读门禁。
- [x] **AC-004** 合成生成器覆盖 10/100/1000 个历史 Spec、最多 3 个 Active Spec、5/30/200 个 Knowledge、10/100/500 条 Route 和 1/3/6 层规则。
- [x] **AC-005** Context 在规模夹具中只加载 Active Spec，预算降级、路径优先、祖先规则和输出排序稳定。
- [x] **AC-006** Specflow 与 Knowledge 能在规模夹具末尾准确发现非法关系、失效摘要或悬空 Route，不因对象数量漏检。
- [x] **AC-007** 默认回归、独立规模回归、仓库检查、pack 检查和 `git diff --check` 通过；规模测试不依赖真实项目或网络。

## 删除条件

- 若 CLI 最终完全交由 Agent Host 原生固定版本机制且采用项目不再运行本仓 CLI，则删除安装版本记录与 Delivery 模板；
- 若规模夹具不能捕获任何当前实现风险、运行成本长期高于收益且已有等价的真实可重放公开夹具，则删除独立规模档，保留最小预算和尾部错误用例。

## 边界说明

规模回归证明确定性程序的容量和错误定位，不证明业务 Knowledge 正确、所有 Host 行为一致或真实大型团队已经采用。正式发布渠道和发布动作继续等待单独决策与授权。
