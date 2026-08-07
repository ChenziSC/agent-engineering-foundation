# Validation Report：补齐采用项目独立治理闭环

## 结果

- 事项 ID：`2026-08-07-standalone-adoption-closure`
- 检查日期：`2026-08-07`
- 结果：`pass`

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001/002 | T-01 | 本地 `npm pack` 产物在源码仓外安装，从无关工作目录完成 Init、9 Skill Distribution、Doctor、Knowledge、Specflow、Distribution Verify 与 Context；既有源码 CLI 测试继续通过 | pass |
| AC-003/004 | T-02 | 合成测试覆盖任务类型、路径、两者一致、未知任务加有效路径、选择器冲突和未映射路径；验证路径优先、Route 解释、代码入口与默认排除 | pass |
| AC-005/006 | T-03 | 9 Skill 首次安装、重复安装、旧完整副本迁移、用户修改、未知文件、运行时链接闭包与 pack 内容回归 | pass |
| AC-007 | T-04 | 可选 GitHub Actions 模板固定 CLI 包来源占位，静态验证仅调用 Doctor、Knowledge、Specflow、Distribution Verify 与 Git Diff；隔离 pack 测试执行等价治理命令 | pass |
| AC-008 | T-05/T-06 | 成熟合成项目全部通过；维护者指定的真实样本从默认主分支新建分支后完成独立 CLI、9 Skill 运行时分发、三类 Context Case、业务路径零改动和只读 Host 新会话发现验证 | pass |
| AC-009/010 | T-07/V-01 | 当前候选 `npm test` 87/87、`npm run check`、`git diff --check`、`npm pack --dry-run` 与 Knowledge Projection Plan/Apply/Verify 通过；真实样本确定性检查和四验证面文档复核通过 | pass |

## Evidence 来源关系

| 待验证主张 | 设计来源 | 验证 Evidence | 来源关系 | 结论 |
| --- | --- | --- | --- | --- |
| Pack CLI 可以脱离源码仓执行 | Spec 背景 | 本地 tarball 隔离安装后，从无关工作目录执行完整治理命令矩阵 | 执行观察 | pass |
| Resolver 的路径优先与诊断契约成立 | Plan 数据流 | 六类选择器 Case、成熟夹具与既有 Context 回归 | 执行观察 + 静态契约复核 | pass |
| 默认分发只包含运行时材料且可安全迁移 | Plan Distribution 决策 | pack 清单、首次/重复安装、旧版迁移、用户修改和未知文件注入测试 | 执行观察 + 交叉验证 | pass |
| 所选实现可以闭合全部完成条件 | 当前 Plan | 本仓 87 项测试、仓库检查、pack 检查、成熟夹具和 Knowledge Projection 通过；真实样本的独立 CLI、运行时分发、Context、业务零改动和 Host 发现均通过 | 多渠道；保留范围外未证明项 | pass |

- [x] 没有把设计说明、自生成检查清单或无外部观察的 Agent 复述作为唯一正确性证据。
- [x] 高风险契约的 Evidence 覆盖当前未提交候选的实际行为，并明确本地 pack 与合成项目适用范围。
- [x] Host 发现、CLI 执行、项目语义和 CI 门禁分别验证，没有互相替代或外推。

## 结构与内容检查

- [x] Spec、Plan、Tasks 和 Meta 均存在且 ID 一致。
- [x] Spec 有目标、非目标和可判定完成条件。
- [x] Plan 的关键决策有当前仓库证据并能追溯到 Spec。
- [x] Tasks 有输入、动作、产物、依赖和验证。
- [x] 未决问题和 Blocker 没有被隐藏。

## 生命周期检查

- [x] 当前事项保持 `in-progress`，不会被当作终态。
- [x] 尚未取得归档授权。
- [x] 尚未创建 Receipt 或修改终态字段。
- [x] 尚未执行 Commit、Push、PR/MR 或发布。

## Knowledge Projection

- [x] Context Resolver 已命中 `repository-positioning`、`deterministic-core-boundary` 和 `public-generalization-policy`。
- [x] 已逐项决定 `repository-positioning`、`deterministic-core-boundary`、`self-hosted-governance` 为 `update`，`public-generalization-policy` 为 `still-valid`。
- [x] Projection Plan/Apply/Verify 通过，Registry 来源摘要与本事项决策已更新。

## 新鲜度检查

- 影响范围是否变化：当前与 Meta Scope 一致。
- 依赖契约是否变化：计划改变 CLI、Resolver 与 Distribution 稳定契约，需在实现后更新长期知识。
- 是否需要重新 Review：需要。
- 相关 Evidence：本事项 Spec、Plan、实现与后续自动化结果。

## 尚未证明

- CLI 的正式公开发布渠道和其他 Agent Host 的原生发布路径；
- 项目业务行为、外部 Adapter 和运行环境就绪度，不能由治理检查推断。

## 下一步

- 保持事项 Active；归档、Commit、Push 和外部发布分别等待用户授权。
