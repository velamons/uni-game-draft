// game.js
class Player {
  constructor() {
    this.acad = 60; this.social = 50; this.health = 70; this.stress = 40; this.money = 50;
    this.cheat = 0;
  }
  clamp(v){ return Math.max(0, Math.min(100, v)); }
  apply({a=0,soc=0,h=0,str=0,m=0}) {
    this.acad=this.clamp(this.acad+a); this.social=this.clamp(this.social+soc);
    this.health=this.clamp(this.health+h); this.stress=this.clamp(this.stress+str);
    this.money=this.clamp(this.money+m);
  }
}

class Choice {
  constructor(label, desc, effect){ this.label=label; this.desc=desc; this.effect=effect; }
  apply(p){ this.effect(p); }
}

const rng = () => Math.random();
const RandomEvent = (p) => {
  if (rng() > 0.5) return "No notable event.";
  const roll = Math.floor(rng()*6);
  switch (roll){
    case 0: p.apply({h:-8, str:+5}); return "Fire alarm at 3 a.m.";
    case 1: p.apply({m:-15, str:+5}); return "Laptop repair.";
    case 2: p.apply({soc:+10, str:-3}); return "Made a friend in lab!";
    case 3: p.apply({h:-12, a:-5}); return "Caught a cold.";
    case 4: p.apply({m:+12, str:+3}); return "One-off gig.";
    case 5: p.apply({a:-8, str:+6}); return "Group project meltdown.";
  }
}

function safeChoices(){
  return [
    new Choice("Study", "Focus on coursework.", p=>p.apply({a:+10, str:+6})),
    new Choice("Workout", "Exercise & recover.", p=>p.apply({h:+10, str:-8, a:-3})),
    new Choice("Part-time Job", "Earn money.", p=>p.apply({m:+15, str:+5, h:-5})),
    new Choice("Hang out", "Social + decompress.", p=>p.apply({soc:+12, str:-6, m:-8})),
    new Choice("Sleep early", "Recover.", p=>p.apply({h:+8, str:-10})),
    new Choice("Club event", "Meet people.", p=>p.apply({soc:+10, str:+4, m:-5})),
    new Choice("Cook at home", "Save & eat well.", p=>p.apply({h:+5, m:+5, str:-3}))
  ];
}

function riskyChoice(semester, week){
  const examWindow = (week>=5&&week<=7)||(week>=11&&week<=12);
  if (examWindow){
    const r = [ "Cheat on exam", "AI essay", "All-night gaming" ][Math.floor(rng()*3)];
    if (r==="Cheat on exam") return new Choice("RISK: Cheat on exam","Dishonesty in test.", p=>{
      if (rng()<0.35){ p.cheat++; p.apply({a:-10, str:+20}); }
      else { p.apply({a:-3, str:+10}); }
    });
    if (r==="AI essay") return new Choice("RISK: Submit AI essay","Likely flagged.", p=>{
      if (rng()<0.5){ p.cheat++; p.apply({a:-12, str:+18}); }
      else { p.apply({a:-5, str:+8}); }
    });
    return new Choice("RISK: All-night gaming","Zero sleep.", p=>p.apply({h:-10, str:+8, a:-6}));
  } else {
    const r = [ "Skip classes", "Drink too much", "All-night gaming" ][Math.floor(rng()*3)];
    if (r==="Skip classes") return new Choice("RISK: Skip classes","Fall behind.", p=>p.apply({a:-8, str:+6, h:-2}));
    if (r==="Drink too much") return new Choice("RISK: Drink too much","Hangover.", p=>{
      if (rng()<0.25) p.apply({h:-15, str:+10, a:-6, m:-10});
      else p.apply({h:-8, str:+6, a:-3, m:-5});
    });
    return new Choice("RISK: All-night gaming","Zero sleep.", p=>p.apply({h:-10, str:+8, a:-6}));
  }
}

