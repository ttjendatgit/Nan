(function(){
  var NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function wedge(r1,r2,s){
    var a=s*Math.PI/180, x2=r2*Math.sin(a), y2=-r2*Math.cos(a), x1=r1*Math.sin(a), y1=-r1*Math.cos(a);
    return 'M0 '+(-r1)+' L0 '+(-r2)+' A'+r2+' '+r2+' 0 0 1 '+x2.toFixed(2)+' '+y2.toFixed(2)+' L'+x1.toFixed(2)+' '+y1.toFixed(2)+' A'+r1+' '+r1+' 0 0 0 0 '+(-r1)+' Z';
  }
  // rib: thin at the pivot, widening toward the tip
  function wedge2(r1,r2,a0,a1){
    function pt(r,a){a=a*Math.PI/180;return (r*Math.sin(a)).toFixed(2)+' '+(-r*Math.cos(a)).toFixed(2);}
    return 'M'+pt(r1,a0)+' L'+pt(r2,a0)+' A'+r2+' '+r2+' 0 0 1 '+pt(r2,a1)+' L'+pt(r1,a1)+' A'+r1+' '+r1+' 0 0 0 '+pt(r1,a0)+' Z';
  }
  function ray(r1,r2,a){a=a*Math.PI/180;return 'M'+(r1*Math.sin(a)).toFixed(2)+' '+(-r1*Math.cos(a)).toFixed(2)+' L'+(r2*Math.sin(a)).toFixed(2)+' '+(-r2*Math.cos(a)).toFixed(2);}
  // rib: runs from the tail (below the pivot) through the pivot to the tip.
  // narrowest at the pivot, widening toward the tip; the tail end is moderately wide.
  function rib(tail,r1,w0,w1,wt){
    var h0=w0/2,h1=w1/2,ht=wt/2;
    return 'M'+(-ht)+' '+tail+' L'+(-h0)+' 0 L'+(-h1)+' '+(-r1)+' Q0 '+(-(r1+h1*1.6)).toFixed(2)+' '+h1+' '+(-r1)+
      ' L'+h0+' 0 L'+ht+' '+tail+' Q0 '+(tail+ht*1.5).toFixed(2)+' '+(-ht)+' '+tail+' Z';
  }
  function arc(r,a0,a1){
    function p(a){a=a*Math.PI/180;return (r*Math.sin(a)).toFixed(2)+' '+(-r*Math.cos(a)).toFixed(2);}
    return 'M'+p(a0)+' A'+r+' '+r+' 0 0 1 '+p(a1);
  }

  // Builds a folding fan. Returns movable parts: [{node, closed, open}]
  function buildFan(svg,o){
    var parts=[], S=2*o.half/o.n;
    var root=el('g',{transform:'translate('+o.cx+' '+o.cy+')'},svg);
    if(o.rays){
      var rays=el('g',{'class':'rays',stroke:'#C9A84C','stroke-width':'1'},root);
      for(var k=0;k<=36;k++){var a=(-90+k*5)*Math.PI/180, r0=o.r2+22, r1=o.r2+(k%2?70:120);
        el('line',{x1:(r0*Math.sin(a)).toFixed(1),y1:(-r0*Math.cos(a)).toFixed(1),x2:(r1*Math.sin(a)).toFixed(1),y2:(-r1*Math.cos(a)).toFixed(1),opacity:k%2?'.35':'.6'},rays);}
      el('path',{d:arc(o.r2+14,-o.half-6,o.half+6),fill:'none',stroke:'#C9A84C','stroke-width':'1',opacity:'.5'},rays);
    }
    // inner ribs
    for(var j=1;j<o.n;j++){
      var g=el('g',{},root);
      el('path',{d:rib(o.tail,o.r2-6,o.rib*0.25,o.rib*1.7,o.rib*0.9),fill:(o.ribColor||'#A8893A'),stroke:'rgba(8,18,67,.35)','stroke-width':'.6'},g);
      ribDecor(g,o,false);
      parts.push({node:g,closed:0,open:-o.half+j*S});
    }
    // pleats: each is a mountain fold, a lit half and a shadow half
    var pd=el('defs',{},svg), k=(o.r1/o.r2).toFixed(3);
    var ga=el('radialGradient',{id:'nanpa'+o.id,gradientUnits:'userSpaceOnUse',cx:0,cy:0,r:o.r2},pd);
    [[k,'#7C97F0','.22'],['.62','#4E6FE0','.46'],['.9','#3F60D6','.62'],['1','#5B7BE6','.74']].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1],'stop-opacity':c[2]},ga);});
    var gb=el('radialGradient',{id:'nanpb'+o.id,gradientUnits:'userSpaceOnUse',cx:0,cy:0,r:o.r2},pd);
    [[k,'#2A45B0','.16'],['.62','#22399C','.36'],['.9','#1D338F','.52'],['1','#2B47B4','.66']].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1],'stop-opacity':c[2]},gb);});
    function P(r,a){a=a*Math.PI/180;return [r*Math.sin(a),-r*Math.cos(a)];}
    function f(q){return q[0].toFixed(2)+' '+q[1].toFixed(2);}
    function mid(a,b){return [(a[0]+b[0])/2,(a[1]+b[1])/2];}
    var b=o.r2*0.024, P0=P(o.r2,0), P2=P(o.r2,S), C=P(o.r2+2*b,S/2),
        A1=mid(P0,C), B1=mid(C,P2), M=mid(A1,B1);
    var halfA='M'+f(P(o.r1,0))+' L'+f(P0)+' Q'+f(A1)+' '+f(M)+' L'+f(P(o.r1,S/2))+' A'+o.r1+' '+o.r1+' 0 0 0 '+f(P(o.r1,0))+' Z';
    var halfB='M'+f(P(o.r1,S/2))+' L'+f(M)+' Q'+f(B1)+' '+f(P2)+' L'+f(P(o.r1,S))+' A'+o.r1+' '+o.r1+' 0 0 0 '+f(P(o.r1,S/2))+' Z';
    var rim='M'+f(P0)+' Q'+f(C)+' '+f(P2);
    var soft=el('filter',{id:'nansoft'+o.id,x:'-30%',y:'-30%',width:'160%',height:'160%'},pd);
    el('feGaussianBlur',{stdDeviation:o.r2*0.012},soft);
    for(var i=0;i<o.n;i++){
      var p=el('g',{},root), d=(200+i*90)+'ms';
      el('path',{d:halfA,fill:'url(#nanpa'+o.id+')'},p);
      el('path',{d:halfB,fill:'url(#nanpb'+o.id+')'},p);
      el('path',{d:halfA,fill:'#DCE6FF','class':'flash',style:'--d:'+d,filter:'url(#nansoft'+o.id+')'},p);
      el('path',{d:ray(o.r1,o.r2,0),stroke:'#A8893A','stroke-width':'.6',opacity:'.35',fill:'none'},p);
      el('path',{d:ray(o.r1+6,o.r2+b*0.6,S/2),stroke:'#C9D8FF','stroke-width':o.deco,'stroke-linecap':'round',fill:'none','class':'crease',style:'--d:'+d},p);
      el('path',{d:arc(o.r1+o.inset,0,S),fill:'none',stroke:'#C9A84C','stroke-width':o.deco*0.8,opacity:'.7'},p);
      el('path',{d:rim,fill:'none',stroke:'#C9A84C','stroke-width':o.deco*1.8,'stroke-linecap':'round'},p);
      parts.push({node:p,closed:-S/2,open:-o.half+i*S});
    }
    // guard ribs
    [0,o.n].forEach(function(j){
      var g=el('g',{},root);
      el('path',{d:rib(o.tail,o.r2+2,o.rib*0.45,o.rib*2.6,o.rib*1.3),fill:(o.guardColor||'#C9A84C'),stroke:'rgba(8,18,67,.35)','stroke-width':'.6'},g);
      ribDecor(g,o,true);
      parts.push({node:g,closed:0,open:-o.half+j*S});
    });
    el('circle',{r:o.rib*1.6,fill:'#C9A84C',stroke:'#081243','stroke-width':o.rib*0.25},root);
    el('circle',{r:o.rib*0.55,fill:'#081243'},root);
    if(o.text){
      var t=el('g',{'class':'fan-text'},root);
      var R=(o.r1+o.r2)/2+4;
      el('path',{id:'nanFanTextArc',d:arc(R,-50,50),fill:'none'},t);
      var defs=el('defs',{},svg);
      var foil=el('linearGradient',{id:'nanFoil',gradientUnits:'userSpaceOnUse',x1:-220,y1:-380,x2:220,y2:-250},defs);
      [['0','#8C6D23'],['.28','#E9D08A'],['.5','#B8953C'],['.72','#F3E3A8'],['1','#9C7C2E']].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1]},foil);});
      var shine=el('linearGradient',{id:'nanShine',gradientUnits:'userSpaceOnUse',x1:-700,y1:0,x2:-520,y2:0},defs);
      [['0','0'],['.5','.9'],['1','0']].forEach(function(c){el('stop',{offset:c[0],'stop-color':'#FFFFFF','stop-opacity':c[1]},shine);});
      window.__nanShine=[];
      [['x1',-760,420],['x2',-500,680]].forEach(function(a){window.__nanShine.push(el('animate',{attributeName:a[0],from:a[1],to:a[2],dur:'2.2s',calcMode:'spline',keyTimes:'0;1',keySplines:'.45 0 .25 1',begin:'indefinite',fill:'freeze'},shine));});
      var f=el('filter',{id:'nanLift',x:'-20%',y:'-40%',width:'140%',height:'180%'},defs);
      el('feDropShadow',{dx:0,dy:4,stdDeviation:6,'flood-color':'#081243','flood-opacity':'.5'},f);
      function word(fill,extra){
        var tx=el('text',Object.assign({fill:fill,'font-family':'Cinzel, Georgia, serif','font-weight':'400','font-size':o.text.size,'letter-spacing':o.text.spacing,'text-anchor':'middle','dominant-baseline':'middle'},extra||{}),t);
        var tp=el('textPath',{href:'#nanFanTextArc',startOffset:'50%'},tx);
        tp.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#nanFanTextArc');
        tp.textContent=o.text.value;
      }
      word('url(#nanFoil)',{stroke:'#081243','stroke-width':'.7','paint-order':'stroke',filter:'url(#nanLift)'});
      word('url(#nanShine)');
    }
    return parts;
  }
  // soft motion: sine-smoothed start, outer pleats trail a little, then a gentle settle
  function soften(x){var s=x*x*(3-2*x), c1=.55, c3=c1+1;return 1+c3*Math.pow(s-1,3)+c1*Math.pow(s-1,2);}
  // rib decoration for the fan-style illustrations
  function ribDecor(g,o,guard){
    if(o.decor==='nodes'){[0.34,0.6,0.84].forEach(function(f){var r=o.r2*f;el('line',{x1:-o.rib*1.3,y1:-r,x2:o.rib*1.3,y2:-r,stroke:'#6E5530','stroke-width':o.rib*0.4,'stroke-linecap':'round',opacity:'.85'},g);});}
    else if(o.decor==='dots'){[0.42,0.57,0.72,0.87].forEach(function(f){el('circle',{cx:0,cy:-o.r2*f,r:o.rib*0.42,fill:'#F3E3A8'},g);});}
    else if(o.decor==='carve'&&guard){[0.3,0.48,0.66,0.84].forEach(function(f){var r=o.r2*f,s=o.rib*1.0;el('path',{d:'M0 '+(-r-s)+' L'+s+' '+(-r)+' L0 '+(-r+s)+' L'+(-s)+' '+(-r)+' Z',fill:'#F3E3A8'},g);});}
  }
  function setP(parts,t){parts.forEach(function(p){
    var span=Math.max(Math.abs(p.open),1e-6), lag=0.22*Math.min(1,Math.abs(p.open)/80);
    var l=Math.max(0,Math.min(1,(t-lag)/(1-lag))), e=t>=1?1:soften(l);
    p.node.setAttribute('transform','rotate('+(p.closed+(p.open-p.closed)*e).toFixed(3)+')');});}

  function addAll(c){document.querySelectorAll('.nan-s').forEach(function(w){w.classList.add(c);});}
  var fanSvg=document.getElementById('nan-fan'), miniSvg=document.getElementById('nan-mini-fan');
  var nav=document.getElementById('nan-nav');
  function onScroll(){if(nav)nav.classList.toggle('solid',window.scrollY>window.innerHeight*0.6);}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  // small static fan in product section
  if(miniSvg)setP(buildFan(miniSvg,{cx:132,cy:140,r1:30,r2:120,half:62,n:10,rib:2.2,tail:18,inset:9,deco:.6,id:'m'}),1);

  // product page: one illustrated fan per rib style
  var STYLES={
    khanghy:{ribColor:'#4A2A17',guardColor:'#5A3319',decor:'carve'},
    hoavan:{ribColor:'#A8893A',guardColor:'#C9A84C',decor:'dots'},
    thuong:{ribColor:'#A8893A',guardColor:'#C9A84C'},
    tre:{ribColor:'#C8A36A',guardColor:'#B8894A',decor:'nodes'}
  };
  document.querySelectorAll('.nan-style-fan').forEach(function(svg,i){
    var st=STYLES[svg.getAttribute('data-style')]||{};
    var o={cx:132,cy:140,r1:30,r2:120,half:62,n:10,rib:2.8,tail:18,inset:9,deco:.6,id:'s'+i};
    for(var k in st)o[k]=st[k];
    setP(buildFan(svg,o),1);
  });
  // "Nhận báo giá mẫu này" pre-selects the model in the form
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-pick]');if(!a)return;
    var sel=document.querySelector('select[name="loai"]');if(!sel)return;
    var v=a.getAttribute('data-pick');
    for(var i=0;i<sel.options.length;i++){if(sel.options[i].text===v){sel.selectedIndex=i;break;}}
  });
  if(!fanSvg)return;
  function soft2(x,c1){var s=x*x*(3-2*x), c3=c1+1;return 1+c3*Math.pow(s-1,3)+c1*Math.pow(s-1,2);}
  function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
  // ===== Option C: silk fan. One continuous pleated fabric glued to the ribs, lit by the fold. =====
  function buildSilk(svg,o){
    var S=2*o.half/o.n, XL='http://www.w3.org/1999/xlink';
    var defs=el('defs',{},svg);
    var root=el('g',{transform:'translate('+o.cx+' '+o.cy+')'},svg);
    var rays=el('g',{'class':'rays',stroke:'#C9A84C','stroke-width':'1'},root);
    for(var k=0;k<=36;k++){var a=(-90+k*5)*Math.PI/180, q0=o.r2+30, q1=o.r2+(k%2?78:128);
      el('line',{x1:(q0*Math.sin(a)).toFixed(1),y1:(-q0*Math.cos(a)).toFixed(1),x2:(q1*Math.sin(a)).toFixed(1),y2:(-q1*Math.cos(a)).toFixed(1),opacity:k%2?'.35':'.6'},rays);}
    el('path',{d:arc(o.r2+22,-o.half-6,o.half+6),fill:'none',stroke:'#C9A84C','stroke-width':'1',opacity:'.5'},rays);
    var fanG=el('g',{},root);

    // silk: opaque sapphire, a touch deeper at the inner edge
    var kk=(o.r1/(o.r2+20)).toFixed(3);
    var sg=el('radialGradient',{id:'nanSilk',gradientUnits:'userSpaceOnUse',cx:0,cy:0,r:o.r2+20},defs);
    [[kk,'#142A56'],['.6','#1C3A73'],['.88','#234686'],['1','#1A356E']].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1]},sg);});
    // moving sheen band (silk catches the light along a band that drifts as the fan moves)
    var sheen=el('linearGradient',{id:'nanSheen',gradientUnits:'userSpaceOnUse',x1:-1100,y1:0,x2:-800,y2:0,gradientTransform:'rotate(-28)'},defs);
    [['0','0'],['.5','.8'],['1','0']].forEach(function(c){el('stop',{offset:c[0],'stop-color':'#F2F6FF','stop-opacity':c[1]},sheen);});
    // fine weave
    var pat=el('pattern',{id:'nanWeave',patternUnits:'userSpaceOnUse',width:4,height:4},defs);
    el('path',{d:'M0 4 L4 0',stroke:'#FFFFFF','stroke-width':'.5',opacity:'.5'},pat);
    // gold foil ink + one-time shine
    var foil=el('linearGradient',{id:'nanSilkFoil',gradientUnits:'userSpaceOnUse',x1:-220,y1:-380,x2:220,y2:-250},defs);
    [['0','#8C6D23'],['.28','#EBD38E'],['.5','#B8953C'],['.72','#F5E6AE'],['1','#9C7C2E']].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1]},foil);});
    var shine=el('linearGradient',{id:'nanSilkShine',gradientUnits:'userSpaceOnUse',x1:-760,y1:0,x2:-500,y2:0},defs);
    [['0','0'],['.5','.85'],['1','0']].forEach(function(c){el('stop',{offset:c[0],'stop-color':'#FFFFFF','stop-opacity':c[1]},shine);});
    window.__nanSilkShine=[];
    [['x1',-760,420],['x2',-500,680]].forEach(function(a){window.__nanSilkShine.push(el('animate',{attributeName:a[0],from:a[1],to:a[2],dur:'2.2s',calcMode:'spline',keyTimes:'0;1',keySplines:'.45 0 .25 1',begin:'indefinite',fill:'freeze'},shine));});
    // the word, laid out flat as if the fan were fully open; each fold shows its own slice
    var R=(o.r1+o.r2)/2+4;
    el('path',{id:'nanSilkArc',d:arc(R,-50,50),fill:'none'},defs);
    var flat=el('g',{id:'nanSilkText'},defs);
    ['url(#nanSilkFoil)','url(#nanSilkShine)'].forEach(function(fill){
      var tx=el('text',{fill:fill,'font-family':'Cinzel, Georgia, serif','font-weight':'400','font-size':o.text.size,'letter-spacing':o.text.spacing,'text-anchor':'middle','dominant-baseline':'middle'},flat);
      var tp=el('textPath',{href:'#nanSilkArc',startOffset:'50%'},tx);
      tp.setAttributeNS(XL,'xlink:href','#nanSilkArc'); tp.textContent=o.text.value;
    });

    // natural bamboo: flat face, a touch darker toward the edges
    [['nanBamboo','#D9BF8E','#F2E6C8'],['nanBambooG','#D2B47E','#EBDAB2']].forEach(function(b){
      var lg=el('linearGradient',{id:b[0],gradientUnits:'userSpaceOnUse',x1:-o.slat/2,y1:0,x2:o.slat/2,y2:0},defs);
      [['0',b[1]],['.18',b[2]],['.7',b[2]],['1',b[1]]].forEach(function(c){el('stop',{offset:c[0],'stop-color':c[1]},lg);});});
    var ao=el('linearGradient',{id:'nanRibAO',gradientUnits:'userSpaceOnUse',x1:0,y1:o.tail,x2:0,y2:-(o.r1+14)},defs);
    var tot=o.tail+o.r1+14;
    [[0,.28],[(o.tail+45)/tot,0],[(o.tail+o.r1-40)/tot,0],[1,.42]].forEach(function(c){el('stop',{offset:c[0].toFixed(3),'stop-color':'#1E1204','stop-opacity':c[1]},ao);});
    var F={o:o,S:S,fanG:fanG,sheen:sheen,ribs:[],halves:[],ridges:[],creases:[],guards:[]};
    F.guards[1]=bambooRib(fanG,o,o.r2,o.slat*.3,o.slat*.78,'nanBambooG',null,true); // back guard, behind the fabric
    // inner slats: flat and wide, overlapping near the rivet; they end just under the fabric
    for(var j=o.n-1;j>=1;j--)F.ribs[j]=bambooRib(fanG,o,o.r1+14,o.slat*.24,o.slat*.62,'nanBamboo');
    for(var p=0;p<o.n;p++){for(var s=0;s<2;s++){
      var id='nanhc'+p+'_'+s, cp=el('clipPath',{id:id,clipPathUnits:'userSpaceOnUse'},defs), h={cpp:el('path',{},cp)};
      var g2=el('g',{},fanG);
      h.base=el('path',{fill:'url(#nanSilk)'},g2);
      el('path',{fill:'url(#nanWeave)',opacity:'.06','clip-path':'url(#'+id+')',d:'M-700 -700H700V200H-700Z'},g2);
      var tw=el('g',{'clip-path':'url(#'+id+')'},g2); h.tr=el('g',{},tw);
      var u=el('use',{href:'#nanSilkText'},h.tr); u.setAttributeNS(XL,'xlink:href','#nanSilkText');
      h.gd=el('linearGradient',{id:'hd'+id,gradientUnits:'userSpaceOnUse'},defs);
      h.gl=el('linearGradient',{id:'hl'+id,gradientUnits:'userSpaceOnUse'},defs);
      h.sd=['0','.5','1'].map(function(o2){return el('stop',{offset:o2,'stop-color':'#020822','stop-opacity':'0'},h.gd);});
      h.sl=['0','.5','1'].map(function(o2){return el('stop',{offset:o2,'stop-color':'#EEF3FF','stop-opacity':'0'},h.gl);});
      h.shade=el('path',{fill:'url(#hd'+id+')'},g2); h.light=el('path',{fill:'url(#hl'+id+')'},g2); h.sh=el('path',{fill:'url(#nanSheen)'},g2);
      F.halves.push(h);}}
    var edges=el('g',{fill:'none','stroke-linecap':'round'},fanG);
    for(j=1;j<o.n;j++)F.ridges[j]=el('path',{stroke:'rgba(5,10,40,.26)','stroke-width':'3.4'},edges);
    for(p=0;p<o.n;p++)F.creases[p]=el('path',{stroke:'#DCE6FF','stroke-width':'2.4'},edges);
    F.inner=el('path',{stroke:'#C9A84C','stroke-width':o.deco*0.9,opacity:'.75'},edges);
    F.rim=el('path',{stroke:'#C9A84C','stroke-width':o.deco*1.6,'stroke-linejoin':'round'},edges);
    F.guards[0]=bambooRib(fanG,o,o.r2,o.slat*.3,o.slat*.78,'nanBambooG',[48,95,190,260,330,400],true,true); // front guard, over the fabric
    el('circle',{r:10,fill:'#C9A84C',stroke:'#8C6D23','stroke-width':'.8'},fanG);
    el('circle',{r:6.5,fill:'none',stroke:'#F3E3A8','stroke-width':'.8',opacity:'.8'},fanG);
    el('circle',{r:3.2,fill:'#081243'},fanG);
    return F;
  }

  // flat bamboo slat: rounded at both ends, width w0 at the tail tapering to w1 at the tip
  // narrow at the tail (rivet end), widening toward the fabric
  function slat(tail,rEnd,w0,w1,flat){var h0=w0/2,h1=w1/2;
    var top=flat?' L'+h1+' '+(-rEnd):' A'+h1+' '+h1+' 0 0 1 '+h1+' '+(-rEnd);
    return 'M'+(-h0)+' '+tail+' L'+(-h1)+' '+(-rEnd)+top+' L'+h0+' '+tail+' A'+h0+' '+h0+' 0 0 1 '+(-h0)+' '+tail+' Z';}
  // refined bamboo: slim flat slat, soft shading, a gold inlay hairline (Art Deco)
  // refined bamboo slat with live lighting: a bevel that catches light on one edge,
  // a face that brightens/dims with its angle, and occlusion near the rivet and under the fabric
  var RIBN=0;
  function bambooRib(parent,o,rEnd,w0,w1,grad,deco,flat,front){
    var g=el('g',{},parent), id='nanrb'+(RIBN++), svg=parent.ownerSVGElement, defs=svg.querySelector('defs');
    var d=slat(o.tail,rEnd,w0,w1,flat);
    g._shadow=el('path',{d:d,fill:'rgba(20,14,4,.18)',transform:front?'translate(3 2.6)':'translate(1.2 1)'},g);
    el('path',{d:d,fill:'url(#'+grad+')',stroke:'#B89868','stroke-width':'.5'},g);
    var gs=el('linearGradient',{id:id+'s',gradientUnits:'userSpaceOnUse',x1:-w1/2,y1:0,x2:w1/2,y2:0},defs);
    var gh=el('linearGradient',{id:id+'h',gradientUnits:'userSpaceOnUse',x1:-w1/2,y1:0,x2:w1/2,y2:0},defs);
    g._sh=['0','.25','.75','1'].map(function(o2){return el('stop',{offset:o2,'stop-color':'#2A1A05','stop-opacity':'0'},gs);});
    g._hi=['0','.3','.7','1'].map(function(o2){return el('stop',{offset:o2,'stop-color':'#FFF6E0','stop-opacity':'0'},gh);});
    el('path',{d:d,fill:'url(#'+id+'s)'},g);el('path',{d:d,fill:'url(#'+id+'h)'},g);
    if(!front)el('path',{d:d,fill:'url(#nanRibAO)'},g);
    g._inlay=el('line',{x1:0,y1:o.tail-3,x2:0,y2:-(rEnd-5),stroke:'#E3C66E','stroke-width':'.7',opacity:'.8'},g);
    if(deco){g._gemHi=[];deco.forEach(function(r){var dd=(w0+(w1-w0)*(r+o.tail)/(rEnd+o.tail))*.28, gd='M0 '+(-r-dd*1.6)+' L'+dd+' '+(-r)+' L0 '+(-r+dd*1.6)+' L'+(-dd)+' '+(-r)+' Z';
      el('path',{d:gd,fill:'#C9A84C',stroke:'#8C6D23','stroke-width':'.4'},g);
      g._gemHi.push(el('path',{d:gd,fill:'#F7EBC0',opacity:'0'},g));});}
    return g;
  }
  function lightRib(g,theta){
    if(!g||!g._hi)return;
    var th=theta*Math.PI/180,ct=Math.cos(th),st=Math.sin(th);
    var side=ct*LIGHT[0]+st*LIGHT[1];
    var tl=.17,N=[-Math.sin(tl)*ct,-Math.sin(tl)*st,Math.cos(tl)];
    var nl=Math.max(0,N[0]*LIGHT[0]+N[1]*LIGHT[1]+N[2]*LIGHT[2]);
    var spec=Math.pow(Math.max(0,N[0]*HALF[0]+N[1]*HALF[1]+N[2]*HALF[2]),14);
    var base=Math.max(0,Math.min(.3,(.95-(.45+.6*nl))*.6));
    var l=Math.max(0,-side),r=Math.max(0,side);   // how much each edge faces the light
    g._hi[0].setAttribute('stop-opacity',(.42*l).toFixed(3));g._hi[3].setAttribute('stop-opacity',(.42*r).toFixed(3));
    g._sh[0].setAttribute('stop-opacity',(.3*r).toFixed(3));g._sh[3].setAttribute('stop-opacity',(.3*l).toFixed(3));
    g._sh[1].setAttribute('stop-opacity',base.toFixed(3));g._sh[2].setAttribute('stop-opacity',base.toFixed(3));
    g._inlay.setAttribute('opacity',(.5+.45*spec).toFixed(3));
    if(g._gemHi)g._gemHi.forEach(function(p){p.setAttribute('opacity',(spec*.9).toFixed(3));});
  }
  var LIGHT=(function(){var v=[-0.45,-0.55,0.7],m=Math.hypot(v[0],v[1],v[2]);return [v[0]/m,v[1]/m,v[2]/m];})();
  var HALF=(function(){var v=[LIGHT[0],LIGHT[1],LIGHT[2]+1],m=Math.hypot(v[0],v[1],v[2]);return [v[0]/m,v[1]/m,v[2]/m];})();
  function F2(q){return q[0].toFixed(2)+' '+q[1].toFixed(2);}
  function PP(r,a){a*=Math.PI/180;return [r*Math.sin(a),-r*Math.cos(a)];}

  // ang: local angles of the n+1 ribs; g: {rot,dy,sc,sheenX}
  function renderSilk(F,ang,g){
    var o=F.o,S=F.S,r1=o.r1,r2=o.r2,rimD='',inD='';
    F.fanG.setAttribute('transform','translate(0 '+g.dy.toFixed(2)+') rotate('+g.rot.toFixed(3)+') scale('+g.sc.toFixed(4)+')');
    for(var j=1;j<o.n;j++)if(F.ribs[j])F.ribs[j].setAttribute('transform','rotate('+ang[j].toFixed(3)+')');
    F.guards[0].setAttribute('transform','rotate('+ang[0].toFixed(3)+')');
    F.guards[1].setAttribute('transform','rotate('+ang[o.n].toFixed(3)+')');
    for(var jl=1;jl<o.n;jl++)lightRib(F.ribs[jl],ang[jl]+g.rot);
    lightRib(F.guards[0],ang[0]+g.rot);lightRib(F.guards[1],ang[o.n]+g.rot);
    var rm=(r1+r2)/2;
    for(var p=0;p<o.n;p++){
      var a0=ang[p],a1=ang[p+1],c=(a0+a1)/2,span=Math.max(a1-a0,.001);
      var cp=Math.max(.06,Math.min(.9,span/S*.9)),sp=Math.sqrt(1-cp*cp);
      var bump=r2*.03*(.35+sp*.65), bow=span*(p%2?.07:-.07);
      // soft geometry: billowing outer edge, gently curved crease
      var ov=p>0?Math.min(S*.22,(1-cp)*S*.3):0, a0e=a0-ov;
      var A0o=PP(r2,a0e),Co=PP(r2+bump,c),A1o=PP(r2,a1),A0i=PP(r1,a0e),Ci=PP(r1+bump*.3,c),A1i=PP(r1,a1);
      var qA=PP(r2+bump*.95,(a0e+c)/2),qB=PP(r2+bump*.95,(c+a1)/2),qC=PP(rm+bump*.6,c+bow);
      var qIA=PP(r1+bump*.25,(a0e+c)/2),qIB=PP(r1+bump*.25,(c+a1)/2);
      var dA='M'+F2(A0i)+'L'+F2(A0o)+'Q'+F2(qA)+' '+F2(Co)+'Q'+F2(qC)+' '+F2(Ci)+'Q'+F2(qIA)+' '+F2(A0i)+'Z';
      var dB='M'+F2(Ci)+'Q'+F2(qC)+' '+F2(Co)+'Q'+F2(qB)+' '+F2(A1o)+'L'+F2(A1i)+'Q'+F2(qIB)+' '+F2(Ci)+'Z';
      rimD+='M'+F2(A0o)+'Q'+F2(qA)+' '+F2(Co)+'Q'+F2(qB)+' '+F2(A1o);
      inD+='M'+F2(A0i)+'Q'+F2(qIA)+' '+F2(Ci)+'Q'+F2(qIB)+' '+F2(A1i);
      // lighting per face
      var th=(c+g.rot)*Math.PI/180,ct=Math.cos(th),st=Math.sin(th),L=[],SP=[];
      for(var s=0;s<2;s++){var sg=s?1:-1,N=[sg*sp*ct,sg*sp*st,cp];
        L[s]=.36+.78*Math.max(0,N[0]*LIGHT[0]+N[1]*LIGHT[1]+N[2]*LIGHT[2]);
        SP[s]=Math.pow(Math.max(0,N[0]*HALF[0]+N[1]*HALF[1]+N[2]*HALF[2]),20);}
      // shared values at the crease and the valleys keep the shading continuous across the whole cloth
      var lumC=(L[0]+L[1])/2, spC=Math.max(SP[0],SP[1]);
      var darkC=Math.max(0,Math.min(.35,(1-lumC)*.6)), lightC=Math.min(.32,.04+spC*.32+Math.max(0,lumC-.95)*.5);
      var darkV=Math.min(.55,.1+sp*.42);
      for(s=0;s<2;s++){
        var h=F.halves[p*2+s], d=s?dB:dA;
        h.base.setAttribute('d',d);h.cpp.setAttribute('d',d);h.shade.setAttribute('d',d);h.light.setAttribute('d',d);h.sh.setAttribute('d',d);
        var darkF=Math.max(0,Math.min(.5,(1.02-L[s])*.8)), lightF=Math.min(.18,SP[s]*.16+Math.max(0,L[s]-.95)*.4);
        var V=PP(rm,s?a1:a0e), Cm=PP(rm+bump*.5,c);
        [h.gd,h.gl].forEach(function(gr){gr.setAttribute('x1',V[0].toFixed(1));gr.setAttribute('y1',V[1].toFixed(1));gr.setAttribute('x2',Cm[0].toFixed(1));gr.setAttribute('y2',Cm[1].toFixed(1));});
        h.sd[0].setAttribute('stop-opacity',darkV.toFixed(3));h.sd[1].setAttribute('stop-opacity',darkF.toFixed(3));h.sd[2].setAttribute('stop-opacity',darkC.toFixed(3));
        h.sl[0].setAttribute('stop-opacity','0');h.sl[1].setAttribute('stop-opacity',lightF.toFixed(3));h.sl[2].setAttribute('stop-opacity',lightC.toFixed(3));
        h.sh.setAttribute('opacity',Math.min(.5,.08+SP[s]*.42).toFixed(3));
        var flat0=-o.half+p*S;
        h.tr.setAttribute('transform','rotate('+(s?(a1-(flat0+S)):(a0-flat0)).toFixed(3)+')');
      }
      F.creases[p].setAttribute('d','M'+F2(Ci)+'Q'+F2(qC)+' '+F2(Co));
      F.creases[p].setAttribute('opacity',(.05+spC*.22).toFixed(3));
      if(p>0&&F.ribs[p])F.ridges[p].setAttribute('d','M'+F2(PP(r1,a0))+'L'+F2(PP(r2,a0)));
    }
    F.rim.setAttribute('d',rimD);F.inner.setAttribute('d',inD);
    F.sheen.setAttribute('x1',(g.sheenX-280).toFixed(1));F.sheen.setAttribute('x2',(g.sheenX+280).toFixed(1));
  }

  // hero fan
  var SF=buildSilk(fanSvg,{cx:500,cy:575,r1:145,r2:430,half:78,n:14,rib:6,slat:22,tail:58,deco:1,text:{value:(fanSvg.getAttribute('data-text')||'NAN'),size:130,spacing:30}});
  var NR=SF.o.n, RIBS=[];
  for(var jj=0;jj<=NR;jj++)RIBS.push({open:-78+jj*SF.S,k:jj/NR});
  function openAngles(t){
    var out=[],prev=-1e9;
    RIBS.forEach(function(r){var lag=.24*Math.pow(1-r.k,1.3),l=Math.max(0,Math.min(1,(t-lag)/(1-lag))),e=t>=1?1:soft2(l,.45);
      var a=-78+(r.open+78)*e; a=Math.max(a,prev+.02); prev=a; out.push(a);});
    return out;
  }
  function openGroup(t){var g=Math.min(1,t/.9),up=smooth(t/.7);
    return {rot:78*(1-(g>=1?1:soft2(g,.32))),dy:16*(1-up),sc:.95+.05*up,sheenX:-1100};}
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function done(){addAll('opened');if(!reduce)setTimeout(function(){(window.__nanSilkShine||[]).forEach(function(a){a.beginElement&&a.beginElement();});},700);}
  function idleSilk(){
    var t0=null,tilt=0,target=0,run=true,TAU=Math.PI*2;
    window.addEventListener('pointermove',function(e){target=((e.clientX/window.innerWidth)-.5)*5;},{passive:true});
    if('IntersectionObserver' in window){new IntersectionObserver(function(en){var v=en[0].isIntersecting;if(v&&!run){run=true;requestAnimationFrame(loop);}run=v;}).observe(fanSvg);}
    function loop(ts){
      if(!run)return; if(t0===null)t0=ts;
      var s=(ts-t0)/1000,amp=Math.min(1,s/2.5);
      var sway=amp*(1.1*Math.sin(TAU*s/6.4)+.35*Math.sin(TAU*s/2.7+1.3)), bob=amp*2.4*Math.sin(TAU*s/6.4+.8);
      tilt+=(target-tilt)*.02;
      var breath=1+amp*.012*Math.sin(TAU*s/3.3+.4);
      var base=s<2.6?-1100+960*smooth(s/2.6):-140;
      var ang=RIBS.map(function(r){return r.open*breath;});
      renderSilk(SF,ang,{rot:sway+tilt,dy:bob,sc:1,sheenX:base+amp*(75*Math.sin(TAU*s/10)+18*Math.sin(TAU*s/3.7+.6))});
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  if(reduce){renderSilk(SF,RIBS.map(function(r){return r.open;}),{rot:0,dy:0,sc:1,sheenX:-140});done();}
  else{
    renderSilk(SF,openAngles(0),openGroup(0));
    var DUR=2600,start=null;
    function frame(ts){if(start===null)start=ts;var p=Math.min(1,(ts-start)/DUR);renderSilk(SF,openAngles(p),openGroup(p));if(p<1)requestAnimationFrame(frame);else{done();idleSilk();}}
    setTimeout(function(){requestAnimationFrame(frame);},450);
  }


})();
