# Web Evidence 框架

成熟度：`reference-implemented`

该框架定义平台无关的 HAR、Trace 与页面版本证据边界，把采集文件中可以机械读取的事实转换为 Observation，并明确哪些性能结论不能从单一证据自动推出。

## 所有权

- Browser 或采集 Adapter 负责产生 HAR、Trace 和页面版本引用；
- 本框架只解析直接可观察的请求、体积、时序和任务持续时间；
- Agent 或人工负责场景选择、源码映射、因果解释和收益判断；
- Prefetch、性能评审或其他消费者在各自 Framework/Skill 中拥有领域决策。

## 当前产物

- [Web Evidence Schema](web-evidence.schema.json)
- [参考解析器](scripts/web-evidence.mjs)
- [合成测试](tests/web-evidence.test.mjs)

参考实现不采集浏览器数据，不读取 Source Map，不把单次 HAR/Trace 推导为稳定性能收益，也不替代多版本、同条件的行为与性能验证。
