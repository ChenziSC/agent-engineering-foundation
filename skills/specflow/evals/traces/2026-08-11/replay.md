# Specflow 按需产物行为回放 Trace

运行条件：2026-08-11 在本地仓库执行只读人工走查；工具为仓库读取与确定性校验；未指定模型或推理强度。只记录本次语义发生变化的 Case，不复制未变化的历史 Trace。

## Case 01

- [S01-A] 从公开 PRD、Figma 与仓库证据提炼范围和完成条件；因公共响应契约、跨模块取舍与分阶段交付，建立有证据的 Plan 和可追溯 Tasks，并区分不能猜测的不变量与待执行验证。
- [S01-B] 输出停在 Planned，没有修改代码、创建外部工作项或把输入原文复制成 Spec。

## Case 04

- [S04-A] 将错别字识别为无需长期产物的一次性维护；将需要长期追溯但无独立设计、拆分或审计职责的单文件展示行为收敛为 Meta 与 Spec，四类条件产物保持 `null`。
- [S04-B] 没有生成空 Plan、Tasks 或 Validation Report，也没有新增复杂度等级、Profile、状态或第二套流程；只在真实创建条件后补建产物。

## Case 07

- [S07-A] 按 Meta Artifact Map 回读 Spec、Plan、Tasks、Validation Report 与相关 Knowledge，形成 Projection 并计算实际声明产物和版本化实现摘要；先写并回读不可覆盖 Receipt，最后更新 Meta。
- [S07-B] 归档状态与未执行的提交、推送、PR/MR 分开报告，没有遗漏 Meta 已声明产物，也没有用文字总结代替摘要。
