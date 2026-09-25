const categories=[
  ['60','Won-lost-tied percentage'],['56','Scoring offense'],['58','Goals-against average'],['1263','Goal differential'],['59','Shutout percentage'],['424','Save percentage'],['94','Assists per game'],['1176','Corner kicks per game'],['547','Fouls per game'],['1208','Penalty kicks'],['95','Points per game'],['551','Red cards'],['93','Saves per game'],['1203','Shot accuracy'],['984','Shots per game'],['986','Shots on goal per game'],['910','Total assists'],['914','Total goals'],['915','Total points'],['549','Yellow cards']
];
const head=document.getElementById('head'),body=document.getElementById('body'),statusLine=document.getElementById('status');
let data,sortIndex=0,ascending=true;
const number=value=>{if(String(value).trim()==='—'||String(value).trim()==='-')return null;const parsed=Number(String(value).replace(/,/g,''));return Number.isFinite(parsed)?parsed:null};
const isUna=value=>/^North (?:Alabama|Ala\.)$/i.test(value);
function render(){
  [...head.children].forEach((th,index)=>th.textContent=th.dataset.label+(index===sortIndex?(ascending?' ▲':' ▼'):' ↕'));
  const rows=[...data.rows].sort((a,b)=>{const left=number(a[sortIndex]),right=number(b[sortIndex]);let comparison;if(left===null&&right!==null)comparison=1;else if(left!==null&&right===null)comparison=-1;else comparison=left!==null?left-right:String(a[sortIndex]).localeCompare(String(b[sortIndex]),undefined,{numeric:true});return ascending?comparison:-comparison});
  body.replaceChildren(...rows.map(row=>{const tr=document.createElement('tr');if(row.some(isUna))tr.className='mine';row.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});return tr}));
}
function build(results){
  const records=results[0],recordRows=new Map(records.rows.map(row=>[row[1],row]));
  const metricMaps=results.slice(1).map(result=>new Map(result.rows.map(row=>[row[1],row.at(-1)])));
  data={headers:[...records.headers,...categories.slice(1).map(([,name])=>name)],rows:[...recordRows.values()].map(row=>[...row,...metricMaps.map(map=>map.get(row[1])??'—')])};
  data.headers.forEach((label,index)=>{const th=document.createElement('th');th.dataset.label=label;th.tabIndex=0;th.setAttribute('role','button');th.setAttribute('aria-label','Sort by '+label);th.onclick=()=>{if(sortIndex===index)ascending=!ascending;else{sortIndex=index;ascending=index===0||/team/i.test(label)}render()};th.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();th.click()}};head.append(th)});
  render();
}
async function fetchCategory(category,attempt=0){
  const response=await fetch('/api/ncaa-wsoc?category='+category);
  const result=await response.json();
  if(!response.ok&&attempt<2)return fetchCategory(category,attempt+1);
  if(!response.ok)throw Error(result.error||'Statistics unavailable.');
  return result;
}
async function load(){
  try{
    const settled=await Promise.allSettled(categories.map(([category])=>fetchCategory(category)));
    if(settled[0].status!=='fulfilled')throw settled[0].reason;
    const missing=settled.flatMap((result,index)=>result.status==='rejected'?[categories[index][1]]:[]);
    const results=settled.map((result,index)=>result.status==='fulfilled'?result.value:{category:categories[index][0],name:categories[index][1],rows:[]});
    build(results);statusLine.textContent=data.rows.length+' teams · '+categories.length+' NCAA statistic columns · Updated '+new Date(results[0].checkedAt).toLocaleString()+(missing.length?' · Temporarily unavailable: '+missing.join(', '):'');
  }catch(error){statusLine.className='error';statusLine.textContent=error.message}
}
load();
