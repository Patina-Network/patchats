import fs from 'fs';
import Papa from 'papaparse';

const USER_FILE = './users-test.csv';
const PAIR_FILE = './pairings-test.csv';

interface User { 
    name : string; 
    email: string;
    intro : string;
    linkedin : string;
    industry : string;
    preferences : string;
    topics : string;
    anything : string;
}

interface Pair{
    fullNameA: string;
    emailA: string;
    fullNameB: string;
    emailB: string;
}

export async function parseUserFile(filePath: string): Promise<Map<string, User>> {
  const userFile = fs.readFileSync(new URL(filePath, import.meta.url), 'utf8');

  const config = {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: true,
    newline: "\n",
    skipEmptyLines: true,
    columns: null
  };

  const results = Papa.parse(userFile, config);
  const userMap = new Map<string, User>();
  
  for (const userData of results.data) {
    const user: User = {
      name: userData.Name,
      email: userData.Email,
      intro: userData.Intro, 
      linkedin: userData.LinkedIn,
      industry: userData.Industry,
      preferences: userData.Preferences,
      topics: userData.Topics,
      anything: userData.Anything
    };

    userMap.set(user.email, user);
  }
  await fetch("/api/emails/send-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(userMap))
      });

  return userMap;

}

export async function parsePairingFile(filePath: string): Promise<Pair[]> {
  const pairFile = fs.readFileSync(new URL(filePath, import.meta.url), 'utf8');

  const config = {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: false, //change header to false 
    newline: "\n",
    skipEmptyLines: true,
    columns: null
  };

  const results = Papa.parse(pairFile, config);

  const pairings = [];

  for (const pairData of results.data) {
    const pair: Pair = {
      fullNameA: pairData[0],
      emailA: pairData[1],
      fullNameB: pairData[2],
      emailB: pairData[3]
    };

    pairings.push(pair);
  }
  await fetch("/api/emails/send-pairings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pairings)
      });
  return pairings;
}

//testing
//console.log(parseUserFile(USER_FILE));
//console.log(parsePairingFile(PAIR_FILE));

//parseUserFile(USER_FILE);
//parsePairingFile(PAIR_FILE);

