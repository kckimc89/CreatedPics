(()=>{'use strict';
const $=id=>document.getElementById(id), scene=$('scene'), ctx=scene.getContext('2d');
const W=900, H=900, DBNAME='family_creative_studio_c1', STORE='works';
let db=null, mode='magic', image=null, originalCanvas=null, maskCanvas=null, maskCtx=null, maskHistory=[], activeBrush='erase', brushSize=40, activeTab='setting', dragging=null, selectedSticker=-1, currentId=null, modalId=null, slideTimer=null, projectsCache=[];
let work=defaultWork();
function defaultWork(){return {id:null,name:'',mode:'magic',background:'flowers',frame:'polaroid',frameSize:70,subject:'',mask:'',x:450,y:480,scale:100,rotation:0,shadow:45,stickers:[],caption:'',created:Date.now()};}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),3500);}
function screen(id){for(const el of document.querySelectorAll('.screen'))el.classList.toggle('active',el.id===id);window.scrollTo(0,0);}
function showTab(tab){activeTab=tab;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));for(const p of document.querySelectorAll('.panel'))p.classList.toggle('active',p.id==='panel-'+tab);$('canvasHelp').textContent=tab==='cutout'?'사진에서 지울 배경을 손가락으로 문질러 주세요.':'인물을 손가락으로 움직여 위치를 바꿔 보세요. 장식도 직접 이동할 수 있습니다.';}
const BACKS=[['flowers','🌷 꽃밭'],['space','🚀 우주'],['sea','🐠 바닷속'],['castle','🏰 동화 성'],['sunset','🌅 노을'],['stars','✨ 별빛'],['plain','🤍 단색']];
const FRAMES=[['polaroid','폴라로이드'],['gold','황금 액자'],['paper','종이 액자'],['simple','심플']];
function makeChoices(id,items,callback){const parent=$(id);parent.innerHTML='';items.forEach(([key,name])=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=name;b.dataset.value=key;b.onclick=()=>callback(key);parent.append(b);});}
makeChoices('backgrounds',BACKS,k=>{work.background=k;syncControls();render();});makeChoices('frames',FRAMES,k=>{work.frame=k;syncControls();render();});
const decorations=['⭐','🦋','🌸','💖','🎈','🌙','✨','☁️','🌈','🐚','🪄','🎉','🪐','🧸'];
for(const icon of decorations){const b=document.createElement('button');b.textContent=icon;b.title='장식 추가 '+icon;b.onclick=()=>{work.stickers.push({text:icon,x:450+Math.random()*140-70,y:450+Math.random()*140-70,size:80});selectedSticker=work.stickers.length-1;render();};$('stickers').append(b);}
function syncControls(){for(const b of document.querySelectorAll('#backgrounds .choice'))b.classList.toggle('selected',b.dataset.value===work.background);for(const b of document.querySelectorAll('#frames .choice'))b.classList.toggle('selected',b.dataset.value===work.frame);for(const [name,val,suffix] of [['scale',work.scale,'%'],['rotate',work.rotation,'°'],['shadow',work.shadow,'%'],['frameSize',work.frameSize,'%']]){$(name).value=val;$(name+'Value').textContent=val+suffix;}$('artText').value=work.caption||'';$('artName').value=work.name||'';$('popSettings').style.display=work.mode==='pop'?'block':'none';$('modeLabel').textContent=work.mode==='magic'?'마법 합성사진':'입체사진';}
function begin(m){work=defaultWork();work.mode=m;work.background=m==='pop'?'plain':'flowers';image=null;originalCanvas=null;maskCanvas=null;maskHistory=[];currentId=null;selectedSticker=-1;syncControls();showTab('setting');screen('editor');render();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>begin(b.dataset.mode));$('homeBtn').onclick=()=>screen('home');$('backToHome').onclick=()=>screen('home');$('galleryHome').onclick=()=>screen('home');$('backupHome').onclick=()=>screen('home');$('galleryOpen').onclick=()=>openGallery();$('backupOpen').onclick=()=>screen('backup');document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
for(const id of ['scale','rotate','shadow','frameSize'])$(id).addEventListener('input',e=>{work[id==='rotate'?'rotation':id]=+e.target.value;syncRange(id);render();});function syncRange(id){const s=id==='rotate'?'°':'%';$(id+'Value').textContent=work[id==='rotate'?'rotation':id]+s;}
$('resetPosition').onclick=()=>{work.x=450;work.y=480;render();};$('artText').oninput=e=>{work.caption=e.target.value;render();};$('artName').oninput=e=>work.name=e.target.value;
function loadImg(url){return new Promise((ok,no)=>{const im=new Image;im.onload=()=>ok(im);im.onerror=()=>no(new Error('이미지 디코딩에 실패했습니다'));im.src=url;});}
// The iPad Photos picker may return a large JPEG, HEIF or an iCloud-backed file.
// Decode first, then make one bounded working copy. Never mutate the original.
function setupPhoto(img){
  const sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height;
  if(!sw||!sh)throw new Error('사진 크기를 확인할 수 없습니다');
  const max=800,ratio=Math.min(1,max/Math.max(sw,sh));
  const iw=Math.max(1,Math.round(sw*ratio)),ih=Math.max(1,Math.round(sh*ratio));
  const c=document.createElement('canvas');c.width=iw;c.height=ih;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('사진 작업 공간을 만들 수 없습니다');
  ctx.drawImage(img,0,0,iw,ih);
  // PNG is required for subject transparency; convert the bounded copy only.
  const data=c.toDataURL('image/png');
  if(!data.startsWith('data:image/png;base64,'))throw new Error('사진 변환에 실패했습니다');
  return {data,iw,ih};
}
function photoStatus(message){const el=$('photoStatus');if(el)el.textContent=message;}
function readAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('사진 파일을 읽지 못했습니다'));r.readAsDataURL(file);});}
let importSequence=0;
async function importPhoto(file){
  if(!file){photoStatus('사진을 선택하지 않았습니다. 다시 선택해 주세요.');return;}
  const personStatusEl=$('personStatus');if(personStatusEl)personStatusEl.textContent='사진을 먼저 가져와 주세요.';
  const seq=++importSequence;
  const ext=(file.name||'').split('.').pop().toLowerCase();
  const typ=(file.type||'').toLowerCase();
  if(!(typ.startsWith('image/')||['jpg','jpeg','png','webp','heic','heif'].includes(ext))){photoStatus('사진 파일이 아닙니다. JPEG 또는 PNG를 선택해 주세요.');return;}
  photoStatus('⏳ 선택한 사진을 읽는 중… ('+Math.max(1,Math.round(file.size/1024))+'KB)');
  let url=null;
  try{
    let decoded=null;
    try{
      url=URL.createObjectURL(file);
      decoded=await loadImg(url);
    }catch(firstErr){
      // Alternate reader path helps some browser file-provider implementations.
      photoStatus('⏳ 다른 방법으로 사진 읽는 중…');
      const data=await readAsDataURL(file);
      decoded=await loadImg(data);
    }
    if(seq!==importSequence)return;
    photoStatus('⏳ 사진 크기를 조절하고 미리보기를 준비하는 중…');
    const setup=setupPhoto(decoded);
    const ready=await loadImg(setup.data);
    if(seq!==importSequence)return;
    // Commit only after all decoding succeeds. Keep earlier work if a file fails.
    image=ready;work.subject=setup.data;
    initMask(setup.iw,setup.ih);
    if(personStatusEl)personStatusEl.textContent='사진 준비 완료. ✂️ 누끼 탭의 자동 인물 따기를 누르세요.';
    work.x=450;work.y=480;work.scale=Math.min(125,Math.max(20,Math.round(650/Math.max(setup.iw,setup.ih)*100)));
    syncControls();render();
    photoStatus('✅ 사진을 가져왔습니다 ('+setup.iw+'×'+setup.ih+'). 화면에서 확인해 주세요.');
    toast('사진을 불러왔어요! 화면에서 움직이거나 배경을 바꿔 보세요.');
  }catch(err){
    console.error('사진 가져오기 오류',err);
    let msg=err&&err.message?err.message:'알 수 없는 오류';
    if(ext==='heic'||ext==='heif'||/heic|heif/i.test(typ))msg='HEIC/HEIF 형식이 현재 Safari에서 열리지 않을 수 있습니다. 사진 앱에서 JPEG로 내보낸 뒤 다시 시도해 주세요.';
    photoStatus('⚠️ 사진 표시 실패: '+msg);
    toast('사진을 표시하지 못했습니다. 아래 원인 메시지를 확인해 주세요.');
  }finally{if(url)URL.revokeObjectURL(url);}
}
$('photoFile').addEventListener('change',e=>{const f=e.currentTarget.files?.[0];if(!f)return;importPhoto(f);e.currentTarget.value='';});
function initMask(w,h){maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});maskCtx.fillStyle='#fff';maskCtx.fillRect(0,0,w,h);maskHistory=[];}
// MediaPipe runs the pretrained person/background model *on this device*.
// Only the model runtime and model weights are downloaded; no photo is uploaded.
let personModel=null,personBusy=false;
async function getPersonModel(){
  if(personModel)return personModel;
  const assets=new URL('./assets/vision/', location.href).href;
  const moduleUrl=assets+'vision_bundle.mjs';
  const modelUrl=assets+'selfie_segmenter.tflite';
  const status=$('personStatus');
  status.textContent='⏳ 같은 사진관 주소의 AI 엔진을 확인하는 중…';
  // Missing deployment assets must be diagnosed before trying dynamic import.
  for(const [url,label] of [[moduleUrl,'AI 실행 모듈'],[modelUrl,'인물 인식 모델']]){
    let response;
    try{response=await fetch(url,{method:'HEAD',cache:'no-store'});}
    catch(_){throw Error(label+'에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.');}
    if(!response.ok)throw Error(label+' 파일이 배포되지 않았습니다 (HTTP '+response.status+'). GitHub Pages를 Actions 방식으로 배포했는지 확인해 주세요.');
    const mime=(response.headers.get('content-type')||'').toLowerCase();
    if(mime.includes('text/html'))throw Error(label+' 경로에 HTML 문서가 표시됩니다. AI 파일 배포가 아직 완료되지 않았습니다.');
  }
  status.textContent='⏳ 인물 분리 AI 모듈 불러오는 중…';
  let mod;
  try{mod=await import(/* webpackIgnore: true */ moduleUrl);}
  catch(e){throw Error('같은 주소의 AI 모듈을 실행하지 못했습니다: '+(e?.message||'알 수 없는 오류'));}
  const Vision=mod.FilesetResolver?mod:mod.default;
  if(!Vision?.FilesetResolver||!Vision?.ImageSegmenter)throw Error('AI 프로그램에 인물 분리 기능이 없습니다.');
  status.textContent='⏳ 아이패드에서 AI 엔진 준비 중…';
  const wasm=await Vision.FilesetResolver.forVisionTasks(assets+'wasm');
  status.textContent='⏳ AI 모델을 열고 있습니다…';
  personModel=await Vision.ImageSegmenter.createFromOptions(wasm,{
    baseOptions:{modelAssetPath:modelUrl,delegate:'CPU'},
    runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true
  });
  return personModel;
}
$('autoPerson').onclick=async()=>{
  const status=$('personStatus'),btn=$('autoPerson');
  if(!image||!maskCanvas){status.textContent='먼저 사진을 가져와 주세요.';return;}
  if(personBusy)return;
  if(!navigator.onLine&&!personModel){status.textContent='AI 파일을 처음 실행하려면 인터넷 연결이 필요합니다.';return;}
  personBusy=true;btn.disabled=true;
  const photoAtStart=image;
  let result=null;
  try{
    status.textContent='⏳ 인물 분리 모델을 준비 중입니다. 처음 실행은 다운로드가 필요합니다.';
    // Keep inference input small to limit iPad memory use.
    const c=document.createElement('canvas'),factor=Math.min(1,512/Math.max(image.width,image.height));
    c.width=Math.max(1,Math.round(image.width*factor));c.height=Math.max(1,Math.round(image.height*factor));
    c.getContext('2d').drawImage(image,0,0,c.width,c.height);
    const model=await getPersonModel();
    status.textContent='⏳ 사진 속 인물을 찾고 있습니다…';
    result=model.segment(c);
    // The single-channel SelfieSegmenter produces ONE foreground confidence
    // mask at index 0. Earlier versions mistakenly requested index 1 and
    // therefore always reported "분리 결과를 받지 못했습니다" even after inference.
    const masks=result?.confidenceMasks;
    const cm=Array.isArray(masks)&&masks.length ? masks[0] : null;
    const cat=result?.categoryMask;
    const srcMask=cm||cat;
    if(!srcMask){
      const count=Array.isArray(masks)?masks.length:0;
      throw Error('AI 처리 결과에 마스크가 없습니다 (confidenceMasks='+count+', categoryMask='+!!cat+').');
    }
    const mw=srcMask.width,mh=srcMask.height;
    if(!mw||!mh)throw Error('AI 마스크 크기를 확인할 수 없습니다.');
    const pixels=cm?cm.getAsFloat32Array():cat.getAsUint8Array();
    if(!pixels||pixels.length<mw*mh)throw Error('분리 마스크가 비어 있습니다.');
    const tmp=document.createElement('canvas');tmp.width=mw;tmp.height=mh;
    const tctx=tmp.getContext('2d');const frame=tctx.createImageData(mw,mh);
    let total=0;
    for(let i=0;i<mw*mh;i++){
      const v=cm?Math.max(0,Math.min(1,(pixels[i]-.12)/.76)):(pixels[i]===1?1:0);
      frame.data[4*i]=255;frame.data[4*i+1]=255;frame.data[4*i+2]=255;frame.data[4*i+3]=Math.round(v*255);
      total+=v;
    }
    if(total<mw*mh*.008)throw Error('인물을 찾지 못했습니다. 사람이 크게 나온 사진으로 시험해 주세요.');
    if(image!==photoAtStart){status.textContent='다른 사진이 선택되어 처리 결과를 적용하지 않았습니다.';return;}
    saveMaskUndo();
    maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
    maskCtx.imageSmoothingEnabled=true;
    tctx.putImageData(frame,0,0);
    maskCtx.drawImage(tmp,0,0,maskCanvas.width,maskCanvas.height);
    status.textContent='✅ 인물 분리 완료! 배경을 바꾸며 마법 사진을 만들어 보세요.';
    toast('자동 누끼가 완성되었어요! 🎉');render();
  }catch(err){
    console.error('자동 인물 분리 실패',err);
    status.textContent='⚠️ 자동 누끼 실패: '+(err?.message||'모델을 실행할 수 없습니다.')+' — 현재 작품은 유지되며 사진 원본은 바뀌지 않습니다.';
  }finally{if(result)try{result.close()}catch(_){};personBusy=false;btn.disabled=false;}
};
function saveMaskUndo(){if(!maskCanvas)return;maskHistory.push(maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height));if(maskHistory.length>8)maskHistory.shift();}
function doBrush(px,py){if(!image||!maskCanvas)return;const p=toLocalImage(px,py);if(!p)return;maskCtx.save();maskCtx.globalCompositeOperation=activeBrush==='erase'?'destination-out':'source-over';maskCtx.fillStyle='#fff';maskCtx.beginPath();maskCtx.arc(p.x,p.y,brushSize/(work.scale/100)/2,0,2*Math.PI);maskCtx.fill();maskCtx.restore();render();}
function toLocalImage(x,y){const dx=x-work.x,dy=y-work.y,angle=-work.rotation*Math.PI/180,s=work.scale/100;return {x:(dx*Math.cos(angle)-dy*Math.sin(angle))/s+image.width/2,y:(dx*Math.sin(angle)+dy*Math.cos(angle))/s+image.height/2};}
function subjectCanvas(){if(!image)return null;const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const v=c.getContext('2d');v.drawImage(image,0,0);if(maskCanvas){v.globalCompositeOperation='destination-in';v.drawImage(maskCanvas,0,0);}return c;}
function paintBackground(c){const g=(a,b)=>{const grad=c.createLinearGradient(0,0,0,900);grad.addColorStop(0,a);grad.addColorStop(1,b);c.fillStyle=grad;c.fillRect(0,0,900,900);};const circ=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
if(work.background==='flowers'){g('#88cfea','#fdebd3');c.fillStyle='#85c58b';c.beginPath();c.moveTo(0,660);c.quadraticCurveTo(420,530,900,675);c.lineTo(900,900);c.lineTo(0,900);c.fill();const colors=['#ff72af','#fff3b4','#ffffff','#de79d7'];for(let i=0;i<65;i++){const x=(i*211+47)%900,y=680+(i*127)%240,r=7+(i%5)*4;for(let q=0;q<5;q++)circ(x+Math.cos(q*1.26)*r,y+Math.sin(q*1.26)*r,r*.62,colors[i%4]);circ(x,y,4,'#f2b348');}circ(750,130,65,'#fff5c6');}
else if(work.background==='space'){g('#11133f','#423777');for(let i=0;i<170;i++)circ((i*197+44)%900,(i*367+21)%900,1+i%4,i%3?'#ffffffb3':'#addaff');circ(745,170,115,'#f4b780');circ(717,149,35,'#f9d9ad');circ(800,206,22,'#d69a6c');c.strokeStyle='#b8c9ff77';c.lineWidth=20;c.beginPath();c.ellipse(745,170,175,45,-.4,0,2*Math.PI);c.stroke();}
else if(work.background==='sea'){g('#34b9d7','#06446c');for(let i=0;i<20;i++){circ((i*171)%900, (i*121)%900, 6+i%13,'#d7fdff55');}for(let i=0;i<20;i++){const x=(i*181)%900,y=680+i%4*56;c.strokeStyle=['#fa8c9a','#f9bb6b','#90daaf'][i%3];c.lineWidth=8;c.beginPath();c.moveTo(x,900);c.quadraticCurveTo(x+30,y,x,y-50);c.stroke();}for(let i=0;i<8;i++){c.fillStyle=['#ffc25a','#ff7e85','#9af4eb'][i%3];const x=(i*227+85)%900,y=(i*129+125)%620;c.beginPath();c.ellipse(x,y,26,15,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-24,y);c.lineTo(x-46,y-16);c.lineTo(x-46,y+16);c.fill();}}
else if(work.background==='castle'){g('#bbd9fc','#fae0e7');c.fillStyle='#90be90';c.beginPath();c.moveTo(0,760);c.quadraticCurveTo(400,630,900,755);c.lineTo(900,900);c.lineTo(0,900);c.fill();const tower=(x,y,w,h)=>{c.fillStyle='#d3a8d9';c.fillRect(x,y,w,h);c.fillStyle='#9974b1';c.beginPath();c.moveTo(x-18,y);c.lineTo(x+w/2,y-95);c.lineTo(x+w+18,y);c.fill();};tower(520,370,170,420);tower(450,450,80,320);tower(690,455,80,315);c.fillStyle='#79649e';c.beginPath();c.arc(605,790,45,Math.PI,2*Math.PI);c.fill();c.fillRect(560,790,90,110);circ(145,140,60,'#fff5c6');}
else if(work.background==='sunset'){g('#f4a38a','#ffe1b3');circ(680,370,130,'#fff2bd');c.fillStyle='#758eae';c.beginPath();c.moveTo(0,720);c.lineTo(215,480);c.lineTo(420,740);c.lineTo(635,590);c.lineTo(900,790);c.lineTo(900,900);c.lineTo(0,900);c.fill();c.fillStyle='#526d91';c.fillRect(0,785,900,115);}
else if(work.background==='stars'){g('#6c46b0','#ed9aca');for(let i=0;i<70;i++){const x=(i*173+51)%900,y=(i*311+75)%900;circ(x,y,2+i%5,'#fff8ca');}circ(735,150,75,'#ffdaec');circ(775,124,75,'#9b65bb');}
else g('#e6e1ed','#fff8f0');}
function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function paintFrame(c){const size=work.frameSize/100*900,fw=size,fh=size*.95,fx=(900-fw)/2,fy=(900-fh)/2; c.save();c.shadowColor='#0007';c.shadowBlur=22;c.shadowOffsetY=15;const color=work.frame==='gold'?'#d9a543':work.frame==='paper'?'#f7eac7':work.frame==='simple'?'#453b56':'#fff';c.fillStyle=color;roundRect(c,fx-17,fy-17,fw+34,fh+(work.frame==='polaroid'?95:34),work.frame==='simple'?5:13);c.fill();c.shadowColor='transparent';c.strokeStyle=work.frame==='gold'?'#fff0a6':'#ffffffb3';c.lineWidth=work.frame==='gold'?10:3;c.strokeRect(fx-8,fy-8,fw+16,fh+16);c.restore();}
function render(canvas=scene){const c=canvas.getContext('2d');c.clearRect(0,0,900,900);paintBackground(c);if(work.mode==='pop')paintFrame(c);if(image){const sb=subjectCanvas(),s=work.scale/100;c.save();c.translate(work.x,work.y);c.rotate(work.rotation*Math.PI/180);c.scale(s,s);c.shadowColor=`rgba(35,19,50,${work.shadow/135})`;c.shadowBlur=work.shadow*.5;c.shadowOffsetX=13;c.shadowOffsetY=22;c.drawImage(sb,-sb.width/2,-sb.height/2);c.restore();}for(const sticker of work.stickers){c.save();c.font=sticker.size+'px Apple Color Emoji, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(sticker.text,sticker.x,sticker.y);c.restore();}if(work.caption){c.save();c.textAlign='center';c.font='bold 46px sans-serif';c.lineWidth=8;c.strokeStyle='#2c1d4faa';c.strokeText(work.caption,450,842,820);c.fillStyle='#fff';c.fillText(work.caption,450,842,820);c.restore();}}
function stageCoords(e){const r=scene.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*900,y:(e.clientY-r.top)/r.height*900};}
scene.addEventListener('pointerdown',e=>{if(!image&&activeTab==='cutout')return;const {x,y}=stageCoords(e);scene.setPointerCapture(e.pointerId);if(activeTab==='cutout'){dragging={type:'brush'};saveMaskUndo();doBrush(x,y);return;}for(let i=work.stickers.length-1;i>=0;i--){const s=work.stickers[i];if(Math.hypot(s.x-x,s.y-y)<Math.max(45,s.size*.6)){selectedSticker=i;dragging={type:'sticker',dx:x-s.x,dy:y-s.y};$('stickerSize').value=s.size;$('stickerSizeValue').textContent=s.size;return;}}if(image){selectedSticker=-1;dragging={type:'subject',dx:x-work.x,dy:y-work.y};}});
scene.addEventListener('pointermove',e=>{if(!dragging)return;const{x,y}=stageCoords(e);if(dragging.type==='brush')doBrush(x,y);else if(dragging.type==='subject'){work.x=x-dragging.dx;work.y=y-dragging.dy;render();}else if(dragging.type==='sticker'){const s=work.stickers[selectedSticker];if(s){s.x=x-dragging.dx;s.y=y-dragging.dy;render();}}});for(const type of ['pointerup','pointercancel','lostpointercapture'])scene.addEventListener(type,()=>dragging=null);
for(const btn of document.querySelectorAll('[data-brush]'))btn.onclick=()=>{activeBrush=btn.dataset.brush;document.querySelectorAll('[data-brush]').forEach(b=>b.classList.toggle('selected-tool',b===btn));};$('brushSize').oninput=e=>{$('brushValue').textContent=e.target.value;brushSize=+e.target.value;};$('undoMask').onclick=()=>{if(!maskHistory.length)return toast('되돌릴 작업이 없어요.');maskCtx.putImageData(maskHistory.pop(),0,0);render();};$('resetMask').onclick=()=>{if(!image)return;saveMaskUndo();maskCtx.fillStyle='#fff';maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height);render();};
$('autoCorners').onclick=()=>{if(!image)return toast('사진을 먼저 선택하세요.');const max=800000,iw=image.width,ih=image.height;if(iw*ih>max){toast('자동 지우기: 큰 사진은 붓으로 지우거나 투명 PNG를 사용해 주세요.');return;}saveMaskUndo();const c=document.createElement('canvas');c.width=iw;c.height=ih;const ct=c.getContext('2d',{willReadFrequently:true});ct.drawImage(image,0,0);const data=ct.getImageData(0,0,iw,ih).data;const visited=new Uint8Array(iw*ih);const found=new Uint8Array(iw*ih);const stack=[];const corners=[0,iw-1,(ih-1)*iw,iw*ih-1];const threshold=65;for(const start of corners){const sr=data[start*4],sg=data[start*4+1],sb=data[start*4+2];stack.push(start);while(stack.length){const n=stack.pop();if(n<0||n>=iw*ih||visited[n])continue;visited[n]=1;const j=n*4;const delta=Math.abs(data[j]-sr)+Math.abs(data[j+1]-sg)+Math.abs(data[j+2]-sb);if(delta>threshold)continue;found[n]=1;const xx=n%iw,yy=(n/iw)|0;if(xx>0)stack.push(n-1);if(xx+1<iw)stack.push(n+1);if(yy>0)stack.push(n-iw);if(yy+1<ih)stack.push(n+iw);}}const v=maskCtx.getImageData(0,0,iw,ih);for(let i=0;i<found.length;i++)if(found[i])v.data[i*4+3]=0;maskCtx.putImageData(v,0,0);render();toast('모서리 배경을 지웠어요. 정확하지 않으면 되돌리기를 사용하세요.');};
$('deleteSticker').onclick=()=>{if(selectedSticker<0)return toast('먼저 화면에서 장식을 선택해 주세요.');work.stickers.splice(selectedSticker,1);selectedSticker=-1;render();};$('clearSticker').onclick=()=>{work.stickers=[];selectedSticker=-1;render();};$('stickerSize').oninput=e=>{const v=+e.target.value;$('stickerSizeValue').textContent=v;if(selectedSticker>=0&&work.stickers[selectedSticker]){work.stickers[selectedSticker].size=v;render();}};
function initDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DBNAME,1);r.onupgradeneeded=()=>{r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}async function ensureDb(){if(!db)db=await initDb();return db;}
async function put(item){const d=await ensureDb();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}async function all(){const d=await ensureDb();return new Promise((resolve,reject)=>{const r=d.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}async function del(id){const d=await ensureDb();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function imageSave(){return scene.toDataURL('image/png');}
async function save(){if(!image)return toast('사진을 먼저 가져와 주세요.');try{const item=structuredClone(work);item.name=$('artName').value.trim()||'나의 마법 작품';item.caption=$('artText').value;item.id=currentId||('art_'+Date.now()+'_'+Math.random().toString(36).slice(2,7));item.created=currentId?work.created:Date.now();item.mask=maskCanvas.toDataURL('image/png');item.preview=imageSave();await put(item);work.id=item.id;currentId=item.id;work.name=item.name;toast('작품 전시관에 저장했어요! 🎉');}catch(e){console.error(e);toast('저장 공간이 부족하거나 저장할 수 없습니다. PNG를 먼저 내보내 주세요.');}}
$('saveProject').onclick=save;
function downloadBlob(blob,name){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000);}
function pngDownload(){scene.toBlob(blob=>{if(!blob)return toast('이미지를 만들지 못했습니다.');downloadBlob(blob,(work.name||'우리_가족_창작사진')+'.png');toast('이미지 파일을 만들었습니다. 아이패드에서는 파일 앱 또는 공유 메뉴에서 사진에 저장할 수 있습니다.');},'image/png');}
$('exportPng').onclick=pngDownload;$('exportPng2').onclick=pngDownload;
async function openGallery(){try{projectsCache=(await all()).sort((a,b)=>b.created-a.created);$('workCount').textContent=`(${projectsCache.length})`;$('emptyGallery').style.display=projectsCache.length?'none':'block';$('galleryGrid').replaceChildren();for(const item of projectsCache){const card=document.createElement('button');card.className='work-card';const img=document.createElement('img');img.src=item.preview;img.alt=item.name;const d=document.createElement('div'),b=document.createElement('b'),s=document.createElement('span');b.textContent=item.name;s.textContent=(item.mode==='magic'?'마법 합성':'입체 사진')+' · '+new Date(item.created).toLocaleDateString('ko-KR');d.append(b,s);card.append(img,d);card.onclick=()=>view(item.id);$('galleryGrid').append(card);}screen('gallery');}catch(e){toast('저장된 작품을 읽지 못했습니다.');console.error(e);}}
function view(id){const item=projectsCache.find(v=>v.id===id);if(!item)return;modalId=id;$('modalTitle').textContent=item.name;$('modalImage').src=item.preview;$('viewModal').classList.remove('hidden');}
$('modalClose').onclick=()=>{$('viewModal').classList.add('hidden');stopSlide();};
$('viewModal').addEventListener('click',e=>{if(e.target===$('viewModal'))$('modalClose').click();});
async function edit(id){const item=projectsCache.find(v=>v.id===id);if(!item)return;try{work=structuredClone(item);image=await loadImg(item.subject);initMask(image.width,image.height);if(item.mask){const mi=await loadImg(item.mask);maskCtx.clearRect(0,0,image.width,image.height);maskCtx.drawImage(mi,0,0,image.width,image.height);}currentId=item.id;maskHistory=[];selectedSticker=-1;syncControls();showTab('setting');$('viewModal').classList.add('hidden');stopSlide();screen('editor');render();}catch(e){console.error(e);toast('편집 자료를 불러오지 못했습니다.');}}
$('modalEdit').onclick=()=>edit(modalId);$('modalDownload').onclick=()=>{const item=projectsCache.find(v=>v.id===modalId);if(!item)return;fetch(item.preview).then(r=>r.blob()).then(blob=>downloadBlob(blob,item.name+'.png')).catch(()=>toast('이미지 저장에 실패했습니다.'));};$('modalDelete').onclick=async()=>{if(!confirm('이 작품을 전시관에서 삭제할까요? 되돌릴 수 없습니다.'))return;try{await del(modalId);$('viewModal').classList.add('hidden');stopSlide();await openGallery();toast('선택한 작품을 삭제했습니다.');}catch(e){toast('삭제하지 못했습니다.');}};
function stopSlide(){if(slideTimer){clearInterval(slideTimer);slideTimer=null;}}
$('slideStop').onclick=()=>{stopSlide();toast('자동 감상을 멈췄어요.');};$('slideStart').onclick=()=>{if(!projectsCache.length)return toast('먼저 작품을 만들어 주세요.');stopSlide();let i=0;view(projectsCache[i].id);slideTimer=setInterval(()=>{i=(i+1)%projectsCache.length;view(projectsCache[i].id);},4500);};
$('backupDownload').onclick=async()=>{try{const items=await all();const payload={format:'family-creative-studio',version:1,exported:new Date().toISOString(),items};const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});downloadBlob(blob,'창작사진관_전체백업_'+new Date().toISOString().slice(0,10)+'.json');toast(`${items.length}개 작품의 백업 파일을 만들었습니다. 파일 앱에 꼭 보관해 주세요.`);}catch(e){console.error(e);toast('백업에 실패했습니다. 저장 공간을 확인해 주세요.');}};
$('backupFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.format!=='family-creative-studio'||!Array.isArray(o.items))throw Error('invalid');const existing=new Set((await all()).map(v=>v.id));let n=0;for(const item of o.items){if(!item.id||typeof item.subject!=='string'||typeof item.preview!=='string')continue;if(existing.has(item.id))continue;await put(item);n++;}toast(`${n}개 작품을 복원했습니다. 기존 작품은 보존했습니다.`);}catch(err){console.error(err);toast('올바른 창작사진관 백업 파일이 아니거나 복원 중 오류가 발생했습니다.');}finally{e.target.value='';}};
window.addEventListener('pagehide',stopSlide);
render();ensureDb().catch(()=>toast('이 브라우저에서 작품 저장이 제한되어 있습니다. 내보내기를 이용해 주세요.'));
})();
