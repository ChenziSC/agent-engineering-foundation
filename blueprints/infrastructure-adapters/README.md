# 项目基建 Adapter Blueprint

成熟度：公共契约 `designed`；Host 注册与本地 Git Source Control 子集 `reference-implemented`

这个 Blueprint 用于让采用方把自己的 Agent Host、代码托管、工作项、设计输入、浏览器证据、发布和遥测基建接入治理骨架，同时避免公开核心依赖某个平台、SDK、凭证格式或组织实现。

## 基本原则

- 核心只认识能力契约、Adapter ID、状态和不透明引用；
- Adapter 在采用方控制的代码中显式注册，不扫描目录，也不自动加载未知代码；
- 每种能力保留自己的输入输出，不设计无所不包的万能 Adapter；
- 外部读取、写入、审批和发布权限不会由“已配置 Adapter”自动获得；
- 真实凭证、内部地址、租户、应用标识和平台字段不进入公开 Manifest。

## Integration Manifest

Starter 的 `agent-foundation.json` 使用 `integrations` 声明项目需要的能力：

```json
{
  "schemaVersion": 2,
  "integrations": [
    {
      "capability": "host",
      "adapterId": "open-agent",
      "configRef": null
    }
  ]
}
```

Manifest 顶层字段分为：

- `schemaVersion`、`preset`：选择并校验受支持契约；
- `directories`、`context`、`integrations`、`safety`：执行契约，必须被 Harness 消费或校验；其中 `context` 控制 Active Spec 全文预算、索引上限和单个规则文件预算；
- `metadata`：受限的辅助理解信息，可包含 `description`、`documentationRef` 和 `labels`，不产生权限、安全或执行效果。

每个 `integrations` 项只能包含：

- `capability`：能力类别；
- `adapterId`：采用方注册的稳定 ID；
- `configRef`：可选的不透明配置引用，必须使用 URI 形式；不能内联配置或凭证。

Manifest 声明需求，不负责加载代码。当前 Harness 要求且只允许一个项目级 Host；其他能力可以声明多个不同 Adapter。

允许保存辅助理解信息不等于允许任意扩展字段。描述性信息进入 `metadata`；任何看起来会改变路径、权限、冲突或凭证处理的字段，都必须先有实际消费者和验证，否则不得加入 Manifest。

完整的合成配置见[Integration Manifest 示例](../../templates/infrastructure-adapters/agent-foundation.example.json)。

## 显式注册

```js
import path from 'node:path';
import { createAdapterRegistry } from '../../adapters/registry.mjs';
import { planSkill } from '../../packages/harness/src/harness.mjs';

const projectHost = {
  capability: 'host',
  id: 'example-project-host',
  displayName: 'Example Project Host',
  scope: 'project',
  supportsSymlinks: false,
  resolveProjectSkillsDir(projectRoot) {
    return path.join(projectRoot, '.example-agent', 'skills');
  },
};

const adapterRegistry = createAdapterRegistry([projectHost]);
await planSkill({ target: '/path/to/project', name: 'specflow', adapterRegistry });
```

真实项目通常提供自己的组合入口，将私有 Adapter 与公开 Harness 连接。公开 CLI 不接受任意模块路径，避免把“插件扩展”变成无授权代码执行。

## 当前能力插槽

| Capability | 主要职责 | 当前成熟度 |
| --- | --- | --- |
| `host` | 仅支持现有项目级兼容 Skill 目录 | Registry 与兼容目录 Adapter 已参考实现；不扩展为通用 Runtime |
| `source-control` | 提供版本、差异、候选变更和合并证据 | 本地 Git Merge Candidate 摘要子集已参考实现；其他 Provider `designed` |
| `work-item` | 查询或写入外部研发事项，处理去重和回读 | `designed` |
| `design-input` | 获取稳定设计标识、资源和能力信息 | `designed` |
| `browser-evidence` | 提供 DOM、网络、控制台、截图和版本映射证据 | `designed` |
| `release` | Inspect、Plan、Confirm、Apply 和 Verify 发布状态 | `designed` |
| `telemetry` | 默认本地、失败隔离、有界等待的使用事件投递 | `designed` |

新增 Capability 时必须先证明现有能力契约无法表达，而不是按平台名称创建类别。

## 通用结果信封

能力级 Adapter 可以复用以下状态，但 `data` 的结构由各能力单独定义：

| 状态 | 含义 |
| --- | --- |
| `unsupported` | Adapter 不支持请求的能力或环境 |
| `unconfigured` | 缺少配置引用或引用无法解析 |
| `blocked` | 权限、授权、版本或安全门禁阻止执行 |
| `partial` | 只有部分来源或步骤成功，必须列出缺口 |
| `succeeded` | 已完成请求范围并产生可验证结果 |
| `failed` | 已尝试但执行失败，不能伪装成未配置 |

结果信封至少包含 `status`；按需增加 `data`、`blockers`、`evidenceRefs` 和不含秘密的 `diagnostics`。Adapter 原始响应、Token 和敏感 Header 不进入结果。

## 凭证和配置引用

- `configRef` 是不透明字符串，例如合成示例中的 `env://SYNTHETIC_CONFIG`；
- Harness 只校验引用形态并传递给 Adapter，不解析、不记录、不缓存真实内容；
- Adapter 或采用方的 Credential Resolver 决定如何解析引用；
- Doctor 可以报告 `unconfigured`，但不能输出引用解析后的秘密；
- 用户级凭证、生产权限和外部写入仍分别需要授权。

## 能力级契约

公共层只统一注册、能力探测、结果状态和凭证引用。具体能力分别定义方法：

- 只读 Provider 通常实现 `inspect` 或 `collect`；
- 外部写入能力遵循 `inspect → plan → confirm → apply → verify`；
- 兼容 Host Adapter 只解析项目目录，不执行 Skill；新的安装与更新优先使用目标 Host 原生机制；
- Source Control 返回版本和差异证据，不自动提交或推送；
- Release Adapter 不把测试环境成功推断为生产发布成功。

## 失败与降级

- Manifest 声明但 Registry 未注册：Doctor 返回 `adapter-unavailable`；
- Host 未注册、重复声明或返回项目外路径：阻断安装；
- 非核心 Adapter 未注册：Doctor 警告，核心本地治理仍可运行；
- `configRef` 不是 URI 形式：阻断并且不尝试猜测凭证；
- Adapter 部分成功：保留已获得证据和未完成项，不回滚外部已发生事实，也不冒充完整成功。

本地 Git Adapter 只接受不可变可解析的 Base/Source 边界。它在临时对象库中计算候选 Tree，按显式 Include/Exclude 范围生成 `source-control-snapshot-v1` 摘要；范围内脏工作区、未跟踪文件或合并冲突会阻断，且不会修改工作树、Index、分支、Tag 或远端。

## 当前不包含

- 任何真实公司或供应商 Adapter；
- 动态插件发现、远端代码下载或任意模块加载；
- 统一认证 SDK、密钥存储或凭证代理；
- 用户级 Skill 安装和生产发布授权；
- 把所有能力压缩成同一个通用请求对象。
