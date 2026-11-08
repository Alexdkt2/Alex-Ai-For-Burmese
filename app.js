const $ = (s) => document.querySelector(s);
const panels = ["cv","voice","jobs"];
function openPanel(name){
  panels.forEach(p => $("#panel-"+p).hidden = p !== name);
  $("#workspace-title").textContent = ({cv:"Create your CV",voice:"Live voice translator",jobs:"Thailand job finder"})[name];
  $("#workspace").scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openPanel(b.dataset.open)));
$("#close-workspace").addEventListener("click",()=>{panels.forEach(p=>$("#panel-"+p).hidden=true);$("#workspace-title").textContent="Choose a tool to get started";});

const cvForm=$("#cv-form");
function updateCV(){
  const d=Object.fromEntries(new FormData(cvForm).entries());
  const safe=(v)=>String(v||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const p=(v,empty)=>`<p>${safe(v).replace(/\n/g,"<br>")||empty}</p>`;
  $("#cv-preview").innerHTML=`<h1>${safe(d.name)||"Your Name"}</h1><h3>${safe(d.headline)||"Professional title"}</h3><p class="cv-contact">${[d.phone,d.email,d.location].filter(Boolean).map(safe).join(" · ")}</p><hr><h4>PROFILE</h4>${p(d.summary,"Add a short professional summary.")}<h4>WORK EXPERIENCE</h4>${p(d.experience,"Add your work history and achievements.")}<h4>SKILLS</h4>${p(d.skills,"Add relevant skills.")}<h4>EDUCATION</h4>${p(d.education,"Add your education.")}<h4>LANGUAGES</h4>${p(d.languages,"Add languages and proficiency.")}`;
}
cvForm.addEventListener("submit",e=>{e.preventDefault();updateCV();});
$("#print-cv").addEventListener("click",()=>{updateCV();window.print();});
updateCV();

const speechInput=$("#speech-input"), output=$("#translation-output"), status=$("#speech-status");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null;
if(SpeechRecognition){
  recognition=new SpeechRecognition(); recognition.continuous=true; recognition.interimResults=true;
  recognition.onstart=()=>{status.textContent="Listening… speak now.";$("#start-listening").disabled=true;$("#stop-listening").disabled=false;};
  recognition.onend=()=>{$("#start-listening").disabled=false;$("#stop-listening").disabled=true;status.textContent="Listening stopped.";};
  recognition.onerror=e=>{status.textContent="Speech recognition error: "+e.error;};
  recognition.onresult=e=>{let text="";for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript+(e.results[i].isFinal?" ":"");speechInput.value=text;};
}else{status.textContent="Speech recognition is not supported in this browser. Type text below instead.";}
$("#start-listening").addEventListener("click",()=>{if(!recognition){status.textContent="Try Chrome on a supported device, or type your text.";return;}recognition.lang=$("#source-lang").value;try{recognition.start();}catch(e){status.textContent="Microphone is already starting. Please wait."; }});
$("#stop-listening").addEventListener("click",()=>recognition&&recognition.stop());
$("#swap-languages").addEventListener("click",()=>{const src=$("#source-lang"),dst=$("#target-lang");const sourceToTarget={"my-MM":"my","en-US":"en","th-TH":"th","ru-RU":"ru","zh-CN":"zh","hi-IN":"hi","ne-NP":"ne","ja-JP":"ja","ko-KR":"ko","fr-FR":"fr","de-DE":"de","es-ES":"es"};const oldSrc=src.value,oldDst=dst.value;const reverse=Object.keys(sourceToTarget).find(k=>sourceToTarget[k]===oldDst);if(reverse)src.value=reverse;dst.value=sourceToTarget[oldSrc]||"en";});
$("#translate-text").addEventListener("click",async()=>{
  const q=speechInput.value.trim();if(!q){status.textContent="Speak or enter text first.";return;}
  const from=$("#source-lang").value.split("-")[0],to=$("#target-lang").value;
  output.value="Translating…";$("#translate-text").disabled=true;
  try{
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
    const res=await fetch(url);if(!res.ok)throw new Error("Translation service returned "+res.status);
    const data=await res.json();if(data.responseStatus!==200)throw new Error(data.responseDetails||"Translation unavailable");
    output.value=data.responseData?.translatedText||"No translation returned.";
  }catch(err){output.value="";status.textContent="Could not translate: "+err.message+" You can try again later.";}
  finally{$("#translate-text").disabled=false;}
});
$("#speak-result").addEventListener("click",()=>{if(!output.value.trim())return;const utterance=new SpeechSynthesisUtterance(output.value);const map={my:"my-MM",en:"en-US",th:"th-TH",ru:"ru-RU",zh:"zh-CN",hi:"hi-IN",ne:"ne-NP",ja:"ja-JP",ko:"ko-KR",fr:"fr-FR",de:"de-DE",es:"es-ES"};utterance.lang=map[$("#target-lang").value]||"en-US";speechSynthesis.speak(utterance);});
$("#copy-result").addEventListener("click",async()=>{if(!output.value)return;try{await navigator.clipboard.writeText(output.value);status.textContent="Translation copied."; }catch(e){status.textContent="Copy is not available in this browser.";}});

function googleSearchUrl(q){return "https://www.google.com/search?q="+encodeURIComponent(q);}
function launchJobSearch(){
  const keyword=$("#job-keyword").value.trim()||"jobs";
  const province=$("#job-province").value;
  const lang=$("#job-language").value;
  const thaiTerms={"hotel bell boy":"พนักงานยกกระเป๋า โรงแรม","hotel technician":"ช่างเทคนิค โรงแรม","plumber":"ช่างประปา","housekeeping":"แม่บ้าน โรงแรม","customer service":"บริการลูกค้า"};
  const thai=thaiTerms[keyword.toLowerCase()]||keyword;
  const queries=[];
  if(lang!=="th")queries.push(`"${keyword}" jobs ${province==="Thailand"?"Thailand":province}`);
  if(lang!=="en")queries.push(`${thai} งาน ${province==="Thailand"?"ทั่วประเทศไทย":province}`);
  const sites=["jobthai.com","th.jobsdb.com","th.indeed.com","jobtopgun.com"];
  const searches=[];
  queries.forEach(q=>sites.forEach(site=>searches.push(googleSearchUrl(`site:${site} ${q}`))));
  searches.push(googleSearchUrl(`${keyword} jobs ${province==="Thailand"?"Thailand":province}`));
  searches.slice(0,6).forEach(url=>window.open(url,"_blank","noopener"));
}
$("#search-jobs").addEventListener("click",launchJobSearch);
document.querySelectorAll("[data-keyword]").forEach(b=>b.addEventListener("click",()=>{$("#job-keyword").value=b.dataset.keyword;launchJobSearch();}));
