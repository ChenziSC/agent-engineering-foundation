# Validation Report：消费级 CLI、交付门禁与规模回归

## 结果

- 状态：`pass`
- AC-001～AC-007 均有自动化证据；事项保持 Active，未获得归档、Commit、Push 或发布授权。

## 完成条件

| 完成条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001 | 源码与隔离 pack CLI 的 `--help`、`--version` 测试；非法参数仍返回 JSON 错误 | pass |
| AC-002 | pack 隔离安装闭环；Distribution 首装、旧记录迁移、版本复核与重复 Apply 测试 | pass |
| AC-003 | Continuous/Delivery 模板静态测试；Repository YAML 子集检查 | pass |
| AC-004 | `SYNTHETIC_SCALE_PROFILES` 的 small/mature/large 参数断言 | pass |
| AC-005 | 3 个 Active Spec 中 1 个全文、2 个 Section Index；历史 Spec 不进入 Load Plan；路径 Route、祖先规则和排序断言 | pass |
| AC-006 | small 尾部失效 Receipt/悬空 Route；large 尾部失效 Receipt/Knowledge 来源摘要 | pass |
| AC-007 | 默认 89 项测试、两项独立规模测试、仓库检查、pack dry-run、Knowledge Projection 和差异检查 | pass |

## 执行证据

- `npm test`：89/89 通过，约 28.6 秒；包含源码/pack CLI、Distribution、两类 CI 模板和 small 规模档。
- `npm run test:scale`：mature 与 large 两档通过；本次并行验收分别约 0.52 秒和 5.28 秒。
- `npm run check`：通过；Specflow 识别 10 个仓库事项，Knowledge、Distribution、YAML 子集、链接与敏感扫描均通过。
- `npm pack --dry-run --json`：生成 `agent-engineering-foundation@0.1.0` 预览，103 个文件，未执行发布。
- `git diff --check`：通过。
- Knowledge Projection：Plan 无警告，Apply 成功，Verify 为 `verified`；更新 `repository-positioning`、`self-hosted-governance`，复核 `deterministic-core-boundary`、`public-generalization-policy` 仍有效。

## 边界与结论

- large 档验证 1000 个历史 Spec、3 个 Active Spec、200 个 Knowledge、500 条 Route 和 6 层祖先规则；它是容量与正确性回归，不是性能 SLA，也不代表真实大型团队采用已验证。
- Active Spec 数量只作为夹具事实固定在不超过 3 个，不新增产品硬门禁。
- CLI 根包仍为 `private`，`0.1.0` 是本地候选版本；没有选择或执行正式发布渠道。
- CI 模板只读，不执行 Apply、Hook、归档、Commit、Push 或发布。
