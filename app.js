import { auth, db } from "./firebase.js";
const TZ="Asia/Kolkata",target=new Date(PROGRESS_DATA.testDate);
function parts(){return Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hour12:false}).formatToParts(new Date()).map(x=>[x.type,x.value]))}
function dayKey(){let p=parts(),d=new Date(`${p.year}-${p.month}-${p.day}T00:00:00+05:30`);if(+p.hour<4)d.setDate(d.getDate()-1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function label(k){return new Intl.DateTimeFormat("en-IN",{timeZone:TZ,day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${k}T12:00:00+05:30`))}
const key=dayKey(),base=PROGRESS_DATA.history[key]||{lectures:[false,false,false],questions:false,revision:false,coaching:false};
let d=JSON.parse(localStorage.getItem("serup-"+key)||"null")||structuredClone(base);
function save(){localStorage.setItem("serup-"+key,JSON.stringify(d));render()}
function render(){date.textContent=label(key);today.textContent=label(key);let start=new Date("2026-08-18T04:00:00+05:30"),cur=new Date(`${key}T04:00:00+05:30`);day.textContent="DAY "+(Math.max(1,Math.floor((cur-start)/864e5)+1));lectures.innerHTML="";d.lectures.forEach((v,i)=>{let l=document.createElement("label");l.innerHTML=`<input type="checkbox" ${v?"checked":""}> Lecture ${i+1}`;l.firstChild.onchange=e=>{d.lectures[i]=e.target.checked;save()};lectures.append(l)});ls.textContent=d.lectures.filter(Boolean).length+"/3";q.checked=d.questions;r.checked=d.revision;c.checked=d.coaching}
[q,r,c].forEach((x,i)=>x.onchange=()=>{d[["questions","revision","coaching"][i]]=x.checked;save()});
function bars(){let total=0,done=0;for(const [n,x] of Object.entries(PROGRESS_DATA.backlog)){let id=n==="maths"?"m":n;let d=document.getElementById(id+"d");let b=document.getElementById(id+"b");if(d)d.textContent=x.done;if(b)b.style.width=(x.done/x.total*100)+"%";total+=x.total;done+=x.done}if(typeof left!=="undefined"&&left)left.textContent=total-done;let pct=Math.round(done/total*65+((d.lectures.filter(Boolean).length+(d.questions?1:0)+(d.revision?1:0)+(d.coaching?1:0))/6)*35);if(typeof overall!=="undefined"&&overall)overall.textContent=pct+"%";if(typeof overallBar!=="undefined"&&overallBar)overallBar.style.width=pct+"%"}
function clock(){let z=target-new Date();if(z<=0)return countdown.textContent="BATTLE DAY";let a=Math.floor(z/864e5),h=Math.floor(z%864e5/36e5),m=Math.floor(z%36e5/6e4),s=Math.floor(z%6e4/1e3);countdown.textContent=`${a}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`}
render();bars();clock();setInterval(clock,1000);setInterval(()=>location.reload(),60000);
document.getElementById("friendName").textContent=PROGRESS_DATA.bestFriend.name;
document.getElementById("friendRole").textContent=PROGRESS_DATA.bestFriend.role;
document.getElementById("friendMessage").textContent=PROGRESS_DATA.bestFriend.message;
