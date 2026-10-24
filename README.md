# Trae-game

TRAE on Campus @ 江南大学 AI Coding Hackathon 比赛项目。

## 分支约定

- `main`：只放已经验证、可以提交/演示的稳定版本。
- `dev`：团队集成与联调分支。
- `feat/*`：每个人自己的功能分支，例如：
  - `feat/gameplay`
  - `feat/ui`
  - `feat/levels`

## 推荐协作流程

1. 从最新 `dev` 创建自己的 `feat/*` 分支。
2. 自己本地运行并确认功能正常。
3. Push 自己的分支。
4. 提 Pull Request：`feat/* -> dev`。
5. 在 `dev` 做集成测试。
6. 确认稳定后再合并：`dev -> main`。

> 自己分支自己验，dev 大家验，main 只放活的。

## 比赛现场规则

- 尽量避免多人同时修改同一个核心文件。
- Bug 卡住 10–15 分钟就考虑降级或绕开。
- 截止前 30 分钟停止新增功能，优先集成、测试、部署和提交。
- `main` 上能跑的版本优先级最高，不在最后时刻做大重构。
