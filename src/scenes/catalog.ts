import type { SceneDescriptor } from '../shared/contracts.ts';
/** 场景顺序和交互语境属于A；几何判定和难度不放在这里。 */
export const SCENES: readonly SceneDescriptor[] = [
  { level: 'door', title: '01 / 宿舍卡门', hint: '走近门口，看向黄色交互物，按 E 进入卡窗。', objectLabel: '宿舍出口' },
  { level: 'bike', title: '02 / 单车解锁', hint: '红色自有单车被卡住了；走近绿色共享单车按 E。', objectLabel: '共享单车' },
  { level: 'crowd', title: '03 / 食堂人群', hint: '走近人群缺口，按 E 操作；包子是可选交互。', objectLabel: '人群缺口' },
  { level: 'guard', title: '04 / 保安停车', hint: '走近停车点，按 E 进入观察；安全判定由 B 接入。', objectLabel: '停车点' },
  { level: 'elevator', title: '05 / 拥挤电梯', hint: '走近电梯，按 E 进入卡位操作。', objectLabel: '电梯入口' },
  { level: 'qr', title: '06 / 扫码签到', hint: '走近讲台，按 E 打开手机扫码界面。', objectLabel: '模拟签到二维码' }
];
