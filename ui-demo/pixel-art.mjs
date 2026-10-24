// Original, code-drawn pixel illustrations. References inform the palette and silhouette only.
const R = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--px-${c})"/>`;
const P = (d,c) => `<path d="${d}" fill="var(--px-${c})"/>`;
function glass(x,y,w=9,h=10,lit=false) {
  return R(x,y,w,h,'outline') + R(x+1,y+1,w-2,h-2,lit?'gold':'blue')
    + R(x+2,y+2,w-4,h-4,lit?'cream':'blue-light')
    + (lit?'':R(x+w-4,y+2,2,2,'highlight')+R(x+w-6,y+4,2,2,'highlight'));
}
export function treeMarkup() {
  return P('M-3 12H3V31H-3Z','outline')+R(-1,12,3,17,'brick')
    +P('M-11-25H7V-21H14V-15H19V-2H15V7H7V13H-9V8H-17V1H-21V-12H-17V-20H-11Z','outline')
    +P('M-10-22H6V-18H12V-12H16V-3H12V4H5V9H-8V4H-14V-2H-18V-11H-14V-17H-10Z','green-dark')
    +P('M-9-22H6V-17H11V-10H13V-3H6V3H-4V-1H-13V-7H-15V-13H-9Z','green')
    +P('M-7-21H5V-16H9V-11H2V-5H-6V-10H-12V-15H-7Z','green-light')
    +R(-11,-3,5,5,'green-light')+R(6,1,4,4,'green')+R(-5,-18,4,3,'cream');
}
export function dormMarkup() {
  let s=P('M-53 0V-77H-58V-85H-50V-91H50V-85H58V-77H53V0Z','outline');
  s+=R(-50,-77,100,74,'cream')+R(37,-77,13,74,'peach')+R(-50,-77,5,74,'peach');
  s+=P('M-54-84H-47V-88H47V-84H54V-79H-54Z','blue-dark')+R(-49,-86,97,3,'blue-light')+R(-54,-80,108,4,'blue');
  for(let row=0;row<3;row++) {
    for(const x of [-39,-19,13,33]) s+=glass(x,-68+row*20,12,13,(x===-19&&row===0)||(x===33&&row===2));
    s+=R(-49,-52+row*20,98,3,'stone');
  }
  s+=R(-7,-77,15,53,'blue-dark')+glass(-5,-72,11,16)+glass(-5,-51,11,15);
  s+=R(-20,-23,40,6,'outline')+R(-18,-21,36,3,'blue')+R(-17,-16,34,16,'peach');
  s+=R(-13,-16,26,16,'blue-dark')+R(-10,-13,9,13,'blue-light')+R(2,-13,9,13,'blue-light')+R(-9,-12,4,2,'highlight');
  s+=R(-55,0,110,4,'outline')+R(-51,0,102,2,'stone');
  return s;
}
export function teachingMarkup() {
  let s=P('M-77 0V-80H-81V-87H-72V-91H-25V-102H25V-91H72V-87H81V-80H77V0Z','outline');
  s+=R(-74,-79,148,76,'cream')+R(62,-79,12,76,'peach')+R(-74,-79,4,76,'peach');
  s+=R(-77,-86,154,6,'blue')+R(-71,-89,142,3,'blue-light')+R(-22,-99,44,12,'blue-dark')+R(-19,-97,38,3,'blue-light');
  s+=R(-70,-79,140,3,'stone');
  for(let row=0;row<3;row++){
    for(const x of [-63,-43,-23,13,33,53])s+=glass(x,-70+row*19,12,12,row===2&&(x===-43||x===33));
    s+=R(-73,-55+row*19,146,2,'stone');
  }
  s+=R(-10,-75,20,28,'outline')+R(-8,-73,16,24,'blue-light')+R(-6,-71,4,5,'highlight');
  s+=R(-24,-23,48,7,'outline')+R(-22,-21,44,3,'blue')+R(-20,-14,5,14,'peach')+R(15,-14,5,14,'peach');
  s+=R(-13,-15,26,15,'blue-dark')+R(-10,-13,9,13,'blue-light')+R(2,-13,9,13,'blue-light');
  s+=R(-82,0,164,4,'outline')+R(-77,0,154,2,'stone')+R(-28,4,56,4,'stone')+R(-32,8,64,3,'outline');
  return s;
}
export function cafeteriaMarkup(){
  let s=P('M-55 0V-61H-59V-70H-50V-75H50V-70H59V-61H55V0Z','outline');
  s+=R(-52,-62,104,60,'cream')+R(-52,-62,12,60,'brick')+R(40,-62,12,60,'brick');
  s+=R(-55,-69,110,7,'stone')+R(-49,-72,98,3,'highlight');
  s+=R(-42,-57,84,13,'outline')+R(-40,-55,80,9,'blue')+R(-37,-53,74,2,'blue-light');
  s+=R(-40,-41,80,39,'blue-dark');for(const x of[-36,-16,4,24])s+=glass(x,-38,15,32,x===-16);
  s+=R(-58,-38,116,9,'outline');for(let x=-55;x<55;x+=11)s+=R(x,-36,11,6,((x+55)/11)%2?'cream':'blue');
  s+=R(-17,-1,34,3,'stone')+R(-60,2,120,4,'outline')+R(-55,2,110,2,'stone');
  s+=R(-52,-24,5,2,'peach')+R(43,-11,5,2,'peach');return s;
}
function flower(x,y){return R(x,y,2,5,'green-dark')+R(x-2,y-3,6,4,'highlight')+R(x,y-5,2,8,'highlight')+R(x,y-2,2,2,'gold')}
function clouds(){return `<g fill="var(--px-highlight)">${[[72,42],[538,30],[995,45]].map(([x,y])=>`<path d="M${x} ${y}h12v-6h15v6h10v6h8v7h-53v-7h8z"/>`).join('')}</g>`}
export function campusMapMarkup(){
  return `<defs><g id="px-tree">${treeMarkup()}</g><g id="px-dorm">${dormMarkup()}</g><g id="px-teaching">${teachingMarkup()}</g><g id="px-food">${cafeteriaMarkup()}</g></defs>
  <rect width="1100" height="430" fill="var(--px-ground)"/>
  <path d="M0 0H1100V55H1000V46H900V58H720V43H500V51H330V45H120V58H0Z" fill="var(--blue-soft)"/>${clouds()}
  <path d="M530 0H570V55H590V90H610V145H650V195H630V250H660V295H680V350H700V430H655V365H635V315H615V265H590V205H605V160H575V112H550V65H530Z" fill="var(--px-blue-dark)" opacity=".45"/>
  <path d="M534 0H566V60H586V94H606V149H646V191H626V254H656V299H676V354H696V430H659V361H639V311H619V261H594V209H609V156H579V108H554V61H534Z" fill="var(--px-water)"/>
  <g fill="var(--px-highlight)"><rect x="553" y="42" width="11" height="3"/><rect x="611" y="168" width="20" height="3"/><rect x="615" y="228" width="10" height="3"/><rect x="649" y="333" width="20" height="3"/></g>
  <path d="M-20 140H235V244H1100M286 0V430M0 330H1100M790 0V430" fill="none" stroke="var(--px-path-shadow)" stroke-width="25" stroke-linejoin="miter"/>
  <path d="M-20 140H235V244H1100M286 0V430M0 330H1100M790 0V430" fill="none" stroke="var(--px-path)" stroke-width="19" stroke-linejoin="miter"/>
  <path d="M180 178H235V244H286V330H640V244H790V204H875" class="route"/>
  <path d="M180 178H235V244H286V330H640V244H790V204H875" class="route-progress"/>
  <g fill="var(--px-green)" opacity=".4">${Array.from({length:42},(_,i)=>{const x=30+(i*127)%1040,y=75+(i*53)%330;return `<rect x="${x}" y="${y}" width="4" height="2"/><rect x="${x+4}" y="${y-3}" width="2" height="4"/>`}).join('')}</g>
  <g transform="translate(164 164)">${dormMarkup()}</g><text x="164" y="194" text-anchor="middle" class="label">榴园</text><text x="164" y="213" text-anchor="middle" class="sub">你的出发点</text>
  <g opacity=".55" transform="translate(386 111) scale(.8)">${dormMarkup()}</g><text x="386" y="139" text-anchor="middle" class="label">桃园</text><text x="386" y="156" text-anchor="middle" class="sub">待开放</text>
  <g opacity=".55" transform="translate(155 367) scale(.8)">${dormMarkup()}</g><text x="155" y="397" text-anchor="middle" class="label">桂园</text>
  <g transform="translate(896 182)">${teachingMarkup()}</g><text x="896" y="215" text-anchor="middle" class="label">第一教学楼</text><text x="896" y="235" text-anchor="middle" class="sub">早八 · 08:00</text>
  <g opacity=".55" transform="translate(920 360) scale(.8)">${teachingMarkup()}</g><text x="920" y="392" text-anchor="middle" class="label">第二教学楼</text>
  <g transform="translate(444 365)">${cafeteriaMarkup()}</g><text x="444" y="395" text-anchor="middle" class="label">食堂</text>
  ${[[75,250],[105,260],[220,73],[680,85],[715,103],[1020,175],[1050,190],[715,364],[745,380],[355,300],[50,375],[1030,350]].map(([x,y])=>`<use href="#px-tree" x="${x}" y="${y}"/>`).join('')}
  ${[[70,290],[120,295],[360,360],[510,373],[980,280],[770,97]].map(([x,y])=>flower(x,y)).join('')}
  <path d="M157 37h14v4h4v14h-4v5h-4v8h-6v-8h-4v-5h-4V41h4z" fill="var(--px-outline)"/><rect x="158" y="42" width="14" height="11" fill="var(--red)"/><rect x="161" y="45" width="5" height="4" fill="var(--px-cream)"/>
  <g transform="translate(299 218)"><image href="assets/student.svg" x="0" y="0" width="24" height="36" image-rendering="pixelated"/></g>`;
}
const digits = {
  '0':['01110','11011','11011','11011','11011','11011','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','11011','00011','00110','01100','11000','11111'],
  '3':['11110','00011','00011','01110','00011','00011','11110'],
  '4':['00011','00111','01111','11011','11111','00011','00011'],
  '5':['11111','11000','11000','11110','00011','11011','01110'],
  '6':['01110','11000','11000','11110','11011','11011','01110'],
  '7':['11111','00011','00110','00110','01100','01100','01100'],
  '8':['01110','11011','11011','01110','11011','11011','01110'],
  '9':['01110','11011','11011','01111','00011','00011','01110'],
  ':':['0','1','1','0','1','1','0']
};
export function pixelClock(value){
  let x=0,marks='';for(const c of value){const grid=digits[c];if(!grid)continue;for(let y=0;y<7;y++)for(let z=0;z<grid[y].length;z++)if(grid[y][z]==='1')marks+=`<rect x="${x+z}" y="${y}" width="1" height="1"/>`;x+=c===':'?3:6;}
  return `<span class="sr-only">${value}</span><svg class="pixel-clock" viewBox="0 0 ${x-1} 7" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">${marks}</svg>`;
}
