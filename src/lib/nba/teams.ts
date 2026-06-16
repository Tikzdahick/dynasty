import { Decade, IconicTeam, NbaPlayer, NbaPosition } from "@/types";
import { ratingCost, slug } from "@/lib/cost";
import { NBA_PLAYERS } from "./players";

type Raw = {
  name: string;
  position: NbaPosition;
  ppg: number;
  rpg: number;
  apg: number;
  overall: number;
};

interface RawTeam {
  decade: Decade;
  team: string;
  label: string;
  players: Raw[];
}

// prettier-ignore
const TEAMS: RawTeam[] = [
  { decade: "1950s", team: "Lakers", label: "1950s Minneapolis Lakers", players: [
    { name: "George Mikan", position: "C", ppg: 23.1, rpg: 13.4, apg: 2.8, overall: 94 },
    { name: "Vern Mikkelsen", position: "PF", ppg: 14.4, rpg: 8.4, apg: 2.0, overall: 82 },
    { name: "Jim Pollard", position: "SF", ppg: 13.1, rpg: 6.4, apg: 2.9, overall: 83 },
    { name: "Slater Martin", position: "PG", ppg: 9.8, rpg: 3.2, apg: 4.2, overall: 81 },
    { name: "Clyde Lovellette", position: "C", ppg: 17.0, rpg: 9.5, apg: 1.7, overall: 82 },
  ]},
  { decade: "1960s", team: "Celtics", label: "1960s Boston Celtics", players: [
    { name: "Bill Russell", position: "C", ppg: 15.1, rpg: 22.5, apg: 4.3, overall: 95 },
    { name: "Bob Cousy", position: "PG", ppg: 18.4, rpg: 5.2, apg: 7.5, overall: 90 },
    { name: "John Havlicek", position: "SF", ppg: 20.8, rpg: 6.3, apg: 4.8, overall: 90 },
    { name: "Sam Jones", position: "SG", ppg: 17.7, rpg: 4.9, apg: 2.5, overall: 86 },
    { name: "K.C. Jones", position: "PG", ppg: 7.4, rpg: 3.5, apg: 4.3, overall: 79 },
    { name: "Tom Heinsohn", position: "PF", ppg: 18.6, rpg: 8.8, apg: 2.0, overall: 84 },
    { name: "Bill Sharman", position: "SG", ppg: 17.8, rpg: 3.9, apg: 3.0, overall: 85 },
  ]},
  { decade: "1960s", team: "76ers", label: "1960s Philadelphia 76ers", players: [
    { name: "Wilt Chamberlain", position: "C", ppg: 30.1, rpg: 22.9, apg: 4.4, overall: 97 },
    { name: "Hal Greer", position: "SG", ppg: 19.2, rpg: 5.0, apg: 4.0, overall: 86 },
    { name: "Chet Walker", position: "SF", ppg: 18.2, rpg: 7.1, apg: 2.1, overall: 83 },
    { name: "Luke Jackson", position: "PF", ppg: 12.0, rpg: 11.9, apg: 1.8, overall: 80 },
    { name: "Billy Cunningham", position: "SF", ppg: 21.2, rpg: 10.4, apg: 4.0, overall: 87 },
  ]},
  { decade: "1960s", team: "Lakers", label: "1960s Los Angeles Lakers", players: [
    { name: "Jerry West", position: "PG", ppg: 27.0, rpg: 5.8, apg: 6.7, overall: 92 },
    { name: "Elgin Baylor", position: "SF", ppg: 27.4, rpg: 13.5, apg: 4.3, overall: 91 },
    { name: "Rudy LaRusso", position: "PF", ppg: 15.6, rpg: 9.4, apg: 2.0, overall: 81 },
    { name: "Walt Hazzard", position: "PG", ppg: 14.0, rpg: 3.5, apg: 5.0, overall: 80 },
  ]},
  { decade: "1970s", team: "Bucks", label: "1970s Milwaukee Bucks", players: [
    { name: "Kareem Abdul-Jabbar", position: "C", ppg: 30.0, rpg: 15.0, apg: 4.3, overall: 96 },
    { name: "Oscar Robertson", position: "PG", ppg: 19.4, rpg: 6.0, apg: 8.2, overall: 90 },
    { name: "Bob Dandridge", position: "SF", ppg: 18.4, rpg: 7.0, apg: 3.2, overall: 84 },
    { name: "Jon McGlocklin", position: "SG", ppg: 12.0, rpg: 2.6, apg: 3.4, overall: 79 },
  ]},
  { decade: "1970s", team: "Knicks", label: "1970s New York Knicks", players: [
    { name: "Walt Frazier", position: "PG", ppg: 18.9, rpg: 5.9, apg: 6.1, overall: 90 },
    { name: "Earl Monroe", position: "SG", ppg: 18.8, rpg: 3.0, apg: 3.9, overall: 87 },
    { name: "Willis Reed", position: "C", ppg: 18.7, rpg: 12.9, apg: 1.8, overall: 87 },
    { name: "Dave DeBusschere", position: "PF", ppg: 16.1, rpg: 11.0, apg: 2.9, overall: 84 },
    { name: "Bill Bradley", position: "SF", ppg: 12.4, rpg: 3.2, apg: 3.4, overall: 80 },
    { name: "Jerry Lucas", position: "PF", ppg: 15.6, rpg: 15.6, apg: 3.3, overall: 84 },
  ]},
  { decade: "1970s", team: "Warriors", label: "1970s Golden State Warriors", players: [
    { name: "Rick Barry", position: "SF", ppg: 25.6, rpg: 6.5, apg: 5.1, overall: 90 },
    { name: "Jamaal Wilkes", position: "SF", ppg: 17.7, rpg: 6.2, apg: 2.5, overall: 83 },
    { name: "Phil Smith", position: "SG", ppg: 16.2, rpg: 4.0, apg: 4.3, overall: 80 },
    { name: "Cliff Ray", position: "C", ppg: 9.4, rpg: 10.0, apg: 2.3, overall: 76 },
    { name: "Charles Johnson", position: "SG", ppg: 10.1, rpg: 2.4, apg: 2.0, overall: 75 },
  ]},
  { decade: "1980s", team: "Lakers", label: "1980s Lakers (Showtime)", players: [
    { name: "Magic Johnson", position: "PG", ppg: 19.5, rpg: 7.2, apg: 11.2, overall: 96 },
    { name: "Kareem Abdul-Jabbar", position: "C", ppg: 22.0, rpg: 9.4, apg: 3.2, overall: 95 },
    { name: "James Worthy", position: "SF", ppg: 17.6, rpg: 5.1, apg: 3.0, overall: 89 },
    { name: "Byron Scott", position: "SG", ppg: 15.0, rpg: 3.1, apg: 3.0, overall: 82 },
    { name: "Michael Cooper", position: "SG", ppg: 8.9, rpg: 3.2, apg: 4.2, overall: 80 },
    { name: "Bob McAdoo", position: "C", ppg: 15.0, rpg: 6.2, apg: 1.9, overall: 85 },
    { name: "Kurt Rambis", position: "PF", ppg: 5.4, rpg: 5.9, apg: 1.3, overall: 74 },
  ]},
  { decade: "1980s", team: "Celtics", label: "1980s Boston Celtics", players: [
    { name: "Larry Bird", position: "SF", ppg: 24.3, rpg: 10.0, apg: 6.3, overall: 96 },
    { name: "Kevin McHale", position: "PF", ppg: 17.9, rpg: 7.3, apg: 1.7, overall: 90 },
    { name: "Robert Parish", position: "C", ppg: 16.5, rpg: 9.8, apg: 1.5, overall: 87 },
    { name: "Dennis Johnson", position: "PG", ppg: 14.1, rpg: 3.9, apg: 5.0, overall: 84 },
    { name: "Danny Ainge", position: "SG", ppg: 11.5, rpg: 2.7, apg: 4.0, overall: 80 },
    { name: "Bill Walton", position: "C", ppg: 7.6, rpg: 6.8, apg: 2.1, overall: 83 },
  ]},
  { decade: "1980s", team: "Pistons", label: "1980s Pistons (Bad Boys)", players: [
    { name: "Isiah Thomas", position: "PG", ppg: 19.2, rpg: 3.6, apg: 9.3, overall: 91 },
    { name: "Joe Dumars", position: "SG", ppg: 16.1, rpg: 2.2, apg: 4.5, overall: 86 },
    { name: "Dennis Rodman", position: "PF", ppg: 8.8, rpg: 11.5, apg: 2.0, overall: 86 },
    { name: "Bill Laimbeer", position: "C", ppg: 12.9, rpg: 9.7, apg: 2.0, overall: 82 },
    { name: "Mark Aguirre", position: "SF", ppg: 15.9, rpg: 4.6, apg: 3.1, overall: 83 },
    { name: "John Salley", position: "PF", ppg: 7.0, rpg: 4.9, apg: 1.2, overall: 76 },
    { name: "Vinnie Johnson", position: "SG", ppg: 12.0, rpg: 2.9, apg: 3.3, overall: 79 },
  ]},
  { decade: "1990s", team: "Bulls", label: "1990s Chicago Bulls", players: [
    { name: "Michael Jordan", position: "SG", ppg: 30.1, rpg: 6.2, apg: 5.3, overall: 99 },
    { name: "Scottie Pippen", position: "SF", ppg: 18.0, rpg: 6.4, apg: 5.2, overall: 92 },
    { name: "Dennis Rodman", position: "PF", ppg: 5.7, rpg: 15.3, apg: 2.9, overall: 86 },
    { name: "Toni Kukoc", position: "SF", ppg: 13.1, rpg: 4.2, apg: 4.2, overall: 82 },
    { name: "Ron Harper", position: "SG", ppg: 8.1, rpg: 3.3, apg: 2.8, overall: 78 },
    { name: "Steve Kerr", position: "PG", ppg: 6.5, rpg: 1.3, apg: 2.0, overall: 77 },
    { name: "Luc Longley", position: "C", ppg: 8.2, rpg: 5.0, apg: 1.5, overall: 74 },
    { name: "Bill Wennington", position: "C", ppg: 5.1, rpg: 3.0, apg: 0.6, overall: 71 },
  ]},
  { decade: "1990s", team: "Jazz", label: "1990s Utah Jazz", players: [
    { name: "Karl Malone", position: "PF", ppg: 25.0, rpg: 10.1, apg: 3.6, overall: 95 },
    { name: "John Stockton", position: "PG", ppg: 13.1, rpg: 2.7, apg: 10.5, overall: 91 },
    { name: "Jeff Hornacek", position: "SG", ppg: 14.5, rpg: 2.8, apg: 4.0, overall: 82 },
    { name: "Bryon Russell", position: "SF", ppg: 10.2, rpg: 4.0, apg: 1.9, overall: 77 },
    { name: "Greg Ostertag", position: "C", ppg: 5.2, rpg: 6.7, apg: 0.5, overall: 73 },
    { name: "Shandon Anderson", position: "SF", ppg: 8.0, rpg: 3.2, apg: 1.6, overall: 74 },
  ]},
  { decade: "1990s", team: "Knicks", label: "1990s New York Knicks", players: [
    { name: "Patrick Ewing", position: "C", ppg: 22.8, rpg: 10.6, apg: 2.2, overall: 91 },
    { name: "John Starks", position: "SG", ppg: 14.1, rpg: 2.7, apg: 3.6, overall: 81 },
    { name: "Charles Oakley", position: "PF", ppg: 10.4, rpg: 10.6, apg: 2.6, overall: 80 },
    { name: "Anthony Mason", position: "PF", ppg: 14.0, rpg: 9.3, apg: 4.4, overall: 81 },
    { name: "Derek Harper", position: "PG", ppg: 12.0, rpg: 2.2, apg: 5.2, overall: 80 },
    { name: "Charles Smith", position: "PF", ppg: 12.4, rpg: 6.0, apg: 1.2, overall: 78 },
  ]},
  { decade: "1990s", team: "Rockets", label: "1990s Houston Rockets", players: [
    { name: "Hakeem Olajuwon", position: "C", ppg: 23.0, rpg: 11.1, apg: 3.0, overall: 95 },
    { name: "Clyde Drexler", position: "SG", ppg: 20.4, rpg: 6.1, apg: 5.6, overall: 90 },
    { name: "Kenny Smith", position: "PG", ppg: 12.4, rpg: 2.2, apg: 5.4, overall: 79 },
    { name: "Robert Horry", position: "PF", ppg: 9.0, rpg: 5.6, apg: 3.0, overall: 80 },
    { name: "Otis Thorpe", position: "PF", ppg: 13.0, rpg: 9.0, apg: 2.0, overall: 80 },
    { name: "Mario Elie", position: "SG", ppg: 9.6, rpg: 3.2, apg: 2.9, overall: 76 },
  ]},
  { decade: "2000s", team: "Lakers", label: "2000s Lakers (Three-Peat)", players: [
    { name: "Kobe Bryant", position: "SG", ppg: 25.0, rpg: 5.2, apg: 4.7, overall: 95 },
    { name: "Shaquille O'Neal", position: "C", ppg: 27.5, rpg: 12.0, apg: 3.1, overall: 97 },
    { name: "Derek Fisher", position: "PG", ppg: 10.0, rpg: 2.2, apg: 3.2, overall: 79 },
    { name: "Robert Horry", position: "PF", ppg: 7.0, rpg: 5.0, apg: 2.3, overall: 79 },
    { name: "Rick Fox", position: "SF", ppg: 9.0, rpg: 4.0, apg: 3.0, overall: 78 },
    { name: "Horace Grant", position: "PF", ppg: 8.5, rpg: 7.4, apg: 2.0, overall: 79 },
  ]},
  { decade: "2000s", team: "Spurs", label: "2000s San Antonio Spurs", players: [
    { name: "Tim Duncan", position: "PF", ppg: 21.0, rpg: 11.4, apg: 3.2, overall: 95 },
    { name: "Tony Parker", position: "PG", ppg: 16.4, rpg: 3.0, apg: 6.0, overall: 87 },
    { name: "Manu Ginobili", position: "SG", ppg: 15.0, rpg: 4.0, apg: 4.0, overall: 87 },
    { name: "David Robinson", position: "C", ppg: 13.2, rpg: 8.4, apg: 1.7, overall: 86 },
    { name: "Steve Smith", position: "SG", ppg: 11.3, rpg: 3.0, apg: 2.6, overall: 78 },
    { name: "Bruce Bowen", position: "SF", ppg: 6.6, rpg: 3.0, apg: 1.6, overall: 77 },
  ]},
  { decade: "2000s", team: "Kings", label: "2000s Sacramento Kings", players: [
    { name: "Chris Webber", position: "PF", ppg: 24.0, rpg: 10.5, apg: 4.8, overall: 90 },
    { name: "Mike Bibby", position: "PG", ppg: 15.0, rpg: 3.2, apg: 5.0, overall: 83 },
    { name: "Peja Stojakovic", position: "SF", ppg: 20.1, rpg: 5.0, apg: 2.0, overall: 86 },
    { name: "Vlade Divac", position: "C", ppg: 12.0, rpg: 9.0, apg: 5.0, overall: 82 },
    { name: "Doug Christie", position: "SG", ppg: 11.0, rpg: 4.0, apg: 4.5, overall: 80 },
    { name: "Bobby Jackson", position: "SG", ppg: 14.0, rpg: 4.0, apg: 3.2, overall: 78 },
  ]},
  { decade: "2000s", team: "Pistons", label: "2000s Detroit Pistons", players: [
    { name: "Chauncey Billups", position: "PG", ppg: 16.5, rpg: 3.0, apg: 6.2, overall: 86 },
    { name: "Richard Hamilton", position: "SG", ppg: 19.0, rpg: 3.8, apg: 4.0, overall: 85 },
    { name: "Tayshaun Prince", position: "SF", ppg: 13.0, rpg: 5.0, apg: 3.0, overall: 81 },
    { name: "Rasheed Wallace", position: "PF", ppg: 15.0, rpg: 8.0, apg: 1.8, overall: 85 },
    { name: "Ben Wallace", position: "C", ppg: 7.0, rpg: 12.0, apg: 1.6, overall: 85 },
    { name: "Lindsey Hunter", position: "PG", ppg: 8.0, rpg: 2.0, apg: 3.0, overall: 75 },
  ]},
  { decade: "2010s", team: "Heat", label: "2010s Miami Heat (Big 3)", players: [
    { name: "LeBron James", position: "SF", ppg: 27.0, rpg: 8.0, apg: 7.0, overall: 98 },
    { name: "Dwyane Wade", position: "SG", ppg: 22.0, rpg: 5.0, apg: 5.0, overall: 91 },
    { name: "Chris Bosh", position: "PF", ppg: 18.0, rpg: 8.0, apg: 1.8, overall: 86 },
    { name: "Ray Allen", position: "SG", ppg: 11.0, rpg: 2.7, apg: 1.7, overall: 82 },
    { name: "Mario Chalmers", position: "PG", ppg: 9.0, rpg: 2.5, apg: 3.5, overall: 77 },
    { name: "Udonis Haslem", position: "PF", ppg: 6.0, rpg: 6.0, apg: 0.8, overall: 74 },
    { name: "Shane Battier", position: "SF", ppg: 7.0, rpg: 3.0, apg: 1.6, overall: 77 },
  ]},
  { decade: "2010s", team: "Warriors", label: "2010s Golden State Warriors", players: [
    { name: "Stephen Curry", position: "PG", ppg: 26.0, rpg: 5.0, apg: 7.0, overall: 96 },
    { name: "Klay Thompson", position: "SG", ppg: 20.0, rpg: 3.5, apg: 2.3, overall: 88 },
    { name: "Draymond Green", position: "PF", ppg: 11.0, rpg: 8.0, apg: 7.0, overall: 86 },
    { name: "Kevin Durant", position: "SF", ppg: 27.0, rpg: 7.0, apg: 5.0, overall: 96 },
    { name: "Andre Iguodala", position: "SF", ppg: 8.0, rpg: 4.0, apg: 4.0, overall: 81 },
    { name: "Shaun Livingston", position: "PG", ppg: 6.0, rpg: 2.0, apg: 3.0, overall: 76 },
  ]},
  { decade: "2010s", team: "Spurs", label: "2010s San Antonio Spurs", players: [
    { name: "Kawhi Leonard", position: "SF", ppg: 18.0, rpg: 6.4, apg: 3.0, overall: 92 },
    { name: "Tim Duncan", position: "PF", ppg: 14.0, rpg: 9.0, apg: 2.5, overall: 89 },
    { name: "Tony Parker", position: "PG", ppg: 14.0, rpg: 2.3, apg: 5.5, overall: 85 },
    { name: "Manu Ginobili", position: "SG", ppg: 12.0, rpg: 3.0, apg: 4.0, overall: 84 },
    { name: "LaMarcus Aldridge", position: "PF", ppg: 18.0, rpg: 8.0, apg: 2.0, overall: 87 },
    { name: "Danny Green", position: "SG", ppg: 10.0, rpg: 3.5, apg: 1.8, overall: 79 },
  ]},
  { decade: "2010s", team: "Thunder", label: "2010s Oklahoma City Thunder", players: [
    { name: "Kevin Durant", position: "SF", ppg: 28.0, rpg: 7.0, apg: 5.0, overall: 96 },
    { name: "Russell Westbrook", position: "PG", ppg: 22.0, rpg: 6.0, apg: 8.0, overall: 92 },
    { name: "James Harden", position: "SG", ppg: 16.0, rpg: 4.0, apg: 4.0, overall: 88 },
    { name: "Serge Ibaka", position: "PF", ppg: 12.0, rpg: 8.0, apg: 0.5, overall: 82 },
    { name: "Kevin Martin", position: "SG", ppg: 14.0, rpg: 2.3, apg: 1.5, overall: 80 },
  ]},
  { decade: "2020s", team: "Warriors", label: "2020s Golden State Warriors", players: [
    { name: "Stephen Curry", position: "PG", ppg: 28.0, rpg: 5.0, apg: 6.0, overall: 96 },
    { name: "Klay Thompson", position: "SG", ppg: 20.0, rpg: 4.0, apg: 2.4, overall: 86 },
    { name: "Draymond Green", position: "PF", ppg: 8.0, rpg: 7.0, apg: 7.0, overall: 85 },
    { name: "Andrew Wiggins", position: "SF", ppg: 17.0, rpg: 5.0, apg: 2.0, overall: 83 },
    { name: "Jordan Poole", position: "SG", ppg: 18.0, rpg: 3.0, apg: 4.0, overall: 80 },
  ]},
  { decade: "2020s", team: "Nuggets", label: "2020s Denver Nuggets", players: [
    { name: "Nikola Jokic", position: "C", ppg: 25.0, rpg: 12.0, apg: 9.0, overall: 97 },
    { name: "Jamal Murray", position: "PG", ppg: 20.0, rpg: 4.0, apg: 6.0, overall: 87 },
    { name: "Michael Porter Jr.", position: "SF", ppg: 17.0, rpg: 7.0, apg: 1.5, overall: 82 },
    { name: "Kentavious Caldwell-Pope", position: "SG", ppg: 11.0, rpg: 3.0, apg: 2.4, overall: 79 },
    { name: "Aaron Gordon", position: "PF", ppg: 14.0, rpg: 6.0, apg: 3.0, overall: 82 },
  ]},
  { decade: "2020s", team: "Celtics", label: "2020s Boston Celtics", players: [
    { name: "Jayson Tatum", position: "SF", ppg: 27.0, rpg: 8.0, apg: 5.0, overall: 93 },
    { name: "Jaylen Brown", position: "SG", ppg: 23.0, rpg: 6.0, apg: 3.5, overall: 89 },
    { name: "Jrue Holiday", position: "PG", ppg: 13.0, rpg: 5.0, apg: 5.0, overall: 85 },
    { name: "Al Horford", position: "C", ppg: 9.0, rpg: 7.0, apg: 3.0, overall: 82 },
    { name: "Kristaps Porzingis", position: "C", ppg: 20.0, rpg: 7.0, apg: 1.8, overall: 86 },
  ]},
  { decade: "2020s", team: "Bucks", label: "2020s Milwaukee Bucks", players: [
    { name: "Giannis Antetokounmpo", position: "PF", ppg: 30.0, rpg: 11.0, apg: 6.0, overall: 96 },
    { name: "Damian Lillard", position: "PG", ppg: 24.0, rpg: 4.0, apg: 7.0, overall: 90 },
    { name: "Khris Middleton", position: "SF", ppg: 15.0, rpg: 5.0, apg: 5.0, overall: 84 },
    { name: "Brook Lopez", position: "C", ppg: 12.0, rpg: 5.0, apg: 1.5, overall: 81 },
    { name: "Bobby Portis", position: "PF", ppg: 13.0, rpg: 9.0, apg: 1.4, overall: 80 },
  ]},
];

