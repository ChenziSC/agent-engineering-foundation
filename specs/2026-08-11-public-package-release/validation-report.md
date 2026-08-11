# Validation Report：发布首个 npm 公共包

## 结果

- 事项 ID：`2026-08-11-public-package-release`
- 检查日期：`2026-08-11`
- 结果：`local-verified / publish-pending`

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001～005 | T-01/T-02 | 公共元数据与固定 Registry；Workflow/发布脚本聚焦测试 6/6；pack/publish dry-run | pass |
| AC-006 | T-03 | 源码仓外 tarball 接入闭环；全量 117/117；规模 2/2；Repository/Doctor/Distribution/Knowledge/Specflow | pass |
| AC-007 | T-04 | npmjs 包名仍返回 E404；仓库 `NPM_TOKEN` 已配置，但 Tag、Workflow 和 Registry 发布尚未执行 | pending |
| AC-008 | T-01～T-04 | Install、交付文档、Workflow 和本报告分层记录 Git/npm/Host 状态 | pass |

## Evidence 来源关系

| 待验证主张 | 设计来源 | 验证 Evidence | 来源关系 | 结论 |
| --- | --- | --- | --- | --- |
| 当前候选具备首发基础 | Spec/Plan | 全量与规模测试、Repository/Doctor/Distribution/Knowledge/Specflow 全部通过 | 执行观察 | pass |
| npm 发布构建器生成唯一制品 | Plan | 聚焦测试；`npm pack --dry-run` 生成 111 个文件、158607 字节，包含 `Install.md` | 执行观察 | pass |
| 制品可脱离源码仓采用 | Install/CLI 契约 | 临时目录安装 tarball，完成 version、init plan/apply、Distribution apply/verify、Doctor 和重复 apply | 执行观察 | pass |
| npm Workflow 可幂等首发 | Plan/Workflow | YAML 子集检查；发布脚本单测覆盖 publish、skip 和 integrity mismatch；真实 Registry Run 尚未执行 | 执行观察＋边界说明 | partial |

- [x] 没有把设计说明或自生成清单作为唯一正确性证据。
- [x] 高风险本地契约已覆盖成功、重复执行和 integrity 冲突路径。
- [ ] 最终不可变候选和实际 npm 发布行为仍需外部 Evidence。
- [x] npm、Git、Host 和项目就绪保持分层表达。

## 结构与内容检查

- [x] Meta、Spec、Plan、Tasks 与 Validation Report 存在且 ID 一致。
- [x] Spec 有目标、非目标和可判定完成条件。
- [x] Plan 的关键决策可追溯到仓库与官方发布规则。
- [x] Tasks 有输入、动作、产物、依赖和验证。
- [x] 首发 Token 已通过仓库 Secret 配置且未记录值；首发后 Trusted Publishing 迁移保持可见。

## 生命周期检查

- [x] 当前事项保持 Active。
- [ ] 尚未获得独立终态授权。
- [x] Commit/Push 已获得单独授权；该授权不外推为 Tag、npm 发布或终态授权。
- [ ] 尚未形成 Tag、Receipt 与 npm Registry 外部 Evidence。
- [x] 没有从用户发布目标推断 Spec 已归档。

## Knowledge Projection

- [x] 已复核 `repository-positioning`、`deterministic-core-boundary`、`self-hosted-governance` 和 `public-generalization-policy`。
- [x] Knowledge Projection Plan、Apply、Verify 全部通过，Registry 摘要已刷新。

## 新鲜度检查

- 影响范围是否变化：新增发布脚本，已同步 Meta Scope。
- 依赖契约是否变化：公共包、npm-only Workflow 与首次接入契约已变化并复核。
- 是否需要重新 Review：实际发布后只复核外部 Registry、Provenance 和 Source Revision Evidence。
- 相关 Evidence：本事项、实际测试、Release Manifest 与 npm Registry。

## 尚未证明

- npm 公共包实际发布、Provenance 和 Registry integrity 一致性。
- 其他 Agent Host、操作系统或真实业务项目的新增有效性。

## 验证明细

- `npm test`：117/117 通过。
- `npm run test:scale`：2/2 通过。
- `npm run check`、Doctor、Distribution Verify、Knowledge Check、Specflow Check：全部通过。
- `npm pack --dry-run --json --registry=https://registry.npmjs.org/`：通过；111 个文件，含 `Install.md`。
- `npm publish --dry-run --json --registry=https://registry.npmjs.org/`：通过；目标为 public access 与 npmjs.org；提示实际发布仍需登录。
- 源码仓外 tarball：安装成功，CLI 为 `0.1.0`，init/Distribution/Doctor 闭环通过；将临时目录规范化为真实路径后，重复 Distribution Apply 为 unchanged。
- Knowledge Projection：Plan、Apply、Verify 通过。

## 下一步

- GitHub Actions Secret `NPM_TOKEN` 已配置；其值未进入仓库、Spec、日志或聊天。
- 本次只执行已授权的 Commit/Push；获得明确终态与 Tag/npm 发布授权后再触发 npm-only Workflow，并核对 integrity 与 Provenance。
