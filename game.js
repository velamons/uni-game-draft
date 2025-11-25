// UniLifeMVP in JavaScript (browser version)

// --- Player / Stats ---
class Player {
  constructor() {
    this.academics = 60;   // 0–100
    this.social = 50;
    this.health = 70;
    this.stress = 40;
    this.money = 50;
    this.cheatingStrikes = 0;
  }

  applyDelta({ dAcad = 0, dSoc = 0, dHealth = 0, dStress = 0, dMoney = 0 } = {}) {
    this.academics += dAcad;
    this.social += dSoc;
    this.health += dHealth;
    this.stress += dStress;
    this.money += dMoney;
    this.clamp();
  }

  clamp() {
    this.academics = this.clamp01(this.academics);
    this.social = this.clamp01(this.social);
    this.health = this.clamp01(this.health);
    this.stress = this.clamp01(this.stress);
    this.money = this.clamp01(this.money);
  }

  clamp01(v) {
    return Math.max(0, Math.min(100, v));
  }
}

// --- Choice ---
class Choice {
  constructor(label, description, effect) {
    this.label = label;
    this.description = description;
    this.effect = effect; // function(player, logFn)
  }

  apply(player, logFn) {
    if (logFn) logFn(`You chose: ${this.label} — ${this.description}`);
    if (this.effect) this.effect(player, logFn);
  }
}

// --- UI helper (DOM-based) ---
const UI = {
  root: null,

  init(rootId = "game") {
    this.root = document.getElementById(rootId);
  },

  clear() {
    if (this.root) this.root.innerHTML = "";
  },

  banner(text) {
    return `<div class="banner">— ${text} —</div>`;
  },

  stats(player) {
    return `
      <div class="stats">
        <div>📚 Academics: <strong>${player.academics}</strong></div>
        <div>💬 Social:    <strong>${player.social}</strong></div>
        <div>💪 Health:    <strong>${player.health}</strong></div>
        <div>😩 Stress:    <strong>${player.stress}</strong></div>
        <div>💰 Money:     <strong>${player.money}</strong></div>
        <div>⚠️ Cheating Strikes: <strong>${player.cheatingStrikes}/3</strong></div>
      </div>
    `;
  },

  logList(logs) {
    if (!logs || logs.length === 0) return "";
    return `
      <div class="log">
        ${logs.map(l => `<div>${l}</div>`).join("")}
      </div>
    `;
  }
};

// --- Random Events ---
const RandomEvent = {
  doOne(player) {
    const logs = [];

    if (Math.random() > 0.5) {
      return logs; // no event
    }

    const roll = Math.floor(Math.random() * 6);
    switch (roll) {
      case 0:
        logs.push("Fire alarm at 3 a.m. — lost sleep.");
        player.applyDelta({ dHealth: -8, dStress: +5 });
        logs.push("💪 Health -8, 😩 Stress +5");
        break;
      case 1:
        logs.push("Laptop broke — emergency repair.");
        player.applyDelta({ dMoney: -15, dStress: +5 });
        logs.push("💰 Money -15, 😩 Stress +5");
        break;
      case 2:
        logs.push("Made a friend in lab!");
        player.applyDelta({ dSoc: +10, dStress: -3 });
        logs.push("💬 Social +10, 😩 Stress -3");
        break;
      case 3:
        logs.push("Caught a cold during quizzes.");
        player.applyDelta({ dHealth: -12, dAcad: -5 });
        logs.push("💪 Health -12, 📚 Academics -5");
        break;
      case 4:
        logs.push("Found a part-time gig for the week.");
        player.applyDelta({ dMoney: +12, dStress: +3 });
        logs.push("💰 Money +12, 😩 Stress +3");
        break;
      case 5:
        logs.push("Group project went sideways.");
        player.applyDelta({ dAcad: -8, dStress: +6 });
        logs.push("📚 Academics -8, 😩 Stress +6");
        break;
    }
    player.clamp();
    return logs;
  }
};

