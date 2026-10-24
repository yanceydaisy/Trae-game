import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { Bounds } from '../player/collision.ts';
import type { SceneDescriptor } from '../shared/contracts.ts';
export class WhiteboxScene {
  readonly root = new Group();
  readonly colliders: Bounds[] = [];
  readonly interactionPoint = new Vector3(0, 1.25, -.7);
  readonly objects: Mesh[] = [];
  readonly blocker: Mesh;
  private blockerCollider: Bounds;
  private interactionCollider: Bounds;
  private extraCollider: Bounds | null = null;
  readonly extraPoint = new Vector3(-2.4, 1, 1);
  private extra: Mesh | null = null;
  private phase = 0;
  readonly descriptor: SceneDescriptor;
  constructor(descriptor: SceneDescriptor) {
    this.descriptor=descriptor;
    this.box(0, -.15, 0, 10, .3, 15, '#d6d8c6');
    for (const [x,y,z,w,h,d] of [[-5,1.5,0,.3,3,15],[5,1.5,0,.3,3,15],[0,1.5,7.5,10,3,.3],[0,1.5,-7.5,10,3,.3]]) this.box(x,y,z,w,h,d,'#667d69',true);
    this.box(-3.25,.5,-1,2.3,1,2.8,'#9cae91',true);
    this.box(3.25,.5,-1,2.3,1,2.8,'#9cae91',true);
    if (descriptor.level === 'door') {
      for(const x of [-3.6,3.6])for(const z of [2.9,-3.8]){this.box(x,.4,z,1.3,.8,2,'#8a7057',true);this.box(x,.85,z,1.2,.15,1.9,'#bfd1b4');}
    }
    this.blocker = this.box(0,1.25,-2.4,3.8,2.5,.22,'#405744',true);
    this.blockerCollider=this.colliders[this.colliders.length-1];
    this.box(-3.4,1.25,-2.4,2.8,2.5,.22,'#667d69',true);
    this.box(3.4,1.25,-2.4,2.8,2.5,.22,'#667d69',true);
    const object = this.box(0,1.1,-.7,.65,.8,.38,'#e8bb60',true);this.objects.push(object);
    this.interactionCollider=this.colliders[this.colliders.length-1];
    if (descriptor.level === 'bike' || descriptor.level === 'crowd') {this.extra = this.box(-2.4,.7,1,.7,1.4,.7,descriptor.level==='bike'?'#b76d59':'#ebc98c',true);this.extraCollider=this.colliders[this.colliders.length-1];}
    this.box(0,.02,-5.7,2,.04,1.5,'#a8cb83');
  }
  private box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,collide=false):Mesh {
    const mesh=new Mesh(new BoxGeometry(w,h,d),new MeshStandardMaterial({color:new Color(color),roughness:.85}));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);
    if(collide)this.colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return mesh;
  }
  setUnlocked(): void {
    this.blocker.visible=false;
    const i=this.colliders.indexOf(this.blockerCollider);
    if(i>=0)this.colliders.splice(i,1);
    this.objects[0].visible=false;
    const j=this.colliders.indexOf(this.interactionCollider);
    if(j>=0)this.colliders.splice(j,1);
  }
  animate(dt:number):void {this.phase+=dt;this.objects[0].rotation.y=Math.sin(this.phase)*.1;}
  hideExtra():void {if(this.extra){const i=this.extraCollider?this.colliders.indexOf(this.extraCollider):-1;if(i>=0)this.colliders.splice(i,1);this.extra.visible=false;}}
  dispose():void {
    this.root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
    this.root.removeFromParent(); this.colliders.length=0;
  }
}
