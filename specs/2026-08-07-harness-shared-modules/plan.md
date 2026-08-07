# Plan：Harness 共享基础设施模块边界

## 方案

保持 `harness.mjs` 为唯一公共聚合入口。新增 `src/shared/errors.mjs`、`src/shared/filesystem.mjs` 和 `src/shared/structured-document.mjs`，领域代码只单向依赖这些无领域状态的底层模块。

## 依赖方向

```text
CLI / tests
  → harness.mjs（兼容聚合入口）
    → shared/structured-document.mjs
      → shared/errors.mjs
    → shared/filesystem.mjs
      → shared/errors.mjs
```

共享模块不导入 `harness.mjs`、Adapter、Skill 或领域 Framework。

## 实现顺序

1. 移动错误类型并从聚合入口重新导出。
2. 移动文件系统安全与摘要函数，修复聚合入口导入。
3. 移动结构化文档解析/序列化函数，保留原错误码和格式。
4. 运行定向与完整回归，检查 import graph、pack 文件和行数变化。
5. 更新文档、Knowledge Projection 与 Validation Report。

## 风险控制

- 纯移动优先，不同时改变算法；
- 每一步先运行 Harness 定向测试；
- `packages/harness/src` 已整体进入 pack 白名单，无需新增发布路径；
- 若必须向共享模块注入领域回调，停止抽取并保留原实现。
