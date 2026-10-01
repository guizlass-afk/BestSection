(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ui = {
    languageSelect:$('languageSelect'), languagePicker:$('languagePicker'), languageButton:$('languageButton'), languageMenu:$('languageMenu'), currentFlag:$('currentFlag'), currentLanguage:$('currentLanguage'),
    projectName:$('projectName'), material:$('material'), materialThickness:$('materialThickness'), allowRotation:$('allowRotation'),
    sheetBody:$('sheetBody'), addSheetButton:$('addSheetButton'), kerf:$('kerf'), edgeTrim:$('edgeTrim'),
    partsBody:$('partsBody'), addPartButton:$('addPartButton'), optimizeButton:$('optimizeButton'), message:$('message'),
    progressPanel:$('progressPanel'), progressLabel:$('progressLabel'), progressPercent:$('progressPercent'), progressTrack:$('progressTrack'), progressBar:$('progressBar'), progressDetail:$('progressDetail'),
    templateButton:$('templateButton'), saveProjectButton:$('saveProjectButton'), excelInput:$('excelInput'),
    resultContent:$('resultContent'), resultSubtitle:$('resultSubtitle'),
    metricSheets:$('metricSheets'), metricUsage:$('metricUsage'), metricPieces:$('metricPieces'), metricWaste:$('metricWaste'),
    materialBadge:$('materialBadge'), sheetLayouts:$('sheetLayouts'), cutsTableBody:$('cutsTableBody'), piecesTableBody:$('piecesTableBody'),
    printButton:$('printButton'), exportButton:$('exportButton')
  };
  const translations=window.BestSectionI18n?.translations||{'pt-BR':{}};
  const languageMeta=window.BestSectionI18n?.meta||{'pt-BR':{label:'Português',flag:'br'}};
  const languageCodes=Object.keys(languageMeta);
  function initialLanguage(){let saved='';try{saved=localStorage.getItem('bestsection-language')||'';}catch(_){}return languageCodes.includes(saved)?saved:'pt-BR';}
  const palette = ['#0d8b84','#ef7b3d','#5078a5','#a56d9d','#c49332','#4595aa','#a95d63','#668c55','#7769ad','#bf6d42'];
  const EPS = 1e-7;
  const state = { nextSheetId:1, nextPartId:1, result:null, progressTimer:null, language:initialLanguage() };

  function numberFrom(value) {
    if (typeof value === 'number') return value;
    let text = String(value ?? '').trim().replace(/\s/g,'');
    if (text.includes(',') && text.includes('.')) text = text.replace(/\./g,'').replace(',','.');
    else if (text.includes(',')) text = text.replace(',','.');
    return Number.parseFloat(text);
  }
  function currentUnit() { return document.documentElement.dataset.unit === 'in' ? 'in' : 'mm'; }
  let displayUnit = currentUnit();
  function convertUnit(value, from, to) { if (!Number.isFinite(value) || from === to) return value; const mm = from === 'in' ? value * 25.4 : value; return to === 'in' ? mm / 25.4 : mm; }
  function toMM(value) { return convertUnit(value, displayUnit, 'mm'); }
  function fromMM(value) { return convertUnit(value, 'mm', displayUnit); }
  function lengthDigits() { return displayUnit === 'in' ? 3 : 1; }
  function formatPlain(value) { if (!Number.isFinite(value)) return ''; const digits = displayUnit === 'in' ? 3 : 2; return String(Math.round(value * 10 ** digits) / 10 ** digits); }
  function formatLength(mm, digits) { return `${formatNumber(fromMM(Number(mm)), digits ?? lengthDigits())} ${displayUnit}`; }
  function t(key,values={}){const template=translations[state.language]?.[key]??translations['en-US']?.[key]??translations['pt-BR']?.[key]??key;return String(template).replace(/\{(\w+)\}/g,(_,name)=>values[name]??`{${name}}`);}
  function formatNumber(value,digits=1) { return Number(value).toLocaleString(state.language,{maximumFractionDigits:digits}); }
  function escapeHtml(value) { const div=document.createElement('div'); div.textContent=value; return div.innerHTML; }
  function safeFileName(value) { return String(value||'bestsection').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'bestsection'; }
  function normalizeHeader(value) { return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function booleanFrom(value) { return ['1','true','sim','yes','x','priorizar','prioritario','prioritaria'].includes(normalizeHeader(value)); }
  function setMessage(text,type='') { ui.message.textContent=text; ui.message.className=`message ${type}`.trim(); }
  function setLanguageMenu(open){ui.languageMenu.hidden=!open;ui.languageButton.setAttribute('aria-expanded',String(open));if(open)ui.languageMenu.querySelector(`[data-language="${state.language}"]`)?.focus();}
  function refreshDynamicLanguage(){
    ui.sheetBody.querySelectorAll('.sheet-row').forEach(row=>{row.querySelector('.sheet-name').setAttribute('aria-label',t('sheetNameAria'));row.querySelector('.sheet-length').setAttribute('aria-label',t('sheetLengthAria'));row.querySelector('.sheet-width').setAttribute('aria-label',t('sheetWidthAria'));row.querySelector('.sheet-quantity').setAttribute('aria-label',t('sheetQuantityAria'));row.querySelector('.priority-label').title=t('priorityTitle');row.querySelector('.sheet-priority').setAttribute('aria-label',t('priorityAria'));const remove=row.querySelector('.remove-sheet');remove.title=t('removeSheet');remove.setAttribute('aria-label',t('removeSheet'));});
    ui.partsBody.querySelectorAll('.part-row').forEach(row=>{row.querySelector('.part-id').setAttribute('aria-label',t('partIdAria'));row.querySelector('.part-length').setAttribute('aria-label',t('partLengthAria'));row.querySelector('.part-width').setAttribute('aria-label',t('partWidthAria'));row.querySelector('.part-quantity').setAttribute('aria-label',t('partQuantityAria'));const remove=row.querySelector('.remove-part');remove.title=t('removePart');remove.setAttribute('aria-label',t('removePart'));});
  }
  function applyLanguage(language,persist=true){
    state.language=languageCodes.includes(language)?language:'pt-BR';document.documentElement.lang=state.language;document.documentElement.dir=state.language.startsWith('ar')?'rtl':'ltr';document.title=t('pageTitle');const meta=languageMeta[state.language];ui.languageSelect.value=state.language;ui.currentFlag.src=`flags/${meta.flag}.svg`;ui.currentFlag.alt='';ui.currentLanguage.textContent=meta.label;ui.languageButton.setAttribute('aria-label',t('languageLabel',{language:meta.label}));ui.languageMenu.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.language===state.language)));document.querySelectorAll('[data-i18n]').forEach(element=>{element.textContent=t(element.dataset.i18n);});document.querySelectorAll('[data-i18n-html]').forEach(element=>{element.innerHTML=t(element.dataset.i18nHtml);});refreshDynamicLanguage();if(state.result)renderResult(state.result);if(persist)try{localStorage.setItem('bestsection-language',state.language);}catch(_){}
  }
  function invalidateResult() {
    if (!state.result) return;
    state.result=null; ui.resultContent.hidden=true; ui.printButton.disabled=ui.exportButton.disabled=true;
    ui.resultSubtitle.textContent=t('changedData');
  }
  function updateRemoveButtons(selector) {
    const buttons=[...document.querySelectorAll(selector)]; buttons.forEach(button=>{button.disabled=buttons.length===1;});
  }
  function addSheetRow(values={},focus=false) {
    const row=document.createElement('div'); row.className='sheet-row'; row.dataset.rowId=values.rowId||`sheet-${state.nextSheetId++}`;
    row.innerHTML=`<input class="row-input sheet-name" value="${escapeHtml(values.name??t('sheetDefault',{number:ui.sheetBody.children.length+1}))}" maxlength="40" aria-label="${escapeHtml(t('sheetNameAria'))}"><input class="row-input number-input sheet-length" type="number" value="${formatPlain(fromMM(Number(values.length??2750)))}" min="1" step="0.1" aria-label="${escapeHtml(t('sheetLengthAria'))}"><input class="row-input number-input sheet-width" type="number" value="${formatPlain(fromMM(Number(values.width??1850)))}" min="1" step="0.1" aria-label="${escapeHtml(t('sheetWidthAria'))}"><input class="row-input number-input sheet-quantity" type="number" value="${values.quantity??1}" min="1" max="999" step="1" aria-label="${escapeHtml(t('sheetQuantityAria'))}"><label class="priority-label" title="${escapeHtml(t('priorityTitle'))}"><input class="sheet-priority" type="checkbox"${values.priority?' checked':''} aria-label="${escapeHtml(t('priorityAria'))}"></label><button class="remove-row remove-sheet" type="button" title="${escapeHtml(t('removeSheet'))}" aria-label="${escapeHtml(t('removeSheet'))}">×</button>`;
    row.querySelectorAll('input').forEach(input=>input.addEventListener('change',invalidateResult));
    row.querySelector('.remove-sheet').addEventListener('click',()=>{if(ui.sheetBody.children.length<=1)return;row.remove();updateRemoveButtons('.remove-sheet');invalidateResult();});
    ui.sheetBody.appendChild(row); updateRemoveButtons('.remove-sheet'); if(focus)row.querySelector('.sheet-name').focus(); return row;
  }
  function addPartRow(values={},focus=false) {
    const row=document.createElement('div'); row.className='part-row'; row.dataset.rowId=values.rowId||`part-${state.nextPartId++}`; row.dataset.observation=values.observation||'';
    row.innerHTML=`<input class="row-input part-id" value="${escapeHtml(values.id??'')}" placeholder="Ex.: P01" maxlength="50" aria-label="${escapeHtml(t('partIdAria'))}"><input class="row-input number-input part-length" type="number" value="${values.length===undefined||values.length===''?'':formatPlain(fromMM(Number(values.length)))}" placeholder="0" min="0.1" step="0.1" aria-label="${escapeHtml(t('partLengthAria'))}"><input class="row-input number-input part-width" type="number" value="${values.width===undefined||values.width===''?'':formatPlain(fromMM(Number(values.width)))}" placeholder="0" min="0.1" step="0.1" aria-label="${escapeHtml(t('partWidthAria'))}"><input class="row-input number-input part-quantity" type="number" value="${values.quantity??1}" min="1" max="9999" step="1" aria-label="${escapeHtml(t('partQuantityAria'))}"><button class="remove-row remove-part" type="button" title="${escapeHtml(t('removePart'))}" aria-label="${escapeHtml(t('removePart'))}">×</button>`;
    row.querySelectorAll('input').forEach(input=>input.addEventListener('change',invalidateResult));
    row.querySelector('.remove-part').addEventListener('click',()=>{if(ui.partsBody.children.length<=1)return;row.remove();updateRemoveButtons('.remove-part');invalidateResult();});
    ui.partsBody.appendChild(row); updateRemoveButtons('.remove-part'); if(focus)row.querySelector('.part-id').focus(); return row;
  }

  function readForm() {
    const kerf=toMM(numberFrom(ui.kerf.value)), edgeTrim=toMM(numberFrom(ui.edgeTrim.value)), thickness=toMM(numberFrom(ui.materialThickness.value));
    if(!(kerf>=0))throw new Error(t('errorKerf'));
    if(!(edgeTrim>=0))throw new Error(t('errorEdge'));
    if(!(thickness>0))throw new Error(t('errorThickness'));
    const sheets=[...ui.sheetBody.querySelectorAll('.sheet-row')].map((row,index)=>{
      const length=toMM(numberFrom(row.querySelector('.sheet-length').value)),width=toMM(numberFrom(row.querySelector('.sheet-width').value)),quantity=Math.trunc(numberFrom(row.querySelector('.sheet-quantity').value));
      if(!(length>0&&width>0))throw new Error(t('errorSheetDimensions',{number:index+1}));
      if(!(quantity>=1&&quantity<=999))throw new Error(t('errorSheetQuantity',{number:index+1}));
      if(length-edgeTrim*2<=EPS||width-edgeTrim*2<=EPS)throw new Error(t('errorMarginEliminates',{number:index+1}));
      return {id:row.dataset.rowId,name:row.querySelector('.sheet-name').value.trim()||t('sheetDefault',{number:index+1}),length,width,quantity,priority:row.querySelector('.sheet-priority').checked};
    });
    if(!sheets.length)throw new Error(t('errorAddSheet'));
    const pieces=[]; let totalPieces=0;
    [...ui.partsBody.querySelectorAll('.part-row')].forEach((row,index)=>{
      const rawLength=row.querySelector('.part-length').value.trim(),rawWidth=row.querySelector('.part-width').value.trim(); if(!rawLength&&!rawWidth)return;
      const length=toMM(numberFrom(rawLength)),width=toMM(numberFrom(rawWidth)),quantity=Math.trunc(numberFrom(row.querySelector('.part-quantity').value));
      if(!(length>0&&width>0))throw new Error(t('errorPartDimensions',{number:index+1}));
      if(!(quantity>=1&&quantity<=9999))throw new Error(t('errorPartQuantity',{number:index+1}));
      pieces.push({id:row.querySelector('.part-id').value.trim()||`P${String(index+1).padStart(2,'0')}`,length,width,quantity,colorIndex:pieces.length,observation:row.dataset.observation||''}); totalPieces+=quantity;
    });
    if(!pieces.length)throw new Error(t('errorAddPart'));
    if(totalPieces>3000)throw new Error(t('errorMaxParts'));
    return {projectName:ui.projectName.value.trim()||'Novo plano de corte',material:ui.material.value.trim()||'Não informado',thickness,allowRotation:ui.allowRotation.checked,kerf,edgeTrim,sheets,pieces};
  }

  function seededRandom(seed) { return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let value=Math.imul(seed^seed>>>15,1|seed);value=value+Math.imul(value^value>>>7,61|value)^value;return((value^value>>>14)>>>0)/4294967296;}; }
  function expandPieces(config) {
    const items=[]; config.pieces.forEach((piece,cutIndex)=>{for(let n=1;n<=piece.quantity;n++)items.push({...piece,cutIndex,instance:n,area:piece.length*piece.width});}); return items;
  }
  function orientedOptions(piece,allowRotation) {
    const options=[{w:piece.length,h:piece.width,rotated:false}];
    if(allowRotation&&Math.abs(piece.length-piece.width)>EPS)options.push({w:piece.width,h:piece.length,rotated:true}); return options;
  }
  function splitGeometry(free,pw,ph,kerf,mode) {
    const deltaW=Math.max(0,free.w-pw),deltaH=Math.max(0,free.h-ph),cutW=deltaW>EPS,cutH=deltaH>EPS;
    const rightW=Math.max(0,deltaW-(cutW?Math.min(kerf,deltaW):0)),bottomH=Math.max(0,deltaH-(cutH?Math.min(kerf,deltaH):0));
    const children=[],cuts=[];
    if(mode==='V') {
      if(cutW)cuts.push({orientation:'vertical',x:free.x+pw,y:free.y,length:free.h,region:{x:free.x,y:free.y,w:free.w,h:free.h},kerf:Math.min(kerf,deltaW)});
      if(cutH)cuts.push({orientation:'horizontal',x:free.x,y:free.y+ph,length:pw,region:{x:free.x,y:free.y,w:pw,h:free.h},kerf:Math.min(kerf,deltaH)});
      if(rightW>EPS)children.push({x:free.x+pw+Math.min(kerf,deltaW),y:free.y,w:rightW,h:free.h});
      if(bottomH>EPS)children.push({x:free.x,y:free.y+ph+Math.min(kerf,deltaH),w:pw,h:bottomH});
    } else {
      if(cutH)cuts.push({orientation:'horizontal',x:free.x,y:free.y+ph,length:free.w,region:{x:free.x,y:free.y,w:free.w,h:free.h},kerf:Math.min(kerf,deltaH)});
      if(cutW)cuts.push({orientation:'vertical',x:free.x+pw,y:free.y,length:ph,region:{x:free.x,y:free.y,w:free.w,h:ph},kerf:Math.min(kerf,deltaW)});
      if(bottomH>EPS)children.push({x:free.x,y:free.y+ph+Math.min(kerf,deltaH),w:free.w,h:bottomH});
      if(rightW>EPS)children.push({x:free.x+pw+Math.min(kerf,deltaW),y:free.y,w:rightW,h:ph});
    }
    return {children,cuts,deltaW,deltaH};
  }
  function placementScore(free,piece,geometry,strategy,random) {
    const waste=free.w*free.h-piece.w*piece.h,children=geometry.children,largest=children.reduce((max,r)=>Math.max(max,r.w*r.h),0),smallest=children.length?Math.min(...children.map(r=>r.w*r.h)):0;
    const short=Math.min(geometry.deltaW,geometry.deltaH),long=Math.max(geometry.deltaW,geometry.deltaH),sliver=children.reduce((sum,r)=>sum+(Math.min(r.w,r.h)<Math.min(piece.w,piece.h)*.18?r.w*r.h:0),0);
    if(strategy%5===0)return waste*10+short*2+long+sliver*3;
    if(strategy%5===1)return waste*8+(waste-largest)*2+sliver*5;
    if(strategy%5===2)return short*20+long*3+waste+sliver*4;
    if(strategy%5===3)return waste*6-smallest*.4+children.length*piece.w*piece.h*.02+sliver*4;
    return waste*(.9+random()*.3)+short*(1+random()*4)+sliver*2;
  }
  function bestPlacementInSheet(sheet,piece,config,strategy,random) {
    let best=null;
    sheet.free.forEach((free,freeIndex)=>orientedOptions(piece,config.allowRotation).forEach(option=>{
      if(option.w>free.w+EPS||option.h>free.h+EPS)return;
      ['V','H'].forEach(mode=>{
        const geometry=splitGeometry(free,option.w,option.h,config.kerf,mode),score=placementScore(free,option,geometry,strategy,random);
        const candidate={sheet,free,freeIndex,piece,pw:option.w,ph:option.h,rotated:option.rotated,mode,geometry,score};
        if(!best||candidate.score<best.score-EPS||(Math.abs(candidate.score-best.score)<EPS&&candidate.geometry.children.length<best.geometry.children.length))best=candidate;
      });
    })); return best;
  }
  function instantiateSheet(stock,index,config) {
    const usableW=stock.length-config.edgeTrim*2,usableH=stock.width-config.edgeTrim*2;
    return {index,stockType:stock,length:stock.length,width:stock.width,usableW,usableH,free:[{x:config.edgeTrim,y:config.edgeTrim,w:usableW,h:usableH}],placements:[],cuts:[]};
  }
  function commitPlacement(candidate) {
    const {sheet,freeIndex,piece,pw,ph,rotated,geometry}=candidate;
    sheet.free.splice(freeIndex,1,...geometry.children);
    const placement={...piece,x:candidate.free.x,y:candidate.free.y,w:pw,h:ph,rotated}; sheet.placements.push(placement);
    geometry.cuts.forEach(cut=>sheet.cuts.push({...cut,order:sheet.cuts.length+1,pieceId:piece.id}));
  }
  function stockFitsPiece(stock,piece,config) {
    const w=stock.length-config.edgeTrim*2,h=stock.width-config.edgeTrim*2;
    return orientedOptions(piece,config.allowRotation).some(option=>option.w<=w+EPS&&option.h<=h+EPS);
  }
  function chooseNewStock(config,piece,usedCounts,strategy,random,priorityOnly=false) {
    let available=config.sheets.filter(stock=>(usedCounts.get(stock.id)||0)<stock.quantity&&stockFitsPiece(stock,piece,config));
    if(priorityOnly)available=available.filter(stock=>stock.priority); else if(available.some(stock=>stock.priority))available=available.filter(stock=>stock.priority);
    if(!available.length)return null;
    return available.map(stock=>{
      const usable=(stock.length-config.edgeTrim*2)*(stock.width-config.edgeTrim*2),waste=usable-piece.area;
      let score=waste;
      if(strategy%4===1)score=Math.max(stock.length,stock.width)*10+waste;
      else if(strategy%4===2)score=stock.length*stock.width*(.92+random()*.16);
      else if(strategy%4===3)score=waste*(.85+random()*.3);
      return {stock,score};
    }).sort((a,b)=>a.score-b.score)[0].stock;
  }
  function pieceOrder(items,trial,random) {
    const copy=[...items],mode=trial%7;
    if(mode===0)return copy.sort((a,b)=>b.area-a.area||Math.max(b.length,b.width)-Math.max(a.length,a.width));
    if(mode===1)return copy.sort((a,b)=>Math.max(b.length,b.width)-Math.max(a.length,a.width)||b.area-a.area);
    if(mode===2)return copy.sort((a,b)=>b.length-a.length||b.width-a.width);
    if(mode===3)return copy.sort((a,b)=>b.width-a.width||b.length-a.length);
    if(mode===4)return copy.sort((a,b)=>(b.length+b.width)-(a.length+a.width)||b.area-a.area);
    if(mode===5)return copy.sort((a,b)=>a.cutIndex-b.cutIndex||b.area-a.area);
    return copy.map(item=>({item,key:item.area*(.72+random()*.56)+Math.max(item.length,item.width)*random()*100})).sort((a,b)=>b.key-a.key).map(entry=>entry.item);
  }
  function summarizeCandidate(config,sheets,unplaced) {
    const totalStockArea=sheets.reduce((sum,sheet)=>sum+sheet.length*sheet.width,0),totalUsableArea=sheets.reduce((sum,sheet)=>sum+sheet.usableW*sheet.usableH,0),totalPieceArea=sheets.reduce((sum,sheet)=>sum+sheet.placements.reduce((inner,p)=>inner+p.area,0),0),remnantArea=sheets.reduce((sum,sheet)=>sum+sheet.free.reduce((inner,r)=>inner+r.w*r.h,0),0);
    const trimLoss=totalStockArea-totalUsableArea,kerfLoss=Math.max(0,totalUsableArea-totalPieceArea-remnantArea),largestRemnant=sheets.reduce((max,sheet)=>Math.max(max,...sheet.free.map(r=>r.w*r.h),0),0);
    return {config,sheets,unplaced,totalSheets:sheets.length,totalPieces:sheets.reduce((sum,s)=>sum+s.placements.length,0),totalStockArea,totalUsableArea,totalPieceArea,remnantArea,trimLoss,kerfLoss,largestRemnant,utilization:totalStockArea?totalPieceArea/totalStockArea*100:0,createdAt:new Date()};
  }
  function betterResult(candidate,best) {
    if(!best)return true;
    if(candidate.unplaced.length!==best.unplaced.length)return candidate.unplaced.length<best.unplaced.length;
    if(candidate.totalStockArea!==best.totalStockArea)return candidate.totalStockArea<best.totalStockArea;
    if(candidate.totalSheets!==best.totalSheets)return candidate.totalSheets<best.totalSheets;
    if(Math.abs(candidate.remnantArea-best.remnantArea)>EPS)return candidate.remnantArea>best.remnantArea;
    if(Math.abs(candidate.largestRemnant-best.largestRemnant)>EPS)return candidate.largestRemnant>best.largestRemnant;
    return candidate.sheets.reduce((sum,s)=>sum+s.cuts.length,0)<best.sheets.reduce((sum,s)=>sum+s.cuts.length,0);
  }
  function runTrial(config,items,trial) {
    const random=seededRandom(9173+trial*7919),ordered=pieceOrder(items,trial,random),sheets=[],usedCounts=new Map(),unplaced=[];
    for(const piece of ordered) {
      const priorityExisting=sheets.filter(sheet=>sheet.stockType.priority).map(sheet=>bestPlacementInSheet(sheet,piece,config,trial,random)).filter(Boolean).sort((a,b)=>a.score-b.score)[0];
      if(priorityExisting){commitPlacement(priorityExisting);continue;}
      const unusedPriority=chooseNewStock(config,piece,usedCounts,trial,random,true);
      if(unusedPriority){const sheet=instantiateSheet(unusedPriority,sheets.length+1,config);usedCounts.set(unusedPriority.id,(usedCounts.get(unusedPriority.id)||0)+1);sheets.push(sheet);const placement=bestPlacementInSheet(sheet,piece,config,trial,random);if(placement){commitPlacement(placement);continue;}}
      const existing=sheets.map(sheet=>bestPlacementInSheet(sheet,piece,config,trial,random)).filter(Boolean).sort((a,b)=>a.score-b.score)[0];
      if(existing){commitPlacement(existing);continue;}
      const stock=chooseNewStock(config,piece,usedCounts,trial,random,false);
      if(!stock){unplaced.push(piece);continue;}
      const sheet=instantiateSheet(stock,sheets.length+1,config); usedCounts.set(stock.id,(usedCounts.get(stock.id)||0)+1); sheets.push(sheet);
      const placement=bestPlacementInSheet(sheet,piece,config,trial,random); if(placement)commitPlacement(placement);else unplaced.push(piece);
    }
    return summarizeCandidate(config,sheets,unplaced);
  }
  async function optimizeGuillotine(config,onProgress=()=>{},forcedTrials=null) {
    const items=expandPieces(config),trials=forcedTrials??Math.min(180,Math.max(48,Math.ceil(14000/Math.max(30,items.length)))); let best=null;
    for(let trial=0;trial<trials;trial++) {
      const candidate=runTrial(config,items,trial); if(betterResult(candidate,best))best=candidate;
      onProgress((trial+1)/trials,{trial:trial+1,trials,bestSheets:best.totalSheets,unplaced:best.unplaced.length});
      if(trial%3===2)await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(best.unplaced.length){const sample=[...new Set(best.unplaced.map(piece=>piece.id))].slice(0,4).join(', ');throw new Error(t('errorStockInsufficient',{count:best.unplaced.length,sample}));}
    best.sheets.forEach((sheet,index)=>{sheet.index=index+1;}); return best;
  }

  function updateProgress(value,detail='') {
    const percent=Math.max(0,Math.min(100,Math.round(value*100))); ui.progressBar.style.width=`${percent}%`;ui.progressPercent.textContent=`${percent}%`;ui.progressTrack.setAttribute('aria-valuenow',String(percent));ui.progressLabel.textContent=t(percent>=100?'progressDone':'progressDoing');if(detail)ui.progressDetail.textContent=detail;
  }
  function svgElement(name,attributes={}) { const element=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,String(value)));return element; }
  function renderSheetLayout(sheet,result) {
    const item=document.createElement('article');item.className='layout-item';
    const heading=document.createElement('div');heading.className='layout-heading';heading.innerHTML=`<strong>${escapeHtml(t('sheetUpper',{number:sheet.index}))} · ${escapeHtml(sheet.stockType.name)}</strong><span>${formatLength(sheet.length)} × ${formatLength(sheet.width)}<br>${escapeHtml(t('pieceCount',{count:sheet.placements.length}))} · ${escapeHtml(t('remainderMeasure',{area:formatNumber(sheet.free.reduce((sum,r)=>sum+r.w*r.h,0)/1e6,3)}))}</span>`;
    const svg=svgElement('svg',{class:'sheet-svg',viewBox:`0 0 ${sheet.length} ${sheet.width}`,role:'img','aria-label':t('sheetPlanAria',{number:sheet.index})});
    svg.appendChild(svgElement('rect',{x:0,y:0,width:sheet.length,height:sheet.width,fill:'#f5f8f9'}));
    if(result.config.edgeTrim>0){const m=result.config.edgeTrim;[[0,0,sheet.length,m],[0,sheet.width-m,sheet.length,m],[0,m,m,sheet.width-2*m],[sheet.length-m,m,m,sheet.width-2*m]].forEach(([x,y,w,h])=>svg.appendChild(svgElement('rect',{x,y,width:w,height:h,class:'trim-area'})));}
    sheet.placements.forEach(placement=>{
      const group=svgElement('g'),rect=svgElement('rect',{x:placement.x,y:placement.y,width:placement.w,height:placement.h,fill:palette[placement.colorIndex%palette.length],class:'piece'}),title=svgElement('title');title.textContent=`${placement.id} · ${formatLength(placement.length)} × ${formatLength(placement.width)}${placement.rotated?` · ${t('rotated')}`:''}`;rect.appendChild(title);group.appendChild(rect);
      if(Math.min(placement.w,placement.h)>35){const font=Math.max(16,Math.min(55,Math.min(placement.w,placement.h)*.16)),text=svgElement('text',{x:placement.x+placement.w/2,y:placement.y+placement.h/2,'font-size':font,class:'piece-label'});text.textContent=placement.id;group.appendChild(text);}svg.appendChild(group);
    });
    const radius=Math.max(9,Math.min(sheet.length,sheet.width)*.015);
    sheet.cuts.forEach(cut=>{
      const x2=cut.orientation==='vertical'?cut.x:cut.x+cut.length,y2=cut.orientation==='vertical'?cut.y+cut.length:cut.y,line=svgElement('line',{x1:cut.x,y1:cut.y,x2,y2,class:'cut-line'});svg.appendChild(line);
      const cx=cut.orientation==='vertical'?cut.x:cut.x+cut.length/2,cy=cut.orientation==='vertical'?cut.y+cut.length/2:cut.y,circle=svgElement('circle',{cx,cy,r:radius,class:'cut-number'}),label=svgElement('text',{x:cx,y:cy,'font-size':radius*1.05,class:'cut-number-text'});label.textContent=cut.order;svg.append(circle,label);
    });
    const legend=document.createElement('div');legend.className='layout-legend';const unique=new Map();sheet.placements.forEach(p=>{if(!unique.has(p.id))unique.set(p.id,p);});legend.innerHTML=[...unique.values()].map(p=>`<span><i style="background:${palette[p.colorIndex%palette.length]}"></i>${escapeHtml(p.id)} · ${formatLength(p.length)} × ${formatLength(p.width)}</span>`).join('');
    item.append(heading,svg,legend);return item;
  }
  function renderResult(result) {
    state.result=result;ui.resultContent.hidden=false;ui.printButton.disabled=ui.exportButton.disabled=false;
    ui.metricSheets.textContent=result.totalSheets;ui.metricUsage.textContent=`${formatNumber(result.utilization,1)}%`;ui.metricPieces.textContent=result.totalPieces;ui.metricWaste.textContent=`${formatNumber(result.remnantArea/1e6,3)} m²`;
    ui.materialBadge.textContent=`${result.config.material} · ${formatLength(result.config.thickness)}`;ui.resultSubtitle.textContent=t('resultSummary',{parts:result.totalPieces,sheets:result.totalSheets,loss:formatNumber(result.kerfLoss/1e6,3)});
    ui.sheetLayouts.innerHTML='';result.sheets.forEach(sheet=>ui.sheetLayouts.appendChild(renderSheetLayout(sheet,result)));
    ui.cutsTableBody.innerHTML='';result.sheets.forEach(sheet=>sheet.cuts.forEach(cut=>{const row=document.createElement('tr'),axis=cut.orientation==='vertical'?'X':'Y',position=cut.orientation==='vertical'?cut.x:cut.y;row.innerHTML=`<td><strong>${escapeHtml(t('sheetNumber',{number:sheet.index}))}</strong><br><small>${escapeHtml(sheet.stockType.name)}</small></td><td><strong>${cut.order}</strong></td><td><span class="direction-chip">${escapeHtml(t(cut.orientation==='vertical'?'vertical':'horizontal'))}</span></td><td>${axis} = ${formatLength(position)}</td><td>${formatLength(cut.length)}</td><td>${formatLength(cut.region.w)} × ${formatLength(cut.region.h)}</td>`;ui.cutsTableBody.appendChild(row);}));
    ui.piecesTableBody.innerHTML='';result.sheets.forEach(sheet=>sheet.placements.forEach(piece=>{const row=document.createElement('tr');row.innerHTML=`<td><strong>${escapeHtml(t('sheetNumber',{number:sheet.index}))}</strong></td><td><span class="piece-code">${escapeHtml(piece.id)}</span></td><td>${formatLength(piece.length)} × ${formatLength(piece.width)}</td><td>${formatLength(piece.x)} × ${formatLength(piece.y)}</td><td>${piece.rotated?'90°':'0°'}</td>`;ui.piecesTableBody.appendChild(row);}));
  }
  async function executeOptimization() {
    try {
      const config=readForm();ui.optimizeButton.disabled=true;ui.optimizeButton.firstElementChild.textContent=t('optimizeBusy');ui.progressPanel.hidden=false;updateProgress(0,t('preparingItems'));setMessage('');await new Promise(resolve=>setTimeout(resolve,30));
      const started=performance.now(),result=await optimizeGuillotine(config,(progress,info)=>updateProgress(progress,t('trialDetail',{current:info.trial,total:info.trials,sheets:info.bestSheets})));result.elapsedMs=performance.now()-started;renderResult(result);setMessage(t('planCompleted',{time:formatNumber(result.elapsedMs,0)}),'success');
      clearTimeout(state.progressTimer);state.progressTimer=setTimeout(()=>{ui.progressPanel.hidden=true;},1600);
    } catch(error){setMessage(error.message,'error');ui.progressPanel.hidden=true;}
    finally{ui.optimizeButton.disabled=false;ui.optimizeButton.firstElementChild.textContent=t('optimize');}
  }

  function workbookAvailable(){if(window.XLSX)return true;setMessage(t('excelMissing'),'error');return false;}
  function projectWorkbook(sheetRows,partRows,settingsRows) {
    const sheets=XLSX.utils.aoa_to_sheet([['Identificacao','Comprimento_mm','Largura_mm','Quantidade','Priorizar'],...sheetRows]),parts=XLSX.utils.aoa_to_sheet([['Identificacao','Comprimento_mm','Largura_mm','Quantidade','Observacao'],...partRows]),settings=XLSX.utils.aoa_to_sheet([['Configuracao','Valor'],...settingsRows]),instructions=XLSX.utils.aoa_to_sheet([
      ['BESTSECTION — ARQUIVO COMPLETO DO PROJETO'],['Preencha as abas Chapas e Pecas sem alterar os nomes das colunas.'],['Chapas','Cadastre cada tamanho de chapa disponível. Use Sim em Priorizar para consumir esse tamanho primeiro.'],['Pecas','Informe identificação, comprimento, largura e quantidade. Observacao é opcional.'],['Configuracoes','Nome_projeto, Material, Espessura_material_mm, Largura_corte_mm, Margem_bordas_mm e Permitir_rotacao_90.'],['Importante','Todas as medidas são em milímetros. A otimização gera somente cortes guilhotinados.']
    ]);
    sheets['!cols']=[{wch:22},{wch:20},{wch:17},{wch:13},{wch:13}];parts['!cols']=[{wch:22},{wch:20},{wch:17},{wch:13},{wch:40}];settings['!cols']=[{wch:30},{wch:34}];instructions['!cols']=[{wch:32},{wch:110}];sheets['!autofilter']={ref:sheets['!ref']};parts['!autofilter']={ref:parts['!ref']};
    const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheets,'Chapas');XLSX.utils.book_append_sheet(workbook,parts,'Pecas');XLSX.utils.book_append_sheet(workbook,settings,'Configuracoes');XLSX.utils.book_append_sheet(workbook,instructions,'Instrucoes');return workbook;
  }
  function formRows() {
    const sheets=[...ui.sheetBody.querySelectorAll('.sheet-row')].map(row=>[row.querySelector('.sheet-name').value,toMM(numberFrom(row.querySelector('.sheet-length').value)),toMM(numberFrom(row.querySelector('.sheet-width').value)),row.querySelector('.sheet-quantity').value,row.querySelector('.sheet-priority').checked?'Sim':'Não']);
    const parts=[...ui.partsBody.querySelectorAll('.part-row')].map(row=>[row.querySelector('.part-id').value,toMM(numberFrom(row.querySelector('.part-length').value)),toMM(numberFrom(row.querySelector('.part-width').value)),row.querySelector('.part-quantity').value,row.dataset.observation||'']);return{sheets,parts};
  }
  function downloadTemplate(){if(!workbookAvailable())return;const workbook=projectWorkbook([['Chapa 1',2750,1850,2,'Não'],['Chapa 2',1200,800,1,'Sim']],[['P01',600,400,4,'Exemplo — substitua'],['P02',800,300,2,'']],[['Versao_modelo',1],['Nome_projeto','Novo plano de corte'],['Material','MDF'],['Espessura_material_mm',15],['Largura_corte_mm',3],['Margem_bordas_mm',0],['Permitir_rotacao_90','Sim'],['Unidade','mm']]);XLSX.writeFile(workbook,'modelo_completo_bestsection.xlsx');setMessage(t('templateDownloaded'),'success');}
  function saveProject(){if(!workbookAvailable())return;const rows=formRows(),workbook=projectWorkbook(rows.sheets,rows.parts,[['Versao_modelo',1],['Nome_projeto',ui.projectName.value],['Material',ui.material.value],['Espessura_material_mm',toMM(numberFrom(ui.materialThickness.value))],['Largura_corte_mm',toMM(numberFrom(ui.kerf.value))],['Margem_bordas_mm',toMM(numberFrom(ui.edgeTrim.value))],['Permitir_rotacao_90',ui.allowRotation.checked?'Sim':'Não'],['Unidade','mm'],['Salvo_em',new Date().toLocaleString(state.language)]]);XLSX.writeFile(workbook,`${safeFileName(ui.projectName.value)}_projeto_bestsection.xlsx`);setMessage(t('projectSaved'),'success');}
  function findHeader(headers,aliases){return headers.find(header=>aliases.includes(normalizeHeader(header)));}
  async function importExcel(file) {
    if(!workbookAvailable())return;
    try{
      const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheetName=workbook.SheetNames.find(name=>['chapas','sheets','estoque'].includes(normalizeHeader(name))),partName=workbook.SheetNames.find(name=>['pecas','parts','cortes'].includes(normalizeHeader(name)))||(!sheetName?workbook.SheetNames[0]:null);
      if(!partName)throw new Error('A planilha deve conter a aba Pecas.');
      if(sheetName){const rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{defval:''});if(!rows.length)throw new Error('A aba Chapas está vazia.');const headers=Object.keys(rows[0]),id=findHeader(headers,['identificacao','id','nome','chapa']),length=findHeader(headers,['comprimentomm','comprimento','lengthmm','length']),width=findHeader(headers,['larguramm','largura','widthmm','width']),quantity=findHeader(headers,['quantidade','qtd','qtde','quantity','qty']),priority=findHeader(headers,['priorizar','prioridade','prioritario']);if(!length||!width||!quantity)throw new Error('A aba Chapas deve conter Comprimento_mm, Largura_mm e Quantidade.');ui.sheetBody.innerHTML='';rows.forEach((row,index)=>addSheetRow({name:String(id?row[id]:'').trim()||t('sheetDefault',{number:index+1}),length:row[length],width:row[width],quantity:row[quantity]||1,priority:booleanFrom(priority?row[priority]:'')}));}
      const rows=XLSX.utils.sheet_to_json(workbook.Sheets[partName],{defval:''});if(!rows.length)throw new Error('A aba Pecas está vazia.');const headers=Object.keys(rows[0]),id=findHeader(headers,['identificacao','id','codigo','peca','nome']),length=findHeader(headers,['comprimentomm','comprimento','lengthmm','length']),width=findHeader(headers,['larguramm','largura','widthmm','width']),quantity=findHeader(headers,['quantidade','qtd','qtde','quantity','qty']),observation=findHeader(headers,['observacao','obs','nota','notes']);if(!length||!width||!quantity)throw new Error('A aba Pecas deve conter Comprimento_mm, Largura_mm e Quantidade.');ui.partsBody.innerHTML='';rows.forEach((row,index)=>addPartRow({id:String(id?row[id]:'').trim()||`P${index+1}`,length:row[length],width:row[width],quantity:row[quantity]||1,observation:String(observation?row[observation]:'').trim()}));
      const settingsName=workbook.SheetNames.find(name=>['configuracoes','configuracao','settings'].includes(normalizeHeader(name)));if(settingsName){const settings=XLSX.utils.sheet_to_json(workbook.Sheets[settingsName],{header:1,defval:''});settings.slice(1).forEach(row=>{const key=normalizeHeader(row[0]),value=row[1];if(key==='nomeprojeto'&&String(value).trim())ui.projectName.value=String(value).trim();if(key==='material'&&String(value).trim())ui.material.value=String(value).trim();if(key==='espessuramaterialmm')ui.materialThickness.value=formatPlain(fromMM(numberFrom(value)));if(['larguracortemm','kerfmm','kerf'].includes(key))ui.kerf.value=formatPlain(fromMM(numberFrom(value)));if(key==='margembordasmm')ui.edgeTrim.value=formatPlain(fromMM(numberFrom(value)));if(key==='permitirrotacao90')ui.allowRotation.checked=booleanFrom(value);});}
      invalidateResult();setMessage(t('imported',{count:rows.length,file:file.name}),'success');
    }catch(error){setMessage(error.message,'error');}finally{ui.excelInput.value='';}
  }
  function exportResult(){if(!state.result||!workbookAvailable())return;const result=state.result,summary=[['BESTSECTION — PLANO DE SECCIONAMENTO'],['Projeto',result.config.projectName],['Material',result.config.material],['Espessura (mm)',result.config.thickness],['Chapas utilizadas',result.totalSheets],['Peças',result.totalPieces],['Aproveitamento (%)',Number(result.utilization.toFixed(2))],['Sobra reaproveitável (m²)',Number((result.remnantArea/1e6).toFixed(4))],['Perda de corte (m²)',Number((result.kerfLoss/1e6).toFixed(4))],['Gerado em',result.createdAt.toLocaleString(state.language)]],sheets=[['Chapa','Identificacao','Comprimento_mm','Largura_mm','Pecas','Prioritaria','Sobra_m2']],pieces=[['Chapa','Identificacao','Comprimento_mm','Largura_mm','X_mm','Y_mm','Rotacao']],cuts=[['Chapa','Ordem','Sentido','X_mm','Y_mm','Extensao_mm','Regiao_comprimento_mm','Regiao_largura_mm']],remnants=[['Chapa','X_mm','Y_mm','Comprimento_mm','Largura_mm','Area_m2']];result.sheets.forEach(sheet=>{sheets.push([sheet.index,sheet.stockType.name,sheet.length,sheet.width,sheet.placements.length,sheet.stockType.priority?'Sim':'Não',Number((sheet.free.reduce((sum,r)=>sum+r.w*r.h,0)/1e6).toFixed(4))]);sheet.placements.forEach(p=>pieces.push([sheet.index,p.id,p.length,p.width,p.x,p.y,p.rotated?90:0]));sheet.cuts.forEach(c=>cuts.push([sheet.index,c.order,c.orientation==='vertical'?'Vertical':'Horizontal',c.x,c.y,c.length,c.region.w,c.region.h]));sheet.free.forEach(r=>remnants.push([sheet.index,r.x,r.y,r.w,r.h,Number((r.w*r.h/1e6).toFixed(4))]));});const workbook=XLSX.utils.book_new();[['Resumo',summary],['Chapas',sheets],['Pecas',pieces],['Cortes',cuts],['Sobras',remnants]].forEach(([name,data])=>XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(data),name));XLSX.writeFile(workbook,`${safeFileName(result.config.projectName)}_bestsection.xlsx`);setMessage(t('exported'),'success');}

  ui.addSheetButton.addEventListener('click',()=>addSheetRow({},true));ui.addPartButton.addEventListener('click',()=>addPartRow({},true));
  [ui.projectName,ui.material,ui.materialThickness,ui.allowRotation,ui.kerf,ui.edgeTrim].forEach(input=>input.addEventListener('change',invalidateResult));
  ui.languageSelect.addEventListener('change',event=>applyLanguage(event.target.value));
  ui.languageButton.addEventListener('click',()=>setLanguageMenu(ui.languageMenu.hidden));
  ui.languageMenu.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(!button)return;applyLanguage(button.dataset.language);setLanguageMenu(false);ui.languageButton.focus();});
  ui.languagePicker.addEventListener('keydown',event=>{if(event.key==='Escape'){setLanguageMenu(false);ui.languageButton.focus();return;}if(!['ArrowDown','ArrowUp'].includes(event.key))return;event.preventDefault();const buttons=[...ui.languageMenu.querySelectorAll('[data-language]')],current=Math.max(0,buttons.indexOf(document.activeElement)),next=event.key==='ArrowDown'?(current+1)%buttons.length:(current-1+buttons.length)%buttons.length;setLanguageMenu(true);buttons[next].focus();});
  document.addEventListener('click',event=>{if(!ui.languagePicker.contains(event.target))setLanguageMenu(false);});
  ui.optimizeButton.addEventListener('click',executeOptimization);ui.templateButton.addEventListener('click',downloadTemplate);ui.saveProjectButton.addEventListener('click',saveProject);ui.excelInput.addEventListener('change',event=>event.target.files[0]&&importExcel(event.target.files[0]));ui.printButton.addEventListener('click',()=>window.print());ui.exportButton.addEventListener('click',exportResult);

  function convertDisplayedLengthInputs(prevUnit,nextUnit) {
    if (prevUnit===nextUnit) return;
    const convert=input=>{const v=numberFrom(input.value);if(Number.isFinite(v))input.value=formatPlain(convertUnit(v,prevUnit,nextUnit));};
    convert(ui.kerf);convert(ui.edgeTrim);convert(ui.materialThickness);
    ui.sheetBody.querySelectorAll('.sheet-length,.sheet-width').forEach(convert);
    ui.partsBody.querySelectorAll('.part-length,.part-width').forEach(convert);
  }
  document.addEventListener('unitchange',event=>{
    const next=event.detail.unit,prev=displayUnit; if(next===prev)return;
    displayUnit=next; convertDisplayedLengthInputs(prev,next);
    if(state.result)renderResult(state.result);
  });
  [ui.kerf,ui.edgeTrim,ui.materialThickness].forEach(input=>{input.value=formatPlain(fromMM(numberFrom(input.value)));});

  addSheetRow({name:t('sheetDefault',{number:1}),length:2750,width:1850,quantity:1});addPartRow({id:'P01',length:600,width:400,quantity:1});applyLanguage(state.language,false);
  window.BestSectionCore=Object.freeze({optimizeGuillotine,runTrial,splitGeometry,numberFrom,expandPieces,applyLanguage,convertUnit,formatLength});
})();
