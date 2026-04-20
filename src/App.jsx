import { useState, useEffect, useRef, useCallback } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// ─── DATA ───────────────────────────────────────────────────────────────────────

const PLAYERS = {
  moon: { name: "Moon", team: "pigs", captain: true, emoji: "🌙", color: "#7B8CDE", bio: "The wallet-dodger with a swing to match. More likely to find water than his round at the bar." },
  cupido: { name: "Cupido", team: "pigs", captain: false, emoji: "💘", color: "#E8786A", bio: "Survived year one of fatherhood. Vertically challenged but horizontally dangerous. Every dog has his day… woof." },
  sozzle: { name: "Sozzle", team: "pigs", captain: false, emoji: "🍺", color: "#F4A940", bio: "Creative scorekeeper. If no one's counting his shots, he's already won. Baby #2 incoming — the hips don't lie." },
  h: { name: "H", team: "pigs", captain: false, emoji: "🤖", color: "#4ECDC4", bio: "Will use AI to calculate every angle, wind speed and power… then top it just off the tee box. Built this app though, so respect." },
  ben: { name: "Ben", team: "happy", captain: true, emoji: "⚡", color: "#5BC0EB", bio: "The Surrey businessman. Single digit handicap, maybe even scratch. Great with his hands. 326 rounds this year. Liquid." },
  brunners: { name: "Brunners", team: "happy", captain: false, emoji: "♿", color: "#6A994E", bio: "Tree trunk base, tall levers, and an investment portfolio bigger than his drive. Whether Brunnerz or Matthew shows up is anyone's guess." },
  flemzo: { name: "Flemzo", team: "happy", captain: false, emoji: "🎩", color: "#9B5DE5", bio: "Swings hard and fast — impressive given most clubs weigh more than him. High heels and a top hat wouldn't slow him down." },
  shlid: { name: "Shlid", team: "happy", captain: false, emoji: "🏎️", color: "#F72585", bio: "Buggy menace. Pubic hair architect. Moving to Worthing and taking everyone's shins with him. The reverse R9 lives on." },
};

const TEAMS = {
  pigs: { name: "Team Pigs", short: "PIGS", color: "#E8786A", gradient: "linear-gradient(135deg, #E8786A 0%, #D4574A 100%)", members: ["moon", "cupido", "sozzle", "h"] },
  happy: { name: "Team Happy Ending", short: "HAPPY", color: "#5BC0EB", gradient: "linear-gradient(135deg, #5BC0EB 0%, #3A9FCD 100%)", members: ["ben", "brunners", "flemzo", "shlid"] },
};

const HOLES = [
  { num: 1, name: "Sodom", par: 4, yards: 310, si: 13, image: "/holes/Sodom-hole-1-waterfall-course.jpeg.webp", desc: "Short par 4 with a deceptively tricky tee shot. Keep left to avoid being blocked by a towering oak on the approach. Elevated green needs a well-struck iron.", challenge: null },
  { num: 2, name: "Gomorrah", par: 4, yards: 280, si: 17, image: "/holes/Gomorrah-hole-2-waterfall-course.jpeg.webp", desc: "Very short par 4 offering a real birdie chance. Reach the top of the slope, favouring the right side for a view of the green. The brave can take on the green from the tee.", challenge: null },
  { num: 3, name: "Gateway", par: 4, yards: 480, si: 5, image: "/holes/Gateway-hole-3-waterfall-course.jpeg.webp", desc: "Par 4 requiring accuracy to thread the ball through the trees. Well-placed bunkers make the approach tough. Huge bunker front-left swallows many balls. Severe slope in the middle of the green.", challenge: null },
  { num: 4, name: "Hell Corner", par: 4, yards: 370, si: 1, image: "/holes/Hellcorner-hole-4-waterfall-course.jpeg.webp", desc: "Very appropriately named. Tough tee shot hugging the tree line. Must be long enough to crest the hill for a view of the green. Two deep bunkers guard any miss-struck approach. Par is a very good score.", challenge: "oneclub" },
  { num: 5, name: "Punch Bowl", par: 3, yards: 165, si: 11, image: "/holes/Punchbowl-hole-5-waterfall-course.jpeg.webp", desc: "First of three stunning par 3s. Green sits in a punch bowl with OOB just yards left. Safe bail-out right, but a bunker waits atop the slope. Accuracy is everything.", challenge: "ctp" },
  { num: 6, name: "Warren", par: 4, yards: 350, si: 7, image: "/holes/Warren-hole-6-waterfall-course.jpeg.webp", desc: "Accuracy more important than length. A shot over the marker finds undulating fairway, leaving an approach over a stream to a two-tiered green.", challenge: null },
  { num: 7, name: "John Jones", par: 4, yards: 380, si: 3, image: "/holes/John-jones-hole-7-waterfall-hole.jpeg.webp", desc: "The hardest hole on the course. Stream winds the entire length. Fairway is very narrow in places — leave the headcovers on the longer clubs. The hole Gary Player admired.", challenge: null },
  { num: 8, name: "Hummocks", par: 5, yards: 490, si: 9, image: "/holes/Hummocks-hole-8-waterfall-course.jpeg.webp", desc: "First par 5 on the course. Driving range is OOB! Well-protected green needs a long iron or layup due to bunkers and the ditch. A hole that demands thought.", challenge: "drive" },
  { num: 9, name: "Beechers", par: 4, yards: 470, si: 15, image: "/holes/Beechers-hole-9-waterfall-course.jpeg.webp", desc: "Long par 4 that takes its toll. Avoid two fairway bunkers from tee and second shot. Approach plays longer than expected due to massive elevation change. Breathe at the top!", challenge: null },
  { num: 10, name: "Waterfall", par: 3, yards: 155, si: 12, image: "/holes/Waterfall-hole-10-waterfall-course.jpeg.webp", desc: "The signature hole. Savour the view from the elevated tee before getting down to business. Plays shorter than the yardage. Danger left. Cross your fingers mid-flight.", challenge: "ctp" },
  { num: 11, name: "Valley", par: 4, yards: 355, si: 2, image: "/holes/Valley-hole-11-waterfall-hole.jpeg.webp", desc: "Gary Player put this in his imaginary top 18 holes of the world. Decisions from the tee — take on large trees or play left for a longer approach to a deep two-tier green.", challenge: null },
  { num: 12, name: "Horizon", par: 4, yards: 340, si: 8, image: "/holes/Horizon-hole-12-waterfall-course.jpeg.webp", desc: "Deep two-tier green with serious bunkers protecting the right side. The safer play left leaves a longer approach. Strategic thinking required.", challenge: null },
  { num: 13, name: "Winter Pick", par: 5, yards: 500, si: 4, image: "/holes/Winterfallpick-hole-13-waterfall-course.jpeg.webp", desc: "A demanding par 5. Avoid fairway bunkers from tee and second shot. Third plays longer than expected — massive elevation change ahead.", challenge: null },
  { num: 14, name: "Blaster", par: 4, yards: 345, si: 10, image: "/holes/Blaster-hole-14-waterfall-course.jpeg.webp", desc: "A plaque commemorates a WWII bomber crash on this hole. Navigate the history and the hazards with a measured approach.", challenge: null },
  { num: 15, name: "Hill", par: 3, yards: 170, si: 6, image: "/holes/Hill-hole-15-waterfall-course.jpeg.webp", desc: "Last par 3, a real beauty surrounded by trouble. Bunkers guard the left, deep ravine and OOB runs the entire right side. Trust your swing and commit.", challenge: "ctp" },
  { num: 16, name: "Old Haven", par: 5, yards: 485, si: 14, image: "/holes/Old-haven-hole-16-waterfall-course.jpeg.webp", desc: "Last par 5 and a real chance to improve your score. Fairway slopes right to left the whole way. Two grass ditches lurk. Downhill putts are dangerously slippery.", challenge: null },
  { num: 17, name: "Holly Bush", par: 4, yards: 365, si: 16, image: "/holes/Hollybush-hole-17-waterfall-course.jpeg.webp", desc: "Almost home! Elevated tee shot — avoid grass bunkers right. Uphill approach to a very shallow green. Take plenty of club. Fast putts above the hole.", challenge: null },
  { num: 18, name: "Fullers", par: 4, yards: 290, si: 18, image: "/holes/Fullers-hole-18-waterfall-course.jpeg.webp", desc: "Easiest and shortest par 4. Tee shot to the top of the hill earns an easy pitch onto a small green. A definite birdie chance. The Mulligan Hole — use it wisely!", challenge: "mulligan" },
];

const CHALLENGE_INFO = {
  oneclub: { label: "ONE CLUB", icon: "🏌️", color: "#F4A940", desc: "Each player may only use ONE club for the entire hole, including putting." },
  ctp: { label: "CTP", icon: "🎯", color: "#4ECDC4", desc: "Closest to the Pin — £30 swindle. If no winner, prize rolls to next par 3." },
  drive: { label: "LONG DRIVE", icon: "💥", color: "#E8786A", desc: "Longest Drive — £30 swindle. Must land on the fairway or the money goes in the whip." },
  mulligan: { label: "MULLIGAN", icon: "🔄", color: "#9B5DE5", desc: "Each player gets ONE mulligan to use on any shot during this hole." },
};

