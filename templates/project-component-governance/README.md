# 项目组件治理模板

这些模板用于把组件治理接入现有项目，不要求项目采用固定框架或目录。

## 模板

- [组件契约](component-contract.template.md)：描述单个组件的公开使用边界。
- [组件 Registry 示例](component-registry.example.yaml)：提供统一发现入口。
- [准入检查清单](component-admission-checklist.md)：评审组件是否应提升层级。
- [仓库指令模板](repository-instructions.template.md)：嵌入项目或模块级 `AGENTS.md`。
- [校验配置示例](component-governance.config.example.yaml)：为当前参考 Validator 描述项目结构和确定性门禁。
- [公共导出兼容基线示例](public-exports.baseline.example.json)：记录采用方明确承诺保持的静态导出名称。

Skill 的决策报告、迁移计划和废弃记录位于 [`skills/project-component-governance/assets/`](../../skills/project-component-governance/assets/)。

## 使用顺序

1. 按项目真实结构修改仓库指令。
2. 为当前需要治理的组件建立 Registry，不要求一次盘点所有历史组件。
3. 只为具有稳定复用承诺的组件补 Contract。
4. 在新增、提升、迁移或废弃时运行检查清单。
5. 将配置复制为 `.component-governance/config.yaml`、Registry 放到配置声明的位置后，运行：

   ```bash
   agent-foundation component check --target <project-root>
   ```

Validator 会检查 Registry 唯一性、Source 与路径归属、标准目录登记、Contract、稳定入口、废弃替代项和代码中的禁止深路径导入。启用 `language_analysis` 时，还检查 JavaScript/TypeScript 静态导出、公共入口消费者及兼容基线。复杂重导出、运行时路径和其他语言仍需专用 Parser；组件是否值得复用或提升层级仍由 Agent 或人工判断。

不要同时维护 Markdown 清单和 YAML Registry 两套完整事实。若已有可靠目录或文档系统，可继续使用它作为 Registry，只需满足同等字段和可检索性。
