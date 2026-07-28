# 自定义 Codex 宠物

这里收录项目维护者自制的 Codex 桌宠。每个目录都是可独立安装的宠物包：

| 目录 | 显示名称 | 说明 |
| --- | --- | --- |
| `strawberry-bao-standing/` | 草莓橘宝（站姿） | 站立捧着草莓、穿黄色衣服和粉色鞋的像素风 Q 版桌宠 |
| `strawberry-bao-squatting/` | 草莓橘宝（蹲姿） | 蹲着捧住草莓的像素风 Q 版桌宠 |

## 包结构

```text
<pet-id>/
├── pet.json
└── spritesheet.webp
```

两个图集都遵循当前 Codex 宠物图集契约：

- `spriteVersionNumber` 为 `2`；
- 图集尺寸为 `1536 × 2288`；
- 网格为 8 列 × 11 行，单元格为 `192 × 208`；
- 图集使用 RGBA 透明背景。

## 本地安装

将需要的完整宠物目录复制到 Codex 用户目录：

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/pets"
cp -R pets/strawberry-bao-standing "${CODEX_HOME:-$HOME/.codex}/pets/"
cp -R pets/strawberry-bao-squatting "${CODEX_HOME:-$HOME/.codex}/pets/"
```

复制后重启或重新加载 Codex，即可在宠物列表中选择。
