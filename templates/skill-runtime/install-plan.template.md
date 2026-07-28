# Skill Install Plan

## 请求

- 操作：`check | install | update`
- Skill：
- Host：
- 范围：`project | user`
- Dry-run：`yes | no`

## 来源

- Manifest：
- Skill 源目录：
- 源版本或内容摘要：

## 目标

- 目标目录：
- 目标是否存在：
- 是否为 Symlink：
- 当前是否由工具管理：

## 计划变化

| 动作 | 路径 | 原因 | 风险 |
| --- | --- | --- | --- |
| add / update / preserve / block |  |  |  |

## 冲突

| 路径 | 冲突类型 | 当前所有权 | 建议 |
| --- | --- | --- | --- |
|  | unknown / user-modified / symlink / manifest-drift |  |  |

## 授权

- 是否需要显式授权：
- 授权范围：
- 当前是否已授权：

## 状态

- `valid`：检查通过，没有待执行计划；
- `blocked`：存在冲突或输入错误；
- `planned`：计划已生成，尚未执行；
- `installed`：安装计划已执行；
- `updated`：更新计划已执行。

当前状态：

## Apply 前重新确认

- [ ] Manifest 与实际目录一致。
- [ ] 源内容摘要未变化。
- [ ] 目标状态与生成计划时一致。
- [ ] 没有计划外文件。
- [ ] 所需授权仍然有效。