function build(raw: Raw, decade: Decade): NbaPlayer {
  return {
    ...raw,
    id: slug(raw.name),
    era: decade,
    cost: ratingCost(raw.overall),
  };
}

export const NBA_ICONIC: IconicTeam<NbaPlayer>[] = TEAMS.map((t) => ({
  decade: t.decade,
  team: t.team,
  label: t.label,
  players: t.players.map((p) => build(p, t.decade)),
}));

// Master pool = base pool + every iconic-team player, deduped by id.
// Keeps the higher-rated version when an id appears twice.
export const NBA_MASTER: NbaPlayer[] = (() => {
  const byId = new Map<string, NbaPlayer>();
  for (const p of NBA_PLAYERS) byId.set(p.id, p);
  for (const t of NBA_ICONIC) {
    for (const p of t.players) {
      const existing = byId.get(p.id);
      if (!existing || p.overall > existing.overall) byId.set(p.id, p);
    }
  }
  return [...byId.values()];
})();

export function nbaDecadePool(decade: Decade): NbaPlayer[] {
  return NBA_MASTER.filter((p) => p.era === decade).sort(
    (a, b) => b.overall - a.overall
  );
}

// Franchises that can appear on the team reel (fallback uses decade pool).
export const NBA_FRANCHISES = [
  "Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers", "Mavericks",
  "Nuggets", "Pistons", "Warriors", "Rockets", "Pacers", "Clippers", "Lakers",
  "Grizzlies", "Heat", "Bucks", "Timberwolves", "Pelicans", "Knicks", "Thunder",
  "Magic", "76ers", "Suns", "Trail Blazers", "Kings", "Spurs", "Raptors",
  "Jazz", "Wizards",
];
