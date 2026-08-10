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

- 状态：`done`
- 依赖：T-02
- 对应：AC-005
- 已完成：Knowledge Projection 的 Plan、Apply、Verify 通过；重写后的既有 Receipt 独立验证通过；只包含 `main` 的公开候选使用 62 项仓外私有词表完成全 Git 扫描并通过；PR #2、PR #3 的只读历史路径经维护者人工复核为可接受低风险命中；已获得归档、Commit 和 Push 授权。