const ODDS_CATEGORIES = [
  {
    title: "Hole in One",
    icon: "⛳",
    entries: [
      { name: "Brunners", odds: "7/2", text: "Brun has been practicing, and he has a few things in his favour; a strong sturdy base previously compared to tree trunks, a tall frame with levers to excel at golf… and a large FOREskinless penis to help him rotate his hips." },
      { name: "Sozzle", odds: "20/1", text: "Like the favourite Sozzle has no FOREskin chunky todger help rotate those hips during his swing. It would seem his hips have secured him another baby on the way too… and as always, if no one else is counting his shots, he may well be the one to get in in one…again. Even though he had 5 out the bunker and 6 putted." },
      { name: "Ben", odds: "12,500/1", text: "Ben is great with his hands but will his handsy swings be enough to defy the odds and slum dunk one straight in the cup. The Surrey businessman has been seen running and playing golf and opening a new branch…and if the rumours are to be believed, practicing his golf swing in the living room which resulted in an injury to his daughter…" },
      { name: "Flemzo", odds: "15,000/1", text: "Flemzo swings hard and fast, which is impressive as most clubs weigh more than him! At 15,000/1, the wind is more likely to blow him into one of the many water hazards than sink a hole in one. Still, if no one is looking he may just tell you he made a hole in one when he moved to Dubai..." },
      { name: "Cupido", odds: "20,000/1", text: "Cupido has survived his first year as a dad with no much golf, meaning this will more than be a tall order for this vertically challenged man. But as the saying goes, every dog has his day…woof" },
      { name: "H", odds: "50,000/1", text: "H will likely use AI to create an app that will work out all the angles, wind and power to calculate exactly how he should hit it…all to see him top it just off the tee box" },
      { name: "Shlid", odds: "75,000/1", text: "SHLID will be more concerned about the itchy scrotch from the new pubic hair style he has in his pants. Will we see a return of the reverse R9 or will we be privileged with a new look framing his far too often seen penis." },
      { name: "Moon", odds: "1,000,000/1", text: "Moon no doubt has some new grandad senior citizen flex clubs because he’s the del boy of golf clubs. Every moon has his day but he’ll actively be trying to avoid a hole in one as that’ll mean he’ll have to get his wallet out at the bar….maybe get some golf insurance to cover it! will be more concerned about the itchy scrotch from the new pubic hair style he has in his pants. Will we see a return of the reverse R9 or will we be privileged with a new look framing his far too often seen penis." },
    ],
  },
  {
    title: "First to Hit Water",
    icon: "💧",
    entries: [
      { name: "Moon", odds: "2/7", text: "The course is called Waterfall and with that name, it suggests plenty of opportunities for Moon to find it faster than he puts his wallet away at the bar." },
      { name: "Flemzo", odds: "4/1", text: "Assuming Flemzo doesn't slope off before the first hole with water to attend Neve's 19th 1st birthday in her 2 years of life, his whippy swing has every chance of sinking HMS Reverse R9." },
      { name: "Shlid", odds: "4/1", text: "Shlid's ball is normally wetter than an otter pocket and the fact he has moved to live closer to the water only highlights his love of it. The magnetism will mean he is very likely to smash his ball into the drink like some of the Iranian missiles man like Trump has been blocking…" },
      { name: "Cupido", odds: "8/1", text: "Cupido is still not over his fear of open water, he'll be laying up to steer clear as much as possible…but shaky legs may cause an upset for him, perhaps even tears." },
      { name: "Sozzle", odds: "12/1", text: "Whilst Sozzle's score card will not include drops, it'll be hard for him to hide the fact he topped a 7 iron into the water that's 10 yards in front of him. Maybe he'll do it on purpose so he can start doing triathlons again…" },
      { name: "H", odds: "16/1", text: "H 2 O, let the water flo, does he still love grime? Who knows, the ball has got to go…into the Horsham water table" },
      { name: "Brunners", odds: "20/1", text: "Some good odds for Brun and if he's as good at dodging the water as Moon is dodging a round, it's only because he's invested a golf company #loaded. Whether Brunnerz or Matthew is playing will determine what happens here. But, as they say, it only takes 7 seconds…" },
      { name: "Ben", odds: "100/1", text: "Ben is liquid…and liquid people don't flirt with water because they play golf more than anyone. This won't happen, he's a single digit handicap, maybe even scratch" },
    ],
  },
  {
    title: "What has Shlid done with his Pubes this year?",
    icon: "✂️",
    entries: [
      { name: "The Full Ronaldo", odds: "5/2", text: "Last year it was the Ronaldo fringe — shaved, shaped, and absolutely nobody asked for it. Has he doubled down? Is there a little curtain parting down there in homage to the great man? Bold. Brave. Wrong." },
      { name: "Landing Strip (Worthing Runway)", odds: "3/1", text: "Now he's moving to Mordor, perhaps the pubes reflect the bleakness of his new surroundings. A lonely strip of hair on an otherwise barren landscape. Just like the Worthing seafront in February." },
      { name: "Full Brazilian", odds: "4/1", text: "Gone. All of it. Clean as a whistle and twice as dramatic. Shlid has looked at his life choices, looked at Worthing, and decided the only thing he can control is his groin. Fair play, lad." },
      { name: "The Full Bush (Letting Mordor Take Him)", odds: "5/1", text: "He's moving to Worthing. He's given up. The pubes have given up too. Full wilderness. Nothing has been touched since he packed the boxes. The removal men were warned." },
      { name: "A New Footballer", odds: "8/1", text: "Ronaldo was last year. This year it could be anyone. A Bellingham fade? A Mbappe? A tribute to a lower league midfielder no one's heard of? Shlid does not do things by halves, except golf shots, which he tops." },
      { name: "Nothing", odds: "12/1", text: "There's no time for pube architecture anymore. It's just whatever happens, happens. The Worthing years begin. Everything softens. The pubes included." },
    ],
  },
  {
    title: "Who will Shlid run over in the buggy?",
    icon: "🏎️",
    entries: [
      { name: "Cupido", odds: "4/7", text: "Previous form. Existing trajectory. Cupido is statistically the most run-over person in this group and nothing about his awareness levels suggests that's about to change. Shlid moves to Mordor but the instincts travel with him." },
      { name: "A Course Marshal", odds: "4/1", text: "Someone with a clipboard is going to try and enforce a speed limit on Shlid. This will be their worst professional decision. The hi-vis will not protect them." },
      { name: "Moon", odds: "6/1", text: "Too slow to move, too tight to pay for a seat in the buggy, and therefore on foot directly in Shlid's natural path. Moon has been warned. Moon has not listened." },
      { name: "Brunners", odds: "8/1", text: "Wouldn't even notice if it did hit him and the buggy and Shlid would likely come off worse." },
      { name: "H", odds: "12/1", text: "Wouldn't recommend Shlid trying to run over a tired Dad as it may be the last thing he ever did, but if the dreaded flavour kicks in who knows what Shlid is capable of." },
      { name: "Ben", odds: "25/1", text: "Very generous odds for the man that is likely to be on the actual fairways, due to the fact he has currently played 326 rounds of golf this year…you're right this doesn't seem to add up…but trust me it's true." },
      { name: "Sozzle", odds: "80/1", text: "He'll be too busy finding his ball in the rough to the left of the green where the buggies can't get to following his 'first' shot on a par 5." },
      { name: "Flemzo", odds: "100/1", text: "It wouldn't matter if he sensed it coming and manufactured an excuse to be somewhere else before impact…as the buggy would simply sail over his head without the need for ducking...even though he's wearing high heels and a top hat." },
    ],
  },
  {
    title: "Most Active Side WhatsApp Chat",
    icon: "📱",
    entries: [
      { name: "H & Cupido", odds: "1/3", text: "The undisputed kings of the side chat with 48 groups in common. While the main group chat is sending course updates and Flemzo's increasingly unconvincing excuses, H and Cupido are three threads deep in a completely separate conversation. Nobody knows what they're saying. Nobody is allowed to know. The side chat is sacred." },
      { name: "The Anti-Moon Round Buying Tracker", odds: "5/2", text: "Someone — possibly Brun, possibly everyone — has a live document tracking how many rounds Moon has bought versus received. It is currently showing a deficit of approximately seventeen pints dating back to 2019. This chat is updated in real time." },
      { name: "Pigs Team Chat (Defending Champions)", odds: "4/1", text: "The Pigs won last year and they haven't let anyone forget it. The team chat is still active. It's mostly Cupido reminding everyone he won the money and a few 'lads we got this' messages that Sozzle hasn't opened because he's been busy with the baby prep." },
      { name: "Brun's Offshore Financial Planning Group", odds: "8/1", text: "Not golf related. Brun is loaded and has various irons in various fires. Somewhere between the 3rd and 5th hole he'll be quietly moving money around while the rest of you are looking for Shlid's ball in the rough. Rich people problems." },
    ],
  },
  {
    title: "Winning Team",
    icon: "🏆",
    entries: [
      { name: "Pigs", odds: "4/6", text: "Defending champions. Cupido left last year with the money and the audacity, and the Pigs haven't stopped mentioning it since. If Moon plays to his ability, Sozzle's creative arithmetic doesn't get too creative, H stays lucid enough to putt, and Cupido's fear of water doesn't manifest — they're the team to beat." },
      { name: "Happy Ending", odds: "5/4", text: "Ben is the danger man — genuinely good, professionally precise, the kind of player who treats a golf course like a physio problem to be solved. If Flemzo stays for the full eighteen (he won't), and Brun plays like we know he can, and Shlid contributes something beyond entertainment value and repacking Brun's suitcase with last night's dinner — they have a chance. A real one. Probably." },
    ],
  },
];

const RULES = [
  { title: "Format", text: "Front 9: 4 vs 4 Scratch Texas Scramble (stroke play). Back 9: 2 matches of 2 vs 2 Match Play." },
  { title: "Tee Shots", text: "Front 9 — each team must use at least 2 tee shots from each member. Back 9 — each pair must use 3 tee shots each." },
  { title: "Closest to the Pin", text: "£30 swindle on all par 3s (holes 5, 10, 15). No winner = prize rolls to next par 3. If all exhausted, money goes in the whip." },
  { title: "Longest Drive", text: "£30 swindle on Hole 8. Must land on the fairway. No fairway hit = money goes in the whip." },
  { title: "Don't Lose Your Ball", text: "£30 swindle, whole round. Keep your designated marked ball. Multiple survivors = putt-off." },
  { title: "One Club Challenge", text: "Hole 4 (Hell Corner) — one club only for the entire hole, including putting." },
  { title: "Mulligan Hole", text: "Hole 18 — each player gets one mulligan on any shot." },
  { title: "Par to Pints", text: "First par after hole 1 triggers a 50/50 spinner — beer or miniature. You must down it." },
  { title: "First Round Token", text: "Hit a hazard = receive the token. It changes hands across the course. Holding it at the end of each 9 = you buy the first round." },
];

// ─── STYLES ─────────────────────────────────────────────────────────────────────

