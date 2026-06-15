import { SoccerPlayer, SoccerPosition } from "@/types";
import { slug } from "@/lib/cost";

// Granular real-career roles for badge display (keyed by slug).
// Coarse eligibility (GK/DEF/MID/FWD) for slot snapping is derived from these.
const ROLES: Record<string, string[]> = {
  "lionel-messi": ["RW", "CAM", "CF"],
  "cristiano-ronaldo": ["LW", "RW", "CF"],
  "diego-maradona": ["CAM", "CF"],
  "zinedine-zidane": ["CM", "CAM"],
  "xavi": ["CM", "CDM"],
  "andres-iniesta": ["CM", "CAM", "LW"],
  "ronaldinho": ["CAM", "LW", "RW"],
  "roberto-carlos": ["LB"],
  "paolo-maldini": ["LB", "CB"],
  "gianluigi-buffon": ["GK"],
  "manuel-neuer": ["GK"],
  "david-beckham": ["RM", "RW", "CM"],
  "ronaldo-nazario": ["CF", "ST"],
  "neymar": ["LW", "CF"],
  "kylian-mbappe": ["LW", "ST"],
  "erling-haaland": ["ST"],
  "robert-lewandowski": ["ST"],
  "luis-suarez": ["ST", "CF"],
  "thierry-henry": ["LW", "ST"],
  "karim-benzema": ["CF", "ST"],
  "gareth-bale": ["RW", "ST"],
  "kevin-de-bruyne": ["CAM", "CM"],
  "luka-modric": ["CM", "CAM"],
  "toni-kroos": ["CM", "CDM"],
  "n-golo-kante": ["CDM", "CM"],
  "andrea-pirlo": ["CDM", "CM"],
  "sergio-busquets": ["CDM"],
  "steven-gerrard": ["CM", "CAM"],
  "frank-lampard": ["CM", "CAM"],
  "paul-scholes": ["CM"],
  "fabio-cannavaro": ["CB"],
  "sergio-ramos": ["CB", "RB"],
  "carles-puyol": ["CB"],
  "gerard-pique": ["CB"],
  "virgil-van-dijk": ["CB"],
  "franco-baresi": ["CB"],
  "franz-beckenbauer": ["CB", "CDM"],
  "cafu": ["RB"],
  "philipp-lahm": ["RB", "LB"],
  "jordi-alba": ["LB"],
  "dani-alves": ["RB"],
  "dani-carvajal": ["RB"],
  "marcelo": ["LB"],
  "pele": ["CF", "SS"],
  "johan-cruyff": ["CF", "CAM"],
  "george-best": ["RW", "CF"],
  "eusebio": ["CF"],
  "alfredo-di-stefano": ["CF", "CAM"],
  "ferenc-puskas": ["CF", "ST"],
  "michel-platini": ["CAM", "CM"],
  "zico": ["CAM"],
  "socrates": ["CM", "CAM"],
  "garrincha": ["RW"],
  "lev-yashin": ["GK"],
  "iker-casillas": ["GK"],
  "marco-van-basten": ["CF", "ST"],
  "ruud-gullit": ["CM", "CF"],
  "mohamed-salah": ["RW", "ST"],
  "zlatan-ibrahimovic": ["ST", "CF"],
  "pedri": ["CM", "CAM"],
  "rodri": ["CDM"],
  "lamine-yamal": ["RW"],
  "vinicius-junior": ["LW"],
  "kaka": ["CAM", "CM"],
  "didier-drogba": ["ST"],
  "samuel-eto-o": ["ST", "RW"],
  "francesco-totti": ["CF", "CAM"],
  "alessandro-del-piero": ["CF", "SS"],
};

const ROLE_COARSE: Record<string, SoccerPosition> = {
  GK: "GK",
  CB: "DEF", RB: "DEF", LB: "DEF", RWB: "DEF", LWB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", RM: "MID", LM: "MID",
  RW: "FWD", LW: "FWD", CF: "FWD", ST: "FWD", SS: "FWD",
};

const DEFAULT_ROLE: Record<SoccerPosition, string[]> = {
  GK: ["GK"],
  DEF: ["CB"],
  MID: ["CM"],
  FWD: ["ST"],
};

export function soccerRoles(p: SoccerPlayer): string[] {
  return ROLES[p.id] ?? ROLES[slug(p.name)] ?? DEFAULT_ROLE[p.position];
}

export function soccerEligible(p: SoccerPlayer): SoccerPosition[] {
  const coarse = new Set<SoccerPosition>();
  for (const r of soccerRoles(p)) {
    const c = ROLE_COARSE[r];
    if (c) coarse.add(c);
  }
  // always allow the player's own coarse position
  coarse.add(p.position);
  return [...coarse];
}
