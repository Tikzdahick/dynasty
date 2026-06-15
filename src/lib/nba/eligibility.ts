import { NbaPlayer, NbaPosition } from "@/types";
import { slug } from "@/lib/cost";

// Real-career position eligibility for notable players (keyed by slug).
// Everyone else falls back to positional adjacency.
const MAP: Record<string, NbaPosition[]> = {
  "lebron-james": ["PG", "SF", "PF"],
  "magic-johnson": ["PG", "SF"],
  "stephen-curry": ["PG", "SG"],
  "kobe-bryant": ["SG", "SF"],
  "michael-jordan": ["SG", "SF"],
  "scottie-pippen": ["SG", "SF", "PF"],
  "dennis-rodman": ["PF", "C"],
  "shaquille-o-neal": ["C"],
  "tim-duncan": ["PF", "C"],
  "kevin-durant": ["SF", "PF"],
  "giannis-antetokounmpo": ["PG", "SF", "PF", "C"],
  "nikola-jokic": ["PF", "C"],
  "luka-doncic": ["PG", "SG"],
  "james-harden": ["PG", "SG"],
  "russell-westbrook": ["PG"],
  "chris-paul": ["PG"],
  "anthony-davis": ["PF", "C"],
  "jayson-tatum": ["SF", "PF"],
  "kawhi-leonard": ["SF", "PF"],
  "jimmy-butler": ["SG", "SF"],
  "draymond-green": ["PF", "C"],
  "charles-barkley": ["SF", "PF"],
  "kevin-garnett": ["PF", "C"],
  "hakeem-olajuwon": ["C"],
  "kareem-abdul-jabbar": ["C"],
  "wilt-chamberlain": ["C"],
  "bill-russell": ["C"],
  "larry-bird": ["SF", "PF"],
  "julius-erving": ["SF", "PF"],
  "oscar-robertson": ["PG", "SG"],
  "jerry-west": ["PG", "SG"],
  "allen-iverson": ["PG", "SG"],
  "dwyane-wade": ["SG"],
  "penny-hardaway": ["PG", "SG"],
  "vince-carter": ["SG", "SF"],
  "tracy-mcgrady": ["SG", "SF"],
  "clyde-drexler": ["SG", "SF"],
  "john-stockton": ["PG"],
  "karl-malone": ["PF"],
  "patrick-ewing": ["C"],
  "david-robinson": ["C"],
  "moses-malone": ["C"],
  "elgin-baylor": ["SF"],
  "george-gervin": ["SG", "SF"],
  "dominique-wilkins": ["SF"],
  "steve-nash": ["PG"],
  "pau-gasol": ["PF", "C"],
  "carmelo-anthony": ["SF", "PF"],
  "damian-lillard": ["PG"],
  "joel-embiid": ["C"],
  "devin-booker": ["SG"],
  "ja-morant": ["PG"],
  "klay-thompson": ["SG"],
  "bob-cousy": ["PG"],
  "john-havlicek": ["SG", "SF"],
  "isiah-thomas": ["PG"],
  "ray-allen": ["SG"],
  "reggie-miller": ["SG"],
  "paul-pierce": ["SF"],
  "robert-parish": ["C"],
  "kevin-mchale": ["PF", "C"],
  "james-worthy": ["SF"],
  "chris-bosh": ["PF", "C"],
  "ben-wallace": ["C"],
  "rasheed-wallace": ["PF", "C"],
  "kristaps-porzingis": ["PF", "C"],
  "al-horford": ["PF", "C"],
};

const ADJACENT: Record<NbaPosition, NbaPosition[]> = {
  PG: ["PG", "SG"],
  SG: ["SG", "PG", "SF"],
  SF: ["SF", "SG", "PF"],
  PF: ["PF", "SF", "C"],
  C: ["C", "PF"],
};

export function nbaEligible(p: NbaPlayer): NbaPosition[] {
  return MAP[p.id] ?? MAP[slug(p.name)] ?? ADJACENT[p.position];
}

// NBA badges are just the eligible positions.
export function nbaRoles(p: NbaPlayer): string[] {
  return nbaEligible(p);
}
