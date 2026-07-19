import { SoccerPlayer } from "@/types";

function cost(overall: number): number {
  return Math.round(Math.pow((overall - 70) / 29, 1.7) * 110 + 25);
}

type Raw = Omit<SoccerPlayer, "id" | "cost" | "overall"> & { overall: number };

// `espnPlayerId` is the ESPN player id used to build real headshot URLs
// (https://a.espncdn.com/i/headshots/soccer/players/full/<espnPlayerId>.png). It
// is optional: players without a verified id fall back to the initials medallion
// in PlayerCard. Only add an id you've confirmed loads the correct player — a
// wrong id shows someone else's photo. Look ids up on espn.com/soccer (the number
// in a player's profile URL). Messi (45843) is verified; fill in the rest as you go.
//
// `club` is each player's single most iconic club, used (alongside `country`) for
// team chemistry — placing players who share a club or country in the same XI
// builds chemistry. A few careers span several clubs (e.g. Zlatan, Ronaldo
// Nazário, Cruyff); the pick is the most-associated one, not the only one.
const raw: Raw[] = [
  { name: "Lionel Messi", country: "Argentina", era: "2010s", position: "FWD", pace: 88, shooting: 94, passing: 95, defending: 38, overall: 98, espnPlayerId: 45843, club: "Barcelona" },
  { name: "Cristiano Ronaldo", country: "Portugal", era: "2010s", position: "FWD", pace: 90, shooting: 95, passing: 82, defending: 35, overall: 97, club: "Real Madrid" },
  { name: "Pele", country: "Brazil", era: "1960s", position: "FWD", pace: 90, shooting: 95, passing: 90, defending: 40, overall: 98, club: "Santos" },
  { name: "Diego Maradona", country: "Argentina", era: "1980s", position: "FWD", pace: 87, shooting: 90, passing: 93, defending: 38, overall: 97, club: "Napoli" },
  { name: "Ronaldinho", country: "Brazil", era: "2000s", position: "FWD", pace: 88, shooting: 88, passing: 93, defending: 35, overall: 94, club: "Barcelona" },
  { name: "Zinedine Zidane", country: "France", era: "2000s", position: "MID", pace: 78, shooting: 86, passing: 95, defending: 65, overall: 96, club: "Real Madrid" },
  { name: "Franz Beckenbauer", country: "Germany", era: "1970s", position: "DEF", pace: 76, shooting: 75, passing: 88, defending: 92, overall: 95, club: "Bayern Munich" },
  { name: "Johan Cruyff", country: "Netherlands", era: "1970s", position: "FWD", pace: 86, shooting: 88, passing: 92, defending: 50, overall: 96, club: "Ajax" },
  { name: "Paolo Maldini", country: "Italy", era: "1990s", position: "DEF", pace: 82, shooting: 55, passing: 80, defending: 95, overall: 95, club: "AC Milan" },
  { name: "Xavi", country: "Spain", era: "2010s", position: "MID", pace: 70, shooting: 78, passing: 96, defending: 65, overall: 93, club: "Barcelona" },
  { name: "Andres Iniesta", country: "Spain", era: "2010s", position: "MID", pace: 76, shooting: 80, passing: 94, defending: 62, overall: 93, club: "Barcelona" },
  { name: "Roberto Carlos", country: "Brazil", era: "2000s", position: "DEF", pace: 93, shooting: 82, passing: 80, defending: 86, overall: 91, club: "Real Madrid" },
  { name: "Ronaldo Nazario", country: "Brazil", era: "2000s", position: "FWD", pace: 96, shooting: 95, passing: 80, defending: 30, overall: 96, club: "Real Madrid" },
  { name: "Neymar", country: "Brazil", era: "2010s", position: "FWD", pace: 90, shooting: 86, passing: 87, defending: 36, overall: 92, club: "Barcelona" },
  { name: "Gianluigi Buffon", country: "Italy", era: "2000s", position: "GK", pace: 50, shooting: 20, passing: 60, defending: 95, overall: 94, club: "Juventus" },
  { name: "Iker Casillas", country: "Spain", era: "2010s", position: "GK", pace: 52, shooting: 20, passing: 62, defending: 93, overall: 92, club: "Real Madrid" },
  { name: "Manuel Neuer", country: "Germany", era: "2010s", position: "GK", pace: 58, shooting: 25, passing: 78, defending: 93, overall: 93, club: "Bayern Munich" },
  { name: "Carles Puyol", country: "Spain", era: "2000s", position: "DEF", pace: 80, shooting: 50, passing: 72, defending: 93, overall: 91, club: "Barcelona" },
  { name: "Fabio Cannavaro", country: "Italy", era: "2000s", position: "DEF", pace: 82, shooting: 45, passing: 72, defending: 94, overall: 92, club: "Juventus" },
  { name: "Cafu", country: "Brazil", era: "2000s", position: "DEF", pace: 88, shooting: 60, passing: 78, defending: 87, overall: 90, club: "AC Milan" },
  { name: "Philipp Lahm", country: "Germany", era: "2010s", position: "DEF", pace: 84, shooting: 60, passing: 84, defending: 88, overall: 90, club: "Bayern Munich" },
  { name: "Andrea Pirlo", country: "Italy", era: "2010s", position: "MID", pace: 66, shooting: 84, passing: 93, defending: 68, overall: 91, club: "AC Milan" },
  { name: "Clarence Seedorf", country: "Netherlands", era: "2000s", position: "MID", pace: 78, shooting: 84, passing: 88, defending: 70, overall: 89, club: "AC Milan" },
  { name: "Ruud Gullit", country: "Netherlands", era: "1980s", position: "MID", pace: 84, shooting: 86, passing: 87, defending: 72, overall: 91, club: "AC Milan" },
  { name: "Marco van Basten", country: "Netherlands", era: "1980s", position: "FWD", pace: 82, shooting: 93, passing: 82, defending: 35, overall: 93, club: "AC Milan" },
  { name: "Michel Platini", country: "France", era: "1980s", position: "MID", pace: 76, shooting: 90, passing: 90, defending: 55, overall: 93, club: "Juventus" },
  { name: "Eusebio", country: "Portugal", era: "1960s", position: "FWD", pace: 92, shooting: 92, passing: 78, defending: 35, overall: 93, club: "Benfica" },
  { name: "Garrincha", country: "Brazil", era: "1960s", position: "FWD", pace: 93, shooting: 84, passing: 84, defending: 35, overall: 92, club: "Botafogo" },
  { name: "Socrates", country: "Brazil", era: "1980s", position: "MID", pace: 74, shooting: 84, passing: 90, defending: 60, overall: 90, club: "Corinthians" },
  { name: "Ferenc Puskas", country: "Hungary", era: "1950s", position: "FWD", pace: 80, shooting: 94, passing: 86, defending: 35, overall: 93, club: "Real Madrid" },
  { name: "Alfredo Di Stefano", country: "Argentina", era: "1950s", position: "FWD", pace: 85, shooting: 92, passing: 90, defending: 60, overall: 94, club: "Real Madrid" },
  { name: "Thierry Henry", country: "France", era: "2000s", position: "FWD", pace: 94, shooting: 91, passing: 82, defending: 35, overall: 92, club: "Arsenal" },
  { name: "Alan Shearer", country: "England", era: "1990s", position: "FWD", pace: 80, shooting: 92, passing: 72, defending: 40, overall: 89, club: "Newcastle United" },
  { name: "Wayne Rooney", country: "England", era: "2010s", position: "FWD", pace: 82, shooting: 88, passing: 82, defending: 50, overall: 88, club: "Manchester United" },
  { name: "Steven Gerrard", country: "England", era: "2010s", position: "MID", pace: 80, shooting: 88, passing: 88, defending: 72, overall: 90, club: "Liverpool" },
  { name: "Frank Lampard", country: "England", era: "2010s", position: "MID", pace: 76, shooting: 88, passing: 85, defending: 68, overall: 89, club: "Chelsea" },
  { name: "David Beckham", country: "England", era: "2000s", position: "MID", pace: 76, shooting: 82, passing: 92, defending: 58, overall: 88, club: "Manchester United" },
  { name: "Paul Scholes", country: "England", era: "2000s", position: "MID", pace: 70, shooting: 86, passing: 91, defending: 66, overall: 89, club: "Manchester United" },
  { name: "Ryan Giggs", country: "Wales", era: "2000s", position: "MID", pace: 88, shooting: 80, passing: 86, defending: 55, overall: 88, club: "Manchester United" },
  { name: "Eric Cantona", country: "France", era: "1990s", position: "FWD", pace: 78, shooting: 88, passing: 84, defending: 45, overall: 88, club: "Manchester United" },
  { name: "Gareth Bale", country: "Wales", era: "2010s", position: "FWD", pace: 94, shooting: 86, passing: 80, defending: 45, overall: 88, club: "Real Madrid" },
  { name: "Kevin De Bruyne", country: "Belgium", era: "2020s", position: "MID", pace: 78, shooting: 88, passing: 95, defending: 64, overall: 92, club: "Manchester City" },
  { name: "Luka Modric", country: "Croatia", era: "2020s", position: "MID", pace: 78, shooting: 80, passing: 92, defending: 68, overall: 91, club: "Real Madrid" },
  { name: "Toni Kroos", country: "Germany", era: "2020s", position: "MID", pace: 70, shooting: 82, passing: 93, defending: 66, overall: 90, club: "Real Madrid" },
  { name: "N'Golo Kante", country: "France", era: "2020s", position: "MID", pace: 84, shooting: 66, passing: 80, defending: 90, overall: 89, club: "Chelsea" },
  { name: "Luis Suarez", country: "Uruguay", era: "2010s", position: "FWD", pace: 82, shooting: 91, passing: 82, defending: 40, overall: 90, club: "Barcelona" },
  { name: "Edinson Cavani", country: "Uruguay", era: "2010s", position: "FWD", pace: 84, shooting: 88, passing: 74, defending: 45, overall: 87, club: "Paris Saint-Germain" },
  { name: "Zlatan Ibrahimovic", country: "Sweden", era: "2010s", position: "FWD", pace: 78, shooting: 91, passing: 82, defending: 40, overall: 90, club: "Paris Saint-Germain" },
  { name: "Robert Lewandowski", country: "Poland", era: "2020s", position: "FWD", pace: 80, shooting: 92, passing: 78, defending: 42, overall: 92, club: "Bayern Munich" },
  { name: "Thomas Muller", country: "Germany", era: "2010s", position: "FWD", pace: 76, shooting: 84, passing: 86, defending: 50, overall: 88, club: "Bayern Munich" },
  { name: "Miroslav Klose", country: "Germany", era: "2010s", position: "FWD", pace: 78, shooting: 87, passing: 74, defending: 45, overall: 87, club: "Bayern Munich" },
  { name: "Kaka", country: "Brazil", era: "2000s", position: "MID", pace: 88, shooting: 86, passing: 88, defending: 50, overall: 90, club: "AC Milan" },
  { name: "Didier Drogba", country: "Ivory Coast", era: "2010s", position: "FWD", pace: 82, shooting: 89, passing: 76, defending: 45, overall: 88, club: "Chelsea" },
  { name: "Samuel Eto'o", country: "Cameroon", era: "2000s", position: "FWD", pace: 90, shooting: 88, passing: 78, defending: 40, overall: 88, club: "Barcelona" },
  { name: "George Best", country: "N. Ireland", era: "1970s", position: "FWD", pace: 89, shooting: 86, passing: 85, defending: 40, overall: 90, club: "Manchester United" },
  { name: "Bobby Charlton", country: "England", era: "1960s", position: "MID", pace: 80, shooting: 90, passing: 88, defending: 60, overall: 91, club: "Manchester United" },
  { name: "Gerd Muller", country: "Germany", era: "1970s", position: "FWD", pace: 78, shooting: 92, passing: 70, defending: 35, overall: 91, club: "Bayern Munich" },
  { name: "Lothar Matthaus", country: "Germany", era: "1990s", position: "MID", pace: 80, shooting: 84, passing: 86, defending: 82, overall: 91, club: "Bayern Munich" },
  { name: "Sergio Ramos", country: "Spain", era: "2010s", position: "DEF", pace: 82, shooting: 70, passing: 78, defending: 92, overall: 90, club: "Real Madrid" },
  { name: "Gerard Pique", country: "Spain", era: "2010s", position: "DEF", pace: 74, shooting: 58, passing: 80, defending: 90, overall: 88, club: "Barcelona" },
  { name: "Virgil van Dijk", country: "Netherlands", era: "2020s", position: "DEF", pace: 82, shooting: 60, passing: 80, defending: 93, overall: 91, club: "Liverpool" },
  { name: "Franco Baresi", country: "Italy", era: "1990s", position: "DEF", pace: 80, shooting: 50, passing: 78, defending: 94, overall: 92, club: "AC Milan" },
  { name: "Kylian Mbappe", country: "France", era: "2020s", position: "FWD", pace: 97, shooting: 90, passing: 82, defending: 36, overall: 93, club: "Paris Saint-Germain" },
  { name: "Erling Haaland", country: "Norway", era: "2020s", position: "FWD", pace: 90, shooting: 94, passing: 70, defending: 40, overall: 91, club: "Manchester City" },
  { name: "Mohamed Salah", country: "Egypt", era: "2020s", position: "FWD", pace: 91, shooting: 88, passing: 82, defending: 44, overall: 90, club: "Liverpool" },
  { name: "Lev Yashin", country: "USSR", era: "1960s", position: "GK", pace: 55, shooting: 20, passing: 55, defending: 93, overall: 91, club: "Dynamo Moscow" },
  { name: "Dino Zoff", country: "Italy", era: "1980s", position: "GK", pace: 48, shooting: 20, passing: 55, defending: 91, overall: 89, club: "Juventus" },
];

export const SOCCER_PLAYERS: SoccerPlayer[] = raw.map((p) => ({
  ...p,
  id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  cost: cost(p.overall),
}));

export const SOCCER_BUDGET = 760; // for 14 players
