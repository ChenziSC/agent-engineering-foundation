# Validation Report：公开发布来源复核与历史脱敏

## 当前结果

| 完成条件 | 证据 | 状态 |
| --- | --- | --- |
| AC-001、AC-002 | 根规则、长期 Knowledge、来源说明、能力图谱和发布清单已统一为逐版本人工来源与权属复核 | pass |
| AC-003、AC-004 | 原始 `main` 已保存为仓外 Git Bundle；两个报告 Blob 和对应 Receipt Blob 完成对象级重写，新报告摘要、Receipt Payload 摘要和 Source Revision 一致 | pass |
| AC-005 | Repository、Knowledge、Specflow、Knowledge Projection 和既有 Receipt 校验通过；只包含 `main` 的公开候选以 62 项仓外词表扫描 443 个文件、1543 个 Git 对象，其中 948 个内容对象完成扫描，无命中 | pass |

## 人工确认

- 维护者确认公开内容不是受限正文、代码、Prompt、Schema、测试或目录结构的改名版本；
- 维护者确认公开案例、URL、接口、版本和数据均为自行构造；
- 维护者确认没有其他来源不明或无权使用的第三方内容，Codex 宠物素材可以公开；
- 维护者确认自己有权公开本仓库；
- 维护者确认 Git 历史中的公开身份、提交邮箱和 Commit message 可以公开。

## GitHub 只读历史引用复核

- PR #1 无仓外词表命中；PR #2、PR #3 的只读引用仍包含已从 `main` 清除的本机绝对路径。
- 该路径只暴露本机目录组织方式和通用用户目录名，不包含凭证、内部域名、业务数据、人员姓名、私有代码或可用于访问系统的信息。
- 维护者明确确认该内容问题不大并接受其公开风险；因此不迁移仓库、不请求 GitHub Support 清除，也不把它继续列为发布 Blocker。

## 最终结论

- AC-001 至 AC-005 全部通过；
- 未解决 Blocker：无；
- 仓库可见性仍为 Private，改为 Public 是归档和 Push 之外的独立授权动作。