// --- ChoiceFactory (safe and risky choices) ---
const ChoiceFactory = (() => {
  // Safe choices
  const SafeChoices = [
    new Choice(
      "Go to office hours",
      "Get some clarification from the professor about the coursework.",
      (p, log) => {
        p.applyDelta({ dAcad: +10, dStress: -6 });
        log && log("📚 Academics +10, 😩 Stress -6");
      }
    ),
    new Choice(
      "Study",
      "Focus on coursework and assignments.",
      (p, log) => {
        p.applyDelta({ dAcad: +10, dStress: +6 });
        log && log("📚 Academics +10, 😩 Stress +6");
      }
    ),
    new Choice(
      "Workout",
      "Exercise to improve health and reduce stress.",
      (p, log) => {
        p.applyDelta({ dHealth: +10, dStress: -8 });
        log && log("💪 Health +10, 😩 Stress -8");
      }
    ),
    new Choice(
      "Part-time Job",
      "Work a short shift to earn money.",
      (p, log) => {
        p.applyDelta({ dMoney: +15, dStress: +5, dHealth: -5 });
        log && log("💰 Money +15, 😩 Stress +5, 💪 Health -5");
      }
    ),
    new Choice(
      "Hang out with friends",
      "Spend time socializing and relaxing.",
      (p, log) => {
        p.applyDelta({ dSoc: +12, dStress: -6, dMoney: -4 });
        log && log("💬 Social +12, 😩 Stress -6, 💰 Money -4");
      }
    ),
    new Choice(
      "Sleep early",
      "Recover energy and improve health.",
      (p, log) => {
        p.applyDelta({ dHealth: +8, dStress: -10 });
        log && log("💪 Health +8, 😩 Stress -10");
      }
    ),
    new Choice(
      "Join a club event",
      "Attend a campus event and meet people.",
      (p, log) => {
        p.applyDelta({ dSoc: +10, dStress: +4, dMoney: -5 });
        log && log("💬 Social +10, 😩 Stress +4, 💰 Money -5");
      }
    ),
    new Choice(
      "Go to a party with your friends",
      "Attend a party hosted by a friend and meet people.",
      (p, log) => {
        p.applyDelta({ dSoc: +10, dStress: +4, dMoney: -5 });
        log && log("💬 Social +10, 😩 Stress +4, 💰 Money -5");
      }
    ),
    new Choice(
      "Cook at home",
      "Save money and eat healthy.",
      (p, log) => {
        p.applyDelta({ dHealth: +5, dMoney: +5, dStress: -3 });
        log && log("💪 Health +5, 💰 Money +5, 😩 Stress -3");
      }
    )
  ];

  // Risky choices
  const Risk_CheatingOnExam = () =>
    new Choice(
      "RISK: Cheat on exam",
      "Attempt academic dishonesty during a major test.",
      (p, log) => {
        const caught = Math.random();
        if (caught < 0.8) {
          p.cheatingStrikes++;
          p.applyDelta({ dAcad: -10, dStress: +20 });
          log && log("🚨 Caught cheating! Cheating strike +1, 📚 -10, 😩 +20");
        } else {
          p.applyDelta({ dAcad: -3, dStress: +10 });
          log && log("😬 You weren’t caught, but you learned little. 📚 -3, 😩 +10");
        }
      }
    );

  const Risk_FlirtWithYourClassmate = () =>
    new Choice(
      "RISK: Flirt with your classmate",
      "Spit some fire game to the cutie in your class.",
      (p, log) => {
        const rejected = Math.random();
        if (rejected < 0.5) {
          p.applyDelta({ dSoc: -10, dStress: +20 });
          log && log("🚨 They rejected you! 💬 -10, 😩 +20");
        } else {
          // Note: preserves your original logic: acad -3, stress +10, even though message says otherwise.
          p.applyDelta({ dAcad: -3, dStress: +10 });
          log && log("😬 They flirt back! 💬 +10, 😩 -10");
        }
      }
    );

  const Risk_UnsanctionedCat = () =>
    new Choice(
      "RISK: Get an unsanctioned cat",
      "You take in a street cat, but pets aren't allowed in your residence.",
      (p, log) => {
        const flagged = Math.random();
        if (flagged < 0.5) {
          p.applyDelta({ dMoney: -10, dStress: +20 });
          log &&
            log(
              "🚨 Your RA hears meowing in your room! You have to give up the cat and pay a fine. 💰 -10, 😩 +20"
            );
        } else {
          p.applyDelta({ dHealth: -15 });
          log && log("😬 It has rabies. 💪 -15");
        }
      }
    );

  const Risk_PlagiarismWithAI = () =>
    new Choice(
      "RISK: Submit AI-written essay",
      "You felt lazy and asked ChatGPT to write your essay.",
      (p, log) => {
        const flagged = Math.random();
        if (flagged < 0.8) {
          p.cheatingStrikes++;
          p.applyDelta({ dAcad: -12, dStress: +18 });
          log &&
            log(
              "🛑 Flagged for plagiarism! Cheating strike +1, 📚 -12, 😩 +18"
            );
        } else {
          p.applyDelta({ dAcad: -5, dStress: +8 });
          log && log("🤖 You are not caught, but your prof is skeptical. 📚 -5, 😩 +8");
        }
      }
    );

  const Risk_RoommatesPartner = () =>
    new Choice(
      "RISK: Flirt with your roomate's partner",
      "Your roommate's romantic partner has been flirting with you, do you reciprocate?",
      (p, log) => {
        const flagged = Math.random();
        if (flagged < 0.8) {
          p.applyDelta({ dSoc: -12, dStress: +18, dMoney: -20 });
          log &&
            log(
              "🛑 Your roommate catches you two. They flip out and throw out all your stuff. 💬 -12, 😩 +18, 💰 -20"
            );
        } else {
          p.applyDelta({ dStress: +8 });
          log &&
            log("You are not caught, but your roommate is skeptical. 📚 -5, 😩 +8");
        }
      }
    );

  const Risk_SkipClassBinge = () =>
    new Choice(
      "RISK: Skip class and binge shows",
      "Miss content and fall behind.",
      (p, log) => {
        p.applyDelta({ dAcad: -8, dStress: +6, dHealth: -2 });
        log && log("⏭️ You missed key material. 📚 -8, 😩 +6, 💪 -2");
      }
    );

  const Risk_ShoppingSpree = () =>
    new Choice(
      "RISK: Go on a shopping spree",
      "Your bank account is low on funds, this will hurt your pockets.",
      (p, log) => {
        p.applyDelta({ dStress: +6, dMoney: -7 });
        log && log("⏭️ You maxed out your credit card! 😩 +6, 💰 -7");
      }
    );

  const Risk_DrinkTooMuch = () =>
    new Choice(
      "RISK: Drink way too much",
      "Overdo it at a party; next day is rough.",
      (p, log) => {
        const veryBad = Math.random() < 0.25;
        if (veryBad) {
          p.applyDelta({ dHealth: -15, dStress: +10, dAcad: -6, dMoney: -10 });
          log &&
            log("🍻 Rough night → rougher morning. 💪 -15, 😩 +10, 📚 -6, 💰 -10");
        } else {
          p.applyDelta({ dHealth: -8, dStress: +6, dAcad: -3, dMoney: -5 });
          log && log("🍺 Hangover fog. 💪 -8, 😩 +6, 📚 -3, 💰 -5");
        }
      }
    );

  const Risk_Doomscroll = () =>
    new Choice(
      "RISK: Sit on your phone for 5 hours",
      "You have a midterm tomorrow, you really should be studying!",
      (p, log) => {
        p.applyDelta({ dStress: +5, dAcad: -6 });
        log && log("You bombed your midterm! 😩 +5, 📚 -6");
      }
    );

  const Risk_StayUpLate = () =>
    new Choice(
      "RISK: You stay up until 3am talkin to your friend",
      "You have class at 8am, you really should be sleeping!",
      (p, log) => {
        p.applyDelta({ dStress: +5, dAcad: -6 });
        log && log("You fell asleep in class! 😩 +5, 📚 -6");
      }
    );

  const Risk_AllNightGaming = () =>
    new Choice(
      "RISK: All-night gaming",
      "Zero sleep; tank your next day.",
      (p, log) => {
        p.applyDelta({ dHealth: -10, dStress: +8, dAcad: -6 });
        log && log("🎮 Sun rises; your grades set… 💪 -10, 😩 +8, 📚 -6");
      }
    );

  const Risk_BedRot = () =>
    new Choice(
      "RISK: Skip classes and lay in bed all day",
      "Become the ultimate bedbug.",
      (p, log) => {
        p.applyDelta({ dHealth: -10, dStress: +10, dAcad: -12 });
        log && log("You failed to turn in your assignment on time. 💪 -10, 😩 +10, 📚 -12");
      }
    );

  const Risk_Haircut = () =>
    new Choice(
      "RISK: Get a haircut at the hairstyler",
      "Cheap place with multiple 1-star reviews.",
      (p, log) => {
        const flagged = Math.random();
        if (flagged < 0.8) {
          p.applyDelta({ dSoc: -12, dStress: +18, dMoney: -20 });
          log &&
            log(
              "It is the hairstyler's first day! They mess your hair up, you are now chopped. 💬 -12, 😩 +18, 💰 -20"
            );
        } else {
          p.applyDelta({ dSoc: +12, dStress: -20 });
          log &&
            log("This place is a hidden gem! You get a good haircut for cheap. 💬 +12, 😩 -20");
        }
      }
    );

  function pickContextualRisk(semester, week) {
    // Note: keeps your original exam window logic,
    // even though you only have 3 weeks per semester.
    const examWindow = (week >= 4 && week <= 7) || (week >= 10 && week <= 12);

    const bucket = [];

    if (examWindow) {
      bucket.push(Risk_CheatingOnExam);
      bucket.push(Risk_PlagiarismWithAI);
      bucket.push(Risk_AllNightGaming);
      bucket.push(Risk_StayUpLate);
      bucket.push(Risk_UnsanctionedCat);
    } else {
      bucket.push(Risk_SkipClassBinge);
      bucket.push(Risk_FlirtWithYourClassmate);
      bucket.push(Risk_DrinkTooMuch);
      bucket.push(Risk_AllNightGaming);
      bucket.push(Risk_Doomscroll);
      bucket.push(Risk_ShoppingSpree);
      bucket.push(Risk_BedRot);
      bucket.push(Risk_RoommatesPartner);
      bucket.push(Risk_Haircut);
      if (Math.random() < 0.5) bucket.push(Risk_PlagiarismWithAI);
    }

    // Harsher penalties by biasing toward cheating sometimes
    if (Math.random() < 0.5) {
      bucket.push(Risk_CheatingOnExam);
    }

    const ctor = bucket[Math.floor(Math.random() * bucket.length)];
    return ctor();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function generateWeeklyMenu(semester, week) {
    const pool = [...SafeChoices];
    shuffle(pool);
    const chosen = pool.slice(0, 3);

    const risky = pickContextualRisk(semester, week);
    chosen.push(risky);

    // Add letter labels (A, B, C, D)
    const result = [];
    let letterCode = "A".charCodeAt(0);
    for (const choice of chosen) {
      const letter = String.fromCharCode(letterCode++);
      result.push(
        new Choice(
          `${letter}) ${choice.label}`,
          choice.description,
          choice.effect
        )
      );
    }
    return result;
  }

  return {
    generateWeeklyMenu
  };
})();

// --- Core Game ---
class Game {
  constructor() {
    this.player = new Player();
    this.week = 1;
    this.semester = 1;
    this.maxSemesters = 4; // 4 semesters
  }

  reset() {
    this.player = new Player();
    this.week = 1;
    this.semester = 1;
  }

  isExpelled() {
    return this.player.cheatingStrikes >= 3;
  }

  isDropout() {
    return (
      this.player.money <= 0 ||
      this.player.health <= 0 ||
      this.player.stress >= 100
    );
  }

  hasGraduated() {
    // Matches your C#: semester > maxSemesters
    return this.semester > this.maxSemesters;
  }

  advanceTime() {
    this.week++;
    if (this.week > 3) {
      this.week = 1;
      this.semester++;
      this.semesterWrapUp();
    }
  }

  semesterWrapUp() {
    if (this.player.academics >= 75) this.player.social += 3;
    this.player.money -= 5;
    this.player.stress = Math.max(20, this.player.stress - 10);
    this.player.clamp();
    this._logPush("— End of semester — minor adjustments applied (tuition paid, stress eased).");
  }

  _logPush(line) {
    if (!this._logs) this._logs = [];
    this._logs.push(line);
  }

  runIntro() {
    UI.clear();
    const introHTML = `
      <div class="card">
        <h1>University Life!</h1>
        <p>You are a first-year student. Survive 8 semesters, avoid expulsion, and manage your well-being.</p>
        ${UI.stats(this.player)}
        <button id="startBtn">Press to begin your first week</button>
      </div>
    `;
    UI.root.innerHTML = introHTML;
    document.getElementById("startBtn").onclick = () => {
      this.loop();
    };
  }

  loop() {
    // Check endings
    if (this.isExpelled()) {
      this.renderEnd("Expelled", "Academic dishonesty reached the limit.");
      return;
    }
    if (this.isDropout()) {
      this.renderEnd("Dropped Out", "Stress/Money/Health collapsed.");
      return;
    }
    if (this.hasGraduated()) {
      this.renderEnd("Graduated", "You completed all semesters.");
      return;
    }

    // Normal turn
    this.renderTurn();
  }

  renderTurn() {
    this._logs = [];

    const eventLogs = RandomEvent.doOne(this.player);
    if (eventLogs && eventLogs.length) {
      this._logs.push(...eventLogs);
    }

    const choices = ChoiceFactory.generateWeeklyMenu(this.semester, this.week);

    UI.clear();
    const header = `<h2>Semester ${this.semester}, Week ${this.week}</h2>`;
    const statsHTML = UI.stats(this.player);
    const logHTML = UI.logList(this._logs);

    const choicesHTML = `
      <div class="card">
        <h3>Choose an action:</h3>
        <div id="choiceButtons"></div>
      </div>
    `;

    UI.root.innerHTML = header + statsHTML + logHTML + choicesHTML;

    const choiceButtonsDiv = document.getElementById("choiceButtons");
    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = `${choice.label} — ${choice.description}`;
      btn.onclick = () => {
        const turnLogs = [];
        const logFn = (line) => turnLogs.push(line);
        choice.apply(this.player, logFn);

        // Show result briefly, then go to next week
        UI.clear();
        UI.root.innerHTML = `
          <div class="card">
            <h2>Semester ${this.semester}, Week ${this.week}</h2>
            ${UI.stats(this.player)}
            ${UI.logList([...this._logs, ...turnLogs])}
            <button id="nextBtn">Continue</button>
          </div>
        `;
        document.getElementById("nextBtn").onclick = () => {
          this.advanceTime();
          this.loop();
        };
      };
      choiceButtonsDiv.appendChild(btn);
    });
  }

  renderEnd(ending, reason) {
    UI.clear();
    UI.root.innerHTML = `
      <div class="card">
        <h2>🏁 Ending: ${ending}</h2>
        <p>${reason}</p>
        ${UI.stats(this.player)}
        <button id="restartBtn">Play again</button>
      </div>
    `;
    document.getElementById("restartBtn").onclick = () => {
      this.reset();
      this.runIntro();
    };
  }
}

// --- Bootstrapping ---
window.addEventListener("DOMContentLoaded", () => {
  UI.init("game");
  const game = new Game();
  game.runIntro();
});

