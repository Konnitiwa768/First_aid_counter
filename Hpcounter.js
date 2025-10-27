export class Hpcounter {
  constructor(container, parts) {
    // 部位データコピー
    this.parts = JSON.parse(JSON.stringify(parts));
    this.container = container;
    this.centers = {};
    this.autoInterval = null;

    // 描画
    this.render();

    // クリックタッチ判定
    this.clickHandler = e => {
      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.applyDamageAtPoint(x, y);
    };
    this.container.addEventListener("click", this.clickHandler);
  }

  // ダメージ軽減計算
  calculateReduction(damage, armor, toughness) {
    const part1 = armor * (1 - 0.04 * damage / (armor + toughness));
    const part2 = armor * 0.2;
    return Math.max(part1, part2) / 25;
  }

  // 範囲ダメージ
  applyDamageAtPoint(x, y) {
    const dmg = Number(document.getElementById("damage")?.value) || 0;
    for (const name in this.parts) {
      const p = this.parts[name];
      if (p.hp <= 0) continue;
      const c = this.centers[name];
      if (!c) continue;
      const dx = c.x - x, dy = c.y - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let factor = 0;
      if(dist <=50) factor=1;
      else if(dist <=100) factor=0.5;
      else if(dist <=150) factor=0.2;
      if(factor>0){
        const red = this.calculateReduction(dmg,p.armor,p.toughness);
        p.hp = Math.max(0,p.hp - dmg*(1-red)*factor);
      }
    }
    this.render();
  }

  // 全部位直撃
  applyDamageDirect() {
    const dmg = Number(document.getElementById("damage")?.value) || 0;
    for(const name in this.parts){
      const p=this.parts[name];
      if(p.hp<=0) continue;
      const red = this.calculateReduction(dmg,p.armor,p.toughness);
      p.hp = Math.max(0,p.hp - dmg*(1-red));
    }
    this.render();
  }

  // HPリセット
  reset() {
    for(const name in this.parts) this.parts[name].hp = this.parts[name].max;
    this.render();
  }

  // 自動ダメージON/OFF
  toggleAuto(interval=1000) {
    if(this.autoInterval){
      clearInterval(this.autoInterval);
      this.autoInterval=null;
    } else {
      this.autoInterval = setInterval(()=>{
        const cx=this.container.clientWidth/2;
        const cy=this.container.clientHeight/2;
        this.applyDamageAtPoint(cx,cy);
      }, interval);
    }
  }

  // 描画
  render() {
    this.container.innerHTML="";
    const gridMap={
      "head":"2 / 1","left arm":"1 / 2","body":"2 / 2","right arm":"3 / 2",
      "left leg":"1 / 3","right leg":"3 / 3","left foot":"1 / 4","right foot":"3 / 4"
    };
    for(const name in this.parts){
      const p = this.parts[name];
      const div=document.createElement("div");
      div.className="part";
      div.dataset.name=name;
      const coords = gridMap[name]||"1 / 1";
      div.style.gridColumn=coords.split(" / ")[0];
      div.style.gridRow=coords.split(" / ")[1];

      const bar=document.createElement("div");
      bar.className="bar";
      bar.style.background=this.getColor(p.hp/p.max);
      div.appendChild(bar);

      const label=document.createElement("div");
      label.className="label";
      label.innerText=`${name} ${p.hp.toFixed(1)}/${p.max}`;
      div.appendChild(label);

      this.container.appendChild(div);
    }

    // 中心座標計算
    setTimeout(()=>{
      const rectBase=this.container.getBoundingClientRect();
      for(const el of this.container.querySelectorAll(".part")){
        const r=el.getBoundingClientRect();
        this.centers[el.dataset.name]={x:r.left+r.width/2-rectBase.left, y:r.top+r.height/2-rectBase.top};
      }
    },10);
  }

  // 色変換
  getColor(t){
    const stops=[
      {t:1.00,c:[0,255,0]},
      {t:0.80,c:[102,255,0]},
      {t:0.60,c:[255,255,0]},
      {t:0.40,c:[255,153,0]},
      {t:0.20,c:[255,0,0]},
      {t:0.00,c:[68,68,68]}
    ];
    for(let i=0;i<stops.length-1;i++){
      const a=stops[i], b=stops[i+1];
      if(t<=a.t && t>=b.t){
        const f=(t-b.t)/(a.t-b.t);
        const r=a.c[0]+(b.c[0]-a.c[0])*f;
        const g=a.c[1]+(b.c[1]-a.c[1])*f;
        const bl=a.c[2]+(b.c[2]-a.c[2])*f;
        return `rgb(${r},${g},${bl})`;
      }
    }
    return "#444";
  }

  // 削除
  destroy() {
    this.container.removeEventListener("click", this.clickHandler);
    if(this.autoInterval) clearInterval(this.autoInterval);
    this.container.innerHTML="";
  }
}