const colors = {
  bg: "#0A1A0F",
  bgCard: "#122117",
  bgCardHover: "#1A3025",
  bgSurface: "#0E2516",
  gold: "#C9A84C",
  goldLight: "#E8CC6E",
  goldDim: "#8B7333",
  green: "#1B5E20",
  greenLight: "#2E7D32",
  greenDark: "#0D3B12",
  text: "#E8E6E1",
  textDim: "#8B9A8E",
  textMuted: "#5A6B5E",
  white: "#FFFFFF",
  danger: "#E8786A",
  accent: "#4ECDC4",
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────────

function Avatar({ player, size = 48 }) {
  const p = PLAYERS[player];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${p.color}44 0%, ${p.color}22 100%)`,
      border: `2px solid ${p.color}88`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, flexShrink: 0,
    }}>
      {p.emoji}
    </div>
  );
}

function TeamBadge({ team, size = "sm" }) {
  const t = TEAMS[team];
  const s = size === "sm" ? { padding: "2px 8px", fontSize: 10 } : { padding: "4px 12px", fontSize: 12 };
  return (
    <span style={{
      ...s, background: t.gradient, borderRadius: 20,
      fontWeight: 700, letterSpacing: 1.5, color: "#fff",
      textTransform: "uppercase", fontFamily: "'Oswald', sans-serif",
    }}>{t.short}</span>
  );
}

function ChallengeBadge({ type, compact = false }) {
  const c = CHALLENGE_INFO[type];
  if (!c) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: compact ? "2px 6px" : "3px 10px",
      background: c.color + "22", border: `1px solid ${c.color}44`,
      borderRadius: 6, fontSize: compact ? 9 : 11, fontWeight: 700,
      color: c.color, letterSpacing: 0.5,
      fontFamily: "'Oswald', sans-serif",
    }}>
      <span>{c.icon}</span> {c.label}
    </span>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: colors.bgCard, borderRadius: 16,
      border: `1px solid ${colors.greenLight}18`,
      padding: 16, ...style,
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s ease",
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <h2 style={{
        margin: 0, fontSize: 14, fontWeight: 700,
        letterSpacing: 2.5, textTransform: "uppercase",
        color: colors.gold, fontFamily: "'Oswald', sans-serif",
      }}>{children}</h2>
    </div>
  );
}

// ─── SCORING HELPERS ────────────────────────────────────────────────────────────

function calcMatchResult(results) {
  let pigs = 0, happy = 0;
  for (let h = 10; h <= 18; h++) {
    if (results[h] === "pigs") pigs++;
    else if (results[h] === "happy") happy++;
  }
  const diff = pigs - happy;
  const holesPlayed = Object.keys(results).filter(k => +k >= 10).length;
  const allDone = holesPlayed >= 9;
  const leader = diff > 0 ? "pigs" : diff < 0 ? "happy" : null;
  return { pigs, happy, diff: Math.abs(diff), leader, allDone, holesPlayed };
}

function calcPoints(scores) {
  const f9p = Object.values(scores.scramble.pigs).reduce((a, b) => a + b, 0);
  const f9h = Object.values(scores.scramble.happy).reduce((a, b) => a + b, 0);
  const front9 = f9p === 0 && f9h === 0 ? null
    : f9p < f9h ? { pigs: 1, happy: 0 }
    : f9h < f9p ? { pigs: 0, happy: 1 }
    : { pigs: 0.5, happy: 0.5 };

  const matches = scores.matchPlay.map(r => {
    const m = calcMatchResult(r);
    if (!m.allDone) return null;
    return m.leader === "pigs" ? { pigs: 1, happy: 0 }
      : m.leader === "happy" ? { pigs: 0, happy: 1 }
      : { pigs: 0.5, happy: 0.5 };
  });

  const total = {
    pigs: (front9?.pigs ?? 0) + (matches[0]?.pigs ?? 0) + (matches[1]?.pigs ?? 0),
    happy: (front9?.happy ?? 0) + (matches[0]?.happy ?? 0) + (matches[1]?.happy ?? 0),
  };
  return { front9, matches, total };
}

// ─── PAGES ──────────────────────────────────────────────────────────────────────

function HomePage({ scores, currentHole, setPage, setSelectedHole, onShowResults }) {
  const front9Pigs = HOLES.slice(0, 9).reduce((sum, h) => sum + (scores.scramble.pigs[h.num] || 0), 0);
  const front9Happy = HOLES.slice(0, 9).reduce((sum, h) => sum + (scores.scramble.happy[h.num] || 0), 0);
  const front9PigsPar = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.pigs[h.num] > 0 ? h.par : 0), 0);
  const front9HappyPar = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.happy[h.num] > 0 ? h.par : 0), 0);
  const front9PigsDiff = front9Pigs > 0 ? front9Pigs - front9PigsPar : null;
  const front9HappyDiff = front9Happy > 0 ? front9Happy - front9HappyPar : null;

  const match1 = calcMatchResult(scores.matchPlay[0] || {});
  const match2 = calcMatchResult(scores.matchPlay[1] || {});
  const points = calcPoints(scores);

  const matchStatusLabel = (m, idx) => {
    const p1 = scores.matchPairings?.[idx];
    if (!p1) return "Pairings not set";
    if (m.holesPlayed === 0) return "Not started";
    if (m.allDone) {
      if (!m.leader) return "Halved";
      return `${TEAMS[m.leader].short} win ${m.leader === "pigs" ? m.pigs : m.happy}–${m.leader === "pigs" ? m.happy : m.pigs}`;
    }
    if (!m.leader) return `All Square (${m.holesPlayed} played)`;
    return `${TEAMS[m.leader].short} ${m.diff}UP (${m.holesPlayed} played)`;
  };

  const fmtPts = (n) => { if (n === null || n === undefined) return "–"; if (n % 1 === 0) return String(n); const w = Math.floor(n); return w === 0 ? "½" : `${w}½`; };

  const hole = HOLES[currentHole - 1];

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 0 20px", position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: "0%", transform: "translateY(-50%)",
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.gold}08 0%, transparent 70%)`,
        }} />
        <div style={{ textAlign: "left", position: "relative" }}>
          <div style={{
            fontSize: 10, letterSpacing: 4, color: colors.goldDim,
            fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 4,
          }}>The 2nd Annual</div>
          <h1 style={{
            margin: 0, fontSize: 32, fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 50%, ${colors.goldDim} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}>Pint Face<br />Invitational</h1>
          <div style={{
            fontSize: 9, letterSpacing: 3, color: colors.textMuted, marginTop: 8,
            fontFamily: "'Oswald', sans-serif", textTransform: "uppercase",
          }}>Mannings Heath — Waterfall Course</div>
        </div>
        <img
          src="/logo.png"
          alt="Pint Face Invitational"
          style={{ height: 110, width: "auto", flexShrink: 0, marginLeft: 12 }}
        />
      </div>

      {/* Score Summary */}
      <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.greenDark} 100%)` }}>
        <div style={{
          fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, textAlign: "center",
          fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 12,
        }}>Front 9 — Texas Scramble</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <TeamBadge team="pigs" size="lg" />
            <div style={{
              fontSize: 44, fontWeight: 700, color: colors.white, marginTop: 6,
              fontFamily: "'Oswald', sans-serif", lineHeight: 1,
            }}>{front9Pigs || "–"}</div>
            {front9PigsDiff !== null && (
              <div style={{ fontSize: 13, color: front9PigsDiff > 0 ? colors.danger : colors.accent, fontWeight: 600, fontFamily: "'Oswald', sans-serif" }}>
                {front9PigsDiff > 0 ? "+" : ""}{front9PigsDiff}
              </div>
            )}
          </div>
          <div style={{
            fontSize: 14, color: colors.textMuted, fontWeight: 600,
            fontFamily: "'Oswald', sans-serif", letterSpacing: 2,
          }}>VS</div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <TeamBadge team="happy" size="lg" />
            <div style={{
              fontSize: 44, fontWeight: 700, color: colors.white, marginTop: 6,
              fontFamily: "'Oswald', sans-serif", lineHeight: 1,
            }}>{front9Happy || "–"}</div>
            {front9HappyDiff !== null && (
              <div style={{ fontSize: 13, color: front9HappyDiff > 0 ? colors.danger : colors.accent, fontWeight: 600, fontFamily: "'Oswald', sans-serif" }}>
                {front9HappyDiff > 0 ? "+" : ""}{front9HappyDiff}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Back 9 Match Play */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 12 }}>
          Back 9 — Match Play
        </div>
        {[match1, match2].map((m, idx) => {
          const pairings = scores.matchPairings?.[idx];
          const leaderColor = m.leader ? TEAMS[m.leader].color : colors.gold;
          return (
            <div key={idx} style={{ marginBottom: idx === 0 ? 10 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>
                  Match {idx + 1}{pairings ? ` · ${pairings.pigs.map(p => PLAYERS[p].name.split(" ")[0]).join("/")} vs ${pairings.happy.map(p => PLAYERS[p].name.split(" ")[0]).join("/")}` : ""}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: leaderColor, fontFamily: "'Oswald', sans-serif" }}>
                  {matchStatusLabel(m, idx)}
                </div>
              </div>
              {idx === 0 && <div style={{ height: 1, background: colors.greenLight + "15", margin: "8px 0" }} />}
            </div>
          );
        })}
      </Card>

      {/* Overall Points */}
      <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.greenDark} 100%)` }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 12 }}>
          Overall Standings
        </div>
        {[
          { label: "Front 9 (Scramble)", pts: points.front9 },
          { label: "Match 1", pts: points.matches[0] },
          { label: "Match 2", pts: points.matches[1] },
        ].map(({ label, pts }, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: colors.textDim, fontFamily: "'Oswald', sans-serif" }}>{label}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: pts?.pigs > pts?.happy ? TEAMS.pigs.color : colors.textMuted, fontFamily: "'Oswald', sans-serif", minWidth: 16, textAlign: "right" }}>{pts ? fmtPts(pts.pigs) : "–"}</span>
              <span style={{ fontSize: 10, color: colors.textMuted, fontFamily: "'Oswald', sans-serif" }}>–</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pts?.happy > pts?.pigs ? TEAMS.happy.color : colors.textMuted, fontFamily: "'Oswald', sans-serif", minWidth: 16 }}>{pts ? fmtPts(pts.happy) : "–"}</span>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: colors.gold + "33", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>TOTAL</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: points.total.pigs > points.total.happy ? TEAMS.pigs.color : colors.text, fontFamily: "'Oswald', sans-serif", minWidth: 20, textAlign: "right" }}>{fmtPts(points.total.pigs)}</span>
            <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: "'Oswald', sans-serif" }}>–</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: points.total.happy > points.total.pigs ? TEAMS.happy.color : colors.text, fontFamily: "'Oswald', sans-serif", minWidth: 20 }}>{fmtPts(points.total.happy)}</span>
          </div>
        </div>
        {scores.finalized && (
          <button onClick={onShowResults} style={{
            width: "100%", marginTop: 12, padding: "10px 0", borderRadius: 8, cursor: "pointer",
            background: colors.gold, border: "none",
            color: colors.bg, fontSize: 13, fontWeight: 700, fontFamily: "'Oswald', sans-serif", letterSpacing: 1.5,
          }}>VIEW FINAL RESULTS →</button>
        )}
      </Card>

      {/* Current Hole */}
      <Card style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { setSelectedHole(currentHole - 1); setPage("holes"); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>Now Playing</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif" }}>Hole {hole.num}</span>
              {hole.name && <span style={{ fontSize: 13, color: colors.textDim, fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>{hole.name}</span>}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: colors.textDim }}>Par {hole.par}</span>
              <span style={{ fontSize: 12, color: colors.textDim }}>{hole.yards} yds</span>
              <span style={{ fontSize: 12, color: colors.textDim }}>SI {hole.si}</span>
            </div>
          </div>
          {hole.challenge && <ChallengeBadge type={hole.challenge} />}
          <span style={{ fontSize: 20, color: colors.textMuted }}>›</span>
        </div>
      </Card>

      {/* Side Games Quick Status */}
      <SectionTitle icon="🎲">Side Games</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { icon: "🎯", label: "CTP Pot", value: "£30", sub: "Next: Hole 5" },
          { icon: "💥", label: "Long Drive", value: "Hole 8", sub: "£30 swindle" },
          { icon: "🏐", label: "Ball Alive", value: "8/8", sub: "All balls in play" },
          { icon: "🎫", label: "Token", value: "—", sub: "No hazards yet" },
        ].map((g, i) => (
          <Card key={i} style={{ padding: 12 }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{g.icon}</div>
            <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: 1, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>{g.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif" }}>{g.value}</div>
            <div style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>{g.sub}</div>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <SectionTitle icon="⚡">Quick Access</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { icon: "📖", label: "Tournament Rules", page: "rules" },
          { icon: "🎰", label: "The Odds", page: "odds" },
          { icon: "👥", label: "Player Profiles", page: "players" },
        ].map((link, i) => (
          <Card key={i} onClick={() => setPage(link.page)} style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{link.label}</span>
            </div>
            <span style={{ fontSize: 16, color: colors.textMuted }}>›</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScoringPage({ scores, setScores, currentHole, setCurrentHole, resetScores, currentTeam, currentPlayer, onChangePlayer }) {
  const hole = HOLES[currentHole - 1];
  const isBack9 = currentHole > 9;
  const [showFinalise, setShowFinalise] = useState(false);

  const updateScore = (team, value) => {
    if (!isBack9) {
      setScores(prev => {
        const next = {
          ...prev,
          scramble: { ...prev.scramble, [team]: { ...prev.scramble[team], [currentHole]: value } },
        };
        if (!prev.parToPints?.triggered && currentHole > 1 && value === hole.par) {
          const otherTeam = team === "pigs" ? "happy" : "pigs";
          next.parToPints = { triggered: true, nominatedTeam: otherTeam, spinResult: null, dismissed: false, holeNum: currentHole };
        }
        return next;
      });
    }
  };

  const updateMatchPlay = (matchIdx, holeNum, winner) => {
    setScores(prev => {
      const matches = [...prev.matchPlay];
      matches[matchIdx] = { ...matches[matchIdx], [holeNum]: winner };
      return { ...prev, matchPlay: matches };
    });
  };

  const updateScrambleTeeShot = (team, playerId) => {
    setScores(prev => ({
      ...prev,
      teeShotUsed: {
        ...prev.teeShotUsed,
        scramble: {
          ...prev.teeShotUsed?.scramble,
          [team]: { ...prev.teeShotUsed?.scramble?.[team], [currentHole]: playerId },
        },
      },
    }));
  };

  // Tally helpers
  const scrambleTeeShots = (team) => {
    const used = scores.teeShotUsed?.scramble?.[team] || {};
    return TEAMS[team].members.reduce((acc, pid) => {
      acc[pid] = Object.values(used).filter(v => v === pid).length;
      return acc;
    }, {});
  };

  const getHoleCircleStyle = (hNum) => {
    if (hNum === currentHole) return { bg: colors.gold, border: colors.gold, text: colors.bg };
    if (hNum <= 9) {
      const p = scores.scramble.pigs[hNum] > 0;
      const hp = scores.scramble.happy[hNum] > 0;
      if (p && hp) return { bg: "#4CAF5040", border: "#4CAF50", text: "#4CAF50" };
      if (p) return { bg: TEAMS.pigs.color + "30", border: TEAMS.pigs.color + "88", text: TEAMS.pigs.color };
      if (hp) return { bg: TEAMS.happy.color + "30", border: TEAMS.happy.color + "88", text: TEAMS.happy.color };
    } else {
      const r0 = scores.matchPlay[0]?.[hNum];
      const r1 = scores.matchPlay[1]?.[hNum];
      if (r0 || r1) {
        const winner = r0 === r1 ? r0 : (r0 && !r1 ? r0 : (!r0 && r1 ? r1 : "halved"));
        if (winner === "pigs") return { bg: TEAMS.pigs.color + "30", border: TEAMS.pigs.color + "88", text: TEAMS.pigs.color };
        if (winner === "happy") return { bg: TEAMS.happy.color + "30", border: TEAMS.happy.color + "88", text: TEAMS.happy.color };
        return { bg: colors.gold + "30", border: colors.gold + "88", text: colors.gold };
      }
    }
    return { bg: colors.bgCard, border: colors.greenLight + "22", text: colors.textDim };
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 4px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
          {isBack9 ? "Match Play" : "Texas Scramble"}
        </div>
        {currentPlayer && (
          <button onClick={onChangePlayer} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: `1px solid ${colors.greenLight}22`,
            borderRadius: 20, padding: "4px 10px", cursor: "pointer",
          }}>
            <span style={{ fontSize: 14 }}>{PLAYERS[currentPlayer].emoji}</span>
            <span style={{ fontSize: 10, color: colors.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: 0.5 }}>
              {PLAYERS[currentPlayer].name}
            </span>
            <span style={{ fontSize: 9, color: colors.textMuted }}>▾</span>
          </button>
        )}
      </div>

      {/* Hole Selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", paddingBottom: 12, marginBottom: 16 }}>
        {HOLES.map((h, i) => {
          const cs = getHoleCircleStyle(h.num);
          return (
            <button key={i} onClick={() => setCurrentHole(h.num)} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: cs.bg,
              border: `1.5px solid ${cs.border}`,
              color: cs.text,
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              fontFamily: "'Oswald', sans-serif",
              position: "relative", flexShrink: 0,
            }}>
              {h.num}
              {h.challenge && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 7, height: 7, borderRadius: "50%",
                  background: CHALLENGE_INFO[h.challenge].color,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Hole Info Bar */}
      <Card style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif" }}>Hole {hole.num}</span>
            {hole.name && <span style={{ fontSize: 13, color: colors.textDim, fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>{hole.name}</span>}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 12, color: colors.textDim, fontFamily: "'Oswald', sans-serif" }}>Par {hole.par}</span>
            <span style={{ fontSize: 12, color: colors.textDim, fontFamily: "'Oswald', sans-serif" }}>{hole.yards}y</span>
          </div>
        </div>
        {hole.challenge && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <ChallengeBadge type={hole.challenge} />
            <span style={{ fontSize: 11, color: colors.textDim }}>{CHALLENGE_INFO[hole.challenge].desc}</span>
          </div>
        )}
      </Card>

      {/* Score Input */}
      {!isBack9 ? (
        /* Front 9 Scramble */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(currentTeam === "happy" ? ["happy", "pigs"] : ["pigs", "happy"]).map(team => {
            const score = scores.scramble[team][currentHole] || 0;
            const isMyTeam = currentTeam === team;
            const isOther = currentTeam !== null && !isMyTeam;

            if (isOther) {
              /* Condensed read-only card for the other team */
              return (
                <Card key={team} style={{ background: `${TEAMS[team].color}05`, border: `1px solid ${TEAMS[team].color}18`, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TeamBadge team={team} size="sm" />
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        fontSize: 28, fontWeight: 700,
                        color: score > 0 ? colors.textDim : colors.textMuted,
                        fontFamily: "'Oswald', sans-serif",
                      }}>{score || "–"}</div>
                      {score > 0 && (
                        <div style={{
                          fontSize: 11, fontWeight: 600, fontFamily: "'Oswald', sans-serif",
                          color: score - hole.par > 0 ? colors.danger : score - hole.par < 0 ? colors.accent : colors.gold,
                        }}>
                          {score - hole.par === 0 ? "Par" : score - hole.par === -1 ? "Birdie" : score - hole.par === -2 ? "Eagle" : score - hole.par > 0 ? `+${score - hole.par}` : score - hole.par}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            /* Full card — my team (or spectator view when not logged in) */
            return (
              <Card key={team} style={{ background: `${TEAMS[team].color}08`, border: `2px solid ${TEAMS[team].color}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <TeamBadge team={team} size="lg" />
                    <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4, fontFamily: "'Oswald', sans-serif" }}>
                      {TEAMS[team].members.map(m => PLAYERS[m].name).join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {isMyTeam ? (
                      <>
                        <button onClick={() => updateScore(team, Math.max(0, score - 1))} style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: colors.bgSurface, border: `1px solid ${colors.greenLight}33`,
                          color: colors.text, fontSize: 20, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>−</button>
                        <div style={{
                          fontSize: 36, fontWeight: 700, color: score > 0 ? colors.white : colors.textMuted,
                          fontFamily: "'Oswald', sans-serif", minWidth: 36, textAlign: "center",
                        }}>{score || "–"}</div>
                        <button onClick={() => updateScore(team, score + 1)} style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: colors.gold, border: "none",
                          color: colors.bg, fontSize: 20, cursor: "pointer", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>+</button>
                      </>
                    ) : (
                      <div style={{
                        fontSize: 36, fontWeight: 700, color: score > 0 ? colors.white : colors.textMuted,
                        fontFamily: "'Oswald', sans-serif", minWidth: 36, textAlign: "center",
                      }}>{score || "–"}</div>
                    )}
                  </div>
                </div>
                {score > 0 && (
                  <div style={{
                    textAlign: "right", fontSize: 13, marginTop: 4,
                    color: score - hole.par > 0 ? colors.danger : score - hole.par < 0 ? colors.accent : colors.gold,
                    fontWeight: 600, fontFamily: "'Oswald', sans-serif",
                  }}>
                    {score - hole.par === 0 ? "Par" : score - hole.par === -1 ? "Birdie!" : score - hole.par === -2 ? "Eagle!!" : score - hole.par > 0 ? `+${score - hole.par}` : score - hole.par}
                  </div>
                )}
                <TeeShotPicker
                  players={TEAMS[team].members}
                  selected={scores.teeShotUsed?.scramble?.[team]?.[currentHole] || null}
                  onSelect={isMyTeam ? (pid) => updateScrambleTeeShot(team, pid) : null}
                  teamColor={TEAMS[team].color}
                  counts={scrambleTeeShots(team)}
                  minRequired={2}
                  currentHole={currentHole}
                />
              </Card>
            );
          })}
        </div>
      ) : (
        /* Back 9 Match Play */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1].map(matchIdx => (
            <Card key={matchIdx}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 10 }}>
                Match {matchIdx + 1}
              </div>
              <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 12 }}>
                {scores.matchPairings[matchIdx]
                  ? `${scores.matchPairings[matchIdx].pigs.map(p => PLAYERS[p].name).join(" & ")} vs ${scores.matchPairings[matchIdx].happy.map(p => PLAYERS[p].name).join(" & ")}`
                  : "Pairings not set yet"}
              </div>
              {scores.matchPairings[matchIdx] ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    {["pigs", "happy", "halved"].map(result => {
                      const current = scores.matchPlay[matchIdx]?.[currentHole];
                      const active = current === result;
                      return (
                        <button key={result} onClick={() => updateMatchPlay(matchIdx, currentHole, result)} style={{
                          padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                          background: active ? (result === "pigs" ? TEAMS.pigs.color : result === "happy" ? TEAMS.happy.color : colors.gold) : colors.bgSurface,
                          border: `1px solid ${active ? "transparent" : colors.greenLight + "33"}`,
                          color: active ? "#fff" : colors.textDim,
                          fontSize: 12, fontWeight: 600, fontFamily: "'Oswald', sans-serif",
                        }}>
                          {result === "halved" ? "Halved" : TEAMS[result].short}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <button onClick={() => {}} style={{
                  width: "100%", padding: 10, borderRadius: 8, cursor: "pointer",
                  background: colors.gold + "22", border: `1px solid ${colors.gold}44`,
                  color: colors.gold, fontSize: 12, fontWeight: 600,
                  fontFamily: "'Oswald', sans-serif",
                }}>Set Pairings on Turn</button>
              )}
            </Card>
          ))}

          {/* Pairing Setup Modal trigger */}
          {!scores.matchPairings[0] && (
            <PairingSetup scores={scores} setScores={setScores} />
          )}
        </div>
      )}

      {/* Nav */}
      {(() => {
        const teeShotAttributed = !currentTeam || !!scores.teeShotUsed?.scramble?.[currentTeam]?.[currentHole];
        const canAdvance = isBack9 || teeShotAttributed;
        return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 12 }}>
              <button onClick={() => setCurrentHole(Math.max(1, currentHole - 1))} disabled={currentHole === 1} style={{
                flex: 1, padding: 12, borderRadius: 10, cursor: currentHole === 1 ? "default" : "pointer",
                background: colors.bgCard, border: `1px solid ${colors.greenLight}22`,
                color: currentHole === 1 ? colors.textMuted : colors.text,
                fontSize: 13, fontWeight: 600, fontFamily: "'Oswald', sans-serif",
                opacity: currentHole === 1 ? 0.4 : 1,
              }}>‹ Prev</button>
              <button onClick={() => canAdvance && setCurrentHole(Math.min(18, currentHole + 1))} disabled={currentHole === 18 || !canAdvance} style={{
                flex: 1, padding: 12, borderRadius: 10, cursor: (currentHole === 18 || !canAdvance) ? "default" : "pointer",
                background: canAdvance ? colors.gold : colors.bgCard,
                border: canAdvance ? "none" : `1px solid ${colors.greenLight}22`,
                color: canAdvance ? colors.bg : colors.textMuted,
                fontSize: 13, fontWeight: 700, fontFamily: "'Oswald', sans-serif",
                opacity: (currentHole === 18 || !canAdvance) ? 0.4 : 1,
              }}>Next ›</button>
            </div>
            {!canAdvance && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>
                Select tee shot to continue
              </div>
            )}
          </>
        );
      })()}

      {/* Finalise Scores — hole 18 only */}
      {currentHole === 18 && !scores.finalized && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowFinalise(true)} style={{
            width: "100%", padding: 14, borderRadius: 10, cursor: "pointer",
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
            border: "none", color: colors.bg, fontSize: 14, fontWeight: 700,
            fontFamily: "'Oswald', sans-serif", letterSpacing: 2, textTransform: "uppercase",
          }}>Finalise Scores →</button>
        </div>
      )}

      {/* Reset Scores — only for H or Moon */}
      {(currentPlayer === "h" || currentPlayer === "moon") && (
        <div style={{ marginTop: 40, paddingBottom: 8, textAlign: "center" }}>
          <button onClick={resetScores} style={{
            background: "none", border: `1px solid ${colors.textMuted}33`,
            borderRadius: 8, padding: "6px 16px", cursor: "pointer",
            color: colors.textMuted, fontSize: 10, fontFamily: "'Oswald', sans-serif",
            letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.4,
          }}>Reset Scores</button>
        </div>
      )}

      {showFinalise && (
        <FinalScoresOverlay
          scores={scores}
          setScores={setScores}
          currentTeam={currentTeam}
          onClose={() => setShowFinalise(false)}
        />
      )}
    </div>
  );
}

function PairingSetup({ scores, setScores }) {
  const [m1Pigs, setM1Pigs] = useState([]);
  const [m1Happy, setM1Happy] = useState([]);

  const togglePlayer = (playerId, team) => {
    if (team === "pigs") {
      setM1Pigs(prev => prev.includes(playerId) ? prev.filter(p => p !== playerId) : prev.length < 2 ? [...prev, playerId] : prev);
    } else {
      setM1Happy(prev => prev.includes(playerId) ? prev.filter(p => p !== playerId) : prev.length < 2 ? [...prev, playerId] : prev);
    }
  };

  const canSave = m1Pigs.length === 2 && m1Happy.length === 2;

  const savePairings = () => {
    if (!canSave) return;
    const m2Pigs = TEAMS.pigs.members.filter(p => !m1Pigs.includes(p));
    const m2Happy = TEAMS.happy.members.filter(p => !m1Happy.includes(p));
    setScores(prev => ({
      ...prev,
      matchPairings: [
        { pigs: m1Pigs, happy: m1Happy },
        { pigs: m2Pigs, happy: m2Happy },
      ],
    }));
  };

  return (
    <Card style={{ background: colors.gold + "08", border: `1px solid ${colors.gold}33` }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: colors.gold, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 12 }}>
        Set Match Play Pairings
      </div>
      <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 12 }}>
        Select 2 players from each team for Match 1. The remaining players will form Match 2.
      </div>
      {["pigs", "happy"].map(team => (
        <div key={team} style={{ marginBottom: 12 }}>
          <TeamBadge team={team} />
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {TEAMS[team].members.map(p => {
              const selected = team === "pigs" ? m1Pigs.includes(p) : m1Happy.includes(p);
              return (
                <button key={p} onClick={() => togglePlayer(p, team)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                  borderRadius: 8, cursor: "pointer",
                  background: selected ? TEAMS[team].color + "33" : colors.bgSurface,
                  border: `1px solid ${selected ? TEAMS[team].color : colors.greenLight + "22"}`,
                  color: selected ? colors.white : colors.textDim,
                  fontSize: 12, fontWeight: 600,
                }}>
                  <span>{PLAYERS[p].emoji}</span> {PLAYERS[p].name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button onClick={savePairings} disabled={!canSave} style={{
        width: "100%", padding: 12, borderRadius: 10, cursor: canSave ? "pointer" : "default",
        background: canSave ? colors.gold : colors.bgSurface,
        border: "none", color: canSave ? colors.bg : colors.textMuted,
        fontSize: 13, fontWeight: 700, fontFamily: "'Oswald', sans-serif",
        marginTop: 8, opacity: canSave ? 1 : 0.5,
      }}>Lock In Pairings</button>
    </Card>
  );
}

function HolesPage({ selectedHole, setSelectedHole }) {
  const hole = HOLES[selectedHole];
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
          Waterfall Course — Hole Guide
        </div>
      </div>

      {/* Hole Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "8px 0 20px", flexWrap: "wrap" }}>
        {HOLES.map((h, i) => (
          <button key={i} onClick={() => setSelectedHole(i)} style={{
            width: 30, height: 30, borderRadius: "50%",
            background: selectedHole === i ? colors.gold : colors.bgCard,
            border: `1.5px solid ${selectedHole === i ? colors.gold : colors.greenLight + "22"}`,
            color: selectedHole === i ? colors.bg : colors.textDim,
            fontWeight: 700, fontSize: 12, cursor: "pointer",
            fontFamily: "'Oswald', sans-serif", position: "relative",
          }}>
            {h.num}
            {h.challenge && selectedHole !== i && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                width: 7, height: 7, borderRadius: "50%",
                background: CHALLENGE_INFO[h.challenge].color,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Hole Detail */}
      <Card style={{ marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -20, right: -20, fontSize: 120,
          opacity: 0.03, fontWeight: 900, fontFamily: "'Oswald', sans-serif",
          color: colors.gold, lineHeight: 1,
        }}>{hole.num}</div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
                {hole.par === 3 ? "Par 3" : hole.par === 5 ? "Par 5" : "Par 4"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif" }}>
                  {hole.num}
                </span>
                {hole.name && (
                  <span style={{ fontSize: 18, color: colors.text, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                    {hole.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, margin: "12px 0", padding: "12px 0", borderTop: `1px solid ${colors.greenLight}15`, borderBottom: `1px solid ${colors.greenLight}15` }}>
            {[
              { label: "PAR", value: hole.par },
              { label: "YARDS", value: hole.yards },
              { label: "S.I.", value: hole.si },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: colors.textMuted, fontFamily: "'Oswald', sans-serif" }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: colors.white, fontFamily: "'Oswald', sans-serif" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {hole.challenge && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: 10,
              background: CHALLENGE_INFO[hole.challenge].color + "12",
              borderRadius: 10, marginBottom: 12,
              border: `1px solid ${CHALLENGE_INFO[hole.challenge].color}22`,
            }}>
              <span style={{ fontSize: 20 }}>{CHALLENGE_INFO[hole.challenge].icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: CHALLENGE_INFO[hole.challenge].color, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>
                  {CHALLENGE_INFO[hole.challenge].label}
                </div>
                <div style={{ fontSize: 11, color: colors.textDim }}>{CHALLENGE_INFO[hole.challenge].desc}</div>
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, lineHeight: 1.7, color: colors.textDim, margin: "0 0 12px" }}>
            {hole.desc}
          </p>

          {hole.image && (
            <div style={{ margin: "0 -16px -16px" }}>
              <img
                src={hole.image}
                alt={`Hole ${hole.num}${hole.name ? ` – ${hole.name}` : ""}`}
                style={{ width: "100%", display: "block", borderRadius: "0 0 12px 12px" }}
                onError={e => { e.currentTarget.parentElement.style.display = "none" }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Swipe hint */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button onClick={() => setSelectedHole(Math.max(0, selectedHole - 1))} disabled={selectedHole === 0} style={{
          flex: 1, padding: 10, borderRadius: 10, cursor: selectedHole === 0 ? "default" : "pointer",
          background: colors.bgCard, border: `1px solid ${colors.greenLight}22`,
          color: selectedHole === 0 ? colors.textMuted : colors.text,
          fontSize: 13, fontWeight: 600, fontFamily: "'Oswald', sans-serif",
          opacity: selectedHole === 0 ? 0.4 : 1,
        }}>‹ Hole {selectedHole > 0 ? selectedHole : ""}</button>
        <button onClick={() => setSelectedHole(Math.min(17, selectedHole + 1))} disabled={selectedHole === 17} style={{
          flex: 1, padding: 10, borderRadius: 10, cursor: selectedHole === 17 ? "default" : "pointer",
          background: colors.gold, border: "none",
          color: colors.bg, fontSize: 13, fontWeight: 700, fontFamily: "'Oswald', sans-serif",
          opacity: selectedHole === 17 ? 0.4 : 1,
        }}>Hole {selectedHole < 17 ? selectedHole + 2 : ""} ›</button>
      </div>
    </div>
  );
}

function PlayersPage() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
          The Competitors
        </div>
      </div>
      {["pigs", "happy"].map(team => (
        <div key={team} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <TeamBadge team={team} size="lg" />
            <span style={{ fontSize: 12, color: colors.textDim }}>{TEAMS[team].name}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TEAMS[team].members.map(pid => {
              const p = PLAYERS[pid];
              const isExpanded = expanded === pid;
              return (
                <Card key={pid} onClick={() => setExpanded(isExpanded ? null : pid)} style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar player={pid} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: colors.text, fontFamily: "'Oswald', sans-serif" }}>{p.name}</span>
                        {p.captain && <span style={{ fontSize: 9, padding: "1px 5px", background: colors.gold + "33", color: colors.gold, borderRadius: 4, fontWeight: 700, fontFamily: "'Oswald', sans-serif" }}>CPT</span>}
                      </div>
                      {!isExpanded && (
                        <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                          {p.bio}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 14, color: colors.textMuted, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.greenLight}15` }}>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: colors.textDim, margin: 0 }}>{p.bio}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function OddsPage() {
  const [expandedCat, setExpandedCat] = useState(0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
          Official Odds
        </div>
        <h2 style={{
          margin: "4px 0 4px", fontSize: 24, fontWeight: 700,
          fontFamily: "'Playfair Display', serif", color: colors.gold,
        }}>The Bookmaker</h2>
        <div style={{ fontSize: 10, color: colors.textMuted, fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>
          Compiled with zero credibility and maximum bias
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {ODDS_CATEGORIES.map((cat, ci) => (
          <Card key={ci} style={{ padding: 0, overflow: "hidden" }}>
            <div
              onClick={() => setExpandedCat(expandedCat === ci ? null : ci)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, fontFamily: "'Oswald', sans-serif", letterSpacing: 0.5 }}>
                  {cat.title}
                </span>
              </div>
              <span style={{
                fontSize: 14, color: colors.textMuted,
                transform: expandedCat === ci ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}>›</span>
            </div>
            {expandedCat === ci && (
              <div style={{ borderTop: `1px solid ${colors.greenLight}15` }}>
                {cat.entries.map((entry, ei) => (
                  <div key={ei} style={{
                    padding: "14px 16px",
                    borderBottom: ei < cat.entries.length - 1 ? `1px solid ${colors.greenLight}10` : "none",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: colors.text, fontWeight: 600, fontFamily: "'Oswald', sans-serif" }}>{entry.name}</span>
                      <span style={{
                        fontSize: 15, fontWeight: 700, color: colors.gold,
                        fontFamily: "'Oswald', sans-serif",
                        background: colors.gold + "15", padding: "2px 10px", borderRadius: 6,
                      }}>{entry.odds}</span>
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.7, color: colors.textDim, margin: 0, fontStyle: "italic" }}>
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RulesPage() {
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>
          Tournament Rules
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: colors.gold }}>
          The Laws of the Land
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {RULES.map((rule, i) => (
          <Card key={i} style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                minWidth: 24, height: 24, borderRadius: "50%",
                background: colors.gold + "22", border: `1px solid ${colors.gold}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif",
              }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, fontFamily: "'Oswald', sans-serif", letterSpacing: 0.5 }}>
                  {rule.title}
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.textDim, margin: "4px 0 0" }}>
                  {rule.text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Fun footer */}
      <div style={{ textAlign: "center", marginTop: 24, padding: 16 }}>
        <div style={{ fontSize: 11, color: colors.textMuted, fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>
          Play fair. Have fun. Moon — buy a round.
        </div>
      </div>
    </div>
  );
}

// ─── NAV ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "scoring", icon: "📝", label: "Scores" },
  { id: "holes", icon: "⛳", label: "Holes" },
  { id: "players", icon: "👥", label: "Players" },
  { id: "odds", icon: "🎰", label: "Odds" },
];

// ─── TEE SHOT PICKER ────────────────────────────────────────────────────────────

function TeeShotPicker({ players, selected, onSelect, teamColor, counts, minRequired, currentHole }) {
  const isBack9 = currentHole > 9;
  const holesInHalf = 9;
  const holesPlayed = isBack9 ? currentHole - 9 : currentHole;
  const holesLeft = holesInHalf - holesPlayed;
  const isReadOnly = !onSelect;

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${teamColor}22` }}>
      <div style={{ fontSize: 8, letterSpacing: 2, color: teamColor, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 8 }}>
        Tee Shot Used
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {players.map(pid => {
          const p = PLAYERS[pid];
          const isSelected = selected === pid;
          const count = counts[pid] || 0;
          const atRisk = holesLeft < (minRequired - count) && count < minRequired;
          const done = count >= minRequired;
          const countColor = done ? "#4ECDC4" : atRisk ? "#F4A940" : teamColor;
          const countLabel = done ? `${count} ✓` : atRisk ? `${count} !` : `${count}/${minRequired}`;
          return (
            <button
              key={pid}
              onClick={isReadOnly ? undefined : () => onSelect(isSelected ? null : pid)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 20, cursor: isReadOnly ? "default" : "pointer",
                background: isSelected ? teamColor + "33" : "transparent",
                border: `1px solid ${isSelected ? teamColor : teamColor + "33"}`,
                color: isSelected ? "#fff" : teamColor,
                fontSize: 11, fontWeight: 600, fontFamily: "'Oswald', sans-serif",
                opacity: isReadOnly && !isSelected ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 13 }}>{p.emoji}</span>
              {p.name}
              <span style={{
                fontSize: 9, fontWeight: 700, color: done ? "#4ECDC4" : atRisk ? "#F4A940" : (isSelected ? "#fff" : teamColor),
                opacity: 0.85, marginLeft: 2,
              }}>{countLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FINAL SCORES OVERLAY ───────────────────────────────────────────────────────

function PointsTable({ points, compact = false }) {
  const fmtPts = (n) => { if (n === null || n === undefined) return "–"; if (n % 1 === 0) return String(n); const w = Math.floor(n); return w === 0 ? "½" : `${w}½`; };
  const rows = [
    { label: "Front 9 (Scramble)", pts: points.front9 },
    { label: "Match 1", pts: points.matches[0] },
    { label: "Match 2", pts: points.matches[1] },
  ];
  return (
    <div>
      {rows.map(({ label, pts }, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? 4 : 6 }}>
          <div style={{ fontSize: compact ? 10 : 11, color: colors.textDim, fontFamily: "'Oswald', sans-serif" }}>{label}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: pts?.pigs > pts?.happy ? TEAMS.pigs.color : colors.textMuted, fontFamily: "'Oswald', sans-serif", minWidth: 14, textAlign: "right" }}>{pts ? fmtPts(pts.pigs) : "–"}</span>
            <span style={{ fontSize: 9, color: colors.textMuted }}>–</span>
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: pts?.happy > pts?.pigs ? TEAMS.happy.color : colors.textMuted, fontFamily: "'Oswald', sans-serif", minWidth: 14 }}>{pts ? fmtPts(pts.happy) : "–"}</span>
          </div>
        </div>
      ))}
      <div style={{ height: 1, background: colors.gold + "33", margin: `${compact ? 6 : 8}px 0` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>TOTAL</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: points.total.pigs > points.total.happy ? TEAMS.pigs.color : colors.text, fontFamily: "'Oswald', sans-serif", minWidth: 18, textAlign: "right" }}>{fmtPts(points.total.pigs)}</span>
          <span style={{ fontSize: 10, color: colors.textMuted }}>–</span>
          <span style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: points.total.happy > points.total.pigs ? TEAMS.happy.color : colors.text, fontFamily: "'Oswald', sans-serif", minWidth: 18 }}>{fmtPts(points.total.happy)}</span>
        </div>
      </div>
    </div>
  );
}

function FinalScoresOverlay({ scores, setScores, currentTeam, onClose }) {
  const points = calcPoints(scores);
  const confs = scores.confirmations || { pigs: false, happy: false };
  const bothConfirmed = confs.pigs && confs.happy;

  const front9Pigs = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.pigs[h.num] || 0), 0);
  const front9Happy = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.happy[h.num] || 0), 0);
  const front9PigsPar = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.pigs[h.num] > 0 ? h.par : 0), 0);
  const front9HappyPar = HOLES.slice(0, 9).reduce((s, h) => s + (scores.scramble.happy[h.num] > 0 ? h.par : 0), 0);

  const confirm = () => {
    if (!currentTeam) {
      setScores(prev => ({ ...prev, confirmations: { pigs: true, happy: true }, finalized: true }));
      onClose();
      return;
    }
    setScores(prev => {
      const nextConfs = { ...(prev.confirmations || { pigs: false, happy: false }), [currentTeam]: true };
      const nowBoth = nextConfs.pigs && nextConfs.happy;
      return { ...prev, confirmations: nextConfs, finalized: nowBoth };
    });
  };

  const hasConfirmed = currentTeam ? confs[currentTeam] : false;
  const otherTeam = currentTeam === "pigs" ? "happy" : "pigs";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(10,26,15,0.96)",
      display: "flex", flexDirection: "column",
      overflowY: "auto", padding: "24px 16px 40px",
    }}>
      <button onClick={onClose} style={{
        alignSelf: "flex-end", marginBottom: 8,
        background: "none", border: `1px solid ${colors.textMuted}44`,
        borderRadius: 8, padding: "4px 10px", cursor: "pointer",
        color: colors.textMuted, fontSize: 18, lineHeight: 1,
      }}>✕</button>

      <div style={{ fontSize: 9, letterSpacing: 3, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", textAlign: "center", marginBottom: 4 }}>
        Final Scores
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif", textAlign: "center", marginBottom: 20 }}>
        Review & Confirm
      </div>

      {/* Front 9 Scramble */}
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 10 }}>Front 9 — Texas Scramble</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {["pigs", "happy"].map(team => {
            const score = team === "pigs" ? front9Pigs : front9Happy;
            const par = team === "pigs" ? front9PigsPar : front9HappyPar;
            const diff = score > 0 ? score - par : null;
            const isWinner = team === "pigs" ? front9Pigs < front9Happy : front9Happy < front9Pigs;
            return (
              <div key={team} style={{ textAlign: "center", flex: 1, opacity: front9Pigs > 0 && front9Happy > 0 && !isWinner ? 0.5 : 1 }}>
                <TeamBadge team={team} size="md" />
                <div style={{ fontSize: 32, fontWeight: 700, color: isWinner ? TEAMS[team].color : colors.white, fontFamily: "'Oswald', sans-serif", lineHeight: 1, marginTop: 4 }}>{score || "–"}</div>
                {diff !== null && <div style={{ fontSize: 11, color: diff > 0 ? colors.danger : colors.accent, fontFamily: "'Oswald', sans-serif" }}>{diff > 0 ? "+" : ""}{diff}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Back 9 Match Play */}
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 10 }}>Back 9 — Match Play</div>
        {[0, 1].map(idx => {
          const m = calcMatchResult(scores.matchPlay[idx] || {});
          const pairings = scores.matchPairings?.[idx];
          const leaderColor = m.leader ? TEAMS[m.leader].color : colors.gold;
          const label = m.allDone
            ? m.leader ? `${TEAMS[m.leader].name} win ${m.leader === "pigs" ? m.pigs : m.happy}–${m.leader === "pigs" ? m.happy : m.pigs}` : "Halved"
            : m.leader ? `${TEAMS[m.leader].short} ${m.diff}UP` : "All Square";
          return (
            <div key={idx} style={{ marginBottom: idx === 0 ? 8 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "'Oswald', sans-serif" }}>
                  Match {idx + 1}{pairings ? ` · ${pairings.pigs.map(p => PLAYERS[p].name.split(" ")[0]).join("/")} vs ${pairings.happy.map(p => PLAYERS[p].name.split(" ")[0]).join("/")}` : ""}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: leaderColor, fontFamily: "'Oswald', sans-serif" }}>{label}</div>
              </div>
              {idx === 0 && <div style={{ height: 1, background: colors.greenLight + "15", margin: "6px 0" }} />}
            </div>
          );
        })}
      </div>

      {/* Points */}
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 10 }}>Overall Points</div>
        <PointsTable points={points} />
      </div>

      {/* Confirmation CTA */}
      {bothConfirmed ? (
        <button onClick={() => { setScores(prev => ({ ...prev, finalized: true })); onClose(); }} style={{
          width: "100%", padding: 14, borderRadius: 10, cursor: "pointer",
          background: colors.gold, border: "none",
          color: colors.bg, fontSize: 14, fontWeight: 700,
          fontFamily: "'Oswald', sans-serif", letterSpacing: 2, textTransform: "uppercase",
        }}>See Results →</button>
      ) : currentTeam && hasConfirmed ? (
        <div style={{ textAlign: "center", padding: 14, borderRadius: 10, background: colors.bgCard, border: `1px solid ${colors.greenLight}22` }}>
          <div style={{ fontSize: 12, color: colors.textDim, fontFamily: "'Oswald', sans-serif" }}>Waiting for</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEAMS[otherTeam].color, fontFamily: "'Oswald', sans-serif", marginTop: 2 }}>{TEAMS[otherTeam].name} to confirm…</div>
        </div>
      ) : (
        <button onClick={confirm} style={{
          width: "100%", padding: 14, borderRadius: 10, cursor: "pointer",
          background: currentTeam ? TEAMS[currentTeam].color : colors.gold,
          border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
          fontFamily: "'Oswald', sans-serif", letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          {currentTeam ? `Confirm as ${TEAMS[currentTeam].name}` : "Finalise Scores"}
        </button>
      )}
    </div>
  );
}

// ─── WINNING MODAL ───────────────────────────────────────────────────────────────

function WinningModal({ scores, onClose }) {
  const points = calcPoints(scores);
  const { pigs, happy } = points.total;
  const winner = pigs > happy ? "pigs" : happy > pigs ? "happy" : null;
  const winnerTeam = winner ? TEAMS[winner] : null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(10,26,15,0.97)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24, overflowY: "auto",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "none", border: `1px solid ${colors.textMuted}44`,
        borderRadius: 8, padding: "4px 10px", cursor: "pointer",
        color: colors.textMuted, fontSize: 18, lineHeight: 1,
      }}>✕</button>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>
          {winner ? (winner === "pigs" ? "🐷" : "😄") : "🤝"}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 700, fontFamily: "'Oswald', sans-serif",
          letterSpacing: 3, textTransform: "uppercase",
          background: winner
            ? `linear-gradient(135deg, ${winnerTeam.color} 0%, ${winnerTeam.colorLight || winnerTeam.color} 100%)`
            : `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {winner ? `${winnerTeam.name} Win!` : "It's a Tie!"}
        </div>
        <div style={{ fontSize: 13, color: colors.textDim, fontFamily: "'Oswald', sans-serif", marginTop: 6, letterSpacing: 1 }}>
          {winner ? `${pigs}–${happy} on points` : `${pigs}–${happy} — all to play for`}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 340, background: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.goldDim, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
          Final Points
        </div>
        <PointsTable points={points} />
      </div>

      <button onClick={onClose} style={{
        padding: "12px 32px", borderRadius: 10, cursor: "pointer",
        background: "none", border: `1px solid ${colors.gold}44`,
        color: colors.gold, fontSize: 13, fontWeight: 600,
        fontFamily: "'Oswald', sans-serif", letterSpacing: 1.5, textTransform: "uppercase",
      }}>Close</button>
    </div>
  );
}

// ─── PAR TO PINTS ───────────────────────────────────────────────────────────────

const WHEEL_SEGMENTS = [
  { label: "🍺", type: "beer",      color: "#F4A940" },
  { label: "🥃", type: "miniature", color: "#4ECDC4" },
  { label: "🍺", type: "beer",      color: "#F4A940" },
  { label: "🥃", type: "miniature", color: "#4ECDC4" },
  { label: "🍺", type: "beer",      color: "#F4A940" },
  { label: "🥃", type: "miniature", color: "#4ECDC4" },
  { label: "🍺", type: "beer",      color: "#F4A940" },
  { label: "🥃", type: "miniature", color: "#4ECDC4" },
];

// Segment centres (degrees): Beer=22.5,112.5,202.5,292.5 | Mini=67.5,157.5,247.5,337.5
const SPIN_TARGET = { beer: 5 * 360 + 67.5, miniature: 5 * 360 + 22.5 };

function ParToPintsOverlay({ scores, setScores, currentTeam }) {
  const { nominatedTeam, spinResult } = scores.parToPints || {};
  const nominated = TEAMS[nominatedTeam];
  const isNominated = currentTeam === nominatedTeam;
  const scoringTeam = TEAMS[nominatedTeam === "pigs" ? "happy" : "pigs"];
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!spinResult || hasAnimated.current) return;
    hasAnimated.current = true;
    setWheelRotation(SPIN_TARGET[spinResult]);
    setSpinning(true);
    const t1 = setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
      let c = 3;
      const tick = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(tick);
          setScores(prev => ({ ...prev, parToPints: { ...prev.parToPints, dismissed: true } }));
        }
      }, 1000);
    }, 4200);
    return () => clearTimeout(t1);
  }, [spinResult]); // eslint-disable-line

  const handleSpin = () => {
    if (spinning || spinResult) return;
    const result = Math.random() < 0.5 ? "beer" : "miniature";
    setScores(prev => ({ ...prev, parToPints: { ...prev.parToPints, spinResult: result } }));
  };

  const canSpin = currentTeam === nominatedTeam && !spinResult;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(10,26,15,0.92)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      {/* Close button */}
      <button
        onClick={() => setScores(prev => ({ ...prev, parToPints: { ...prev.parToPints, dismissed: true } }))}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: `1px solid ${colors.textMuted}44`,
          borderRadius: 8, padding: "4px 10px", cursor: "pointer",
          color: colors.textMuted, fontSize: 18, lineHeight: 1,
        }}
      >✕</button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>🍺</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: colors.gold, fontFamily: "'Oswald', sans-serif", letterSpacing: 2 }}>
          {isNominated ? "PAR TO PINTS — YOU'RE UP!" : "PAR TO PINTS!"}
        </div>
        <div style={{ fontSize: 14, color: nominated?.color || colors.text, fontFamily: "'Oswald', sans-serif", marginTop: 4, letterSpacing: 1 }}>
          {isNominated
            ? `${scoringTeam?.name} scored par — spin to find your fate!`
            : `${nominated?.name} face the wheel!`}
        </div>
      </div>

      {/* Wheel container */}
      <div style={{ position: "relative", width: 260, height: 280, margin: "16px auto 8px" }}>
        {/* Pointer */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0, zIndex: 2,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: `22px solid ${colors.gold}`,
        }} />

        {/* Wheel */}
        <div style={{
          position: "absolute", top: 22, left: "50%", transform: `translateX(-50%) rotate(${wheelRotation}deg)`,
          transition: spinning ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.08, 0.99)" : "none",
          width: 240, height: 240, borderRadius: "50%",
          background: `conic-gradient(${WHEEL_SEGMENTS.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(", ")})`,
          border: `4px solid ${colors.gold}44`,
          boxShadow: `0 0 30px ${colors.gold}33`,
        }}>
          {/* Segment labels */}
          {WHEEL_SEGMENTS.map((seg, i) => {
            const angle = i * 45 + 22.5; // centre of segment in degrees
            const rad = (angle - 90) * (Math.PI / 180);
            const r = 82;
            const x = 120 + r * Math.cos(rad);
            const y = 120 + r * Math.sin(rad);
            return (
              <div key={i} style={{
                position: "absolute", fontSize: 20,
                left: x - 12, top: y - 12,
                width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                userSelect: "none",
              }}>
                {seg.label}
              </div>
            );
          })}
        </div>

        {/* Wheel hub */}
        <div style={{
          position: "absolute", top: 22 + 100, left: "50%",
          transform: "translate(-50%, -50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: colors.gold, zIndex: 2,
          boxShadow: `0 0 8px ${colors.gold}88`,
        }} />
      </div>

      {/* CTA */}
      {!showResult && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          {canSpin ? (
            <button onClick={handleSpin} disabled={spinning} style={{
              padding: "14px 48px", borderRadius: 12,
              background: spinning ? colors.bgCard : colors.gold,
              border: "none", color: spinning ? colors.textMuted : colors.bg,
              fontSize: 20, fontWeight: 700, cursor: spinning ? "default" : "pointer",
              fontFamily: "'Oswald', sans-serif", letterSpacing: 2,
              boxShadow: spinning ? "none" : `0 0 20px ${colors.gold}66`,
              transition: "all 0.2s",
            }}>
              {spinning ? "SPINNING…" : "SPIN"}
            </button>
          ) : spinResult ? (
            <div style={{ fontSize: 13, color: colors.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>
              {spinning ? "SPINNING…" : "Revealing…"}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: 1 }}>
              Waiting for {nominated?.name} to spin…
            </div>
          )}
        </div>
      )}

      {/* Result card */}
      {showResult && (
        <div style={{
          textAlign: "center", marginTop: 8,
          padding: "20px 32px", borderRadius: 16,
          background: colors.bgCard,
          border: `2px solid ${spinResult === "beer" ? "#F4A940" : "#4ECDC4"}`,
          boxShadow: `0 0 30px ${spinResult === "beer" ? "#F4A94066" : "#4ECDC466"}`,
        }}>
          <div style={{ fontSize: 52, marginBottom: 4 }}>{spinResult === "beer" ? "🍺" : "🥃"}</div>
          <div style={{
            fontSize: 32, fontWeight: 700, fontFamily: "'Oswald', sans-serif",
            color: spinResult === "beer" ? "#F4A940" : "#4ECDC4", letterSpacing: 2,
          }}>
            {spinResult === "beer" ? "BEER!" : "MINIATURE!"}
          </div>
          <div style={{ fontSize: 16, color: colors.textDim, marginTop: 4, fontFamily: "'Oswald', sans-serif" }}>
            {isNominated ? "Down it! 🤘" : `${nominated?.name} — down it! 😈`}
          </div>
          {/* Countdown bar */}
          <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: colors.bgSurface, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: spinResult === "beer" ? "#F4A940" : "#4ECDC4",
              width: `${(countdown / 3) * 100}%`,
              transition: "width 1s linear",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PLAYER SELECT ──────────────────────────────────────────────────────────────

function PlayerSelectScreen({ onSelect }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: colors.bg,
      backgroundImage: `radial-gradient(ellipse at 50% 0%, ${colors.greenDark}66 0%, transparent 60%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      overflowY: "auto", padding: "40px 20px 60px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⛳</div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700, color: colors.gold,
            fontFamily: "'Oswald', sans-serif", letterSpacing: 1,
          }}>PINTFACE INVITATIONAL</h1>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 6, fontFamily: "'Oswald', sans-serif", letterSpacing: 2 }}>
            WHO ARE YOU?
          </div>
        </div>

        {["pigs", "happy"].map(team => (
          <div key={team} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <TeamBadge team={team} size="lg" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEAMS[team].members.map(pid => {
                const p = PLAYERS[pid];
                return (
                  <button key={pid} onClick={() => onSelect(pid)} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    background: colors.bgCard,
                    border: `1.5px solid ${TEAMS[team].color}33`,
                    width: "100%", textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = TEAMS[team].color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = TEAMS[team].color + "33"}
                  >
                    <Avatar player={pid} size={44} />
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, fontFamily: "'Oswald', sans-serif" }}>
                        {p.name}
                        {p.captain && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", background: colors.gold + "33", color: colors.gold, borderRadius: 4, fontWeight: 700 }}>CPT</span>}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2, lineHeight: 1.4, maxWidth: 260 }}>
                        {p.bio.length > 70 ? p.bio.slice(0, 68) + "…" : p.bio}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────────────────

const INITIAL_SCORES = {
  scramble: { pigs: {}, happy: {} },
  teeShotUsed: {
    scramble: { pigs: {}, happy: {} },
    matchPlay: [
      { pigs: {}, happy: {} },
      { pigs: {}, happy: {} },
    ],
  },
  matchPlay: [{}, {}],
  matchPairings: [null, null],
  confirmations: { pigs: false, happy: false },
  finalized: false,
  parToPints: {
    triggered: false,
    nominatedTeam: null,
    spinResult: null,
    dismissed: false,
    holeNum: null,
  },
};

const SCORES_DOC = () => doc(db, "game", "live");

export default function App() {
  const [page, setPage] = useState("home");
  const [currentHole, setCurrentHole] = useState(1);
  const [selectedHole, setSelectedHole] = useState(0);
  const [scores, setScoresLocal] = useState(INITIAL_SCORES);
  const [loading, setLoading] = useState(true);
  const [showWinning, setShowWinning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(
    () => localStorage.getItem("pintface_player") || null
  );

  const currentTeam = currentPlayer ? PLAYERS[currentPlayer].team : null;

  const selectPlayer = (pid) => {
    localStorage.setItem("pintface_player", pid);
    setCurrentPlayer(pid);
  };

  const changePlayer = () => {
    localStorage.removeItem("pintface_player");
    setCurrentPlayer(null);
  };

  const scrollRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      SCORES_DOC(),
      (snap) => {
        if (snap.exists()) setScoresLocal(snap.data());
        setLoading(false);
      },
      (err) => { console.error("Firestore error:", err); setLoading(false); }
    );
    return unsub;
  }, []);

  // Write-through: update local state immediately + persist to Firestore
  const setScores = useCallback((updater) => {
    setScoresLocal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setDoc(SCORES_DOC(), next).catch(console.error);
      return next;
    });
  }, []);

  const resetScores = useCallback(() => {
    if (window.confirm("Reset all scores? This cannot be undone.")) {
      setScores(INITIAL_SCORES);
    }
  }, [setScores]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    if (scores.finalized) setShowWinning(true);
  }, [scores.finalized]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: colors.bg, color: colors.text,
        fontFamily: "'Oswald', 'Playfair Display', sans-serif",
        position: "relative",
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${colors.greenDark}44 0%, transparent 60%)`,
      }}>
        {/* Content */}
        <div ref={scrollRef} style={{ paddingBottom: 80, overflowY: "auto" }}>
          {page === "home" && <HomePage scores={scores} currentHole={currentHole} setPage={setPage} setSelectedHole={setSelectedHole} onShowResults={() => setShowWinning(true)} />}
          {page === "scoring" && <ScoringPage scores={scores} setScores={setScores} currentHole={currentHole} setCurrentHole={setCurrentHole} resetScores={resetScores} currentTeam={currentTeam} currentPlayer={currentPlayer} onChangePlayer={changePlayer} />}
          {loading && page === "scoring" && (
            <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg + "cc", zIndex: 99 }}>
              <div style={{ color: colors.gold, fontFamily: "'Oswald', sans-serif", letterSpacing: 2, fontSize: 13 }}>LOADING SCORES…</div>
            </div>
          )}
          {page === "holes" && <HolesPage selectedHole={selectedHole} setSelectedHole={setSelectedHole} />}
          {page === "players" && <PlayersPage />}
          {page === "odds" && <OddsPage />}
          {page === "rules" && <RulesPage />}
        </div>

        {/* Bottom Nav */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: `linear-gradient(180deg, ${colors.bg}00 0%, ${colors.bg} 20%)`,
          paddingTop: 20,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-around", alignItems: "center",
            padding: "8px 8px 20px",
            background: colors.bgCard,
            borderTop: `1px solid ${colors.greenLight}15`,
            borderRadius: "20px 20px 0 0",
          }}>
            {NAV_ITEMS.map(item => {
              const active = page === item.id;
              return (
                <button key={item.id} onClick={() => setPage(item.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  background: "none", border: "none", cursor: "pointer",
                  padding: "6px 12px",
                  color: active ? colors.gold : colors.textMuted,
                  transition: "all 0.2s ease",
                }}>
                  <span style={{
                    fontSize: 20,
                    filter: active ? "none" : "grayscale(80%)",
                    transition: "filter 0.2s",
                  }}>{item.icon}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                    fontFamily: "'Oswald', sans-serif", textTransform: "uppercase",
                  }}>{item.label}</span>
                  {active && <div style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: colors.gold, marginTop: 1,
                  }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {!currentPlayer && <PlayerSelectScreen onSelect={selectPlayer} />}
      {scores.parToPints?.triggered && !scores.parToPints?.dismissed && (
        <ParToPintsOverlay scores={scores} setScores={setScores} currentTeam={currentTeam} />
      )}
      {showWinning && scores.finalized && (
        <WinningModal scores={scores} onClose={() => setShowWinning(false)} />
      )}
    </>
  );
}
