import { NbaPlayer } from "@/types";

// Draft cost is derived from overall so the salary cap stays meaningful.
function cost(overall: number): number {
  // 99 -> ~140, 80 -> ~40. Steeper at the top.
  return Math.round(Math.pow((overall - 70) / 29, 1.7) * 110 + 25);
}

// `nbaPlayerId` is the NBA.com person id used to build real headshot URLs
// (https://cdn.nba.com/headshots/nba/latest/1040x760/<id>.png). It is optional:
// players without a known id (or without an available photo) fall back to the
// initials medallion in PlayerCard. Pre-1980 legends are left unset because the
// CDN generally has no headshot for them.
const raw: Omit<NbaPlayer, "id" | "cost">[] = [
  { name: "Michael Jordan", era: "1990s", position: "SG", ppg: 30.1, rpg: 6.2, apg: 5.3, overall: 99, nbaPlayerId: 893 },
  { name: "LeBron James", era: "2010s", position: "SF", ppg: 27.1, rpg: 7.5, apg: 7.4, overall: 98, nbaPlayerId: 2544 },
  { name: "Kareem Abdul-Jabbar", era: "1970s", position: "C", ppg: 24.6, rpg: 11.2, apg: 3.6, overall: 97, nbaPlayerId: 76003 },
  { name: "Wilt Chamberlain", era: "1960s", position: "C", ppg: 30.1, rpg: 22.9, apg: 4.4, overall: 97 },
  { name: "Magic Johnson", era: "1980s", position: "PG", ppg: 19.5, rpg: 7.2, apg: 11.2, overall: 96, nbaPlayerId: 77142 },
  { name: "Bill Russell", era: "1960s", position: "C", ppg: 15.1, rpg: 22.5, apg: 4.3, overall: 95 },
  { name: "Larry Bird", era: "1980s", position: "SF", ppg: 24.3, rpg: 10.0, apg: 6.3, overall: 95, nbaPlayerId: 1449 },
  { name: "Shaquille O'Neal", era: "2000s", position: "C", ppg: 23.7, rpg: 10.9, apg: 2.5, overall: 96, nbaPlayerId: 406 },
  { name: "Tim Duncan", era: "2000s", position: "PF", ppg: 19.0, rpg: 10.8, apg: 3.0, overall: 95, nbaPlayerId: 1495 },
  { name: "Kobe Bryant", era: "2000s", position: "SG", ppg: 25.0, rpg: 5.2, apg: 4.7, overall: 96, nbaPlayerId: 977 },
  { name: "Hakeem Olajuwon", era: "1990s", position: "C", ppg: 21.8, rpg: 11.1, apg: 2.5, overall: 95, nbaPlayerId: 165 },
  { name: "Stephen Curry", era: "2010s", position: "PG", ppg: 24.8, rpg: 4.7, apg: 6.4, overall: 96, nbaPlayerId: 201939 },
  { name: "Oscar Robertson", era: "1960s", position: "PG", ppg: 25.7, rpg: 7.5, apg: 9.5, overall: 95 },
  { name: "Kevin Durant", era: "2010s", position: "SF", ppg: 27.3, rpg: 7.1, apg: 4.3, overall: 96, nbaPlayerId: 201142 },
  { name: "Giannis Antetokounmpo", era: "2020s", position: "PF", ppg: 23.0, rpg: 9.8, apg: 4.8, overall: 96, nbaPlayerId: 203507 },
  { name: "Nikola Jokic", era: "2020s", position: "C", ppg: 21.0, rpg: 10.8, apg: 6.9, overall: 96, nbaPlayerId: 203999 },
  { name: "Karl Malone", era: "1990s", position: "PF", ppg: 25.0, rpg: 10.1, apg: 3.6, overall: 93, nbaPlayerId: 252 },
  { name: "Kevin Garnett", era: "2000s", position: "PF", ppg: 17.8, rpg: 10.0, apg: 3.7, overall: 92, nbaPlayerId: 708 },
  { name: "Dirk Nowitzki", era: "2000s", position: "PF", ppg: 20.7, rpg: 7.5, apg: 2.4, overall: 92, nbaPlayerId: 1717 },
  { name: "Dwyane Wade", era: "2000s", position: "SG", ppg: 22.0, rpg: 4.7, apg: 5.4, overall: 92, nbaPlayerId: 2548 },
  { name: "Charles Barkley", era: "1990s", position: "PF", ppg: 22.1, rpg: 11.7, apg: 3.9, overall: 92, nbaPlayerId: 787 },
  { name: "Allen Iverson", era: "2000s", position: "PG", ppg: 26.7, rpg: 3.7, apg: 6.2, overall: 91, nbaPlayerId: 947 },
  { name: "David Robinson", era: "1990s", position: "C", ppg: 21.1, rpg: 10.6, apg: 2.5, overall: 92, nbaPlayerId: 764 },
  { name: "John Stockton", era: "1990s", position: "PG", ppg: 13.1, rpg: 2.7, apg: 10.5, overall: 90, nbaPlayerId: 304 },
  { name: "Scottie Pippen", era: "1990s", position: "SF", ppg: 16.1, rpg: 6.4, apg: 5.2, overall: 90, nbaPlayerId: 937 },
  { name: "Patrick Ewing", era: "1990s", position: "C", ppg: 21.0, rpg: 9.8, apg: 1.9, overall: 90, nbaPlayerId: 121 },
  { name: "Luka Doncic", era: "2020s", position: "PG", ppg: 28.6, rpg: 8.7, apg: 8.3, overall: 95, nbaPlayerId: 1629029 },
  { name: "Jayson Tatum", era: "2020s", position: "SF", ppg: 26.9, rpg: 8.1, apg: 4.6, overall: 92, nbaPlayerId: 1628369 },
  { name: "James Harden", era: "2010s", position: "SG", ppg: 24.1, rpg: 5.6, apg: 7.0, overall: 92, nbaPlayerId: 201935 },
  { name: "Russell Westbrook", era: "2010s", position: "PG", ppg: 21.7, rpg: 7.0, apg: 8.3, overall: 90, nbaPlayerId: 201566 },
  { name: "Chris Paul", era: "2010s", position: "PG", ppg: 17.6, rpg: 4.5, apg: 9.4, overall: 91, nbaPlayerId: 101108 },
  { name: "Anthony Davis", era: "2020s", position: "PF", ppg: 24.0, rpg: 10.4, apg: 2.5, overall: 92, nbaPlayerId: 203076 },
  { name: "Julius Erving", era: "1980s", position: "SF", ppg: 24.2, rpg: 8.5, apg: 4.2, overall: 92 },
  { name: "Isiah Thomas", era: "1980s", position: "PG", ppg: 19.2, rpg: 3.6, apg: 9.3, overall: 90 },
  { name: "Reggie Miller", era: "1990s", position: "SG", ppg: 18.2, rpg: 3.0, apg: 3.0, overall: 88, nbaPlayerId: 397 },
  { name: "Ray Allen", era: "2000s", position: "SG", ppg: 18.9, rpg: 4.1, apg: 3.4, overall: 88, nbaPlayerId: 951 },
  { name: "Paul Pierce", era: "2000s", position: "SF", ppg: 19.7, rpg: 5.6, apg: 3.5, overall: 88, nbaPlayerId: 1718 },
  { name: "Penny Hardaway", era: "1990s", position: "PG", ppg: 15.2, rpg: 4.5, apg: 5.0, overall: 87, nbaPlayerId: 56 },
  { name: "Vince Carter", era: "2000s", position: "SG", ppg: 16.7, rpg: 4.3, apg: 3.1, overall: 87, nbaPlayerId: 1713 },
  { name: "Tracy McGrady", era: "2000s", position: "SF", ppg: 19.6, rpg: 5.6, apg: 4.4, overall: 89, nbaPlayerId: 1503 },
  { name: "Clyde Drexler", era: "1990s", position: "SG", ppg: 20.4, rpg: 6.1, apg: 5.6, overall: 89, nbaPlayerId: 23 },
  { name: "Jerry West", era: "1960s", position: "PG", ppg: 27.0, rpg: 5.8, apg: 6.7, overall: 92 },
  { name: "Elgin Baylor", era: "1960s", position: "SF", ppg: 27.4, rpg: 13.5, apg: 4.3, overall: 91 },
  { name: "Moses Malone", era: "1980s", position: "C", ppg: 20.6, rpg: 12.2, apg: 1.4, overall: 90 },
  { name: "George Gervin", era: "1980s", position: "SG", ppg: 26.2, rpg: 4.6, apg: 2.8, overall: 88 },
  { name: "Dominique Wilkins", era: "1980s", position: "SF", ppg: 24.8, rpg: 6.7, apg: 2.5, overall: 88 },
  { name: "Steve Nash", era: "2000s", position: "PG", ppg: 14.3, rpg: 3.0, apg: 8.5, overall: 89, nbaPlayerId: 959 },
  { name: "Pau Gasol", era: "2010s", position: "PF", ppg: 17.0, rpg: 9.2, apg: 3.2, overall: 86, nbaPlayerId: 2200 },
  { name: "Carmelo Anthony", era: "2010s", position: "SF", ppg: 22.5, rpg: 6.2, apg: 2.7, overall: 87, nbaPlayerId: 2546 },
  { name: "Damian Lillard", era: "2010s", position: "PG", ppg: 25.2, rpg: 4.2, apg: 6.7, overall: 90, nbaPlayerId: 203081 },
  { name: "Kawhi Leonard", era: "2010s", position: "SF", ppg: 20.0, rpg: 6.4, apg: 3.0, overall: 92, nbaPlayerId: 202695 },
  { name: "Joel Embiid", era: "2020s", position: "C", ppg: 27.9, rpg: 11.2, apg: 3.6, overall: 94, nbaPlayerId: 203954 },
  { name: "Devin Booker", era: "2020s", position: "SG", ppg: 24.9, rpg: 4.1, apg: 5.5, overall: 90, nbaPlayerId: 1626164 },
  { name: "Ja Morant", era: "2020s", position: "PG", ppg: 22.5, rpg: 5.3, apg: 7.4, overall: 89, nbaPlayerId: 1629630 },
  { name: "Klay Thompson", era: "2010s", position: "SG", ppg: 19.6, rpg: 3.5, apg: 2.3, overall: 87, nbaPlayerId: 202691 },
  { name: "Draymond Green", era: "2010s", position: "PF", ppg: 8.7, rpg: 7.0, apg: 5.6, overall: 85, nbaPlayerId: 203110 },
  { name: "Jimmy Butler", era: "2020s", position: "SF", ppg: 17.7, rpg: 5.3, apg: 4.0, overall: 89, nbaPlayerId: 202710 },
];

export const NBA_PLAYERS: NbaPlayer[] = raw.map((p) => ({
  ...p,
  id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  cost: cost(p.overall),
}));

export const NBA_SALARY_CAP = 520; // draft points for 8 players
export const NBA_STARTERS = 5;
export const NBA_BENCH = 3;
