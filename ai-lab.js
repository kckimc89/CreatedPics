/* MASTER C1.4.10 — improved face fidelity, anatomy, pose and lighting prompts. Preserves existing IndexedDB and prior works. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const scenes=[
{id:'castle',name:'🏰 동화성에서 뛰기',desc:'활짝 웃으며 꽃길을 뛰어오는 모습. 신체 자세와 자연스러운 햇살을 검증합니다.',scene:'황금빛 햇살이 비치는 풍성한 장미 정원과 아름다운 동화성의 돌길을 즐겁게 뛰어오는 장면',pose:'가벼운 달리기 자세, 한 손을 앞으로 내밀고 자연스러운 환한 미소',clothes:'원래 옷의 특징을 최대한 유지하되 자연스럽게 움직이는 옷자락'},
{id:'ocean',name:'🐢 바닷속 헤엄치기',desc:'물속에서 떠 있는 자세와 머리카락, 거품, 물빛 조화를 검증합니다.',scene:'햇살이 비치는 투명한 산호 궁전 바닷속에서 바다거북과 열대어 사이를 헤엄치는 장면',pose:'물속에서 수평으로 헤엄치는 자연스러운 전신 자세, 양팔을 부드럽게 펼친 모습, 밝은 미소',clothes:'푸른색의 우아한 바다 탐험 의상, 물결에 따라 흐르는 머리카락과 옷자락'},
{id:'space',name:'🚀 우주에서 날기',desc:'우주복으로 갈아입고 공중에 뜬 포즈, 조명과 손 모양을 검증합니다.',scene:'지구와 행성, 성운과 반짝이는 별이 멀리 보이는 아름다운 우주 공간을 탐험하는 장면',pose:'무중력 상태에서 부드럽게 떠 있는 전신 자세, 한 손으로 인사하며 기쁨을 표현',clothes:'얼굴이 가려지지 않는 안전한 우주복, 생생한 소재와 디테일'},
{id:'forest',name:'🦌 마법숲의 친구들',desc:'동물과 교감하는 자세 및 자연스러운 시선과 표정을 확인합니다.',scene:'반딧불과 작은 사슴, 토끼가 있는 달빛 마법숲의 아름다운 오솔길',pose:'작은 사슴을 바라보며 살짝 앉아 다정하게 손을 내미는 자세, 호기심 어린 미소',clothes:'꽃무늬의 자연스러운 동화풍 의상'},
{id:'cloud',name:'🌈 무지개 구름여행',desc:'날아가는 자세와 머리카락, 옷자락의 자연스러움을 확인합니다.',scene:'무지개와 반짝이는 하늘 궁전이 있는 환상적인 구름나라',pose:'양팔을 벌리고 구름 위를 날아가는 듯한 역동적인 자세, 환하게 웃는 표정',clothes:'가벼운 파스텔빛 여행 의상과 자연스럽게 펄럭이는 옷자락'},
{id:'garden',name:'🌸 꽃정원에서 놀기',desc:'꽃이나 나비와의 자연스러운 상호작용을 확인합니다.',scene:'햇빛과 나비, 다채로운 장미와 수국이 가득한 고품질 영화 같은 꽃정원',pose:'꽃을 들고 나비를 바라보며 웃는 자연스러운 앉은 자세',clothes:'사진의 인물과 어울리는 꽃무늬 여름옷'}
];
const titles={castle:'꽃길을 달리는 나',ocean:'산호 궁전의 바다 탐험',space:'별나라 우주 탐험가',forest:'마법숲에서 만난 친구',cloud:'구름 위의 신나는 여행',garden:'꽃과 나비의 비밀 정원'};
const titleFor=id=>titles[id]||'새로운 환상 작품';
const sceneFor=id=>scenes.find(s=>s.id===id)||scenes[0];
let selected='castle',source=null,result=null,works=[],active=null,repairParent=null,repairPromptParent=null,editMode=false,dirty=false,saving=false;
function message(t){$('message').textContent=t;}
function setTitleForScene(id){$('workTitle').value=titleFor(id);}
function composeScene(s,pose){
  if(!pose)return s.scene;
  const place={castle:'황금빛 햇살이 비치는 풍성한 장미 정원과 아름다운 동화성의 돌길',ocean:'햇살이 비치는 투명한 산호 궁전 바닷속, 바다거북과 열대어가 보이는 곳',space:'지구와 행성, 성운과 반짝이는 별이 보이는 우주 탐험 공간',forest:'반딧불과 작은 사슴, 토끼가 있는 달빛 마법숲의 오솔길',cloud:'무지개와 반짝이는 하늘 궁전이 있는 환상적인 구름나라',garden:'햇빛과 나비, 다채로운 장미와 수국이 가득한 영화 같은 꽃정원'}[s.id]||s.scene;
  const action=pose.includes('앉')?'편안하게 앉아 있는 장면':pose.includes('서서')?'자연스럽게 서 있는 장면':pose.includes('달리')?'즐겁게 달리는 장면':pose.includes('인사')?'손을 흔들며 인사하는 장면':pose.includes('꽃을')?'꽃을 들고 있는 장면':'선택한 자세를 취한 장면';
  return `${place}에서 ${action}. 기존 장면에 포함된 뛰기·헤엄치기·날기 등의 동작이 선택한 자세와 충돌하면 선택한 자세를 우선하고 충돌하는 동작은 제거해 주세요.`;
}
function displayScene(id,updateMeta){selected=sceneFor(id).id;const s=sceneFor(selected);$('scenes').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.id===selected));
  if(updateMeta)$('resultScene').value=selected;
  const expression=$('expressionChoice').value,pose=$('poseChoice').value,clothes=$('clothesChoice').value;
  const scene=composeScene(s,pose);
  $('sceneDesc').textContent=pose ? `선택한 배경에서 ${pose} · 직접 선택한 자세를 우선합니다. (장면의 원래 동작은 적용하지 않음)` : s.desc;
   $('prompt').value=`첨부한 사진 속 실제 아이 한 명을 유일한 인물 참고 이미지로 사용하여, 같은 아이임을 알아볼 수 있는 사실적인 창작사진 한 장을 만들어 주세요. 원본 사진의 얼굴을 임의로 재해석하지 마세요.\n\n[장면] ${scene}\n[표정] ${expression||'장면에 어울리는 자연스러운 표정'}\n[자세] ${pose||s.pose}\n[의상] ${clothes||s.clothes}\n\n[지시 우선순위] 직접 선택한 표정·자세·의상이 장면 기본값보다 우선합니다. 장면 이름은 배경 분류명일 뿐, 동작을 강제하지 않습니다. 예를 들어 ‘동화성에서 뛰기’에서 ‘앉기’를 선택했다면 동화성 배경에 앉은 모습만 그리세요. 달리기·헤엄치기·날기 등 충돌하는 동작을 섞지 마세요.\n\n[가장 중요한 기준: 얼굴 동일성] 원본의 얼굴형, 이마·턱 윤곽, 눈 사이 거리와 눈매, 코와 입의 형태 및 비율, 헤어라인·머리색, 실제 나이의 인상을 최대한 유지하세요. 피부를 인위적으로 매끈하게 만들거나 눈을 과장하거나 얼굴을 미화하지 마세요. 표정이 달라져도 같은 아이의 얼굴이어야 합니다. 원본에서 보이지 않는 얼굴 특징은 함부로 새로 만들지 마세요.\n\n[자세와 신체 구조] 먼저 한 명의 인물이 취할 수 있는 자세인지 확인하세요. 어깨–팔꿈치–손목–손, 골반–무릎–발목–발이 자연스럽게 이어지게 하세요. 손과 발은 실제 보이는 만큼만 표현하고, 가려진 손·발을 억지로 드러내거나 추가하지 마세요. 손가락 수와 방향, 소품을 잡는 손의 접촉을 자연스럽게 표현하세요. 팔·다리·손·발이 중복되거나 몸통에서 떨어져 보이지 않게 하세요.\n\n[자세별 물리적 일관성] 앉기라면 엉덩이와 발을 지지하는 바닥·의자·돌 등의 접촉점을 분명히 하세요. 달리기라면 무게중심과 다리 움직임을 맞추세요. 헤엄치기라면 물속의 몸 방향과 부력·머리카락 흐름을 맞추세요. 우주·구름 장면이라면 중력감이 장면 설정과 어울리도록 하되 신체 구조는 현실적으로 유지하세요. 선택하지 않은 동작을 추가하지 마세요.\n\n[인물과 배경의 통합] 인물의 얼굴과 의상에 비치는 빛의 방향·색온도·밝기가 배경과 일치해야 합니다. 발이나 몸이 지면에 닿는 경우 접촉 그림자를 넣고, 물속이라면 수중 빛과 물의 색감을 인물에도 자연스럽게 반영하세요. 인물 크기·초점·원근감·경계선·머리카락과 옷자락을 주변 환경과 맞춰 합성 티가 나지 않게 하세요.\n\n[구도와 사진 품질] 얼굴은 알아보기 쉽고 선명하게, 선택한 자세는 확인할 수 있게 구성하세요. 한 장의 고해상도 사실적인 사진처럼 표현하세요. 추가 인물, 중복 얼굴, 불필요한 소품, 글자, 워터마크, 분할 화면, 콜라주를 넣지 마세요.\n\n[최종 점검] ① 원본과 같은 아이인지 ② 선택한 표정·자세·의상이 정확한지 ③ 팔·손·손가락·다리·발의 연결이 자연스러운지 ④ 배경과 인물의 조명·그림자가 맞는지 확인하고 오류를 최소화하세요. 완벽한 일치를 보장할 수 없는 부분은 과장하거나 임의로 꾸미지 마세요. 이 이미지는 실제 기록이 아닌 상상 속 창작사진입니다.`;
}
function selectScene(id){displayScene(id,true);if(!editMode)setTitleForScene(selected);else dirty=true;}
for(const s of scenes){const b=document.createElement('button');b.type='button';b.textContent=s.name;b.dataset.id=s.id;b.onclick=()=>selectScene(s.id);$('scenes').append(b);const o=document.createElement('option');o.value=s.id;o.textContent=s.name;$('resultScene').append(o);}
$('resultScene').onchange=()=>selectScene($('resultScene').value);
for(const id of ['expressionChoice','poseChoice','clothesChoice'])$(id).addEventListener('change',()=>displayScene(selected,false));
$('resetChoices').onclick=()=>{for(const id of ['expressionChoice','poseChoice','clothesChoice'])$(id).value='';displayScene(selected,false);};
displayScene('castle',true);setTitleForScene('castle');
// C1.4.9: Separate IndexedDB for presets; never alter the existing works database.
const presetKey='family-creative-ai-lab-presets-c148';
const presetDbName='family-creative-ai-lab-presets-c149';
const choiceIds=['expressionChoice','poseChoice','clothesChoice'];
let presets=[],presetReady=false;
function safePreset(p){
 return p&&typeof p==='object'&&!Array.isArray(p)&&typeof p.id==='string'&&p.id.length<=120&&typeof p.name==='string'&&p.name.length<=40&&scenes.some(s=>s.id===p.scene)&&choiceIds.every(id=>typeof p[id]==='string'&&[...$(id).options].some(o=>o.value===p[id]));
}
function presetDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(presetDbName,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('presets'))r.result.createObjectStore('presets',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('조합 저장소가 다른 탭에서 사용 중입니다.'));});}
async function readPresetsDb(){const d=await presetDb();try{return await new Promise((resolve,reject)=>{const tx=d.transaction('presets','readonly');const r=tx.objectStore('presets').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{d.close();}}
async function persistPresets(next){
 const d=await presetDb();try{await new Promise((resolve,reject)=>{const tx=d.transaction('presets','readwrite');const store=tx.objectStore('presets');store.clear();for(const p of next)store.put(p);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('조합 저장 실패'));tx.onabort=()=>reject(tx.error||Error('조합 저장 중단'));});}finally{d.close();}
 presets=next;renderPresets();
}
function renderPresets(selectedId=''){
 const sel=$('presetList');sel.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='저장한 조합 선택';sel.append(placeholder);
 for(const p of presets){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' · '+sceneFor(p.scene).name;sel.append(o);}
 if(presets.some(p=>p.id===selectedId))sel.value=selectedId;
 $('presetStatus').textContent=presets.length+'개 조합 저장됨 · 이 기기의 별도 저장소에 보관됩니다. 전체 백업에도 포함됩니다.';
}
function presetMessage(t){$('presetStatus').textContent=t;}
async function initPresets(){
 try{
  let stored=(await readPresetsDb()).filter(safePreset).slice(0,50);
  // One-time, non-destructive import from C1.4.8 if it is readable.
  try{const old=JSON.parse(localStorage.getItem(presetKey)||'[]');if(Array.isArray(old)){const ids=new Set(stored.map(p=>p.id));const extra=old.filter(safePreset).filter(p=>!ids.has(p.id)).slice(0,50-stored.length);if(extra.length){stored=[...stored,...extra];await persistPresets(stored);}}}catch(e){/* localStorage may be unavailable; independent DB remains usable */}
  presets=stored;presetReady=true;renderPresets();
 }catch(e){presetReady=false;presetMessage('⚠️ 조합 저장소를 열지 못했습니다: '+(e?.name||e?.message||'알 수 없는 오류')+' · 작품 저장소는 변경하지 않았습니다.');}
}
renderPresets();initPresets();
$('savePreset').onclick=async()=>{
 if(!presetReady){presetMessage('⚠️ 조합 저장소를 사용할 수 없습니다. Safari 일반 탭에서 다시 열어 주세요.');return;}
 const name=$('presetName').value.trim();if(!name){presetMessage('⚠️ 조합 이름을 입력해 주세요.');return;}
 if(presets.length>=50){presetMessage('⚠️ 조합은 최대 50개까지 저장할 수 있습니다.');return;}
 const p={id:'preset-'+Date.now()+'-'+Math.random().toString(36).slice(2),name,scene:selected,...Object.fromEntries(choiceIds.map(id=>[id,$(id).value]))};
 try{await persistPresets([...presets,p]);$('presetList').value=p.id;presetMessage('✅ '+name+' 조합을 저장했습니다. 기존 작품에는 영향을 주지 않습니다.');}catch(e){presetMessage('⚠️ 조합 저장 실패 ('+(e?.name||'오류')+'). 기존 작품은 그대로입니다.');}
};
$('loadPreset').onclick=()=>{
 const p=presets.find(p=>p.id===$('presetList').value);if(!p){presetMessage('먼저 저장한 조합을 선택해 주세요.');return;}
 for(const id of choiceIds)$(id).value=p[id];selectScene(p.scene);$('presetName').value=p.name;displayScene(p.scene,true);
 presetMessage('✅ '+p.name+' 조합을 요청문에 적용했습니다. 기존 작품 사진은 변경하지 않았습니다.');
};
$('deletePreset').onclick=async()=>{
 const p=presets.find(p=>p.id===$('presetList').value);if(!p){presetMessage('삭제할 조합을 선택해 주세요.');return;}
 if(!confirm('「'+p.name+'」 조합만 삭제할까요? 보관 작품 사진은 삭제되지 않습니다.'))return;
 try{await persistPresets(presets.filter(x=>x.id!==p.id));presetMessage('조합만 삭제했습니다. 보관 작품은 그대로입니다.');}catch(e){presetMessage('⚠️ 조합 삭제를 저장하지 못했습니다 ('+(e?.name||'오류')+').');}
};

