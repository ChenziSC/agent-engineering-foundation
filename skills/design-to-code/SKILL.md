---
name: design-to-code
description: 将设计文件、图片或交互说明转化为项目代码时，建立设计版本、页面范围、现有组件复用、响应式、状态、交互、无障碍以及视觉和行为验证闭环。适用于设计稿还原、页面实现、UI 重构或视觉验收。
---

# Design-to-Code

1. 固定设计来源、版本、Frame 和目标代码范围；无法确认版本时不得宣称完整还原。
2. 先读取项目规则、组件 Registry、Token 和现有页面结构，优先复用符合契约的项目组件。
3. 将视觉层级、布局、字体、颜色、资源、响应式和交互状态拆成实现清单。
4. 明确正常、加载、空态、错误、禁用和权限中实际适用的状态。
5. 实现后分别收集视觉对照与行为验证；二者缺一不能输出 `validated`。
6. 不自动发布，不把设计平台元数据、内部链接或访问凭证写入公开产物。

输出使用[实现报告模板](assets/implementation-report-template.md)，失败边界见[常见失败](references/failure-modes.md)。项目采用 `frameworks/design-to-code/` 时，可用 Design Contract Validator 检查结构完整性。
