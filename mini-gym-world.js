/* KRAFTLOG MINI-WELT 6.0 — lizenzfreie, interaktive Canvas-Illustrationen. */
(function () {
  'use strict';
  const W = 960, H = 690, CX = 480, TOP = 214, AX = 34, AY = 18, AZ = 34;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const groups=[
    ['Möbel','chair',['Lounge-Sessel','Schwingstuhl','Esszimmerstuhl','Lesesessel','Hocker','Barhocker','Clubsessel','Rattansessel','Hocker mit Polster','Fensterstuhl']],
    ['Möbel','table',['Couchtisch','Beistelltisch','Esstisch','Konsole','Vitrinentisch','Runder Tisch','Travertintisch','Niedriger Tisch','Schreibtisch','Terrassentisch']],
    ['Wohnbereich','sofa',['Creme-Sofa','Ecksofa','Modulares Sofa','Recamiere','Sitzbank','Samtsofa','Schlafsofa','Zweisitzer','Runder Pouf','Fensterbank']],
    ['Schlafbereich','bed',['Podestbett','Himmelbett','Gästebett','Travertinbett','Walnussbett','Tagesbett','Loftbett','Bett mit Schubladen','Bambusbett','Polsterbett']],
    ['Arbeitsbereich','desk',['Design-Schreibtisch','Zeichentisch','Schminktisch','Bücherarbeitsplatz','Computer-Schreibtisch','Regaltisch','Fenstertisch','Eichentisch','Sekretär','Klapptisch']],
    ['Licht & Kunst','lamp',['Stehlampe','Kugelleuchte','Kronleuchter','Tischlampe','Bogenleuchte','Wandleuchte','Laterne','Atelierlampe','Nachttischlampe','Glaspendel']],
    ['Pflanzen','plant',['Olivenbaum','Monstera','Gummibaum','Zimmerpalme','Bogenhanf','Bonsai','Pampasgras','Hängepflanze','Geigenfeige','Orchidee']],
    ['Haustiere','pet',['Hauskatze','Golden Retriever','Französische Bulldogge','Kaninchen','Maine-Coon','Shiba Inu','Britisch-Kurzhaar','Papagei','Schildkröte','Toy-Pudel']],
    ['Außenbereich','outdoor',['Pergola','Gartenbank','Sonnenliege','Feuerschale','Springbrunnen','Blumenbeet','Sportwagen','Vespa','Whirlpool','Garten-Sitzgruppe']],
    ['Fitnessgeräte','equipment',['Kurzhantelständer','Squat Rack','Kabelturm','Hantelbank','Laufband','Ergometer','Rudergerät','Kettlebells','Boxsack','Pilates-Reformer']]
  ];
  const palette=['#aa7c61','#caa988','#87715f','#ac9888','#b78f7d','#94715f','#7b6f62','#af987d','#bf9a7a','#86736b'];
  const catalog=[];
  groups.forEach(([category,kind,names],gi)=>names.forEach((name,variant)=>catalog.push({
    id:'item-'+String(gi*10+variant+1).padStart(3,'0'), name, category, kind, variant,
    color:palette[(gi*3+variant)%palette.length],
    zone:kind==='outdoor'?'outdoor':kind==='lamp'&&variant===2?'ceiling':kind==='lamp'&&variant===5?'wall':'floor'
  })));
  const map=Object.fromEntries(catalog.map(item=>[item.id,item]));
  const fromId=id=>map[id]||catalog[0];
  const iso=(x,y,z=0)=>({x:CX+(x-y)*AX, y:TOP+(x+y)*AY-z*AZ});
  function unproject(x,y){const u=(x-CX)/AX, v=(y-TOP)/AY;return {x:(u+v)/2,y:(v-u)/2};}
  const pt=(ctx,x,y)=>{ctx.lineTo(x,y);};
  const shade=(color,amt)=>{
    const n=parseInt(color.slice(1),16);
    const rgb=[(n>>16)&255,(n>>8)&255,n&255].map(v=>clamp(Math.round(v+amt),0,255));
    return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  };
  function poly(ctx,coords,fill,stroke=null,line=1){ctx.beginPath();ctx.moveTo(coords[0][0],coords[0][1]);for(let i=1;i<coords.length;i++)pt(ctx,...coords[i]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}}
  function oval(ctx,x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,Math.max(rx,1),Math.max(ry,1),0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
  function rounded(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function stroke(ctx,x1,y1,x2,y2,w,color){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=w;ctx.lineCap='round';ctx.strokeStyle=color;ctx.stroke();}
  function cuboid(ctx,x,y,w,h,depth,color){
    const d=depth, top=shade(color,30), dark=shade(color,-33), edge=shade(color,-11);
    poly(ctx,[[x,y-h],[x+d,y-h-d*.48],[x+w+d,y-h-d*.48],[x+w,y-h]],top);
    poly(ctx,[[x+w,y-h],[x+w+d,y-h-d*.48],[x+w+d,y-d*.48],[x+w,y]],dark);
    poly(ctx,[[x,y-h],[x+w,y-h],[x+w,y],[x,y]],edge);
  }
  function shadow(ctx,w=54){ctx.save();ctx.filter='blur(7px)';oval(ctx,7,1,w,12,'rgba(52,32,20,.22)');ctx.restore();}
  function color(item){return item.color||'#a77b5d';}
  function leaf(ctx,x,y,rx,ry,tilt,col){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);oval(ctx,0,0,rx,ry,col);ctx.restore();}
  function drawChair(ctx,item){const v=item.variant,c=color(item),leather=v===5||v===6;
    if(v===4||v===5){shadow(ctx,31);stroke(ctx,0,-10,0,-43,5,'#563b30');cuboid(ctx,-27,-41,54,12,12,c);return;}
    shadow(ctx,41);cuboid(ctx,-31,-24,62,17,15,c);cuboid(ctx,-31,-44,13,34,13,shade(c,-17));
    if(v!==1&&v!==7)cuboid(ctx,22,-36,9,15,10,shade(c,-16));
    if(v===7){stroke(ctx,-28,-33,-44,-53,4,'#8c6244');stroke(ctx,29,-33,45,-53,4,'#8c6244');}
    if(v===1){stroke(ctx,-33,-12,-48,2,5,'#7b5a42');stroke(ctx,28,-12,47,2,5,'#7b5a42');}
    if(v===8)oval(ctx,-2,-28,26,8,'#f4ddc7');
    if(v===2){for(const q of [-26,-14,-2])stroke(ctx,q,-66,q,-42,4,shade(c,-25));stroke(ctx,-33,-66,4,-66,4,shade(c,-20));}
    if(v===3)cuboid(ctx,-30,-66,46,25,12,shade(c,14));
    if(v===6){oval(ctx,-24,-35,10,9,'#bba28d');oval(ctx,27,-35,9,9,'#bba28d');}
    if(v===9){rounded(ctx,-20,-59,40,16,7,shade(c,23));}
    stroke(ctx,-22,-10,-23,1,5,'#654739');stroke(ctx,22,-10,24,1,5,'#654739');
    if(leather)stroke(ctx,-23,-35,24,-35,2,'rgba(255,255,255,.32)');
  }
  function drawTable(ctx,item){const v=item.variant,c=color(item);shadow(ctx,51);
    const round=[1,5,9].includes(v);
    if(round){oval(ctx,5,-41,42,16,shade(c,-12));oval(ctx,2,-45,42,16,shade(c,32));}
    else cuboid(ctx,-49,-38,87,v===7?9:14,15,c);
    stroke(ctx,-28,-27,-29,-2,7,shade(c,-34));stroke(ctx,34,-27,30,-3,7,shade(c,-34));
    if(v===3||v===6)cuboid(ctx,-35,-14,65,8,6,shade(c,-11));
    if(v===4)oval(ctx,6,-54,12,4,'#d6c1a0');
    if(v===8)cuboid(ctx,15,-55,30,15,7,'#2d3336');
    if(v===9)stroke(ctx,13,-44,23,-69,3,'#6d7b64');
    if(v===0)oval(ctx,4,-48,14,5,'#ddcfba');
    if(v===2){for(const xx of [-22,6,30])rounded(ctx,xx,-44,16,3,1,'rgba(255,255,255,.22)');}
    if(v===5){oval(ctx,-15,-52,6,6,'#f1e3d4');oval(ctx,23,-51,6,6,'#f1e3d4');}
    if(v===6)for(let x=-39;x<44;x+=16)stroke(ctx,x,-46,x+10,-46,1,'#f2e7d8');
  }
  function drawSofa(ctx,item){const v=item.variant,c=color(item);shadow(ctx,61);
    if(v===8){oval(ctx,1,-19,50,19,shade(c,-10));oval(ctx,1,-26,45,16,shade(c,22));return;}
    cuboid(ctx,-56,-22,108,23,18,c);cuboid(ctx,-56,-49,12,38,18,shade(c,-17));
    cuboid(ctx,-57,-24,14,22,13,shade(c,-20));cuboid(ctx,43,-24,14,22,12,shade(c,-20));
    for(let k=0;k<3;k++)rounded(ctx,-34+k*27,-42,23,20,6,shade(c,13+k*3));
    if(v===1||v===6)cuboid(ctx,22,-10,38,17,13,shade(c,5));
    if(v===3){oval(ctx,7,-37,13,10,'#ddd0b6');}
    if(v===7)rounded(ctx,-48,-29,91,6,3,'rgba(255,255,255,.4)');
    if(v===2){for(const xx of [-32,0,32])stroke(ctx,xx,-38,xx,-12,2,shade(c,-28));}
    if(v===4){stroke(ctx,-50,-14,-50,3,6,'#7f614e');stroke(ctx,49,-14,49,3,6,'#7f614e');}
    if(v===5){for(let x=-39;x<38;x+=18)oval(ctx,x,-37,3,3,'#d9bd9a');}
    if(v===9){for(const xx of [-30,28])cuboid(ctx,xx,-13,8,19,9,shade(c,-26));}
  }
  function drawBed(ctx,item){const v=item.variant,c=color(item);shadow(ctx,64);
    cuboid(ctx,-56,-20,113,24,28,c);
    cuboid(ctx,-53,-27,108,11,21,'#e9dcc9');
    cuboid(ctx,-56,-39,15,34,20,shade(c,-21));
    rounded(ctx,-38,-37,25,14,5,'#fffaf0');rounded(ctx,-8,-37,24,14,5,'#fff7ea');
    if(v===1||v===6){for(const x of [-45,49])stroke(ctx,x,-43,x,-102,4,'#6a4d3b');stroke(ctx,-45,-102,49,-102,4,'#6a4d3b');}
    if(v===7)cuboid(ctx,-40,-3,79,7,13,shade(c,-10));
    if(v===9)rounded(ctx,-8,-17,37,10,5,'#b5b5aa');
    if(v===2)stroke(ctx,-55,-46,58,-46,4,'#b3a28f');
    if(v===3){for(let xx=-30;xx<44;xx+=14)stroke(ctx,xx,-22,xx+9,-22,1,'rgba(114,91,67,.25)');}
    if(v===4)rounded(ctx,10,-30,26,7,3,'#9d755b');
    if(v===5)rounded(ctx,12,-19,29,8,4,'#e4c0a4');
  }
  function drawDesk(ctx,item){const v=item.variant,c=color(item);shadow(ctx,52);
    cuboid(ctx,-49,-46,95,12,16,c);cuboid(ctx,-44,-21,10,22,9,shade(c,-21));cuboid(ctx,29,-21,10,22,9,shade(c,-21));
    if(v!==5){rounded(ctx,-24,-59,35,23,4,'#353333');rounded(ctx,-21,-56,29,17,2,'#8ba59e');stroke(ctx,-7,-36,-7,-43,2,'#4d453e');}
    if(v===2){oval(ctx,25,-50,12,8,'#eac1aa');}
    if(v===4)rounded(ctx,18,-57,19,11,2,'#d4bc9e');
    if(v===8)cuboid(ctx,-49,-68,17,30,11,shade(c,-10));
    if(v===9)stroke(ctx,38,-45,38,-13,3,'#77614d');
    if(v===1){stroke(ctx,-47,-68,36,-68,3,'#8f765d');stroke(ctx,-47,-69,-47,-40,3,'#8f765d');}
    if(v===3){cuboid(ctx,24,-38,22,30,8,'#a08168');}
    if(v===5)for(const yy of [-77,-70])stroke(ctx,-36,yy,35,yy,4,'#95785f');
    if(v===6)oval(ctx,-29,-53,8,8,'#d2a37f');
    if(v===7)stroke(ctx,-44,-54,43,-54,2,'#806048');
  }
  function drawLamp(ctx,item){const v=item.variant,c=color(item);shadow(ctx,24);
    if(v===9){stroke(ctx,0,-116,0,-65,3,'#5b554f');oval(ctx,0,-68,26,22,'#eddcb9');oval(ctx,0,-52,19,5,'#ffedbf');return;}
    if(v===2){stroke(ctx,0,-115,0,-66,3,'#5b554f');oval(ctx,0,-65,39,8,'#c4a17a');for(const dx of [-25,0,25]){stroke(ctx,dx,-65,dx,-43,3,'#99785a');oval(ctx,dx,-41,10,7,'#ffe9b2');}return;}
    if(v===5){cuboid(ctx,-32,-55,63,34,9,c);oval(ctx,0,-60,18,8,'#ffdea4');return;}
    if(v===6){cuboid(ctx,-17,-26,34,28,10,shade(c,12));oval(ctx,0,-36,9,8,'#ffe29e');return;}
    stroke(ctx,0,-8,0,-78,v===4?5:4,'#554e46');oval(ctx,0,-5,22,6,shade(c,-22));
    if(v===4){stroke(ctx,0,-78,38,-101,4,'#5e5147');oval(ctx,37,-95,14,14,'#f8d6aa');}
    else if(v===1||v===7)oval(ctx,0,-80,20,20,'#fff0cc');
    else {poly(ctx,[[-29,-87],[29,-87],[17,-69],[-17,-69]],shade(c,26));oval(ctx,0,-68,12,4,'#fbe7bd');}
  }
  function drawPlant(ctx,item){const v=item.variant,c=color(item);shadow(ctx,29);
    cuboid(ctx,-19,-12,37,30,14,shade(c,8));stroke(ctx,0,-36,0,v===3?-106:-78,4,'#78634e');
    const greens=['#627c50','#779a70','#4e7050','#90a96d','#5b826a'];
    if(v===4||v===6){for(let i=0;i<9;i++){const a=i*.8;stroke(ctx,0,-37,Math.cos(a)*18,-62-Math.sin(a)*17,3,greens[i%greens.length]);}return;}
    if(v===5){for(let i=0;i<14;i++)oval(ctx,Math.sin(i*1.7)*17,-58-Math.cos(i*.8)*12,9,4,greens[i%5]);return;}
    for(let i=0;i<(v===9?6:12);i++){
      const angle=i*2.399,rx=22+(i%3)*6,yy=-76+(i%4)*10;
      leaf(ctx,Math.sin(angle)*rx,yy,11+(i%3)*3,v===3?6:12,angle*.32,greens[(i+v)%greens.length]);
    }
    if(v===9)for(let k=0;k<3;k++)oval(ctx,Math.sin(k*2)*15,-67+k*8,5,8,'#ead9dc');
  }
  function drawPet(ctx,item){const v=item.variant,c=[ '#b6aba2','#d3a86d','#a78f7c','#e3cfaf','#93847d','#bb916a','#8c9092','#4f8e77','#8d9b59','#d4b99b'][v];shadow(ctx,30);
    if(v===7){stroke(ctx,0,-10,0,-46,4,'#786855');oval(ctx,0,-53,17,21,c);oval(ctx,-4,-56,4,6,'#fcf7e9');leaf(ctx,16,-46,13,6,0.2,'#2c6955');return;}
    if(v===8){oval(ctx,0,-18,35,19,c);oval(ctx,0,-25,28,13,'#6a8552');oval(ctx,25,-15,13,11,c);return;}
    oval(ctx,1,-21,v===3?26:36,20,c);oval(ctx,31,-37,21,v===3?15:18,c);
    for(const x of [-17,16])rounded(ctx,x,-10,10,17,4,shade(c,-14));
    if(v===0||v===4||v===6){poly(ctx,[[17,-52],[26,-75],[35,-51]],shade(c,-10));poly(ctx,[[42,-52],[48,-74],[54,-49]],shade(c,-10));stroke(ctx,-33,-27,-49,-42,7,c);}
    else if(v===3){oval(ctx,26,-61,7,26,c);oval(ctx,47,-62,7,26,c);}
    else {oval(ctx,17,-51,9,15,shade(c,-13));oval(ctx,51,-51,9,15,shade(c,-13));stroke(ctx,-33,-22,-52,-33,8,c);}
    oval(ctx,37,-36,4,3,'#362a22');oval(ctx,28,-43,2,2,'#2e2824');oval(ctx,43,-43,2,2,'#2e2824');
    if(v===9){for(let k=0;k<5;k++)oval(ctx,-10+k*9,-25,6,8,shade(c,14));}
  }
  function drawOutdoor(ctx,item){const v=item.variant,c=color(item);shadow(ctx,51);
    if(v===0){for(const x of [-48,48])for(const y of [-67,-25])stroke(ctx,x,y,x,y+65,6,'#735b45');stroke(ctx,-48,-66,48,-66,5,'#70543d');for(let i=0;i<5;i++)stroke(ctx,-41+i*18,-75,-41+i*18,-52,3,'#866e52');return;}
    if(v===1||v===2||v===9){cuboid(ctx,-44,-23,85,v===2?10:18,12,c);cuboid(ctx,-42,-42,12,25,8,shade(c,-18));stroke(ctx,-30,-10,-30,3,6,'#54463a');stroke(ctx,35,-10,35,3,6,'#54463a');return;}
    if(v===3){oval(ctx,0,-11,37,15,'#6c5a50');oval(ctx,0,-16,28,12,'#db844d');for(const [x,y] of [[-7,-33],[10,-25],[1,-48]])poly(ctx,[[x-9,y+11],[x+2,y-12],[x+12,y+12]],'#f6b958');return;}
    if(v===4){oval(ctx,0,-15,48,20,shade(c,-22));oval(ctx,0,-20,39,17,'#86b8c3');oval(ctx,0,-30,24,8,'#b3e0e5');stroke(ctx,0,-30,0,-63,4,'#bdd4cf');return;}
    if(v===5){cuboid(ctx,-44,-15,88,22,15,shade(c,-13));for(let i=0;i<7;i++){oval(ctx,-33+i*11,-45-(i%3)*5,9,10,['#ce8d82','#f7bfa9','#d7a44e'][i%3]);}return;}
    if(v===6){cuboid(ctx,-55,-22,107,30,22,c);cuboid(ctx,-22,-45,49,20,19,shade(c,30));for(const x of [-40,38])oval(ctx,x,-4,12,12,'#343333');stroke(ctx,-14,-41,18,-41,3,'#9da6ac');return;}
    if(v===7){oval(ctx,-30,-6,14,14,'#2c2a2a');oval(ctx,32,-6,14,14,'#2c2a2a');stroke(ctx,-30,-10,-10,-35,5,'#5c5146');stroke(ctx,-10,-35,32,-10,5,'#5c5146');oval(ctx,-9,-38,16,8,c);return;}
    if(v===8){cuboid(ctx,-49,-16,99,33,22,shade(c,-11));oval(ctx,5,-27,36,14,'#88b9be');oval(ctx,5,-29,28,11,'#bce0dc');return;}
  }
  function drawEquipment(ctx,item){const v=item.variant,c='#393b3a';shadow(ctx,54);
    if(v===7){for(let k=0;k<5;k++){const x=-43+k*21;oval(ctx,x,-7,10+(k%2)*3,8,'#3d3f3e');rounded(ctx,x-8,-28,16,21,8,['#b17850','#5e7d64','#876b50'][k%3]);stroke(ctx,x-5,-29,x+5,-29,4,'#2d302d');}return;}
    if(v===0){cuboid(ctx,-51,-8,99,12,18,'#6b4c37');for(let k=0;k<5;k++){stroke(ctx,-37+k*17,-28,-37+k*17,-12,5,'#343536');oval(ctx,-37+k*17,-29,8,7,'#242526');}return;}
    if(v===1||v===2){for(const x of [-44,45])stroke(ctx,x,-4,x,-100,6,c);stroke(ctx,-44,-100,45,-100,6,c);stroke(ctx,-47,-49,48,-49,4,'#777c7d');for(const x of [-45,46]){oval(ctx,x,-49,12,13,'#242526');}if(v===2)stroke(ctx,0,-94,0,-14,4,'#a6aaa8');return;}
    if(v===9){cuboid(ctx,-51,-18,103,18,14,'#c3a58b');cuboid(ctx,-49,-40,92,12,14,'#d0bcb0');stroke(ctx,-45,-11,-45,2,4,c);stroke(ctx,48,-11,48,2,4,c);for(let x=-38;x<=35;x+=16)stroke(ctx,x,-44,x,-27,3,'#817a73');return;}
    if(v===3){cuboid(ctx,-44,-20,80,18,18,'#68584b');cuboid(ctx,-20,-55,21,34,12,'#3d3e3e');for(const x of [-35,29])stroke(ctx,x,-8,x,3,5,c);return;}
    if(v===4){cuboid(ctx,-55,-16,111,20,26,'#343737');rounded(ctx,-32,-35,63,18,5,'#1d2323');stroke(ctx,35,-27,46,-98,6,c);cuboid(ctx,16,-100,49,11,11,'#404b4b');return;}
    if(v===5){oval(ctx,-18,-4,22,23,'#242627');oval(ctx,-18,-4,15,16,'#a4a9a8');stroke(ctx,-18,-4,15,-53,5,c);oval(ctx,22,-10,21,14,'#313333');stroke(ctx,15,-53,34,-78,4,c);return;}
    if(v===6){stroke(ctx,-47,-4,22,-67,7,c);rounded(ctx,-4,-50,44,13,5,'#565b5b');oval(ctx,-44,-4,20,12,'#2b2f2f');return;}
    if(v===8){stroke(ctx,0,-2,0,-105,4,c);oval(ctx,0,-36,25,40,'#6c5144');stroke(ctx,-15,-90,15,-90,3,'#cbb8a4');return;}
  }
  const drawers={chair:drawChair,table:drawTable,sofa:drawSofa,bed:drawBed,desk:drawDesk,lamp:drawLamp,plant:drawPlant,pet:drawPet,outdoor:drawOutdoor,equipment:drawEquipment};
  function drawObject(ctx,item,sx,sy,scale=1,selected=false){
    ctx.save();ctx.translate(sx,sy);ctx.scale(scale,scale);
    const drawer=drawers[item.kind]||drawTable;
    drawer(ctx,item);
    if(selected){ctx.strokeStyle='#d59b5e';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.ellipse(0,-38,65,68,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  }
  function sceneColors(design){
    const walls={sand:['#ddccba','#c7b09c'],travertine:['#e8ddce','#ccbaa5'],clay:['#ceac9a','#b78e79'],graphite:['#c5bebb','#a89f9b'],terra:['#c89379','#a77760'],greige:['#d7d1c9','#bbb1a7']};
    const floors={walnut:['#9f7252','#6e4a31','#503b2c'],oak:['#d2b38b','#af8a5e','#866746'],stone:['#c3bdb2','#aaa498','#807b73'],cream:['#e2d3bd','#ccbea9','#a89d8f'],travertine:['#ddc7a9','#c7af91','#a28a6f']};
    return {wall:walls[design.wall]||walls.sand, floor:floors[design.floor]||floors.walnut};
  }
  function wallQuad(ctx,a,b,h,fill){const aa=iso(...a),bb=iso(...b),ct=iso(b[0],b[1],h),dt=iso(a[0],a[1],h);poly(ctx,[[dt.x,dt.y],[ct.x,ct.y],[bb.x,bb.y],[aa.x,aa.y]],fill);}
  function boxWorld(ctx,x1,y1,x2,y2,z,c){const a=iso(x1,y1,0),b=iso(x2,y1,0),d=iso(x1,y2,0),e=iso(x2,y2,0),c1=iso(x1,y1,z),c2=iso(x2,y1,z),c3=iso(x2,y2,z),c4=iso(x1,y2,z);poly(ctx,[[a.x,a.y],[d.x,d.y],[c4.x,c4.y],[c1.x,c1.y]],shade(c,-25));poly(ctx,[[b.x,b.y],[e.x,e.y],[c3.x,c3.y],[c2.x,c2.y]],shade(c,-8));poly(ctx,[[c1.x,c1.y],[c2.x,c2.y],[c3.x,c3.y],[c4.x,c4.y]],shade(c,13));}
  function drawArchitecture(ctx,design){
    ctx.fillStyle='#f2e8df';ctx.fillRect(0,0,W,H);
    const colors=sceneColors(design);
    const bg=ctx.createLinearGradient(0,80,960,660);bg.addColorStop(0,'#faf5ee');bg.addColorStop(1,'#ebe2d8');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const p=(x,y,z=0)=>{const q=iso(x,y,z);return [q.x,q.y];};
    // back wall planes, with real material recoloring
    poly(ctx,[p(0,0,4.9),p(9.6,0,4.9),p(9.6,0,0),p(0,0,0)],colors.wall[0]);
    poly(ctx,[p(0,0,4.9),p(0,9.6,4.9),p(0,9.6,0),p(0,0,0)],colors.wall[1]);
    // travertine veins / clay plaster subtle texture
    ctx.save();ctx.globalAlpha=.13;for(let i=0;i<22;i++){const x=i/2.4,y=(i*3.97)%9.1;const a=iso(x,0,3.9);stroke(ctx,a.x,a.y,a.x+10,a.y+20,1.2,shade(colors.wall[0],-45));}ctx.restore();
    // windows inset into back walls
    function windowQuad(x1,x2,z1,z2,axis){
      const pts=axis==='right'?[p(x1,0,z1),p(x2,0,z1),p(x2,0,z2),p(x1,0,z2)]:[p(0,x1,z1),p(0,x2,z1),p(0,x2,z2),p(0,x1,z2)];
      poly(ctx,pts,'#a1b2ad','#554d43',8);
      const inset=[pts[0],pts[1],pts[2],pts[3]];
      poly(ctx,inset,'rgba(217,235,225,.62)');
      const cross1=axis==='right'?[p((x1+x2)/2,0,z1),p((x1+x2)/2,0,z2)]:[p(0,(x1+x2)/2,z1),p(0,(x1+x2)/2,z2)];
      const cross2=axis==='right'?[p(x1,0,(z1+z2)/2),p(x2,0,(z1+z2)/2)]:[p(0,x1,(z1+z2)/2),p(0,x2,(z1+z2)/2)];
      stroke(ctx,...cross1[0],...cross1[1],5,'#594e44');stroke(ctx,...cross2[0],...cross2[1],5,'#594e44');
      ctx.save();ctx.globalAlpha=.28;poly(ctx,[inset[0],inset[1],inset[2],inset[3]],'#e8f2e4');ctx.restore();
    }
    windowQuad(1.2,4.2,1.1,4.15,'left');windowQuad(5.6,8.3,1.2,4.2,'right');
    // a small framed art piece: part of the building, not a collectible
    poly(ctx,[p(0,6.0,2.2),p(0,7.45,2.2),p(0,7.45,3.35),p(0,6.0,3.35)],'#5a483d');
    poly(ctx,[p(0,6.12,2.3),p(0,7.32,2.3),p(0,7.32,3.23),p(0,6.12,3.23)],'#f4ecdf');
    poly(ctx,[p(0,6.3,2.45),p(0,7.04,2.75),p(0,6.6,3.1)],'#b79075');
    // wall-height shelves add architectural depth
    for(const z of [1.9,2.55,3.2]){
      const a=p(7.7,0,z),b=p(8.85,0,z),d=p(8.85,.33,z),e=p(7.7,.33,z);
      poly(ctx,[a,b,d,e],'#8b6c54');
      stroke(ctx,...e,...d,3,'#654c39');
    }
    // curtains next to window
    for(const x of [1.1,4.3]){
      const a=iso(0,x,4.4),b=iso(0,x,1.0);stroke(ctx,a.x,a.y,b.x,b.y,9,'rgba(247,240,228,.92)');
    }
    // floor slab & plinth (whole room changes material)
    poly(ctx,[p(0,9.6),p(9.6,9.6),p(9.6,9.6,-.38),p(0,9.6,-.38)],colors.floor[2]);
    poly(ctx,[p(9.6,0),p(9.6,9.6),p(9.6,9.6,-.38),p(9.6,0,-.38)],shade(colors.floor[2],-12));
    poly(ctx,[p(0,0),p(9.6,0),p(9.6,9.6),p(0,9.6)],colors.floor[0]);
    // visible terrace 1.5 units strip, lightly different material
    const patio=(design.scene==='studio')?'#cfc3b4':(design.scene==='terrace')?'#d8c5a8':'#bdc6a9';
    poly(ctx,[p(7.8,0.05),p(9.6,.05),p(9.6,9.4),p(7.8,9.4)],patio);
    // wood and travertine inlay grooves in the entire floor
    ctx.save();ctx.globalAlpha=.25;
    for(let i=.7;i<9.7;i+=.55){const a=p(i,0),b=p(i,9.6);stroke(ctx,...a,...b,1,colors.floor[2]);}
    for(let i=.9;i<9.7;i+=1.9){const a=p(0,i),b=p(9.6,i);stroke(ctx,...a,...b,1.4,colors.floor[1]);}
    ctx.restore();
    // indoor - patio separation
    stroke(ctx,...p(7.8,.05),...p(7.8,9.4),4,'#8d826b');
    // sunlit patch on floor
    ctx.save();ctx.globalAlpha=.14;poly(ctx,[p(1.0,3.3),p(4,3.3),p(6.1,7.6),p(3,7.6)],'#fffef3');ctx.restore();
    // ornamental baseboard & wall ledge
    stroke(ctx,...p(0,0,.16),...p(9.5,0,.16),6,shade(colors.wall[0],-30));
    stroke(ctx,...p(0,0,.16),...p(0,9.5,.16),6,shade(colors.wall[1],-30));
    // floor rug built in (small), stationary architecture detail
    poly(ctx,[p(3.3,4.1,.02),p(6.7,4.1,.02),p(6.7,6.2,.02),p(3.3,6.2,.02)],'rgba(233,219,196,.63)');
    // built-in architectural pendant, warm glow
    const light=iso(.15,.2,4.2);oval(ctx,light.x,light.y,9,6,'#ffdfa1');
    const pendant=iso(5.0,2.1,3.4), ceiling=iso(5.0,2.1,4.6);
    stroke(ctx,ceiling.x,ceiling.y,pendant.x,pendant.y,2,'rgba(86,68,52,.7)');
    oval(ctx,pendant.x,pendant.y+7,17,6,'#cfb49a');
    oval(ctx,pendant.x,pendant.y+11,11,4,'#ffe1aa');
    // background ambient labels
    ctx.fillStyle='rgba(62,48,36,.55)';ctx.font='600 14px system-ui';ctx.fillText('STUDIO / COURTYARD',76,596);
    ctx.font='11px system-ui';ctx.fillText('MINIATURE LIVING SPACE',76,616);
  }
  function defaultWorld(){return {version:1,items:[]};}
  function normalizeWorld(data){
    if(!data.gymWorld||typeof data.gymWorld!=='object'){
      const legacy=Array.isArray(data.gymLayout)?data.gymLayout:[];
      const positions=[[2,2],[3.5,2.7],[5,2],[3,4],[5.7,4],[2,6],[4.1,6.2],[5.8,7],[8.7,2.9],[8.6,6.5]];
      const items=[];
      legacy.forEach((id,i)=>{if(!id||!map[id])return;const meta=fromId(id),v=positions[i]||[4,4];items.push({id,x:meta.zone==='outdoor'?8.5:v[0],y:v[1],rotation:0});});
      data.gymWorld={version:1,items:items.slice(0,10)};
    }
    if(!Array.isArray(data.gymWorld.items))data.gymWorld.items=[];
    const seen=new Set();data.gymWorld.items=data.gymWorld.items.filter(it=>{
      if(!it||!map[it.id]||seen.has(it.id)||!(data.inventory||[]).includes(it.id))return false;
      seen.add(it.id);it.x=clamp(Number(it.x)||4,.2,9.3);it.y=clamp(Number(it.y)||4,.2,9.3);it.rotation=Number(it.rotation)||0;return true;
    }).slice(0,10);
    return data.gymWorld;
  }
  function snap(meta,x,y){
    if(meta.zone==='outdoor')return {x:clamp(x,8.0,9.25),y:clamp(y,.75,8.85)};
    if(meta.zone==='wall')return y<x?{x:clamp(x,1.2,7.4),y:.1}:{x:.1,y:clamp(y,1.2,7.4)};
    return {x:clamp(x,.6,7.3),y:clamp(y,.6,8.75)};
  }
  function xyz(it){const m=fromId(it.id),z=m.zone==='wall'?2.1:m.zone==='ceiling'?3.7:0;return iso(it.x,it.y,z);}
  function scaleFor(it){return .9+((it.x+it.y)/20)*.20;}
  let active=null;
  function mount(canvas,data,onChange,selectedId,onDone){
    if(!canvas||!data)return;
    if(active?.canvas===canvas){active.selectedId=selectedId;active.draw();return;}
    if(active)active.destroy();
    const world=normalizeWorld(data);const ctx=canvas.getContext('2d');
    const render=()=>{
      if(!canvas.isConnected)return;
      ctx.clearRect(0,0,W,H);drawArchitecture(ctx,data.gymDesign||{});
      const sorted=[...world.items].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
      sorted.forEach(it=>{const m=fromId(it.id),p=xyz(it),sc=scaleFor(it);drawObject(ctx,m,p.x,p.y,sc,active?.selectedObject===it.id);});
      if(active?.ghost){const m=fromId(active.ghost.id),p=xyz(active.ghost);ctx.save();ctx.globalAlpha=.7;drawObject(ctx,m,p.x,p.y,scaleFor(active.ghost),true);ctx.restore();}
    };
    const px=(e)=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
    const hit=(x,y)=>{const items=[...world.items].sort((a,b)=>(b.x+b.y)-(a.x+a.y));return items.find(it=>{const p=xyz(it),s=scaleFor(it);return Math.abs(x-p.x)<58*s&&y>p.y-116*s&&y<p.y+16*s;})||null;};
    let drag=null;
    function down(e){if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();const p=px(e);const chosen=active?.selectedId;
      if(chosen){const meta=fromId(chosen);const s=snap(meta,...Object.values(unproject(p.x,p.y)));let it=world.items.find(o=>o.id===chosen);if(!it){if(world.items.length>=10){onDone?.('max');return;}it={id:chosen,x:s.x,y:s.y,rotation:0};world.items.push(it);}else{it.x=s.x;it.y=s.y;}drag={it,moved:false,start:p,wasNew:true};active.selectedObject=chosen;active.ghost=null;canvas.setPointerCapture(e.pointerId);render();return;}
      const it=hit(p.x,p.y);if(!it){active.selectedObject=null;render();return;}drag={it,moved:false,start:p};active.selectedObject=it.id;canvas.setPointerCapture(e.pointerId);render();
    }
    function move(e){if(!drag)return;const p=px(e);if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;const meta=fromId(drag.it.id),un=unproject(p.x,p.y);const pos=snap(meta,un.x,un.y);drag.it.x=pos.x;drag.it.y=pos.y;render();}
    function up(e){if(!drag)return;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(drag.moved||drag.wasNew){onChange();if(drag.wasNew)onDone?.('placed');}else onDone?.('selected',drag.it.id);drag=null;render();}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    active={canvas,selectedId,selectedObject:null,ghost:null,draw:render,destroy(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);}};
    render();
  }
  const previews=new Map();
  function thumbnail(itemId){if(previews.has(itemId))return previews.get(itemId);const item=fromId(itemId),c=document.createElement('canvas');c.width=240;c.height=240;const cx=c.getContext('2d');const g=cx.createLinearGradient(0,0,240,240);g.addColorStop(0,'#fcf7ef');g.addColorStop(1,'#e9dcd0');cx.fillStyle=g;cx.fillRect(0,0,240,240);drawObject(cx,item,116,182,1.65,false);const url=c.toDataURL('image/png');previews.set(itemId,url);return url;}
  window.KraftlogMiniGym={catalog,fromId,normalizeWorld,mount,thumbnail,snap,iso,unproject,drawObject};
})();
