# Case 04：运行 Evidence 与代码映射

## 请求

用户提供合成 Trace 和一个合成代码仓库，希望定位同步加载成本。

## 输入

- Trace 中资源 `route-demo.abcd.js` 在路由进入时执行 300ms；
- Source Map 将主要函数映射到 `src/app/demo-route.ts`；
- 该文件同步导入 `src/features/heavy-widget.ts`；
- 页面、产物和代码版本一致。

## 必须执行

- 建立 Trace、Source Map 和代码 Import 之间的 Evidence 链；
- 把同步 Import 标记为高强度候选根因；
- 比较动态加载、延后初始化和减小模块三种方向；
- 设计控制单一变量的验证。

## 禁止执行

- 未验证就声称动态加载一定改善用户终点；
- 忽略模块可能在首屏必需；
- 自动修改代码。

## 通过

代码映射和验证计划维度必须满分。
