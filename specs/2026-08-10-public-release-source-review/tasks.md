# Tasks：公开发布来源复核与历史脱敏

## T-01 收敛公开发布治理规则

- 状态：`done`
- 对应：AC-001、AC-002
- 已完成：根规则、长期 Knowledge、来源说明、能力图谱、发布清单和 Registry 统一改为逐版本人工来源与权属复核。

## T-02 清洗绝对路径历史

- 状态：`in-progress`
- 依赖：T-01
- 对应：AC-003、AC-004
- 动作：创建本地备份引用与 Bundle；重写绝对路径及对应归档 Receipt；记录旧、新 HEAD。

## T-03 复核、归档并交付

- 状态：`pending`
- 依赖：T-02
- 对应：AC-005
- 动作：更新 Knowledge Projection，执行全量校验，形成最终 Receipt，更新 Meta，提交并强制推送已授权的 `main`。
