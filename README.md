# Trae-game

TRAE on Campus @ 江南大学 AI Coding Hackathon 比赛项目。

## A 核心运行框架 V2

当前技术栈是 **Vite + TypeScript + Three.js**。本分支交付 A 的操作框架和六场景白盒接入，不包含 B 的正式算法或 C 的美术。

```sh
npm install
npm run dev
```

打开终端显示的地址并加 `?dev=1` 进入联调模式，例如 `http://localhost:5173/?dev=1`。只有该模式显示“模拟完成/失败”按钮；没有真实机制时不能将普通页面当成完整游戏。计时显示 `--:--`，等待 B 接入。

```sh
npm run test
npm run build
npm run preview
```

要求 Node.js 22.18+，建议24。也支持pnpm，提供pnpm锁文件。

操作：WASD移动、鼠标观察、E进入卡窗、拖动标题栏、Space发送确认、Esc取消/暂停、R重试。鼠标锁定不支持时可按住场景拖动观察。

详细交接、试玩路线和接口：[A交付与联调说明](docs/A交付与联调说明.md)。共享接口目前为待三人确认的草案。

V2分支：A `feat/core-integration`；B `feat/game-mechanics`；C `feat/ui-polish`。B/C请先同步工程骨架，正式代码分别放入各自约定目录，不覆盖main.ts。

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
