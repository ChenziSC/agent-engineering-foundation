# Plan：消费级 CLI、交付门禁与规模回归

## 方案摘要

保持一个根 Package 和一个 CLI。CLI 从自身包根读取版本；Distribution 在既有受管记录顶层保存 Foundation 版本。采用路径只新增文档和可选 Delivery CI 模板，继续调用现有命令。规模回归通过测试时生成临时仓库，不提交千级固定夹具。

## 关键决策

| 决策 | 选择理由 | 明确不做 |
| --- | --- | --- |
| 根包版本升级为首个候选版本但保持 `private` | 消除 `0.0.0` 占位，同时避免误触正式发布 | 不 publish、不选择公开 Registry |
| `--help` 输出人类可读用法，`--version` 输出稳定单行 | 符合常见 CLI 使用方式；普通命令继续输出 JSON | 不新增复杂文档生成器 |
| 安装记录顶层保存 Foundation 版本 | 一次记录覆盖全部 Skill，避免每条重复 | 不尝试从已安装包反推 tarball registry integrity |
| Delivery 模板直接调用 Change Gate | 已有确定性实现，不新增聚合命令 | 不安装 Hook、不自动归档 |
| Active Spec 正常规模为 0～3 | 符合维护者对真实并发事项的判断 | 不把数量写成硬门禁 |
| 测试时参数化生成规模仓库 | 可重复、脱敏、Ground Truth 明确 | 不复制真实大型项目 |

## 实现路径

1. 为 CLI 增加包版本解析、帮助和版本短路；扩展 pack 测试。
2. 扩展安装状态 Schema，Apply 写入 Foundation 版本，Plan/Verify 报告版本迁移或不一致。
3. 在采用模板中定义三级路径，新增只读 Delivery GitHub Actions 示例并静态测试。
4. 抽取合成项目测试辅助器，生成 small/mature/scale 三档数据和尾部错误。
5. 执行默认测试、规模测试、仓库检查、Projection 复核和 pack 隔离验证。

## 验证策略

- CLI：源码入口与隔离 pack 分别执行 `--help`、`--version` 和非法参数。
- Distribution：首次 Apply、旧记录迁移、版本漂移、重复 Apply 和 Verify。
- CI：静态扫描只读命令、不可变 Source 输入、无 Apply/Commit/Push/发布。
- Scale：检查输出内容、数量、稳定排序和错误定位；只设置宽松测试超时，不把机器毫秒数作为公共 SLA。
- Repository：`npm test`、`npm run check`、`npm pack --dry-run`、`git diff --check`。

## 风险与回退

- 安装记录格式变化：保持 `schemaVersion: 1` 兼容读取，缺少版本的旧记录由下一次 Apply 补齐；若影响旧项目则回退为可选字段。
- 千级文件拖慢默认测试：small 进入默认回归，mature/large 使用独立脚本，在 Harness、Context、Specflow 或 Knowledge 相关变更时运行。
- Delivery 模板误用可变引用：模板强制 Base/Source 显式输入并在说明中要求不可变 SHA。