const dbName='family-creative-ai-lab-c140'; // DO NOT rename: retains the C1.4.2 stored works.
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('works'))r.result.createObjectStore('works',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transact(mode,act){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('works',mode);let req;try{req=act(tx.objectStore('works'));}catch(e){d.close();reject(e);return;}let value;req.onsuccess=()=>{value=req.result;};tx.oncomplete=()=>{d.close();resolve(value);};tx.onerror=()=>{d.close();reject(tx.error);};tx.onabort=()=>{d.close();reject(tx.error||Error('저장 중단'));};});}
const fetchAll=()=>transact('readonly',s=>s.getAll());
const put=item=>transact('readwrite',s=>s.put(item));
const add=item=>transact('readwrite',s=>s.add(item));
function view(id,data){const el=$(id);el.replaceChildren();if(!data){const sp=document.createElement('span');sp.textContent='사진을 선택해 주세요';el.append(sp);return;}const img=new Image();img.alt=id==='originalView'?'원본 아이 사진':'AI로 만든 시험 결과';img.src=data;el.append(img);}
function clearRepair(clearParent=true){if(clearParent)repairParent=null;repairPromptParent=null;$('repairPrompt').value='';$('repairLineage').textContent='수정 전 작품: 선택되지 않음';$('repairCompare').classList.add('hidden');}
function resetScores(){for(const id of ['face','quality','anatomy','poseScore'])$(id).value='';}
function newDraft({preserveSource=true,preserveParent=false}={}){
  active=null;editMode=false;dirty=false;result=null;view('resultView',null);if(!preserveSource){source=null;view('originalView',null);}
  if(!preserveParent)clearRepair();else{$('repairPrompt').value='';repairPromptParent=null;$('repairCompare').classList.add('hidden');}
  $('workNote').value='';resetScores();displayScene(selected,true);setTitleForScene(selected);
  markSelection();
}
function markSelection(){$('works').querySelectorAll('button[data-work-id]').forEach(b=>b.classList.toggle('selected',b.dataset.workId===active));}
async function normalize(file){if(!file||!file.type.startsWith('image/'))throw Error('JPG, PNG, WebP 등 이미지 파일을 선택해 주세요.');const url=URL.createObjectURL(file);try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('사진을 읽지 못했습니다. HEIC는 사진 앱에서 JPEG로 내보낸 뒤 다시 선택해 주세요.'));i.src=url;});const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.90);}finally{URL.revokeObjectURL(url);}}
$('originalFile').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const data=await normalize(f);newDraft({preserveSource:false});source=data;view('originalView',source);$('sourceStatus').textContent='✅ 원본을 화면에 불러왔습니다. 외부로 전송하지 않았습니다.';message('새 원본을 선택했습니다. 새 AI 결과를 가져와 주세요.');}catch(err){$('sourceStatus').textContent='⚠️ '+err.message;}};
$('resultFile').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const data=await normalize(f);if(editMode){ // keep selected work untouched; explicitly move to a new creation
    const parent=repairParent;newDraft({preserveSource:true,preserveParent:!!parent});repairParent=parent;
  }
  result=data;view('resultView',result);$('repairCompare').classList.add('hidden');markSelection();message('✅ 새 AI 결과를 가져왔습니다. 평가 후 새 작품으로 저장할 수 있습니다.');
}catch(err){message('⚠️ '+err.message);}};
async function copyPrompt(id){const t=$(id).value;if(!t){message('먼저 요청문을 만드세요.');return;}try{await navigator.clipboard.writeText(t);message('✅ 요청문을 복사했습니다. ChatGPT에 해당 사진과 함께 붙여넣으세요.');}catch(e){$(id).focus();$(id).select();message('요청문을 선택했습니다. 복사 메뉴를 이용하세요.');}}
$('copyPrompt').onclick=()=>copyPrompt('prompt');
function download(data,name){if(!data){message('먼저 AI 결과를 불러오세요.');return;}const a=document.createElement('a');a.href=data;a.download=name;a.click();}
$('downloadResult').onclick=()=>download(result,'AI_마법변신_'+($('workTitle').value.trim()||selected).replace(/[\\/:*?"<>|]/g,'_')+'.jpg');
const repairPanel=document.createElement('section');repairPanel.className='lab-meta';repairPanel.style.marginTop='14px';repairPanel.innerHTML=`<h3 style="margin:0">🛠️ AI 작품 다시 수정하기 (C1.4.6)</h3><p class="status">보관 작품을 선택한 다음 수정 요청문을 만드세요. 수정 결과는 항상 별도 작품으로 보관합니다.</p><label>수정할 부분<select id="repairType" class="lab-select"><option value="hands">팔·손·손가락 오류</option><option value="face">얼굴 특징 유지</option><option value="expression">표정만 바꾸기</option><option value="clothes">의상만 바꾸기</option><option value="pose">자세만 바꾸기</option><option value="background">배경만 바꾸기</option><option value="custom">직접 입력</option></select></label><label>추가 요청 (선택)<input id="repairDetail" class="lab-select" maxlength="240" placeholder="예: 왼손 손가락을 자연스럽게"></label><div class="lab-actions"><button id="makeRepair" type="button" class="button">🪄 수정 요청문 만들기</button><button id="copyRepair" type="button" class="button">📋 수정 요청문 복사</button></div><textarea id="repairPrompt" class="prompt" readonly placeholder="보관 작품을 선택하고 수정 요청문 만들기를 누르세요."></textarea><div id="repairLineage" class="status">수정 전 작품: 선택되지 않음</div><div class="lab-actions"><button id="compareParent" type="button" class="button">🔎 수정 전후 비교</button></div><div id="repairCompare" class="lab-grid hidden"><div><h3>수정 전 작품</h3><div id="repairBefore" class="photo-box"></div></div><div><h3>수정 후 작품</h3><div id="repairAfter" class="photo-box"></div></div></div><div class="score"><label>손·발 정확성<select id="anatomy" class="lab-select"><option value="">평가 선택</option><option value="5">5 · 자연스러움</option><option value="4">4 · 대체로 정확</option><option value="3">3 · 일부 어색함</option><option value="2">2 · 명확한 오류</option><option value="1">1 · 심각한 오류</option></select></label><label>자세 자연스러움<select id="poseScore" class="lab-select"><option value="">평가 선택</option><option value="5">5 · 자연스러움</option><option value="4">4 · 대체로 자연스러움</option><option value="3">3 · 조금 어색함</option><option value="2">2 · 부자연스러움</option><option value="1">1 · 심각한 오류</option></select></label></div>`;
$('workNote').closest('.lab-meta').append(repairPanel);
const repairInstructions={hands:'팔은 정확히 두 개, 손은 정확히 두 개여야 합니다. 중복된 팔·손·손가락을 제거하고 어깨부터 손끝까지 관절과 연결을 자연스럽게 수정해 주세요.',face:'원본 아이의 얼굴형, 눈·코·입의 비율, 나이와 헤어라인을 충실하게 유지하고 달라진 얼굴 특징만 교정해 주세요.',expression:'얼굴의 고유한 특징은 유지하면서 표정만 자연스럽게 바꿔 주세요.',clothes:'아이의 얼굴·자세·배경을 유지하고 의상만 자연스럽게 변경해 주세요.',pose:'아이의 얼굴·의상·배경을 유지하면서 자세만 자연스럽게 변경해 주세요. 신체 구조와 손발 개수를 정확히 지켜 주세요.',background:'아이의 얼굴·표정·의상·자세는 유지하고 배경만 변경해 주세요.',custom:'아래 추가 요청에 적힌 부분만 수정해 주세요.'};
$('makeRepair').onclick=()=>{const parent=works.find(w=>w.id===active);if(!parent){message('먼저 아래 보관 작품을 선택해 주세요.');return;}repairParent=parent.id;repairPromptParent=parent.id;const type=$('repairType').value,extra=$('repairDetail').value.trim();$('repairPrompt').value='첨부한 AI 창작사진 한 장을 수정해 주세요. 새 인물을 생성하지 마세요.\n\n[수정할 부분] '+repairInstructions[type]+(extra?'\n[추가 요청] '+extra:'')+'\n\n[반드시 유지] 아이의 얼굴 특징과 나이, 헤어스타일, 기존 장면의 조명과 분위기, 변경 대상으로 지정하지 않은 의상·배경·자세는 최대한 유지해 주세요.\n[품질 점검] 팔 2개, 손 2개, 다리 2개, 손가락·관절의 연결과 신체 비율을 확인해 주세요. 불필요한 팔다리·중복 인물·워터마크·문자는 넣지 마세요.\n사진처럼 사실적인 고품질 결과 이미지 한 장을 만들어 주세요.';
  $('repairLineage').textContent='수정 전 작품: '+(parent.name||'이름 없음')+' · 결과 이미지를 가져오면 새 작품으로 저장';$('repairCompare').classList.add('hidden');message('✅ 수정 요청문이 준비되었습니다. ChatGPT에 수정 전 AI 사진을 첨부해 주세요.');};
$('copyRepair').onclick=()=>copyPrompt('repairPrompt');
$('compareParent').onclick=()=>{
  const child=works.find(w=>w.id===active);
  const linkedParent=child?.parentId?works.find(w=>w.id===child.parentId):null;
  const parent=linkedParent||works.find(w=>w.id===repairParent);
  if(!parent){message('비교할 수정 전 작품을 먼저 선택해 주세요.');return;}
  // A selected parent is not itself a revised result. Never show it on both sides.
  const revised=linkedParent?child.result:(!editMode&&repairParent===parent.id?result:null);
  $('repairCompare').classList.remove('hidden');
  view('repairBefore',parent.result);
  view('repairAfter',revised);
  if(!revised){$('repairAfter').querySelector('span').textContent='수정 후 사진을 아직 가져오지 않았습니다.';message('수정 전 작품만 표시했습니다. 수정한 AI 사진을 ③번에서 가져오면 오른쪽에 표시됩니다.');}
  else message('수정 전후 작품을 나란히 표시했습니다.');
  $('repairCompare').scrollIntoView({block:'nearest',behavior:'smooth'});
};
function getScore(id){return Number($(id).value)||0;}
$('saveResult').onclick=async()=>{if(saving)return;if(!source||!result){message('⚠️ 원본과 새 AI 결과 사진을 모두 선택해 주세요.');return;}if(editMode){message('⚠️ 현재 보관 작품을 보고 있습니다. 「같은 원본으로 새 작품 준비」를 누른 후 새 AI 결과를 가져오세요.');return;}
  saving=true;$('saveResult').disabled=true;const sceneId=$('resultScene').value;const title=$('workTitle').value.trim()||titleFor(sceneId);
  const parentId=repairParent&&works.some(w=>w.id===repairParent)?repairParent:null;
  const item={id:'ai-'+Date.now()+'-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2)),created:Date.now(),scene:sceneId,name:title,note:$('workNote').value.trim(),original:source,result,face:getScore('face'),quality:getScore('quality'),anatomy:getScore('anatomy'),poseScore:getScore('poseScore'),...(parentId?{parentId}:{})};
  try{await add(item);active=item.id;editMode=true;repairParent=null;repairPromptParent=null;$('repairLineage').textContent=parentId?'✅ 수정 결과가 별도 작품으로 저장되었습니다.':'수정 전 작품: 없음';await refresh();message('✅ '+title+' 작품을 새로 보관했습니다. 기존 작품은 그대로 유지됩니다.');}catch(e){message('⚠️ 저장하지 못했습니다. 저장 공간을 확인하고 결과 사진을 먼저 내보내세요.');}finally{saving=false;$('saveResult').disabled=false;}
};
function selectWork(w){active=w.id;editMode=true;dirty=false;source=w.original;result=w.result;clearRepair();displayScene(w.scene,true);$('workTitle').value=w.name||titleFor(w.scene);$('workNote').value=w.note||'';view('originalView',source);view('resultView',result);for(const id of ['face','quality','anatomy','poseScore'])$(id).value=w[id]||'';
  if(w.parentId){const parent=works.find(p=>p.id===w.parentId);$('repairLineage').textContent='수정 전 작품: '+(parent?.name||'백업에 없는 작품')+' (수정 관계 기록됨)';}
  else $('repairLineage').textContent='수정 전 작품: 새 수정 요청문을 만들 수 있습니다.';
  markSelection();message('보관 작품을 선택했습니다. 정보 수정은 기존 기록만 바꾸고, 새 작품 준비는 기존 사진을 보존합니다.');
}
async function refresh(){works=(await fetchAll()).filter(x=>x&&typeof x.id==='string').sort((a,b)=>(b.created||0)-(a.created||0));$('workCount').textContent=`보관된 AI 시험작품 ${works.length}개 · 작품을 선택하면 제목과 장면을 수정하거나 사진을 내보낼 수 있습니다.`;$('works').replaceChildren();
  for(const w of works){const b=document.createElement('button');b.type='button';b.dataset.workId=w.id;const img=new Image();img.loading='lazy';img.src=w.result;img.alt=w.name||'AI 작품';const small=document.createElement('small');const name=sceneFor(w.scene).name;small.textContent=(w.name||name)+' · '+name+' · 얼굴 '+(w.face||'미평가')+'/5 · 완성도 '+(w.quality||'미평가')+'/5'+(w.parentId?' · 수정작':'');b.append(img,small);b.onclick=()=>selectWork(w);$('works').append(b);}markSelection();
}
$('updateInfo').onclick=async()=>{if(!active||!editMode){message('먼저 아래 보관함에서 수정할 작품을 선택해 주세요.');return;}const item=works.find(w=>w.id===active);if(!item){message('수정할 작품을 찾지 못했습니다.');return;}
  const updated={...item,scene:$('resultScene').value,name:$('workTitle').value.trim()||titleFor($('resultScene').value),note:$('workNote').value.trim(),face:getScore('face'),quality:getScore('quality'),anatomy:getScore('anatomy'),poseScore:getScore('poseScore')};try{await put(updated);dirty=false;await refresh();message('✅ 작품 정보만 수정했습니다. 원본·결과 사진과 수정 연결 관계는 유지했습니다.');}catch(e){message('⚠️ 작품 정보 수정에 실패했습니다. 먼저 백업해 주세요.');}};
$('newWork').onclick=()=>{const parent=repairParent&&works.find(w=>w.id===repairParent);newDraft({preserveSource:true,preserveParent:!!parent});if(parent){repairParent=parent.id;$('repairLineage').textContent='수정 전 작품: '+(parent.name||'이름 없음')+' · 수정 결과를 가져오세요.';}message('✅ 원본 사진을 유지하고 새 작품 준비를 시작했습니다. 새 결과를 가져오면 별도 작품으로 저장됩니다.');};
function downloadJson(obj,filename){const blob=new Blob([JSON.stringify(obj)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),25000);}
$('backup').onclick=async()=>{try{if(!presetReady)throw Error('조합 저장소를 확인할 수 없어 전체 백업을 중단했습니다.');const items=await fetchAll();downloadJson({format:'family-creative-ai-lab',version:1,exportedAt:new Date().toISOString(),items,presets},'AI_마법변신_시험작품_백업.json');message('✅ 백업 파일 다운로드를 요청했습니다. 파일 앱에서 실제 저장 여부를 확인해 주세요. ('+items.length+'개 작품)');}catch(e){message('⚠️ 백업 파일 생성에 실패했습니다.');}};
function validRecord(w){return w&&typeof w==='object'&&!Array.isArray(w)&&typeof w.id==='string'&&w.id.length>0&&w.id.length<=180&&typeof w.original==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(w.original)&&typeof w.result==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(w.result)&&(!w.parentId||typeof w.parentId==='string');}
$('restore').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const o=JSON.parse(await f.text());if(o.format!=='family-creative-ai-lab'||!Array.isArray(o.items)||o.items.length>2000)throw Error('파일 형식이 맞지 않습니다.');if(!o.items.every(validRecord))throw Error('일부 작품 데이터가 올바르지 않아 복원을 중단했습니다.');const ids=new Set((await fetchAll()).map(w=>w.id));let n=0,skip=0;for(const w of o.items){if(ids.has(w.id)){skip++;continue;}await add(w);ids.add(w.id);n++;}let addedPresets=0;if(Array.isArray(o.presets)&&o.presets.length<=50&&o.presets.every(safePreset)){
 const known=new Set(presets.map(p=>p.id));const additions=o.presets.filter(p=>!known.has(p.id)).slice(0,Math.max(0,50-presets.length));
 try{if(!presetReady)throw Error('조합 저장소 사용 불가');await persistPresets([...presets,...additions]);addedPresets=additions.length;}catch(e){/* works restoration remains successful */}
 }await refresh();message('✅ '+n+'개 작품을 추가 복원했습니다. 기존 작품과 중복 '+skip+'개는 변경하지 않았습니다. 조합 '+addedPresets+'개 추가.');}catch(err){await refresh().catch(()=>{});message('⚠️ 복원 중단: '+err.message+' 기존 작품은 유지됩니다. 일부 새 작품은 복원되었을 수 있습니다.');}};
refresh().catch(()=>message('⚠️ 저장소를 열지 못했습니다. 브라우저 저장 설정을 확인해 주세요.'));
})();
