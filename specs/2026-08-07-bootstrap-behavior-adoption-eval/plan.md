# Plan：Bootstrap 行为增益与连续采用验证

## 决策

### 1. 一个事项、两层 Evidence

同一事项同时生成可重复行为 Eval 和真实采用观察，但两者不互相替代：正式 Replay 证明合成 Case 中所测行为，真实样本观察只补充外部有效性。

### 2. 同 revision、独立只读会话

baseline 使用真实样本默认分支的不可变 revision，不加载本仓 Skill 或接入候选；candidate 使用同一源码 revision 加当前待审核的项目规则、Knowledge、代码入口和已安装 Skill。两组都使用只读沙箱、相同任务文本和等价工具边界，每次任务启动新会话。

candidate 的治理文件是本次输入条件，不作为业务源码 revision 的一部分。报告分别记录源码 revision 和治理候选摘要，避免把未提交工作树描述成不可变业务版本。

### 3. 三类任务

1. **规则就绪审计**：判断治理结构是否足以指导真实开发，验证能否识别运行时、有效测试和人工场景缺口；
2. **普通新会话恢复**：为一个有界前端变更定位最小上下文，验证不会重复 Bootstrap 或扫描历史停用大文件；
3. **稳定契约复核**：核对前后端接口边界，验证 observed/inferred/unresolved 分层和跨仓库停止条件。

### 4. 首个消费者不扩通用 Runner

宿主原生 baseline 不是 Skill 版本，现有 `eval compare` 面向同一 Skill 的版本回归，不能假装二者语义相同。本事项使用人工可复核的对照报告保存 baseline/candidate 差异，现有 Runner 只封存 candidate 的正式 Replay。出现第二个同类消费者后，再评估通用 condition-aware 比较契约。

### 5. 数据最小化

只保存任务类型、可观察动作摘要、读取范围类别、结论状态、阻塞行为和 Evidence ID。样本名称仅在本地执行记录中使用；公开 Trace 改写为“维护者自有的存量 Web 项目”，不保存远端、绝对路径、真实配置、Prompt、完整命令日志或思维过程。

## 验证路径

1. `codex --version` 确认可用版本；
2. 取得用户对只读 Agent Host 运行条件的明确选择；
3. 用只读独立会话执行三类 baseline/candidate 任务；
4. 人工按 Rubric 复核最小行为证据，生成 candidate Replay；
5. 运行 `agent-foundation eval run --skill project-context-bootstrap`；
6. 运行 Specflow、Knowledge Projection、仓库检查与 `git diff --check`；
7. 比较真实样本前后工作区状态，确认没有新增改动。

## 风险控制

- 随机性：不比较文风和措辞，只比较阻塞行为、Evidence、范围、状态和必须动作；
- 输入污染：baseline 不读取 candidate 治理文件，candidate 不读取本事项评分答案；
- 自我评分：Runner 只校验结构和引用，语义评分保留人工复核依据；
- 长期外推：首轮只标记 initial observation，不使用“长期验证完成”表述；
- 工作树污染：所有 Agent 会话使用只读沙箱，开始和结束分别记录状态摘要。
