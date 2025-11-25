using System;
using System.Collections.Generic;

namespace UniLifeMVP
{
    class Program
    {
        static void Main()
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Game game = new Game();
            game.Run();
        }
    }

    // --- Core Game ---
    class Game
    {
        private Player player;
        private int week = 1;
        private int semester = 1;
        private readonly int maxSemesters = 4; // 4 semesters
        private readonly Random rng = new Random();

        public void Run()
        {
            InitPlayer();
            PrintIntro();

            while (true)
            {
                // END CHECKS at the start of the loop
                if (IsExpelled()) { End("Expelled", "Academic dishonesty reached the limit."); break; }
                if (IsDropout()) { End("Dropped Out", "Stress/Money/Health collapsed."); break; }
                if (HasGraduated()) { End("Graduated", "You completed all semesters with adequate Academics."); break; }

                // Turn
                Console.WriteLine($"\n===== Semester {semester}, Week {week} =====");
                RandomEvent.DoOne(player, rng);
                ShowStats();

                // Menu of choices for the turn
                var choices = ChoiceFactory.GenerateWeeklyMenu(semester, week);
                char sel = UI.PromptChoice(choices);

                // Apply choice effects
                choices[sel].Apply(player);

                // Pause briefly so player can see results
                UI.Pause("\nPress ENTER to continue...");
                Console.Clear();   // ← clear the screen before showing the next week

                // Progress time
                AdvanceTime();
            }
        }

        private void InitPlayer()
        {
            player = new Player
            {
                Academics = 60,
                Social = 50,
                Health = 70,
                Stress = 40,
                Money = 50,
                CheatingStrikes = 0,
            };
        }

        private void PrintIntro()
        {
            Console.WriteLine("Welcome to University Life!");
            Console.WriteLine("You are a first-year student. Survive 8 semesters, avoid expulsion, and manage your well-being.");
            ShowStats();
            UI.Pause("Press ENTER to begin your first week...");
        }

        private void ShowStats()
        {
            Console.WriteLine($"📚 Academics: {player.Academics}");
            Console.WriteLine($"💬 Social:    {player.Social}");
            Console.WriteLine($"💪 Health:    {player.Health}");
            Console.WriteLine($"😩 Stress:    {player.Stress}");
            Console.WriteLine($"💰 Money:     {player.Money}");
            Console.WriteLine($"⚠️ Cheating Strikes: {player.CheatingStrikes}/3\n");
        }

        private void AdvanceTime()
        {
            week++;
            if (week > 3) // simple: 3 weeks per semester
            {

                week = 1;
                semester++;
                // Small end-of-semester adjustments
                SemesterWrapUp();
            }
        }

        private void SemesterWrapUp()
        {
            // GPA-ish bump if Academics high; small money drain for tuition; stress reset-ish
            if (player.Academics >= 75) player.Social += 3;
            player.Money -= 5;
            player.Stress = Math.Max(20, player.Stress - 10);
            player.Clamp();
            Console.WriteLine("— End of semester — minor adjustments applied (tuition paid, stress eased).");
        }

        private bool IsExpelled() => player.CheatingStrikes >= 3;
        private bool IsDropout()
            => player.Money <= 0 || player.Health <= 0 || player.Stress >= 100;

        private bool HasGraduated()
            => semester > maxSemesters;

        private void End(string ending, string reason)
        {
            Console.WriteLine($"\n🏁 Ending: {ending}");
            Console.WriteLine($"Reason: {reason}");
            Console.WriteLine($"\nFinal Stats:");
            ShowStats();
            Console.WriteLine("Thanks for playing!");
        }
    }

    // --- Player / Stats ---
    class Player
    {
        public int Academics { get; set; } // 0–100
        public int Social { get; set; } // 0–100
        public int Health { get; set; } // 0–100
        public int Stress { get; set; } // 0–100 (higher is worse)
        public int Money { get; set; } // 0–100 (abstracted)
        public int CheatingStrikes { get; set; }

        public void ApplyDelta(int dAcad = 0, int dSoc = 0, int dHealth = 0, int dStress = 0, int dMoney = 0)
        {
            Academics += dAcad;
            Social += dSoc;
            Health += dHealth;
            Stress += dStress;
            Money += dMoney;
            Clamp();
        }

        public void Clamp()
        {
            Academics = Clamp01(Academics);
            Social = Clamp01(Social);
            Health = Clamp01(Health);
            Stress = Clamp01(Stress);
            Money = Clamp01(Money);
        }

        private int Clamp01(int v) => Math.Max(0, Math.Min(100, v));
    }

    // --- Choices ---
    class Choice
    {
        public string Label { get; set; }
        public string Description { get; set; }
        public Action<Player> Effect { get; set; }

        public void Apply(Player p)
        {
            Console.WriteLine($"\nYou chose: {Label} — {Description}");
            Effect?.Invoke(p);
        }
    }

    static class ChoiceFactory
    {
        private static readonly Random rng = new Random();

        // --- Safe options pool ---
        private static readonly List<Choice> SafeChoices = new List<Choice>
    {
        new Choice {
            Label = "Go to office hours",
            Description = "Get some clarification from the professor about the coursework.",
            Effect = p => {
                p.ApplyDelta(dAcad:+10, dStress:-6);
                Console.WriteLine("📚 Academics +10, 😩 Stress -6");
            }
        },

        new Choice {
            Label = "Study",
            Description = "Focus on coursework and assignments.",
            Effect = p => {
                p.ApplyDelta(dAcad:+10, dStress:+6);
                Console.WriteLine("📚 Academics +10, 😩 Stress +6");
            }
        },
        new Choice {
            Label = "Workout",
            Description = "Exercise to improve health and reduce stress.",
            Effect = p => {
                p.ApplyDelta(dHealth:+10, dStress:-8);
                Console.WriteLine("💪 Health +10, 😩 Stress -8");
            }
        },
        new Choice {
            Label = "Part-time Job",
            Description = "Work a short shift to earn money.",
            Effect = p => {
                p.ApplyDelta(dMoney:+15, dStress:+5, dHealth:-5);
                Console.WriteLine("💰 Money +15, 😩 Stress +5, 💪 Health -5");
            }
        },
        new Choice {
            Label = "Hang out with friends",
            Description = "Spend time socializing and relaxing.",
            Effect = p => {
                p.ApplyDelta(dSoc:+12, dStress:-6, dMoney:-4);
                Console.WriteLine("💬 Social +12, 😩 Stress -6, 💰 Money -4");
            }
        },
        new Choice {
            Label = "Sleep early",
            Description = "Recover energy and improve health.",
            Effect = p => {
                p.ApplyDelta(dHealth:+8, dStress:-10);
                Console.WriteLine("💪 Health +8, 😩 Stress -10");
            }
        },
        new Choice {
            Label = "Join a club event",
            Description = "Attend a campus event and meet people.",
            Effect = p => {
                p.ApplyDelta(dSoc:+10, dStress:+4, dMoney:-5);
                Console.WriteLine("💬 Social +10, 😩 Stress +4, 💰 Money -5");
            }
        },
        new Choice {
            Label = "Go to a party with your friends",
            Description = "Attend a party hosted by a friend and meet people.",
            Effect = p => {
                p.ApplyDelta(dSoc:+10, dStress:+4, dMoney:-5);
                Console.WriteLine("💬 Social +10, 😩 Stress +4, 💰 Money -5");
            }
        },
        new Choice {
            Label = "Cook at home",
            Description = "Save money and eat healthy.",
            Effect = p => {
                p.ApplyDelta(dHealth:+5, dMoney:+5, dStress:-3);
                Console.WriteLine("💪 Health +5, 💰 Money +5, 😩 Stress -3");
            }
        }
    };

        // --- Risky scenarios (context-aware; NEVER positive overall) ---
        private static Choice Risk_CheatingOnExam() => new Choice
        {
            Label = "RISK: Cheat on exam",
            Description = "Attempt academic dishonesty during a major test.",
            Effect = p => {
                // No rewards: either caught (severe) or not caught (still stress, guilt, poor prep)
                double caught = rng.NextDouble();
                if (caught < 0.8)
                {
                    p.CheatingStrikes++;
                    p.ApplyDelta(dAcad: -10, dStress: +20);
                    Console.WriteLine("🚨 Caught cheating! Cheating strike +1, 📚 -10, 😩 +20");
                }
                else
                {
                    p.ApplyDelta(dAcad: -3, dStress: +10);
                    Console.WriteLine("😬 You weren’t caught, but you learned little. 📚 -3, 😩 +10");
                }
            }
        };

        private static Choice Risk_FlirtWithYourClassmate() => new Choice
        {
            Label = "RISK: Flirt with your classmate",
            Description = "Spit some fire game to the cutie in your class.",
            Effect = p =>
            {
                double rejected = rng.NextDouble();
                if (rejected < 0.5)
                {
                    p.ApplyDelta(dSoc: -10, dStress: +20);
                    Console.WriteLine("🚨 They rejected you!, 💬 -10, 😩 +20");
                }
                else
                {
                    p.ApplyDelta(dAcad: -3, dStress: +10);
                    Console.WriteLine("😬 They flirt back! 💬 +10, 😩 -10");
                }
            }
        };

        private static Choice Risk_UnsanctionedCat() => new Choice
        {
            Label = "RISK: Get an unsanctioned cat",
            Description = "You take in a street cat, but pets aren't allowed in your residence.",
            Effect = p =>
            {
                double rejected = rng.NextDouble();
                if (rejected < 0.5)
                {
                    p.ApplyDelta(dMoney: -10, dStress: +20);
                    Console.WriteLine("🚨 Your RA hears meowing in your room! You have to give up the cat and pay a fine, 💰 -10, 😩 +20");
                }
                else
                {
                    p.ApplyDelta(dHealth: -15);
                    Console.WriteLine("😬 It has rabies. 💪 -15");
                }
            }
        };

        private static Choice Risk_PlagiarismWithAI() => new Choice
        {
            Label = "RISK: Submit AI-written essay",
            Description = "You felt lazy and asked ChatGPT to write your essay.",
            Effect = p => {
                double flagged = rng.NextDouble();
                if (flagged < 0.8)
                {
                    p.CheatingStrikes++;
                    p.ApplyDelta(dAcad: -12, dStress: +18);
                    Console.WriteLine("🛑 Flagged for plagiarism! Cheating strike +1, 📚 -12, 😩 +18");
                }
                else
                {
                    p.ApplyDelta(dAcad: -5, dStress: +8);
                    Console.WriteLine("🤖 You are not caught, but your prof is skeptical. 📚 -5, 😩 +8");
                }
            }
        };

        private static Choice Risk_RoommatesPartner() => new Choice
        {
            Label = "RISK: Flirt with your roomate's partner",
            Description = "Your roommate's romantic partner has been flirting with you, do you reciprocate?.",
            Effect = p => {
                double flagged = rng.NextDouble();
                if (flagged < 0.8)
                {
                    p.ApplyDelta(dSoc: -12, dStress: +18, dMoney: -20);
                    Console.WriteLine("🛑 Your roommate catches you two. They flip out and throw out all your stuff. 💬 -12, 😩 +18, 💰 -20");
                }
                else
                {
                    p.ApplyDelta(dStress: +8);
                    Console.WriteLine("You are not caught, but your roommate is skeptical. 📚 -5, 😩 +8");
                }
            }
        };

        private static Choice Risk_SkipClassBinge() => new Choice
        {
            Label = "RISK: Skip class and binge shows",
            Description = "Miss content and fall behind.",
            Effect = p => {
                p.ApplyDelta(dAcad: -8, dStress: +6, dHealth: -2);
                Console.WriteLine("⏭️ You missed key material. 📚 -8, 😩 +6, 💪 -2");
            }
        };

        private static Choice Risk_ShoppingSpree() => new Choice
        {
            Label = "RISK: Go on a shopping spree",
            Description = "Your bank account is low on funds, this will hurt your pockets.",
            Effect = p => {
                p.ApplyDelta(dStress: +6, dMoney: -7);
                Console.WriteLine("⏭️ You maxed out your credit Card!. 😩 Stress +6, 💰 Money -7");
            }
        };

        private static Choice Risk_DrinkTooMuch() => new Choice
        {
            Label = "RISK: Drink way too much",
            Description = "Overdo it at a party; next day is rough.",
            Effect = p => {
                // No upside; hangover & maybe minor financial/health hit
                bool veryBad = rng.NextDouble() < 0.25;
                if (veryBad)
                {
                    p.ApplyDelta(dHealth: -15, dStress: +10, dAcad: -6, dMoney: -10);
                    Console.WriteLine("🍻 Rough night → rougher morning. 💪 -15, 😩 +10, 📚 -6, 💰 -10");
                }
                else
                {
                    p.ApplyDelta(dHealth: -8, dStress: +6, dAcad: -3, dMoney: -5);
                    Console.WriteLine("🍺 Hangover fog. 💪 -8, 😩 +6, 📚 -3, 💰 -5");
                }
            }
        };
        private static Choice Risk_Doomscroll() => new Choice
        {
            Label = "RISK: Sit on your phone for 5 hours",
            Description = "You have a midterm tomorrow, you really should be studying!.",
            Effect = p => {
                p.ApplyDelta(dStress: +5, dAcad: -6);
                Console.WriteLine("You bombed your midterm! … 😩 +5, 📚 -6");
            }
        };
        private static Choice Risk_StayUpLate() => new Choice
        {
            Label = "RISK: You stay up until 3am talkin to your friend",
            Description = "You have class at 8am, you really should be sleeping!.",
            Effect = p => {
                p.ApplyDelta(dStress: +5, dAcad: -6);
                Console.WriteLine("You fell asleep in class! … 😩 +5, 📚 -6");
            }
        };
        private static Choice Risk_AllNightGaming() => new Choice
        {
            Label = "RISK: All-night gaming",
            Description = "Zero sleep; tank your next day.",
            Effect = p => {
                p.ApplyDelta(dHealth: -10, dStress: +8, dAcad: -6);
                Console.WriteLine("🎮 Sun rises; your grades set… 💪 -10, 😩 +8, 📚 -6");
            }
        };

        private static Choice Risk_BedRot() => new Choice
        {
            Label = "RISK: Skip classes and lay in bed all day",
            Description = "Become the ultimate bedbug.",
            Effect = p => {
                p.ApplyDelta(dHealth: -10, dStress: +10, dAcad: -12);
                Console.WriteLine("You failed to turn in your assignment on time 💪 -10, 😩 +10, 📚 -12");
            }
        };

        private static Choice Risk_Haircut() => new Choice
        {
            Label = "RISK: Get a haircut at the hairstyler",
            Description = "Your hair has gotten really long and you are in dire need of a haircut, your friend recomends a place because it is cheap, but they have multiple 1 star reviews.",
            Effect = p => {
                double flagged = rng.NextDouble();
                if (flagged < 0.8)
                {
                    p.ApplyDelta(dSoc: -12, dStress: +18, dMoney: -20);
                    Console.WriteLine("It is the hairstyler's first day! They mess your hair up, you are now chopped. 💬 -12, 😩 +18, 💰 -20");
                }
                else
                {
                    p.ApplyDelta(dSoc: +12, dStress: -20);
                    Console.WriteLine("This place is a hidden gem! You get a good haircut for cheap. 💬 +12, 😩 -20");
                }
            }
        };

        // Choose one context-aware risky action based on semester/week cadence
        private static Choice PickContextualRisk(int semester, int week)
        {
            // Simple cadence:
            // Weeks 5–7 (midterms) & 11–12 (finals) → exam-related risks more likely
            bool examWindow = (week >= 4 && week <= 7) || (week >= 10 && week <= 12);

            var bucket = new List<Func<Choice>>();

            if (examWindow)
            {
                bucket.Add(Risk_CheatingOnExam);
                bucket.Add(Risk_PlagiarismWithAI);
                bucket.Add(Risk_AllNightGaming);
                bucket.Add(Risk_StayUpLate);
                bucket.Add(Risk_UnsanctionedCat);
            }
            else
            {
                bucket.Add(Risk_SkipClassBinge);
                bucket.Add(Risk_FlirtWithYourClassmate);
                bucket.Add(Risk_DrinkTooMuch);
                bucket.Add(Risk_AllNightGaming);
                bucket.Add(Risk_Doomscroll);
                bucket.Add(Risk_ShoppingSpree);
                bucket.Add(Risk_BedRot);
                bucket.Add(Risk_RoommatesPartner);
                bucket.Add(Risk_Haircut);
                // Mix in academic risks occasionally even off-cycle
                if (rng.NextDouble() < 0.5) bucket.Add(Risk_PlagiarismWithAI);
            }

            // Slightly harsher penalties in later semesters by biasing to worse options:
            if (rng.NextDouble() < 0.5)
                bucket.Add(Risk_CheatingOnExam);

            var ctor = bucket[rng.Next(bucket.Count)];
            return ctor();
        }

        // Public API: generate 3 safe + 1 risky (context-aware), new each week
        public static Dictionary<char, Choice> GenerateWeeklyMenu(int semester, int week)
        {
            var pool = new List<Choice>(SafeChoices);
            Shuffle(pool);
            var chosen = pool.GetRange(0, 3);

            // inject contextual risky option (never rewarding)
            var risky = PickContextualRisk(semester, week);
            chosen.Add(risky);

            // Assign letters dynamically
            var dict = new Dictionary<char, Choice>();
            char letter = 'A';
            foreach (var choice in chosen)
            {
                dict.Add(letter, new Choice
                {
                    Label = $"{letter}) {choice.Label}",
                    Description = choice.Description,
                    Effect = choice.Effect
                });
                letter++;
            }
            return dict;
        }

        // Fisher–Yates
        private static void Shuffle<T>(IList<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }



    // --- Random Events ---
    static class RandomEvent
    {
        public static void DoOne(Player p, Random rng)
        {
            // ~50% chance of an event per week
            if (rng.NextDouble() > 0.5) return;

            var roll = rng.Next(0, 6);
            switch (roll)
            {
                case 0:
                    UI.Banner("Fire alarm at 3 a.m. — lost sleep.");
                    p.ApplyDelta(dHealth: -8, dStress: +5);
                    Console.WriteLine("💪 Health -8, 😩 Stress +5");
                    Console.WriteLine();
                    break;
                case 1:
                    UI.Banner("Laptop broke — emergency repair.");
                    p.ApplyDelta(dMoney: -15, dStress: +5);
                    Console.WriteLine("💰 Money -15, 😩 Stress +5");
                    Console.WriteLine();
                    break;
                case 2:
                    UI.Banner("Made a friend in lab!");
                    p.ApplyDelta(dSoc: +10, dStress: -3);
                    Console.WriteLine("💬 Social +10, 😩 Stress -3");
                    Console.WriteLine();
                    break;
                case 3:
                    UI.Banner("Caught a cold during quizzes.");
                    p.ApplyDelta(dHealth: -12, dAcad: -5);
                    Console.WriteLine("💪 Health -12, 📚 Academics -5");
                    Console.WriteLine();
                    break;
                case 4:
                    UI.Banner("Found a part-time gig for the week.");
                    p.ApplyDelta(dMoney: +12, dStress: +3);
                    Console.WriteLine("💰 Money +12, 😩 Stress +3");
                    Console.WriteLine();
                    break;
                case 5:
                    UI.Banner("Group project went sideways.");
                    p.ApplyDelta(dAcad: -8, dStress: +6);
                    Console.WriteLine("📚 Academics -8, 😩 Stress +6");
                    Console.WriteLine();
                    break;
            }
            p.Clamp();
        }
    }

    // --- Simple UI Helpers ---
    static class UI
    {
        public static void Pause(string msg)
        {
            Console.WriteLine(msg);
            Console.ReadLine();
        }

        public static void Banner(string text)
        {
            Console.WriteLine($"\n— {text} —");
        }

        public static char PromptChoice(Dictionary<char, Choice> choices)
        {
            Console.WriteLine("Choose an action:");
            foreach (var kv in choices)
                Console.WriteLine(kv.Value.Label + "  — " + kv.Value.Description);

            Console.Write("Select [A/B/C/D]: ");
            while (true)
            {
                var key = Console.ReadKey(intercept: true).KeyChar;
                char c = char.ToUpperInvariant(key);
                if (choices.ContainsKey(c))
                {
                    Console.WriteLine(c);
                    return c;
                }
            }
        }
    }
}
