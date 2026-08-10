# Research：GitHub Delivery Check 事件去重纠偏

## 真实故障证据

- Foundation PR #2 Run `31374609828`，Source SHA `4280d270496647c4e7ee0d7a5b74492b0d45e48e`。
- `verify` 成功；`delivery` 返回 `github-delivery-check-ambiguous`。
- 同 SHA 同时存在 Push Run `31374606776` 和 Pull Request Run `31374609828`，两者均产生 `quality / verify`。
- Delivery 失败后的“确认门禁没有改写项目”步骤被跳过。

## 结论

Provider 行为符合失败关闭契约。缺陷位于 Workflow 事件配置与失败路径复核，不应通过放宽 Check 精确匹配修复。
