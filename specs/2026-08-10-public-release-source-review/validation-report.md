# Validation Report：公开发布来源复核与历史脱敏

## 当前结果

| 完成条件 | 证据 | 状态 |
| --- | --- | --- |
| AC-001、AC-002 | 根规则、长期 Knowledge、来源说明、能力图谱和发布清单已统一为逐版本人工来源与权属复核 | pass |
| AC-003、AC-004 | 原始 `main` 已保存为仓外 Git Bundle；两个报告 Blob 和对应 Receipt Blob 完成对象级重写，新报告摘要、Receipt Payload 摘要和 Source Revision 一致 | pass |
| AC-005 | Knowledge Projection Plan/Apply/Verify 和既有 Receipt 独立校验通过；全 Git 私有词表扫描需在远端残留分支处理后执行 | pending |

## 人工确认

- 维护者确认公开内容不是受限正文、代码、Prompt、Schema、测试或目录结构的改名版本；
- 维护者确认公开案例、URL、接口、版本和数据均为自行构造；
- 维护者确认没有其他来源不明或无权使用的第三方内容，Codex 宠物素材可以公开；
- 维护者确认自己有权公开本仓库；
- 维护者确认 Git 历史中的公开身份、提交邮箱和 Commit message 可以公开。

## 未完成事项

- `origin/codex/maturity-projection-consistency` 和 `origin/codex/self-hosted-adoption-closure` 的分支 Tip 仍包含旧路径；仓库公开前必须删除或同步重写，不能仅凭 `main` 通过宣称全仓干净；
- 在所有准备公开的远端引用收敛后，使用仓外私有词表复扫全部 Git 对象；
- 完成归档和最终交付检查。
