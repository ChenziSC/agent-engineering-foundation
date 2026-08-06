# project-context-bootstrap 独立回放 Trace

本 Trace 只记录本次独立回放的最小行为证据。评分依据为本次四个 Case 在合成项目和本仓的实际观察、Case 文本与 Rubric；不保存完整 Prompt、工具原始输出、凭证、个人信息、真实业务数据或临时绝对路径。

## 运行条件

- 合成项目：完全自行构造的 synthetic-project-v1 固定快照；无 Git，明确记录为快照边界。
- 本仓：当前工作区的 Git HEAD；回放期间保留既有未提交修改，未创建提交。
- 工具：只读 context resolve、定向 rg/局部行区间读取、合成测试命令和确定性 Skill/Eval 工具。
- 外部写入：无；未提交、推送、发布或归档。

## Case 01：为存量项目建立最小上下文

- [C01-A] 两个目标均选择 bootstrap。每个目标先运行 Resolver：合成项目只返回目录模块 Active Spec 和根/模块规则；本仓只返回与 project-context-bootstrap 相关的 Active Spec、根规则和最小 Knowledge 加载计划。合成目标以固定快照标识复核；本仓记录为 Git HEAD 加工作区已有脏状态，未把未提交内容伪装成不可变版本。
- [C01-B] 合成项目将根规则、目录模块规则、目录入口、价格 Schema、购物车直接消费者、邻近测试分别归入项目规则、稳定契约候选、动态锚点和验证入口；没有扫描缓存、Registry 等无关模块。
- [C01-C] 合成项目发现当前 Schema/实现把 price 约束为数值，而过期说明仍描述展示字符串；该冲突保持可见，候选契约标为 draft，并给出维护者批准和 Schema/实现变化刷新条件。缺失商品异常分支被记录为已观察事实，不把旧说明提升为当前契约。
- [C01-D] 本仓将 Context Contract、Skill、Harness/Resolver、Knowledge、Distribution 和当前事项视为不同职责层；稳定候选未写入 Knowledge，动态切片未写入长期文档。两项目均只输出建议写入位置和未确认项，回放期间没有修改源码或治理状态。

## Case 02：消费大型 Spec 的 Section Index

- [C02-A] 合成项目先收到 Resolver 返回，结果明确为 sectioned，全文加载计划排除三个核心 Markdown，并返回包含“完成条件”“数据流”“兼容与迁移”“UI 细节”和未完成 Tasks 的索引。只有索引选定相关章节后才读取正文。
- [C02-B] 合成项目按索引局部读取完成条件、数据流、兼容与迁移及未完成 Tasks，未读取 UI 细节；随后只在缓存模块和邻近测试内检索缓存入口。切片确认读写函数存在，但版本字段、适配器和兼容消费者缺少证据，保持为 unresolved，没有把索引标题当作正文摘要。
- [C02-C] 本仓 Resolver 将大型父事项标为 sectioned；索引显示完成条件、非目标、兼容与迁移、验证策略以及 Context 相关 T-18/T-19/T-33。先按索引选择这些章节，再局部读取正文，确认当前相关 Tasks 已完成而非虚构未完成项；未重读整个事项，也没有在 Resolver 返回前搜索其核心文档。
- [C02-D] 本仓随后围绕 resolveProjectContext、预算分配、Section Index、loadPlan、CLI 入口和最近的 Context 测试生成切片；索引仅作导航，正文与实现分别作为 Evidence。没有在 Skill 内重新实现 Markdown 分段或替换 Resolver 预算。

## Case 03：生成有边界的任务切片

- [C03-A] 合成项目选择 slice，以 getCatalogItem 和 price 为锚点，记录固定快照边界、目录目标路径和非目标。关系闭合为入口路由 → loadCatalogItem → normalizePrice → 返回价格 → previewCart；同时关联价格 Schema、缺失商品异常分支和价格测试。
- [C03-B] 本仓选择 slice，以 CLI 的 context resolve 和 resolveProjectContext/loadMode 为锚点。观察到 CLI 参数 → Resolver → Knowledge/Code Entry Map → Active Spec → 全文预算 → Section Index 或 loadPlan 的数据链，直接消费者为 CLI、Harness 测试和 Skill 说明；错误路径包括非法选择器、知识检查阻断、越界路径和缺失 Spec 产物。
- [C03-C] 两个切片都在直接消费者、契约/Schema、异常和最近测试足以支持当前判断的位置停止；没有递归展开无关库存、推荐、其他 Skill 或完整调用图。当前调用链被标为动态视图，未提升为长期稳定契约，详细结果建议归当前 Spec 的 Evidence/Research。

## Case 04：动态消费者无法由静态搜索闭合

- [C04-A] 合成项目静态搜索确认 Registry 的 register/dispatch 入口以及 local-a、local-b 两个本地消费者，二者标为 observed；采用方所说的插件消费者没有清单、运行 Trace 或 Registry 快照，标为 unresolved，整体状态为 partial。输出建议补充 Registry 快照、运行态 Trace 或 Adapter Evidence。
- [C04-B] 本仓静态证据确认 Adapter Registry 的显式注册、默认 Host/Source Control 记录、Harness 的 get 消费点以及 Blueprint/测试中的注入消费者；仓外采用方可能注册的 Adapter 和外部调用者不可由本仓静态搜索闭合，标为 unresolved，整体保持 partial。没有虚构插件名称、数量、外部拓扑或调用关系。
- [C04-C] 两个项目都保留已证实的本地关系，同时显式列出运行态和外部边界；没有因证据不足丢弃已观察事实，也没有读取或输出凭证、真实个人信息、生产数据或无关敏感配置。