class Game {
  constructor(){
    this.p = new Player(); this.week=1; this.sem=1; this.maxSem=8;
    this.root = document.getElementById('game');
    this.renderIntro();
  }
  ended(){
    if (this.p.cheat>=3) return ["Expelled","Academic dishonesty."];
    if (this.p.money<=0 || this.p.health<=0 || this.p.stress>=100) return ["Dropped Out","Well-being/finances collapsed."];
    if (this.sem>this.maxSem && this.p.acad>=70) return ["Graduated","You completed the program."];
    return null;
  }
  nextWeek(){
    // random event
    const event = RandomEvent(this.p) || "—";
    // choices: 3 safe + 1 risky
    const safe = safeChoices().sort(()=>0.5-rng()).slice(0,3);
    const risky = riskyChoice(this.sem, this.week);
    this.renderTurn(event, [...safe, risky]);
  }
  advanceTime(){
    this.week++;
    if (this.week>12){ this.week=1; this.sem++; /* end-sem adjustments */ 
      if (this.p.acad>=75) this.p.social = this.p.clamp(this.p.social+3);
      this.p.money = this.p.clamp(this.p.money-5);
      this.p.stress = Math.max(20, this.p.stress-10);
    }
  }
  renderIntro(){
    this.root.innerHTML = `
      <div class="card">
        <p>You’re a first-year student. Survive 8 semesters, avoid expulsion, and keep your well-being in check.</p>
        ${this.statsHTML()}
        <button id="start">Begin</button>
      </div>`;
    document.getElementById('start').onclick = ()=>{ this.clear(); this.loop(); };
  }
  loop(){
    const end = this.ended();
    if (end){ this.renderEnd(end[0], end[1]); return; }
    this.root.innerHTML = `<h2>Semester ${this.sem}, Week ${this.week}</h2>`;
    this.nextWeek();
  }
  renderTurn(eventText, choices){
    const ctn = document.createElement('div');
    ctn.className="card";
    ctn.innerHTML = `
      <div><strong>Random event:</strong> ${eventText}</div>
      <div class="stats" style="margin-top:8px">${this.statsHTML()}</div>
      <h3 style="margin-top:12px">Choose:</h3>
      <div id="choices"></div>
    `;
    this.root.appendChild(ctn);
    const list = document.getElementById('choices');
    choices.forEach(ch=>{
      const b=document.createElement('button');
      b.textContent = ch.label + " — " + ch.description;
      b.onclick = ()=>{
        ch.apply(this.p);
        // show quick result, then clear screen like Console.Clear()
        this.flash("Applied: " + ch.label, 600).then(()=>{
          this.clear(); this.advanceTime(); this.loop();
        });
      };
      list.appendChild(b);
    });
  }
  statsHTML(){
    const p=this.p;
    return `
      <div>📚 Academics: <strong>${p.acad}</strong></div>
      <div>💬 Social: <strong>${p.social}</strong></div>
      <div>💪 Health: <strong>${p.health}</strong></div>
      <div>😩 Stress: <strong>${p.stress}</strong></div>
      <div>💰 Money: <strong>${p.money}</strong></div>
      <div>⚠️ Strikes: <strong>${p.cheat}/3</strong></div>`;
  }
  flash(text, ms){
    const n=document.createElement('div'); n.className='card'; n.textContent=text;
    this.root.appendChild(n);
    return new Promise(res=>setTimeout(()=>{ n.remove(); res(); }, ms));
  }
  clear(){ this.root.innerHTML=""; }
  renderEnd(title, reason){
    this.root.innerHTML = `
      <div class="card">
        <h2>🏁 Ending: ${title}</h2>
        <p>${reason}</p>
        <div class="stats">${this.statsHTML()}</div>
        <button id="restart">Play again</button>
      </div>`;
    document.getElementById('restart').onclick = ()=>{ this.p=new Player(); this.week=1; this.sem=1; this.clear(); this.loop(); };
  }
}
new Game();
