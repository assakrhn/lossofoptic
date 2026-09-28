const state={
 level:1, matchAttempt:1, matchSolved:false, selectedLeft:null, selectedRight:null,
 results:{matchAttempts:0,cableLoss:0,connectorCount:22,connectorLoss:5.5,splitterLoss:0,rx:0,score:0},
 attenSet:[], attenIndex:0, decimalDone:false, splitterQuestion:null
};

const $=id=>document.getElementById(id);
const attenQuestions=[
 ["Jakarta → Bandung", 150],["Bandung → Cirebon", 120],["Cirebon → Tegal", 140],
 ["Semarang → Solo", 110],["Solo → Yogyakarta", 70],["Yogyakarta → Magelang", 80],
 ["Surabaya → Malang", 90],["Malang → Kediri", 100],["Jakarta → Cirebon", 220],["Surabaya → Jember", 200]
];
const decimalQuestions=[
 ["Jakarta → Bogor",127.5],["Bandung → Sumedang",82.5],["Semarang → Demak",62.5]
];
const splitterQuestions=[
 {olt:7, ratio:"1:8", loss:10.5},
 {olt:7, ratio:"1:4", loss:7.2},
 {olt:7, ratio:"1:8", loss:10.5}
];

function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function updateProgress(){
 const done=state.level-1;
 $("progressText").textContent=`${done} / 5`;
 $("progressBar").style.width=`${done/5*100}%`;
 document.querySelectorAll("#levelNav button").forEach((b,i)=>{
   b.classList.toggle("active",i+1===state.level);
   b.classList.toggle("done",i+1<state.level);
   b.disabled=i+1>state.level;
 });
}
function showLevel(n){
 state.level=n;
 document.querySelectorAll(".level").forEach(x=>x.classList.add("hidden"));
 if(n<=5)$("level"+n).classList.remove("hidden");
 updateProgress();
}
function makeMatch(){
 const pairs=[
  {id:"cable1",img:"assets/cable.svg",label:"Atenuasi kabel",value:"0,35 dB/km",group:"cable"},
  {id:"cable2",img:"assets/fiberbox.svg",label:"Atenuasi kabel",value:"0,35 dB/km",group:"cable"},
  {id:"splice1",img:"assets/splice.svg",label:"Splice",value:"0,1 dB",group:"splice"},
  {id:"connector1",img:"assets/connector.svg",label:"Konektor",value:"0,25 dB",group:"connector"},
  {id:"connector2",img:"assets/connector.svg",label:"Konektor",value:"0,25 dB",group:"connector"},
  {id:"splitter8",img:"assets/splitter1to8.svg",label:"Splitter 1:8",value:"1:8",group:"splitter8"},
  {id:"splitter4",img:"assets/splitter1to4.svg",label:"Splitter 1:4",value:"1:4",group:"splitter4"},
  {id:"olt",img:"assets/olt.svg",label:"Output OLT",value:"+7 dB",group:"olt"}
 ];
 const left=shuffle(pairs);
 const right=shuffle(pairs.map(p=>({id:p.id,value:p.value})));
 $("matchingBoard").innerHTML=`
 <div class="match-col" id="leftCards">${left.map(p=>`<div class="match-card left" data-id="${p.id}"><img src="${p.img}" alt=""><span>${p.label}</span></div>`).join("")}</div>
 <div class="match-col" id="rightCards">${right.map(p=>`<div class="match-card right" data-id="${p.id}"><span class="value-card">${p.value}</span></div>`).join("")}</div>`;
 document.querySelectorAll(".left").forEach(c=>c.onclick=()=>selectSide(c,"left"));
 document.querySelectorAll(".right").forEach(c=>c.onclick=()=>selectSide(c,"right"));
}
function selectSide(card,side){
 document.querySelectorAll("."+side).forEach(c=>c.classList.remove("selected"));
 card.classList.add("selected");
 if(side==="left")state.selectedLeft=card;else state.selectedRight=card;
 if(state.selectedLeft&&state.selectedRight){
   state.selectedLeft.dataset.match=state.selectedRight.dataset.id;
 }
}
$("checkMatch").onclick=()=>{
 const left=[...document.querySelectorAll(".left")];
 let all=true;
 left.forEach(c=>{
   const rightId=c.dataset.match;
   const ok=rightId&&rightId===c.dataset.id;
   c.classList.toggle("correct",ok); c.classList.toggle("wrong",!ok);
   if(!ok)all=false;
 });
 state.matchAttempt++;
 if(all){
   state.matchSolved=true; state.results.matchAttempts=state.matchAttempt-1;
   $("matchFeedback").textContent=`Semua pasangan benar dalam ${state.results.matchAttempts} percobaan.`;
   $("matchFeedback").className="feedback good";
   $("checkMatch").disabled=true;
   setTimeout(()=>{showLevel(2);startAttenuation()},700);
 }else{
   $("matchFeedback").textContent="Belum semua benar. Perbaiki pasangan yang salah dan coba lagi.";
   $("matchFeedback").className="feedback bad";
   $("matchAttempt").textContent=state.matchAttempt;
   state.selectedLeft=null;state.selectedRight=null;
   left.forEach(c=>delete c.dataset.match);
   document.querySelectorAll(".right").forEach(c=>c.classList.remove("selected"));
 }
};
function startAttenuation(){
 state.attenSet=shuffle(attenQuestions).slice(0,3).map(x=>({name:x[0],km:x[1],decimal:false}));
 state.attenSet.push({...shuffle(decimalQuestions)[0]&&{name:shuffle(decimalQuestions)[0][0],km:shuffle(decimalQuestions)[0][1]},decimal:true});
 // fix random decimal selection cleanly
 const d=shuffle(decimalQuestions)[0]; state.attenSet[3]={name:d[0],km:d[1],decimal:true};
 state.attenIndex=0; renderAttenuation();
}
function renderAttenuation(){
 const q=state.attenSet[state.attenIndex];
 $("attenProgress").textContent=`Soal ${state.attenIndex+1} dari 4`;
 $("attenQuestion").innerHTML=`<div class="question-box">
 <b>${q.decimal?"Soal Desimal":"Soal Jarak Genap"}</b>
 <h3>${q.name}</h3>
 <p>Jarak = <strong>${q.km} km</strong></p>
 <p>Koefisien atenuasi = <strong>0,35 dB/km</strong></p>
 <div class="formula">Loss = 0,35 × ${q.km} = ? dB</div>
 <div class="answer-row"><input id="attenAnswer" type="number" step="0.001" placeholder="Masukkan loss"><button class="primary" id="checkAtten">Periksa</button></div></div>`;
 $("attenFeedback").textContent="";
 $("checkAtten").onclick=()=>{
   const val=parseFloat($("attenAnswer").value);
   const correct=+(q.km*0.35).toFixed(3);
   if(Math.abs(val-correct)<0.001){
     $("attenFeedback").textContent="Benar. Lanjut ke soal berikutnya.";
     $("attenFeedback").className="feedback good";
     state.results.cableLoss += correct;
     state.attenIndex++;
     setTimeout(()=>{
       if(state.attenIndex<4) renderAttenuation(); else {state.results.cableLoss=+(state.results.cableLoss.toFixed(3));showLevel(3)}
     },500);
   }else{
     $("attenFeedback").textContent="Belum tepat. Periksa kembali satuan km dan hasil perkalian.";
     $("attenFeedback").className="feedback bad";
   }
 };
}
$("checkConnector").onclick=()=>{
 const val=parseInt($("connectorAnswer").value);
 if(val===22){
   state.results.connectorCount=22;state.results.connectorLoss=+(22*0.25).toFixed(2);
   $("connectorFeedback").textContent="Benar. 22 × 0,25 dB = 5,50 dB.";
   $("connectorFeedback").className="feedback good";
   setTimeout(()=>{showLevel(4);startSplitter()},600);
 }else{
   $("connectorFeedback").textContent="Belum tepat. Hitung semua konektor biru pada kedua box.";
   $("connectorFeedback").className="feedback bad";
 }
};
function startSplitter(){
 state.splitterQuestion=shuffle(splitterQuestions)[0];
 const q=state.splitterQuestion;
 $("splitterQuestion").innerHTML=`<div class="question-box">
 <img src="assets/olt.svg" style="width:220px;max-width:100%">
 <h3>Output OLT = ${q.olt} dBm</h3>
 <p>Splitter = <strong>${q.ratio}</strong></p>
 <p>Loss splitter = <strong>${q.loss} dB</strong></p>
 <div class="formula">Daya setelah splitter = ${q.olt} − ${q.loss} = ? dBm</div>
 <div class="answer-row"><input id="splitAnswer" type="number" step="0.01" placeholder="Masukkan dBm"><button class="primary" id="checkSplit">Periksa</button></div>
 </div>`;
 $("splitterFeedback").textContent="";
 $("checkSplit").onclick=()=>{
   const val=parseFloat($("splitAnswer").value);
   const correct=+(q.olt-q.loss).toFixed(2);
   if(Math.abs(val-correct)<0.01){
     state.results.splitterLoss=q.loss;
     $("splitterFeedback").textContent="Benar. Lanjut ke Final Challenge.";
     $("splitterFeedback").className="feedback good";
     setTimeout(()=>{showLevel(5);startFinal()},600);
   }else{
     $("splitterFeedback").textContent="Belum tepat. Kurangi loss splitter dari output OLT.";
     $("splitterFeedback").className="feedback bad";
   }
 };
}
function startFinal(){
 const tx=7, cable=state.results.cableLoss, conn=state.results.connectorLoss, split=state.results.splitterLoss;
 const rx=+(tx-cable-conn-split).toFixed(3);state.results.rx=rx;
 $("finalData").innerHTML=[
  ["Output OLT",tx+" dBm"],["Cable Loss",cable+" dB"],["Connector Loss",conn+" dB"],["Splitter Loss",split+" dB"]
 ].map(x=>`<div class="data-pill"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");
 $("finalQuestion").innerHTML=`<div class="question-box"><h3>Berapa daya yang diterima (Rx)?</h3><div class="formula">Rx = Tx − Cable − Connector − Splitter</div>
 <div class="answer-row"><input id="finalAnswer" type="number" step="0.001" placeholder="Masukkan Rx dBm"><button class="primary" id="checkFinal">Selesaikan</button></div></div>`;
 $("finalFeedback").textContent="";
 $("checkFinal").onclick=()=>{
   const val=parseFloat($("finalAnswer").value);
   if(Math.abs(val-rx)<0.001){
     $("finalFeedback").textContent=`Benar. Rx = ${rx} dBm.`;
     $("finalFeedback").className="feedback good";
     finish();
   }else{
     $("finalFeedback").textContent="Belum tepat. Kurangkan semua loss dari output OLT.";
     $("finalFeedback").className="feedback bad";
   }
 };
}
function finish(){
 const name=$("studentName").value.trim()||"Belum diisi";
 // Score: base 100, deductions for extra matching attempts and incomplete/incorrect attempts are intentionally modest.
 const extra=Math.max(0,state.results.matchAttempts-1)*5;
 state.results.score=Math.max(60,100-extra);
 $("finalScore").textContent=state.results.score;
 $("resultGrid").innerHTML=[
  ["Nama",name],["Level 1",""+state.results.matchAttempts+" percobaan"],["Level 2","4 soal selesai"],
  ["Level 3",state.results.connectorCount+" konektor / "+state.results.connectorLoss+" dB"],
  ["Level 4",state.splitterQuestion.ratio+" / "+state.results.splitterLoss+" dB"],
  ["Final Rx",state.results.rx+" dBm"]
 ].map(x=>`<div class="result-item"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");
 $("result").classList.remove("hidden");
 document.querySelectorAll(".level").forEach(x=>x.classList.add("hidden"));
 $("levelNav").classList.add("hidden");
 $("progressText").textContent="5 / 5";$("progressBar").style.width="100%";
}
$("restart").onclick=()=>location.reload();
makeMatch();updateProgress();
