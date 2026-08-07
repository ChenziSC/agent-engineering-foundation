# Tasks：消费级 CLI、交付门禁与规模回归

## T-01 建立事项与基线

- 状态：`done`
- 对应：全部 AC 的治理前置。
- 验证：Spec、Plan、Tasks、Meta 完整且事项保持 Active。

## T-02 CLI 与安装版本契约

- 状态：`done`
- 对应：AC-001、AC-002。
- 动作：实现 help/version、候选版本和安装记录版本复核。
- 验证：源码与隔离 pack CLI 测试、Distribution 迁移回归。

## T-03 三级采用与 Delivery 模板

- 状态：`done`
- 对应：AC-003。
- 动作：更新采用说明并新增只读 Delivery CI 模板。
- 验证：静态门禁与合成 Git 候选测试。

## T-04 参数化大型项目规模回归

- 状态：`done`
- 对应：AC-004、AC-005、AC-006。
- 动作：增加合成生成器、三档规模和尾部错误用例；Active Spec 不超过 3。
- 验证：默认与独立规模测试。

## V-01 最终验收

- 状态：`done`
- 对应：AC-007。
- 动作：运行完整回归、仓库检查、pack 和差异检查，更新 Validation Report。
