# Tasks：公开发布来源复核与历史脱敏

## T-01 收敛公开发布治理规则

- 状态：`done`
- 对应：AC-001、AC-002
- 已完成：根规则、长期 Knowledge、来源说明、能力图谱、发布清单和 Registry 统一改为逐版本人工来源与权属复核。

## T-02 清洗绝对路径历史

- 状态：`done`
- 依赖：T-01
- 对应：AC-003、AC-004
- 已完成：原始 `main` 已保存为仓外 Git Bundle；两个报告 Blob 和对应 Receipt Blob 已做对象级重写，重写后的报告、Receipt 产物摘要、Payload 摘要和 Source Revision 验证一致。

## T-03 复核、归档并交付

- 状态：`in-progress`
- 依赖：T-02
- 对应：AC-005
- 已完成：Knowledge Projection 的 Plan、Apply、Verify 通过；重写后的既有 Receipt 独立验证通过。
- 待完成：两个已合并远端功能分支仍包含旧路径，需要独立授权删除或重写；之后执行全 Git 私有词表扫描、归档和最终推送。
