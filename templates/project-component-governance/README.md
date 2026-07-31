# 项目组件治理模板

这些模板用于把组件治理接入现有项目，不要求项目采用固定框架或目录。

## 模板

- [组件契约](component-contract.template.md)：描述单个组件的公开使用边界。
- [组件 Registry 示例](component-registry.example.yaml)：提供统一发现入口。
- [准入检查清单](component-admission-checklist.md)：评审组件是否应提升层级。
- [仓库指令模板](repository-instructions.template.md)：嵌入项目或模块级 `AGENTS.md`。
- [校验配置示例](component-governance.config.example.yaml)：为未来确定性校验器描述项目结构。

Skill 的决策报告、迁移计划和废弃记录位于 [`skills/project-component-governance/assets/`](../../skills/project-component-governance/assets/)。

## 使用顺序

1. 按项目真实结构修改仓库指令。
2. 为当前需要治理的组件建立 Registry，不要求一次盘点所有历史组件。
3. 只为具有稳定复用承诺的组件补 Contract。
4. 在新增、提升、迁移或废弃时运行检查清单。
5. 需要自动门禁时，再基于校验配置实现项目自己的检查器。

不要同时维护 Markdown 清单和 YAML Registry 两套完整事实。若已有可靠目录或文档系统，可继续使用它作为 Registry，只需满足同等字段和可检索性。
