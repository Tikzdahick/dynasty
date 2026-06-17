import { Decade, IconicTeam, SoccerPlayer, SoccerPosition } from "@/types";
import { ratingCost, slug } from "@/lib/cost";
import { SOCCER_PLAYERS } from "./players";

type Raw = {
  name: string;
  country: string;
  position: SoccerPosition;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
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
  { decade: "1950s", team: "Hungary", label: "1950s Hungary (Mighty Magyars)", players: [
    { name: "Ferenc Puskas", country: "Hungary", position: "FWD", pace: 80, shooting: 94, passing: 86, defending: 35, overall: 93 },
    { name: "Sandor Kocsis", country: "Hungary", position: "FWD", pace: 78, shooting: 90, passing: 78, defending: 35, overall: 88 },
    { name: "Nandor Hidegkuti", country: "Hungary", position: "MID", pace: 76, shooting: 85, passing: 84, defending: 45, overall: 86 },
    { name: "Zoltan Czibor", country: "Hungary", position: "FWD", pace: 85, shooting: 82, passing: 80, defending: 38, overall: 85 },
    { name: "Jozsef Bozsik", country: "Hungary", position: "MID", pace: 72, shooting: 78, passing: 86, defending: 68, overall: 85 },
    { name: "Gyula Grosics", country: "Hungary", position: "GK", pace: 50, shooting: 20, passing: 55, defending: 89, overall: 84 },
  ]},
  { decade: "1950s", team: "Brazil", label: "1958 Brazil", players: [
    { name: "Pele", country: "Brazil", position: "FWD", pace: 90, shooting: 94, passing: 88, defending: 40, overall: 95 },
    { name: "Garrincha", country: "Brazil", position: "FWD", pace: 93, shooting: 84, passing: 84, defending: 35, overall: 91 },
    { name: "Didi", country: "Brazil", position: "MID", pace: 74, shooting: 82, passing: 90, defending: 60, overall: 88 },
    { name: "Vava", country: "Brazil", position: "FWD", pace: 82, shooting: 86, passing: 72, defending: 35, overall: 84 },
    { name: "Zagallo", country: "Brazil", position: "MID", pace: 80, shooting: 78, passing: 80, defending: 50, overall: 83 },
    { name: "Nilton Santos", country: "Brazil", position: "DEF", pace: 80, shooting: 55, passing: 78, defending: 86, overall: 86 },
    { name: "Djalma Santos", country: "Brazil", position: "DEF", pace: 80, shooting: 55, passing: 75, defending: 86, overall: 85 },
  ]},
  { decade: "1970s", team: "Brazil", label: "1970 Brazil", players: [
    { name: "Pele", country: "Brazil", position: "FWD", pace: 88, shooting: 94, passing: 90, defending: 40, overall: 96 },
    { name: "Rivelino", country: "Brazil", position: "MID", pace: 76, shooting: 88, passing: 88, defending: 55, overall: 89 },
    { name: "Jairzinho", country: "Brazil", position: "FWD", pace: 88, shooting: 86, passing: 78, defending: 40, overall: 87 },
    { name: "Tostao", country: "Brazil", position: "FWD", pace: 82, shooting: 84, passing: 82, defending: 40, overall: 86 },
    { name: "Clodoaldo", country: "Brazil", position: "MID", pace: 76, shooting: 72, passing: 84, defending: 70, overall: 83 },
    { name: "Carlos Alberto", country: "Brazil", position: "DEF", pace: 82, shooting: 70, passing: 80, defending: 86, overall: 88 },
    { name: "Gerson", country: "Brazil", position: "MID", pace: 70, shooting: 82, passing: 88, defending: 62, overall: 85 },
  ]},
  { decade: "1970s", team: "Netherlands", label: "1974 Netherlands (Total Football)", players: [
    { name: "Johan Cruyff", country: "Netherlands", position: "FWD", pace: 86, shooting: 88, passing: 92, defending: 50, overall: 96 },
    { name: "Johan Neeskens", country: "Netherlands", position: "MID", pace: 80, shooting: 84, passing: 86, defending: 78, overall: 88 },
    { name: "Rob Rensenbrink", country: "Netherlands", position: "FWD", pace: 86, shooting: 84, passing: 82, defending: 38, overall: 86 },
    { name: "Ruud Krol", country: "Netherlands", position: "DEF", pace: 80, shooting: 60, passing: 82, defending: 88, overall: 87 },
    { name: "Johnny Rep", country: "Netherlands", position: "FWD", pace: 85, shooting: 82, passing: 76, defending: 38, overall: 84 },
    { name: "Arie Haan", country: "Netherlands", position: "MID", pace: 74, shooting: 80, passing: 84, defending: 72, overall: 84 },
  ]},
  { decade: "1970s", team: "West Germany", label: "1974 West Germany", players: [
    { name: "Franz Beckenbauer", country: "West Germany", position: "DEF", pace: 76, shooting: 75, passing: 88, defending: 92, overall: 95 },
    { name: "Gerd Muller", country: "West Germany", position: "FWD", pace: 78, shooting: 92, passing: 70, defending: 35, overall: 91 },
    { name: "Sepp Maier", country: "West Germany", position: "GK", pace: 50, shooting: 20, passing: 55, defending: 90, overall: 87 },
    { name: "Berti Vogts", country: "West Germany", position: "DEF", pace: 80, shooting: 50, passing: 72, defending: 89, overall: 84 },
    { name: "Paul Breitner", country: "West Germany", position: "DEF", pace: 80, shooting: 82, passing: 86, defending: 82, overall: 88 },
    { name: "Jurgen Grabowski", country: "West Germany", position: "MID", pace: 82, shooting: 78, passing: 82, defending: 55, overall: 83 },
  ]},
  { decade: "1980s", team: "Brazil", label: "1982 Brazil", players: [
    { name: "Zico", country: "Brazil", position: "MID", pace: 80, shooting: 90, passing: 90, defending: 45, overall: 92 },
    { name: "Socrates", country: "Brazil", position: "MID", pace: 74, shooting: 84, passing: 90, defending: 60, overall: 90 },
    { name: "Falcao", country: "Brazil", position: "MID", pace: 76, shooting: 82, passing: 88, defending: 72, overall: 88 },
    { name: "Eder", country: "Brazil", position: "FWD", pace: 84, shooting: 86, passing: 78, defending: 40, overall: 85 },
    { name: "Junior", country: "Brazil", position: "DEF", pace: 84, shooting: 70, passing: 82, defending: 84, overall: 85 },
    { name: "Leandro", country: "Brazil", position: "DEF", pace: 82, shooting: 65, passing: 78, defending: 84, overall: 84 },
    { name: "Serginho", country: "Brazil", position: "FWD", pace: 78, shooting: 82, passing: 68, defending: 35, overall: 80 },
  ]},
  { decade: "1980s", team: "Argentina", label: "1986 Argentina", players: [
    { name: "Diego Maradona", country: "Argentina", position: "FWD", pace: 87, shooting: 90, passing: 93, defending: 38, overall: 97 },
    { name: "Jorge Valdano", country: "Argentina", position: "FWD", pace: 80, shooting: 84, passing: 80, defending: 40, overall: 84 },
    { name: "Jorge Burruchaga", country: "Argentina", position: "MID", pace: 80, shooting: 82, passing: 84, defending: 60, overall: 84 },
    { name: "Oscar Ruggeri", country: "Argentina", position: "DEF", pace: 78, shooting: 55, passing: 70, defending: 88, overall: 84 },
    { name: "Sergio Batista", country: "Argentina", position: "MID", pace: 74, shooting: 72, passing: 82, defending: 78, overall: 82 },
    { name: "Hector Enrique", country: "Argentina", position: "MID", pace: 76, shooting: 74, passing: 80, defending: 70, overall: 80 },
  ]},
  { decade: "1980s", team: "Netherlands", label: "1988 Netherlands", players: [
    { name: "Ruud Gullit", country: "Netherlands", position: "MID", pace: 84, shooting: 86, passing: 87, defending: 72, overall: 92 },
    { name: "Marco van Basten", country: "Netherlands", position: "FWD", pace: 82, shooting: 93, passing: 82, defending: 35, overall: 93 },
    { name: "Frank Rijkaard", country: "Netherlands", position: "MID", pace: 80, shooting: 80, passing: 86, defending: 86, overall: 90 },
    { name: "Ronald Koeman", country: "Netherlands", position: "DEF", pace: 76, shooting: 82, passing: 86, defending: 85, overall: 88 },
    { name: "Berry van Aerle", country: "Netherlands", position: "DEF", pace: 78, shooting: 55, passing: 72, defending: 84, overall: 80 },
    { name: "Gerald Vanenburg", country: "Netherlands", position: "MID", pace: 82, shooting: 78, passing: 82, defending: 55, overall: 81 },
  ]},
  { decade: "1990s", team: "AC Milan", label: "1990s AC Milan", players: [
    { name: "Paolo Maldini", country: "Italy", position: "DEF", pace: 82, shooting: 55, passing: 80, defending: 95, overall: 94 },
    { name: "Franco Baresi", country: "Italy", position: "DEF", pace: 80, shooting: 50, passing: 78, defending: 94, overall: 92 },
    { name: "Demetrio Albertini", country: "Italy", position: "MID", pace: 70, shooting: 78, passing: 88, defending: 72, overall: 85 },
    { name: "Zvonimir Boban", country: "Croatia", position: "MID", pace: 76, shooting: 82, passing: 88, defending: 60, overall: 85 },
    { name: "Marcel Desailly", country: "France", position: "DEF", pace: 80, shooting: 55, passing: 75, defending: 90, overall: 88 },
    { name: "George Weah", country: "Liberia", position: "FWD", pace: 90, shooting: 90, passing: 78, defending: 40, overall: 91 },
  ]},
  { decade: "1990s", team: "France", label: "1998 France", players: [
    { name: "Zinedine Zidane", country: "France", position: "MID", pace: 78, shooting: 86, passing: 95, defending: 65, overall: 96 },
    { name: "Thierry Henry", country: "France", position: "FWD", pace: 94, shooting: 86, passing: 80, defending: 35, overall: 88 },
    { name: "Patrick Vieira", country: "France", position: "MID", pace: 80, shooting: 76, passing: 84, defending: 85, overall: 88 },
    { name: "Marcel Desailly", country: "France", position: "DEF", pace: 80, shooting: 55, passing: 75, defending: 90, overall: 88 },
    { name: "Lilian Thuram", country: "France", position: "DEF", pace: 84, shooting: 58, passing: 76, defending: 89, overall: 87 },
    { name: "Youri Djorkaeff", country: "France", position: "FWD", pace: 80, shooting: 84, passing: 86, defending: 50, overall: 85 },
    { name: "Emmanuel Petit", country: "France", position: "MID", pace: 76, shooting: 78, passing: 84, defending: 80, overall: 84 },
    { name: "Fabien Barthez", country: "France", position: "GK", pace: 55, shooting: 20, passing: 60, defending: 88, overall: 85 },
  ]},
  { decade: "1990s", team: "Brazil", label: "1998 Brazil", players: [
    { name: "Ronaldo Nazario", country: "Brazil", position: "FWD", pace: 96, shooting: 94, passing: 80, defending: 30, overall: 95 },
    { name: "Rivaldo", country: "Brazil", position: "MID", pace: 84, shooting: 90, passing: 88, defending: 45, overall: 92 },
    { name: "Roberto Carlos", country: "Brazil", position: "DEF", pace: 93, shooting: 82, passing: 80, defending: 86, overall: 90 },
    { name: "Cafu", country: "Brazil", position: "DEF", pace: 88, shooting: 60, passing: 78, defending: 87, overall: 88 },
    { name: "Denilson", country: "Brazil", position: "FWD", pace: 90, shooting: 78, passing: 80, defending: 35, overall: 82 },
    { name: "Bebeto", country: "Brazil", position: "FWD", pace: 84, shooting: 86, passing: 78, defending: 35, overall: 84 },
    { name: "Leonardo", country: "Brazil", position: "MID", pace: 80, shooting: 80, passing: 86, defending: 65, overall: 84 },
  ]},
  { decade: "2000s", team: "Brazil", label: "2000s Brazil", players: [
    { name: "Ronaldinho", country: "Brazil", position: "MID", pace: 88, shooting: 88, passing: 93, defending: 35, overall: 94 },
    { name: "Ronaldo Nazario", country: "Brazil", position: "FWD", pace: 90, shooting: 94, passing: 80, defending: 30, overall: 94 },
    { name: "Roberto Carlos", country: "Brazil", position: "DEF", pace: 90, shooting: 80, passing: 80, defending: 85, overall: 89 },
    { name: "Cafu", country: "Brazil", position: "DEF", pace: 85, shooting: 60, passing: 78, defending: 86, overall: 87 },
    { name: "Adriano", country: "Brazil", position: "FWD", pace: 84, shooting: 90, passing: 76, defending: 40, overall: 87 },
    { name: "Kaka", country: "Brazil", position: "MID", pace: 88, shooting: 86, passing: 88, defending: 50, overall: 91 },
    { name: "Robinho", country: "Brazil", position: "FWD", pace: 90, shooting: 82, passing: 82, defending: 35, overall: 85 },
  ]},
  { decade: "2000s", team: "Greece", label: "2004 Greece (Miracle)", players: [
    { name: "Theodoros Zagorakis", country: "Greece", position: "MID", pace: 76, shooting: 74, passing: 82, defending: 78, overall: 82 },
    { name: "Angelos Charisteas", country: "Greece", position: "FWD", pace: 76, shooting: 82, passing: 70, defending: 45, overall: 80 },
    { name: "Traianos Dellas", country: "Greece", position: "DEF", pace: 70, shooting: 55, passing: 68, defending: 86, overall: 81 },
    { name: "Giourkas Seitaridis", country: "Greece", position: "DEF", pace: 80, shooting: 55, passing: 72, defending: 84, overall: 80 },
    { name: "Takis Fyssas", country: "Greece", position: "DEF", pace: 80, shooting: 50, passing: 72, defending: 82, overall: 78 },
  ]},
  { decade: "2000s", team: "Italy", label: "2006 Italy", players: [
    { name: "Gianluigi Buffon", country: "Italy", position: "GK", pace: 50, shooting: 20, passing: 60, defending: 95, overall: 94 },
    { name: "Fabio Cannavaro", country: "Italy", position: "DEF", pace: 82, shooting: 45, passing: 72, defending: 94, overall: 92 },
    { name: "Andrea Pirlo", country: "Italy", position: "MID", pace: 66, shooting: 84, passing: 93, defending: 68, overall: 91 },
    { name: "Francesco Totti", country: "Italy", position: "FWD", pace: 76, shooting: 88, passing: 90, defending: 45, overall: 90 },
    { name: "Alessandro Del Piero", country: "Italy", position: "FWD", pace: 80, shooting: 88, passing: 84, defending: 40, overall: 88 },
    { name: "Luca Toni", country: "Italy", position: "FWD", pace: 78, shooting: 86, passing: 68, defending: 40, overall: 84 },
    { name: "Daniele De Rossi", country: "Italy", position: "MID", pace: 74, shooting: 78, passing: 82, defending: 82, overall: 85 },
    { name: "Mauro Camoranesi", country: "Italy", position: "MID", pace: 82, shooting: 76, passing: 82, defending: 55, overall: 82 },
  ]},
  { decade: "2010s", team: "Spain", label: "Spain (Golden Generation)", players: [
    { name: "Iker Casillas", country: "Spain", position: "GK", pace: 52, shooting: 20, passing: 62, defending: 93, overall: 92 },
    { name: "Sergio Ramos", country: "Spain", position: "DEF", pace: 82, shooting: 70, passing: 78, defending: 92, overall: 90 },
    { name: "Carles Puyol", country: "Spain", position: "DEF", pace: 80, shooting: 50, passing: 72, defending: 93, overall: 90 },
    { name: "Xavi", country: "Spain", position: "MID", pace: 70, shooting: 78, passing: 96, defending: 65, overall: 93 },
    { name: "Andres Iniesta", country: "Spain", position: "MID", pace: 76, shooting: 80, passing: 94, defending: 62, overall: 93 },
    { name: "David Villa", country: "Spain", position: "FWD", pace: 86, shooting: 90, passing: 80, defending: 35, overall: 89 },
    { name: "Fernando Torres", country: "Spain", position: "FWD", pace: 88, shooting: 86, passing: 76, defending: 35, overall: 86 },
    { name: "Cesc Fabregas", country: "Spain", position: "MID", pace: 74, shooting: 82, passing: 90, defending: 60, overall: 87 },
    { name: "Sergio Busquets", country: "Spain", position: "MID", pace: 66, shooting: 66, passing: 88, defending: 82, overall: 87 },
    { name: "Gerard Pique", country: "Spain", position: "DEF", pace: 74, shooting: 58, passing: 80, defending: 90, overall: 88 },
    { name: "David Silva", country: "Spain", position: "MID", pace: 80, shooting: 82, passing: 90, defending: 45, overall: 88 },
  ]},
  { decade: "2010s", team: "Germany", label: "2014 Germany", players: [
    { name: "Manuel Neuer", country: "Germany", position: "GK", pace: 58, shooting: 25, passing: 78, defending: 93, overall: 93 },
    { name: "Philipp Lahm", country: "Germany", position: "DEF", pace: 84, shooting: 60, passing: 84, defending: 88, overall: 90 },
    { name: "Mats Hummels", country: "Germany", position: "DEF", pace: 74, shooting: 58, passing: 80, defending: 89, overall: 88 },
    { name: "Jerome Boateng", country: "Germany", position: "DEF", pace: 80, shooting: 55, passing: 76, defending: 88, overall: 86 },
    { name: "Toni Kroos", country: "Germany", position: "MID", pace: 70, shooting: 82, passing: 93, defending: 66, overall: 90 },
    { name: "Mesut Ozil", country: "Germany", position: "MID", pace: 76, shooting: 82, passing: 92, defending: 45, overall: 88 },
    { name: "Thomas Muller", country: "Germany", position: "FWD", pace: 76, shooting: 84, passing: 86, defending: 50, overall: 88 },
    { name: "Bastian Schweinsteiger", country: "Germany", position: "MID", pace: 74, shooting: 80, passing: 88, defending: 80, overall: 88 },
    { name: "Mario Gotze", country: "Germany", position: "MID", pace: 82, shooting: 82, passing: 86, defending: 45, overall: 84 },
    { name: "Miroslav Klose", country: "Germany", position: "FWD", pace: 78, shooting: 87, passing: 74, defending: 45, overall: 86 },
    { name: "Lukas Podolski", country: "Germany", position: "FWD", pace: 84, shooting: 86, passing: 74, defending: 35, overall: 83 },
  ]},
  { decade: "2010s", team: "Barcelona", label: "2010s Barcelona", players: [
    { name: "Lionel Messi", country: "Argentina", position: "FWD", pace: 88, shooting: 94, passing: 95, defending: 38, overall: 98 },
    { name: "Xavi", country: "Spain", position: "MID", pace: 70, shooting: 78, passing: 96, defending: 65, overall: 92 },
    { name: "Andres Iniesta", country: "Spain", position: "MID", pace: 76, shooting: 80, passing: 94, defending: 62, overall: 92 },
    { name: "Neymar", country: "Brazil", position: "FWD", pace: 90, shooting: 86, passing: 87, defending: 36, overall: 91 },
    { name: "Luis Suarez", country: "Uruguay", position: "FWD", pace: 82, shooting: 91, passing: 82, defending: 40, overall: 90 },
    { name: "Gerard Pique", country: "Spain", position: "DEF", pace: 74, shooting: 58, passing: 80, defending: 90, overall: 88 },
    { name: "Jordi Alba", country: "Spain", position: "DEF", pace: 90, shooting: 70, passing: 82, defending: 84, overall: 85 },
    { name: "Sergio Busquets", country: "Spain", position: "MID", pace: 66, shooting: 66, passing: 88, defending: 82, overall: 87 },
    { name: "Dani Alves", country: "Brazil", position: "DEF", pace: 88, shooting: 72, passing: 84, defending: 82, overall: 86 },
    { name: "Victor Valdes", country: "Spain", position: "GK", pace: 52, shooting: 22, passing: 68, defending: 88, overall: 85 },
  ]},
  { decade: "2010s", team: "Real Madrid", label: "2010s Real Madrid", players: [
    { name: "Cristiano Ronaldo", country: "Portugal", position: "FWD", pace: 90, shooting: 95, passing: 82, defending: 35, overall: 96 },
    { name: "Gareth Bale", country: "Wales", position: "FWD", pace: 94, shooting: 86, passing: 80, defending: 45, overall: 88 },
    { name: "Karim Benzema", country: "France", position: "FWD", pace: 80, shooting: 88, passing: 82, defending: 40, overall: 88 },
    { name: "Luka Modric", country: "Croatia", position: "MID", pace: 78, shooting: 80, passing: 92, defending: 68, overall: 91 },
    { name: "Toni Kroos", country: "Germany", position: "MID", pace: 70, shooting: 82, passing: 93, defending: 66, overall: 90 },
    { name: "Sergio Ramos", country: "Spain", position: "DEF", pace: 82, shooting: 70, passing: 78, defending: 92, overall: 90 },
    { name: "Raphael Varane", country: "France", position: "DEF", pace: 84, shooting: 55, passing: 74, defending: 89, overall: 86 },
    { name: "Marcelo", country: "Brazil", position: "DEF", pace: 88, shooting: 72, passing: 84, defending: 80, overall: 86 },
    { name: "Keylor Navas", country: "Costa Rica", position: "GK", pace: 54, shooting: 22, passing: 64, defending: 89, overall: 85 },
  ]},
  { decade: "2020s", team: "Argentina", label: "2022 Argentina", players: [
    { name: "Lionel Messi", country: "Argentina", position: "FWD", pace: 85, shooting: 92, passing: 95, defending: 38, overall: 96 },
    { name: "Angel Di Maria", country: "Argentina", position: "FWD", pace: 86, shooting: 84, passing: 86, defending: 45, overall: 86 },
    { name: "Julian Alvarez", country: "Argentina", position: "FWD", pace: 86, shooting: 84, passing: 78, defending: 45, overall: 84 },
    { name: "Rodrigo De Paul", country: "Argentina", position: "MID", pace: 80, shooting: 76, passing: 84, defending: 78, overall: 84 },
    { name: "Leandro Paredes", country: "Argentina", position: "MID", pace: 68, shooting: 76, passing: 84, defending: 72, overall: 82 },
    { name: "Nicolas Otamendi", country: "Argentina", position: "DEF", pace: 74, shooting: 55, passing: 72, defending: 86, overall: 83 },
    { name: "Lisandro Martinez", country: "Argentina", position: "DEF", pace: 78, shooting: 52, passing: 74, defending: 86, overall: 83 },
    { name: "Cristian Romero", country: "Argentina", position: "DEF", pace: 80, shooting: 55, passing: 72, defending: 88, overall: 85 },
    { name: "Emiliano Martinez", country: "Argentina", position: "GK", pace: 56, shooting: 22, passing: 64, defending: 89, overall: 86 },
  ]},
  { decade: "2020s", team: "Spain", label: "2024 Spain", players: [
    { name: "Rodri", country: "Spain", position: "MID", pace: 72, shooting: 78, passing: 88, defending: 86, overall: 91 },
    { name: "Pedri", country: "Spain", position: "MID", pace: 78, shooting: 78, passing: 90, defending: 66, overall: 88 },
    { name: "Fabian Ruiz", country: "Spain", position: "MID", pace: 74, shooting: 80, passing: 86, defending: 72, overall: 84 },
    { name: "Nico Williams", country: "Spain", position: "FWD", pace: 94, shooting: 82, passing: 78, defending: 40, overall: 84 },
    { name: "Lamine Yamal", country: "Spain", position: "FWD", pace: 92, shooting: 84, passing: 86, defending: 35, overall: 85 },
    { name: "Alvaro Morata", country: "Spain", position: "FWD", pace: 80, shooting: 84, passing: 74, defending: 40, overall: 83 },
    { name: "Marc Cucurella", country: "Spain", position: "DEF", pace: 84, shooting: 55, passing: 76, defending: 84, overall: 82 },
    { name: "Dani Carvajal", country: "Spain", position: "DEF", pace: 84, shooting: 60, passing: 78, defending: 86, overall: 84 },
    { name: "Aymeric Laporte", country: "Spain", position: "DEF", pace: 74, shooting: 58, passing: 80, defending: 87, overall: 85 },
    { name: "Unai Simon", country: "Spain", position: "GK", pace: 54, shooting: 22, passing: 66, defending: 88, overall: 84 },
  ]},
  { decade: "2000s", team: "France", label: "2000 France (Euro winners)", players: [
    { name: "Zinedine Zidane", country: "France", position: "MID", pace: 78, shooting: 86, passing: 95, defending: 65, overall: 95 },
    { name: "Thierry Henry", country: "France", position: "FWD", pace: 94, shooting: 88, passing: 82, defending: 35, overall: 90 },
    { name: "Patrick Vieira", country: "France", position: "MID", pace: 80, shooting: 76, passing: 84, defending: 85, overall: 88 },
    { name: "Marcel Desailly", country: "France", position: "DEF", pace: 80, shooting: 55, passing: 75, defending: 90, overall: 88 },
    { name: "Lilian Thuram", country: "France", position: "DEF", pace: 84, shooting: 58, passing: 76, defending: 89, overall: 87 },
    { name: "Robert Pires", country: "France", position: "MID", pace: 84, shooting: 84, passing: 88, defending: 50, overall: 86 },
    { name: "Bixente Lizarazu", country: "France", position: "DEF", pace: 84, shooting: 60, passing: 78, defending: 84, overall: 83 },
    { name: "Fabien Barthez", country: "France", position: "GK", pace: 55, shooting: 20, passing: 60, defending: 88, overall: 85 },
  ]},
];

