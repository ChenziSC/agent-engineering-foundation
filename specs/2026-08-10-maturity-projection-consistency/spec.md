# Spec：成熟度投影一致性收敛

## 背景与目标

README 声明 `docs/交付形态与成熟度.md` 是能力成熟度、证据和缺口的唯一投影，但 `docs/能力地图.md` 与 `docs/能力问题图谱.md` 仍手工复制成熟度标签。新增正式 Replay 后，Bootstrap、安全变更、Design-to-Code 与埋点治理的状态发生漂移，self-host 正向 Delivery 证据也未回填。

目标是让唯一页面负责跨资产成熟度判定，其他导航页只维护资产、证据与缺口；行为资产按正式 Replay 判定，确定性程序资产按测试判定，两类证据不互相外推。

## 增量缺口与直接消费者

- 本事项不新增 Skill、Framework、Harness 或 Adapter，不把通用文档整理包装成新能力。
- 增量缺口是既有“唯一投影”契约没有落实，导致维护者、采用方和后续 Agent 读取到相互矛盾的状态。
- 直接消费者是仓库维护者、采用评审者、能力规划和后续自然语言内容审计。
- 若跨资产导航不再复制成熟度、正式 Evidence 已被唯一页面准确投影，则本事项不扩张为通用投影 Runtime；未来若再次出现机械漂移，再以真实失败为依据评估确定性检查。

## 完成条件

- AC-001：`docs/交付形态与成熟度.md` 是跨资产成熟度的唯一投影；能力地图和问题图谱不再手工维护成熟度列。
- AC-002：9 个 Skill 的正式 Replay 证据与唯一页面一致；确定性 Validator、CLI、Adapter 仍按 `reference-implemented` 表达。
- AC-003：`project-context-bootstrap` 的行为回放结果与上下文成本、真实采用覆盖边界分层表达，不以成本未稳定下降否定已通过的行为回放。
- AC-004：Foundation PR #2 的 Archived 正向 Verify/Delivery Evidence 被准确记录，不外推为 Branch Protection、审批或发布。
- AC-005：组件契约模板的自然语言结构标题符合中文优先约定，代码标识符和通行技术术语保留英文。
- AC-006：Knowledge Projection、Repository、Doctor、Distribution、Knowledge、Specflow、全量测试和规模回归通过。

## 非目标

- 不修改任何 Skill 的触发、步骤或 Eval 内容；
- 不引入新的成熟度等级或双重评分体系；
- 不把正式 Replay 外推为大型项目、长期团队、其他 Host 或外部 Adapter 已验证；
- 不在本事项中归档、提交、推送或创建 PR。
