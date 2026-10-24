# A 核心框架交付

依据团队《ABC三人详细分工方案 V2》开发，使用 Vite + TypeScript + Three.js，不使用 Unity，不使用旧版“按住空格冻结世界”玩法。

## 范围

已实现A的操作和运行基础：响应式Three.js画布、相机、灯光、WASD、鼠标视角、鼠标锁定及拖动观察备用操作、圆形玩家与静态障碍碰撞、射线E交互、输入模式、开场镜头占位、手机查看、菜单选项、场景资源卸载、六场景串联接入口、检查点重建、暂停恢复、B事件转发。

没有声称完成B的六关判定、睡眠随机、统一倒计时、迟到惩罚与彩蛋，也没有完成C的正式场景、美术和音效。六个场景当前复用白盒，仅用于验证运行及交互。框架仍需与B/C正式模块联调验收。

联调模式 `?dev=1` 提供明确标注的“模拟本关完成”和“模拟失败”。这些按钮不进行真正几何判定。普通入口没有模拟按钮，但仍提示当前是A框架；B未接入前无法正常解谜通关。

## 本地运行

安装 Node.js 22.18+（建议24）。在工程根目录：

```sh
npm install
npm run dev
```

打开控制台显示的地址，并在地址后加 `?dev=1`，例如 `http://localhost:5173/?dev=1`。也支持 `pnpm install`，仓库提供pnpm锁文件。团队应选定一种包管理器，避免同时维护多个锁文件。

```sh
npm run test
npm run build
npm run preview
```

`dist` 是生产构建，需由静态HTTP服务器提供；不要直接双击dist/index.html。当前使用Vite默认根路径部署；部署GitHub Pages子路径前需配置Vite base。

## 试玩路线

1. 选择榴园、教学楼和睡眠时间。桃园、桂园只显示未开放提示。
2. 进入开场，等镜头结束或按E，出现手机；点击确认后开始移动。
3. WASD走近中央黄色交互标记，略向下看，让准星对准它。内嵌浏览器若拒绝Pointer Lock，可按住鼠标在场景拖动观察。
4. 出现E提示时按E。角色与视角输入停用，拖动测试窗口标题栏。
5. 空格只转发给B，当前占位实现会提示“判定尚未接入”，不会假装成功。
6. 点击“仅联调：模拟本关完成”，门与交互标记及对应碰撞体移除。走过绿色出口，加载下一场景。
7. 第二关出口后有5秒骑行占位，其他关之间短暂转场。第六关的模拟完成进入模拟签到结算。
8. Esc：小游戏中取消，探索中暂停；暂停后点击继续。R：重建当前检查点，向B请求状态复位。切出页面自动暂停。

## 文件边界

- A：`src/core`、`src/player`、`src/scenes`、工程配置、入口。
- B：预留 `src/mechanics`、`src/levels`，本交付不写入这些目录。
- C：预留 `src/ui`、`src/effects`、`src/audio`、`src/assets`，本交付不写入这些目录。
- `src/core/dev` 中的机制和界面全是A自测占位，正式接入后可删除。
- `src/shared/contracts.ts`、`src/shared/sceneContracts.ts` 是接口草案，需要三人确认，不代表B/C已经接受。

## B 接入

实现 `MechanicsPort`，在 `src/main.ts` 替换 `DevelopmentMechanics`。

| 调用 | 输入 / 责任 |
| --- | --- |
| start | 菜单选项和固定seed；确认手机后才调用，B在这里建立计时 |
| update | 真实帧间隔和当前输入模式；菜单、开场、手机、暂停、结算期间A不调用 |
| enterLevel | 创建本关规则；B可在这里一次性计入转场费用 |
| beginPuzzle | E交互后进入本关小游戏 |
| moveWindow | 1920×1080参考画布坐标；A只做显示区域边界限制，B计算吸附与Ready |
| confirmPuzzle / cancelPuzzle | 空格确认、Esc取消；B防止重复确认 |
| getSnapshot | 倒计时、醒来时间、窗口数据、谜题状态、提示 |
| retryCheckpoint | B复位当前关并保留seed；A重建玩家位置和白盒，A不额外扣时间 |
| reportAction | A报告exit-reached、ride-finished、collect-bun，B判定后发事件 |
| subscribe | 订阅纯逻辑事件，返回解除订阅函数 |

`ALIGNMENT_SUCCESS` 打开通路并恢复探索；`LEVEL_COMPLETED` 推进关卡；`GAME_COMPLETED` / `GAME_FAILED` 进入结算。最后一关应由B发出GAME_COMPLETED，不依赖A推断胜负。取消、失败和重试不能直接跳关。

暂停状态的恢复保留原模式，包含卡窗、骑行和转场。B的update不会在暂停时运行；卡窗0.25倍率、时间同帧优先级与重试惩罚只由B处理。A没有全局计时器，`--:--`表示未接入。

## C 接入

UI：实现 `UIPort.update(UIState)` 和 `dispose()`，在main的createUI替换DevelopmentUI。按钮调用UIActions，不直接修改玩法状态。

场景：实现 `ScenePort`，用GameApp的createScene工厂替换WhiteboxScene。提供碰撞盒、射线可交互Mesh、场景root和清理方法。当前通用玩家出生点为(0,1.65,4.4)，出口触发区域为z<-4.4；C场景需遵守该布局，或与A协商把出生点/出口扩展成场景数据。不能仅更换美术后悄悄改变通路几何。

效果：通过 `app.events.subscribe` 监听LEVEL_STARTED、MODE_CHANGED、GLITCH_ENTERED/EXITED、ALIGNMENT_READY/SUCCESS/FAILED、GAME_COMPLETED/FAILED。UI按snapshot显示Ready，A不猜测阈值。订阅必须在dispose中解除。

## 验证

Node测试覆盖暂停模式恢复、事件解除、圆形碰撞、薄墙防穿透、沿墙移动、占位不伪造判定、拖动和复位、模拟事件、六场景解锁移除碰撞（包括旋转标记）。生产构建包含TypeScript严格检查。

仍需正式验收：B真实六关算法和计时、C场景资源、完整路演流程、真实浏览器Pointer Lock与音效、弱设备性能。当前白盒没有NPC、真实骑行、正式片头、真实签到或存档文件，运行选项只存在内存。

## 提交

分支 `feat/core-integration` → PR目标 `dev`。集成前B/C先拉取A的工程骨架，避免各自生成package.json及main.ts。正式模块就绪后由A统一编辑main.ts，不要三人同时覆盖。