function build(raw: Raw, decade: Decade): SoccerPlayer {
  return {
    ...raw,
    id: slug(raw.name),
    era: decade,
    cost: ratingCost(raw.overall),
  };
}

export const SOCCER_ICONIC: IconicTeam<SoccerPlayer>[] = TEAMS.map((t) => ({
  decade: t.decade,
  team: t.team,
  label: t.label,
  players: t.players.map((p) => build(p, t.decade)),
}));

export const SOCCER_MASTER: SoccerPlayer[] = (() => {
  const byId = new Map<string, SoccerPlayer>();
  for (const p of SOCCER_PLAYERS) byId.set(p.id, p);
  for (const t of SOCCER_ICONIC) {
    for (const p of t.players) {
      const existing = byId.get(p.id);
      if (!existing || p.overall > existing.overall) byId.set(p.id, p);
    }
  }
  return [...byId.values()];
})();

export function soccerDecadePool(decade: Decade): SoccerPlayer[] {
  return SOCCER_MASTER.filter((p) => p.era === decade).sort(
    (a, b) => b.overall - a.overall
  );
}

// Nations + iconic clubs that can appear on the team reel.
export const SOCCER_TEAMS = [
  "Argentina", "Brazil", "France", "Germany", "Spain", "Italy", "England",
  "Netherlands", "Portugal", "Belgium", "Croatia", "Uruguay", "Colombia",
  "Mexico", "USA", "Japan", "Senegal", "Morocco", "Ghana", "Ivory Coast",
  "Australia", "South Korea", "Poland", "Czech Republic", "Sweden", "Denmark",
  "Switzerland", "Hungary", "West Germany", "Greece",
];

// Iconic club sides (not nations) — used for the club-chemistry bonus.
export const SOCCER_CLUBS = new Set(["AC Milan", "Barcelona", "Real Madrid"]);
