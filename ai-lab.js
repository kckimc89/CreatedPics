/* C1.4.2: independent, local-only AI-image quality lab. Never sends photos over network. */
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
let selected=scenes[0],source=null,result=null,works=[],active=null,repairParent=null;
const preferredTitles={castle:'꽃길을 달리는 나',ocean:'산호 궁전의 바다 탐험',space:'별나라 우주 탐험가',forest:'마법숲에서 만난 친구',cloud:'구름 위의 신나는 여행',garden:'꽃과 나비의 비밀 정원'};
const titleFor=id=>preferredTitles[id]||(scenes.find(s=>s.id===id)?.name||'새로운 환상 작품').replace(/^[^ ]+ /,'');
function setMeta(id,resetTitle=true){$('resultScene').value=id;if(resetTitle)$('workTitle').value=titleFor(id);}
function message(t){$('message').textContent=t;}

const dbName='family-creative-ai-lab-c140';
function db(){return new Promise((res,rej)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('works',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function fetchAll(){let d=await db();return new Promise((res,rej)=>{let r=d.transaction('works').objectStore('works').getAll();r.onsuccess=()=>{d.close();res(r.result)};r.onerror=()=>{d.close();rej(r.error)}})}
async function put(item){let d=await db();return new Promise((res,rej)=>{let tx=d.transaction('works','readwrite');tx.objectStore('works').put(item);tx.oncomplete=()=>{d.close();res()};tx.onerror=()=>{d.close();rej(tx.error)}})}
async function del(id){let d=await db();return new Promise((res,rej)=>{let tx=d.transaction('works','readwrite');tx.objectStore('works').delete(id);tx.oncomplete=()=>{d.close();res()};tx.onerror=()=>{d.close();rej(tx.error)}})}
function view(id,data){const el=$(id);el.replaceChildren();if(!data){const sp=document.createElement('span');sp.textContent='사진을 선택해 주세요';el.append(sp);return;}const img=new Image();img.alt=id==='originalView'?'원본 아이 사진':'AI로 만든 시험 결과';img.src=data;el.append(img);}
function chosen(id){selected=scenes.find(s=>s.id===id)||scenes[0];$('scenes').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));$('sceneDesc').textContent=selected.desc; if($('resultScene') && !$('resultScene').dataset.locked){setMeta(selected.id);}$('prompt').value=`첨부한 사진 속 실제 아이를 유일한 인물 참고 이미지로 사용하여 새로운 고품질 창작사진 한 장을 생성해 주세요.\n\n[장면] ${selected.scene}\n[표정과 자세] ${selected.pose}\n[의상] ${selected.clothes}\n\n[절대 우선] 원본 아이의 얼굴형, 눈·코·입의 비율, 헤어라인, 나이에 맞는 얼굴 특징을 가능한 한 충실하게 보존해 주세요. 전혀 다른 아이의 얼굴로 바뀌면 안 됩니다. 피부를 부자연스럽게 매끈하게 만들거나 나이를 바꾸지 마세요.\n[사진 품질] 사진처럼 사실적인 피부·머리카락·의상 재질, 정확한 손가락과 신체 비율, 장면에 맞는 빛·그림자·원근감, 영화 같은 풍부한 배경 디테일. 인물과 배경이 따로 붙인 것처럼 보이지 않게 표현해 주세요.\n[구도] 아이 얼굴이 잘 보이고, 자세가 자연스럽게 드러나는 인물 중심의 한 장면. 문자·워터마크·콜라주·여러 컷 제외. 실제 기록사진이 아닌 상상으로 만든 창작사진으로 제작해 주세요.`;}
scenes.forEach(s=>{const b=document.createElement('button');b.type='button';b.textContent=s.name;b.dataset.id=s.id;b.onclick=()=>chosen(s.id);$('scenes').append(b);const o=document.createElement('option');o.value=s.id;o.textContent=s.name;$('resultScene').append(o)});
// C1.4.2 repair controls. Existing IndexedDB and stored records remain unchanged.
const repairPanel=document.createElement('section');repairPanel.className='lab-meta';repairPanel.style.marginTop='14px';
repairPanel.innerHTML=`<h3 style="margin:0">🛠️ AI 작품 다시 수정하기 (C1.4.2)</h3><p class="status">보관 작품을 선택한 뒤 수정 요청문을 만드세요. AI 사진은 ChatGPT에서 수정하고 결과를 다시 가져옵니다.</p><label>수정할 부분<select id="repairType" class="lab-select"><option value="hands">팔·손·손가락 오류</option><option value="face">얼굴 특징 유지</option><option value="expression">표정만 바꾸기</option><option value="clothes">의상만 바꾸기</option><option value="pose">자세만 바꾸기</option><option value="background">배경만 바꾸기</option><option value="custom">직접 입력</option></select></label><label>추가 요청 (선택)<input id="repairDetail" class="lab-select" maxlength="240" placeholder="예: 왼손 손가락을 자연스럽게"></label><div class="lab-actions"><button id="makeRepair" type="button" class="button">🪄 수정 요청문 만들기</button><button id="copyRepair" type="button" class="button">📋 수정 요청문 복사</button></div><textarea id="repairPrompt" class="prompt" readonly placeholder="보관 작품을 선택하고 수정 요청문 만들기를 누르세요."></textarea><div id="repairLineage" class="status">수정 전 작품: 선택되지 않음</div><div class="lab-actions"><button id="compareParent" type="button" class="button">🔎 수정 전후 비교</button></div><div id="repairCompare" class="lab-grid hidden"><div><h3>수정 전 작품</h3><div id="repairBefore" class="photo-box"></div></div><div><h3>수정 후 작품</h3><div id="repairAfter" class="photo-box"></div></div></div><div class="score"><label>손·발 정확성<select id="anatomy" class="lab-select"><option value="">평가 선택</option><option value="5">5 · 자연스러움</option><option value="4">4 · 대체로 정확</option><option value="3">3 · 일부 어색함</option><option value="2">2 · 명확한 오류</option><option value="1">1 · 심각한 오류</option></select></label><label>자세 자연스러움<select id="poseScore" class="lab-select"><option value="">평가 선택</option><option value="5">5 · 자연스러움</option><option value="4">4 · 대체로 자연스러움</option><option value="3">3 · 조금 어색함</option><option value="2">2 · 부자연스러움</option><option value="1">1 · 심각한 오류</option></select></label></div>`;
$('workNote').closest('.lab-meta').append(repairPanel);
const repairInstructions={hands:'팔은 정확히 두 개, 손은 정확히 두 개여야 합니다. 중복된 팔·손·손가락을 제거하고 어깨부터 손끝까지 관절과 연결을 자연스럽게 수정해 주세요.',face:'원본 아이의 얼굴형, 눈·코·입의 비율, 나이와 헤어라인을 충실하게 유지하고 달라진 얼굴 특징만 교정해 주세요.',expression:'얼굴의 고유한 특징은 유지하면서 표정만 자연스럽게 바꿔 주세요.',clothes:'아이의 얼굴·자세·배경을 유지하고 의상만 자연스럽게 변경해 주세요.',pose:'아이의 얼굴·의상·배경을 유지하면서 자세만 자연스럽게 변경해 주세요. 신체 구조와 손발 개수를 정확히 지켜 주세요.',background:'아이의 얼굴·표정·의상·자세는 유지하고 배경만 변경해 주세요.',custom:'아래 추가 요청에 적힌 부분만 수정해 주세요.'};
$('makeRepair').onclick=()=>{const w=works.find(w=>w.id===active)||works.find(w=>w.id===repairParent);if(!w){message('먼저 보관 작품을 선택해 주세요.');return;}repairParent=w.id;const type=$('repairType').value,extra=$('repairDetail').value.trim();$('repairPrompt').value='첨부한 AI 창작사진 한 장을 수정해 주세요. 새 인물을 생성하지 마세요.\n\n[수정할 부분] '+repairInstructions[type]+(extra?'\n[추가 요청] '+extra:'')+'\n\n[반드시 유지] 아이의 얼굴 특징과 나이, 헤어스타일, 기존 장면의 조명과 분위기, 변경 대상으로 지정하지 않은 의상·배경·자세는 최대한 유지해 주세요.\n[품질 점검] 팔 2개, 손 2개, 다리 2개, 손가락·관절의 연결과 신체 비율을 확인해 주세요. 불필요한 팔다리·중복 인물·워터마크·문자는 넣지 마세요.\n사진처럼 사실적인 고품질 결과 이미지 한 장을 만들어 주세요.';$('repairLineage').textContent='수정 전 작품: '+(w.name||'이름 없음')+' (새 결과는 별도 작품으로 저장)';message('✅ 수정 요청문이 준비되었습니다. ChatGPT에 수정 전 AI 사진을 첨부해 주세요.');};
$('copyRepair').onclick=async()=>{if(!$('repairPrompt').value){message('먼저 수정 요청문을 만드세요.');return;}try{await navigator.clipboard.writeText($('repairPrompt').value);message('✅ 수정 요청문을 복사했습니다. ChatGPT에 수정 전 작품 사진과 함께 붙여넣으세요.');}catch(e){$('repairPrompt').readOnly=false;$('repairPrompt').select();$('repairPrompt').readOnly=true;message('요청문을 선택했습니다. 복사 메뉴를 이용하세요.');}};
$('compareParent').onclick=()=>{const child=works.find(w=>w.id===active),parent=works.find(w=>w.id===(child?.parentId||repairParent));if(!parent){message('비교할 수정 전 작품을 먼저 선택해 주세요.');return;}$('repairCompare').classList.remove('hidden');view('repairBefore',parent.result);view('repairAfter',child&&child.id!==parent.id?child.result:result);$('repairCompare').scrollIntoView({block:'nearest',behavior:'smooth'});};
$('resultScene').onchange=()=>{selected=scenes.find(s=>s.id===$('resultScene').value)||scenes[0];chosen(selected.id);$('workTitle').value=titleFor(selected.id);};
chosen('castle');setMeta('castle');
async function normalize(file){if(!file||!file.type.startsWith('image/'))throw Error('JPG, PNG, WebP 등 이미지 파일을 선택해 주세요.');const url=URL.createObjectURL(file);try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('사진을 읽지 못했습니다. HEIC는 사진 앱에서 JPEG로 내보낸 뒤 다시 선택해 주세요.'));i.src=url});const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.90);}finally{URL.revokeObjectURL(url)}}
$('originalFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{source=await normalize(f); active=null; $('resultScene').dataset.locked=''; view('originalView',source);$('sourceStatus').textContent='✅ 원본을 화면에 불러왔습니다. 외부로 전송하지 않았습니다.';}catch(err){$('sourceStatus').textContent='⚠️ '+err.message}e.target.value=''};
$('resultFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{result=await normalize(f);active=null;$('resultScene').dataset.locked='';view('resultView',result);$('message').textContent='✅ AI 시험 결과를 불러왔습니다. 얼굴 유지와 작품 완성도를 평가해 보세요.';}catch(err){$('message').textContent='⚠️ '+err.message}e.target.value=''};
$('copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText($('prompt').value);$('message').textContent='✅ 요청문을 복사했습니다. ChatGPT에서 아이 사진과 함께 붙여넣어 주세요.';}catch(e){$('prompt').focus();$('prompt').select();$('message').textContent='복사가 제한되어 요청문을 선택했습니다. 복사 메뉴를 사용해 주세요.'}};
function download(data,name){if(!data){$('message').textContent='먼저 AI 결과를 불러오세요.';return}const a=document.createElement('a');a.href=data;a.download=name;a.click();}
$('downloadResult').onclick=()=>download(result,'AI_마법변신_'+($('workTitle').value.trim()||selected.id).replace(/[\\/:*?"<>|]/g,'_')+'.jpg');
$('saveResult').onclick=async()=>{if(!source||!result){$('message').textContent='⚠️ 원본과 AI 결과 사진을 모두 선택해 주세요.';return}const sceneId=$('resultScene').value;
const title=$('workTitle').value.trim()||titleFor(sceneId);
const item={id:'ai-'+Date.now()+'-'+Math.random().toString(36).slice(2),created:Date.now(),scene:sceneId,name:title,note:$('workNote').value.trim(),original:source,result,face:Number($('face').value)||0,quality:Number($('quality').value)||0,anatomy:Number($('anatomy').value)||0,poseScore:Number($('poseScore').value)||0,...(repairParent?{parentId:repairParent}:{})};try{await put(item);active=item.id;repairParent=null;$('repairLineage').textContent='수정 결과가 별도 작품으로 저장되었습니다.';$('message').textContent='✅ '+title+' 작품을 새로 보관했습니다. 기존 작품은 그대로 유지됩니다.';await refresh()}catch(e){$('message').textContent='⚠️ 저장 용량이 부족하거나 기기 저장소가 제한되었습니다. 먼저 이미지로 내보내세요.'}};
async function refresh(){
  works=(await fetchAll()).sort((a,b)=>b.created-a.created);
  $('workCount').textContent=`보관된 AI 시험작품 ${works.length}개 · 작품을 선택하면 제목과 장면을 수정하거나 사진을 내보낼 수 있습니다.`;
  $('works').replaceChildren();
  for(const w of works){
    const b=document.createElement('button');b.type='button';b.className=w.id===active?'selected':'';
    const img=new Image();img.loading='lazy';img.src=w.result;img.alt=w.name;
    const small=document.createElement('small');
    const sceneName=scenes.find(s=>s.id===w.scene)?.name||'기존 기록';
    small.textContent=(w.name||sceneName)+' · '+sceneName+' · 얼굴 '+(w.face||'미평가')+'/5 · 완성도 '+(w.quality||'미평가')+'/5';
    b.append(img,small);
    b.onclick=()=>{active=w.id;source=w.original;result=w.result;
      $('resultScene').dataset.locked='yes';chosen(w.scene);setMeta(w.scene,false);
      $('workTitle').value=w.name||titleFor(w.scene);$('workNote').value=w.note||'';
      view('originalView',source);view('resultView',result);
      $('face').value=w.face||'';$('quality').value=w.quality||'';$('anatomy').value=w.anatomy||'';$('poseScore').value=w.poseScore||'';repairParent=null;$('repairLineage').textContent=w.parentId?'수정 전 작품: '+(works.find(p=>p.id===w.parentId)?.name||'백업에 없는 작품'):'수정 전 작품: 선택한 작품에서 새 수정 요청문을 만들 수 있습니다.';
      message('저장 작품을 불러왔습니다. 장면/제목을 바꿀 때는 정보 수정, 새 작품을 만들 때는 새 작품 준비를 누르세요.');refresh();
    };$('works').append(b);
  }
}
$('updateInfo').onclick=async()=>{
  if(!active){message('먼저 아래 보관함에서 수정할 작품을 선택해 주세요.');return;}
  const item=works.find(w=>w.id===active);
  if(!item){message('수정할 작품을 찾지 못했습니다.');return;}
  const updated={...item,scene:$('resultScene').value,name:$('workTitle').value.trim()||titleFor($('resultScene').value),note:$('workNote').value.trim(),face:Number($('face').value)||0,quality:Number($('quality').value)||0,anatomy:Number($('anatomy').value)||0,poseScore:Number($('poseScore').value)||0};
  try{await put(updated);await refresh();message('✅ 작품 제목·장면·메모·평가를 수정했습니다. 사진 데이터는 변경하지 않았습니다.')}catch(e){message('⚠️ 작품 정보 수정에 실패했습니다. 백업 후 다시 시도해 주세요.')}
};
$('newWork').onclick=()=>{
  active=null;repairParent=null;result=null;view('resultView',null);$('resultScene').dataset.locked='';
  $('face').value='';$('quality').value='';$('anatomy').value='';$('poseScore').value='';$('workNote').value='';setMeta(selected.id);
  message('✅ 원본 사진은 그대로 두고 새 작품을 준비했습니다. 다른 장면을 고른 다음 AI 결과 이미지를 가져오세요.');
  refresh().catch(()=>{});
};
function downloadJson(obj,filename){const blob=new Blob([JSON.stringify(obj)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),25000)}
$('backup').onclick=async()=>{try{downloadJson({format:'family-creative-ai-lab',version:1,items:await fetchAll()},'AI_마법변신_시험작품_백업.json');$('message').textContent='✅ 시험작품 백업 파일을 만들었습니다.'}catch(e){$('message').textContent='백업에 실패했습니다.'}};
$('restore').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.format!=='family-creative-ai-lab'||!Array.isArray(o.items))throw Error('형식이 다릅니다.');const ids=new Set((await fetchAll()).map(w=>w.id));let n=0;for(const w of o.items){if(!w.id||typeof w.result!=='string'||typeof w.original!=='string'||ids.has(w.id))continue;await put(w);n++}$('message').textContent='✅ '+n+'개 시험작품을 복원했습니다. 기존 작품은 유지했습니다.';await refresh()}catch(err){$('message').textContent='⚠️ 올바른 백업 파일이 아니거나 용량이 부족합니다.'}e.target.value=''};
refresh().catch(()=>{$('message').textContent='⚠️ 이 브라우저에서 저장소를 열지 못했습니다. 이미지 내보내기를 사용하세요.'});
})();