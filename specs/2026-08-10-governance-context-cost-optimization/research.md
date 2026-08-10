# Research：治理上下文成本归因与最小加载优化

## 已知观察

- 规则就绪审计：治理候选输入上下文约为 baseline 的 `1.38x`，工具批次由 6 增至 22；候选执行了完整 Skill readiness 盘点。
- 普通有界任务：治理候选输入上下文约为 baseline 的 `1.70x`，工具批次 13 与 14 接近；该任务未触发 Bootstrap，但使用了其他任务型治理能力并扩大了证据读取。
- 稳定契约复核：治理候选输入上下文约为 baseline 的 `0.56x`，工具批次由 11 降至 8；Knowledge 和停止边界帮助收窄范围。
- 上述 Token 含缓存与工具结果，只能作为同环境方向性信号。

## 静态盘点初步结论

### 已观察事实

- 真实样本根规则约束日常 Context Resolver 复用、Specflow、领域 Skill 状态、项目入口、跨仓边界和验证安全。
- 样本安装了 9 个项目级 Skill，其中部分在根规则中明确标记为 `not-applicable` 或仅专项触发。
- 样本 Knowledge Registry 只有 2 条长期知识，Code Entry Map 只有 4 条任务路由；Active Spec 数量处于正常小规模，不支持“索引规模导致回归”的解释。
- 当前 Resolver 的 `loadPlan` 只包含命中规则、范围相关 Active Spec 核心产物和 Knowledge；`startPaths` 与 `excludeByDefault` 是导航信息，不进入 Load Plan。
- 同时提供任务类型和路径时，路径路由优先；任务类型未知会告警，但不会因此自动加载全部 Knowledge。

### 待验证推断

- 完整项目 Skill 集合由 Host 发现所产生的固定输入，可能是普通任务额外成本的一部分。
- 普通任务 `1.70x` 更可能由后续工具读取体量和跨仓取证主导，因为工具批次数接近但累计输入差异很大。
- 根规则正文可能包含任务不需要的领域状态，但在确认选择性安装与停止边界收益前不应直接压缩。

## 实验设计

| 变体 | 只改变 | 保持不变 | 要回答的问题 |
| --- | --- | --- | --- |
| `current-full` | 无 | 当前治理候选全部输入 | 当前结果能否复现 |
| `selective-skills` | 临时移除普通任务不直接需要的项目 Skill | 业务源码、规则、Knowledge、Spec | Host Skill 集合贡献多少 |
| `load-plan-stop` | 明确只消费 Resolver Load Plan 和命中入口，Evidence 不要求时停止 | `selective-skills` 其他内容 | 继续展开治理目录和代码取证贡献多少 |

每个变体至少两轮独立只读会话。公开结果只保存变体、聚合计量、读取类别、可观察结论和行为门禁，不保存样本标识、原始 Prompt、完整日志或私有路径。

## 决策门

- 若某一变量在重复轮次中方向一致，并保持行为质量，则只修改该变量对应的现有入口。
- 若结果落在会话波动内或互相冲突，只允许一次范围明确的补充实验；仍不稳定则停止实现。
- 若收益要求删减安全、跨仓停止条件或真实项目事实，拒绝该优化。

## 两轮结果

| 变体 | 平均输入 Token | 相对完整候选 | 平均命令数 | 平均命令输出字节 | 结论 |
| --- | ---: | ---: | ---: | ---: | --- |
| `current-full` | 604,435 | baseline | 23 | 287,965 | 当前参照 |
| `selective-skills` | 795,286 | +32% | 53 | 273,348 | 拒绝；Agent 扩大自主取证，未稳定降本 |
| `load-plan-stop` | 700,426 | +16% | 21.5 | 258,393 | 拒绝；输出体量下降未转化为总输入下降 |

所有轮次均使用同一业务内容、任务文本、`gpt-5.6-sol`、`high` reasoning、只读沙箱和临时副本。临时副本不含 Git 元数据且未暴露全局 Harness 命令，三组均出现不同数量的可恢复探测失败，因此这些数据只支持方向性否定，不支持精确性能 SLA。

## 事件分类结论

- 每轮普通任务都读取 Specflow 主入口，并继续读取部分输入、Workflow 或生命周期 Reference；Specflow 相关命令输出约 8～16 KB。
- 当前 Specflow 主文件约 13 KB，包含首次归档、Event、Relation Transaction、Delivery Gate 等只在终态任务触发的命令和实现细节；相同事实已由 `references/archive-and-lifecycle.md`、`references/change-gate.md` 和相关模板持有。
- 由于主文件在 Skill 触发时必须完整读取，将终态细节改为按需 Reference 路由可以确定性降低普通 Spec/Plan 任务的固定输入；该收益不依赖后续代码搜索随机性。

## 实施决策

- 不修改 Skill 安装集合、Distribution Manifest、Context Resolver 或项目根规则；
- 缩减 Specflow 主入口中的终态实现细节，保留明确授权、Receipt 先写、Meta 最后写、不可覆盖历史、关系事务和外部动作独立授权等不变量；
- 增加普通规划任务不展开归档/关系事务材料的行为 Case，并复跑全部 Specflow Replay。

## 最小实现回归

Specflow 主入口从 `12,986` 字节降至 `9,534` 字节，固定输入减少 `3,452` 字节，约为 27%。终态授权、Receipt 先写、Meta 最后写、不可覆盖不可变历史、关系事务和外部动作独立授权等不变量仍留在主入口；命令、Schema 与完整终态流程继续由原有 Reference 按需承载。

在相同普通有界任务下执行两轮 `compact-specflow` 只读会话：

| 变体 | 平均输入 Token | 相对完整候选 | 平均命令数 | 平均命令输出字节 | Specflow 相关输出 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `current-full` | 604,435 | baseline | 23 | 287,965 | 11,763 |
| `compact-specflow` | 758,063 | +25% | 27 | 298,406 | 7,799（约 -34%） |

两轮候选都没有读取归档、Lifecycle Event、Relation Transaction 或 Delivery Gate 的完整 Reference，行为 Case 通过；但端到端输入 Token 仍受代码搜索、跨仓探测、缓存和模型轮次主导，未显示稳定下降。因此本事项接受“固定治理输入和无关 Specflow 材料减少”的窄收益，不把结果外推为整场会话 Token 优化，也不继续改 Resolver、安装集合或项目模板。
