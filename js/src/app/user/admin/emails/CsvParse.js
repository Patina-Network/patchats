import fs from "fs";

//Configuration Constants
const SENDER_NAME = "Patina Network"
const SENDER_EMAIL = "bella.patinanetwork@gmail.com"
const APP_PASSWORD = ""
const USERS_FILE = "js/src/app/user/admin/emails/users-test.csv"
const PAIRINGS_FILE = "js/src/app/user/admin/emails/pairings-test.csv"

//classes 
class User {
    constructor(name, intro, linkedin, industry, preferences, topics, anything) {
        this.name = name;
        this.intro = intro;
        this.linkedin = linkedin;
        this.industry = industry;
        this.preferences = preferences;
        this.topics = topics;
        this.anything = anything;
    }
}

class Pair{
    constructor(fullNameA, fullNameB, emailA, emailB) {
        this.fullNameA = fullNameA;
        this.fullNameB = fullNameB;
        this.emailA = emailA;
        this.emailB = emailB;
    }
}

function validateCSV(csv) {
    const requiredHeaders = ['Timestamp','Name','Email','Intro','LinkedIn','Industry','Preferences','Topics','Anything'];
    const headers = csv[0];
    return requiredHeaders.every(header => headers.includes(header)); //returns true if all requiredheaders are present, false otherwise
}

function splitCSVLine(line){ //split lines w/ commas as deliminators (manually implmented to handle commas within quotes)
    const result = [];
    let current = "";
    let inQuotes = false;
    
    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes; // Toggle the inQuotes flag
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
        }
        else {
            current += char;
        }
    }
    result.push(current.trim()); // Add the last field
    return result;  
}

function parseUsers(csv){
    /*
    Parse Users.csv and return a map from email addresses to User objects.
    
    Args:
        filename: Path to the Users.csv file
        
    Returns:
        Dictionary mapping email addresses (lowercase) to User objects
    */
    const users = new Map();
    try{
        const data = fs.readFileSync(csv, "utf-8");

        const lines = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        const csvArray = lines.map(line => splitCSVLine(line, 9));
        
        if (!validateCSV(csvArray)) {
            throw new Error("Invalid CSV: missing required headers.");
        }
        const headerIndex = csvArray[0].reduce((acc, header, index) => {
            acc[header] = index;
            return acc;
        }, {});

        const usersMap = new Map();

    for (let i = 1; i < csvArray.length; i++) {
        const row = csvArray[i];
        const email = row[headerIndex['Email']].toLowerCase();

        const user = new User(
            row[headerIndex['Name']],
            row[headerIndex['Intro']],
            row[headerIndex['LinkedIn']],
            row[headerIndex['Industry']],
            row[headerIndex['Preferences']],
            row[headerIndex['Topics']],
            row[headerIndex['Anything']]
        );
        usersMap.set(email, user);
    }
    //console.log(usersMap);  //testing
    return usersMap;
    
    
    }
    catch (err){
        console.error(`Error parsing CSV: ${err}`);
    }

    
}

function parsePairs(csv){
    /*
    Parse Pairings-Apr26.csv and return a list of Pairing objects.
    
    Args:
        filename: Path to the pairings CSV file
        
    Returns:
        List of Pairing objects
    */
   const pairings = [];
   try{
        const data = fs.readFileSync(csv, "utf-8");
        const lines = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        const csvArray = lines.map(line => line.split(",").map(cell => cell.trim()));
        for (let i = 0; i < csvArray.length; i++) {
            const row = csvArray[i];
            if (row == undefined || row.length < 4) {
                console.log(`Warning: Skipping malformed row: ${row}`);
                continue;
            }
            const pair = new Pair(
                row[0], //fullNameA
                row[2], //fullNameB
                row[1], //emailA
                row[3]  //emailB
            );

            pairings.push(pair);

        }
   }catch (err){    
        console.error(`Error parsing CSV: ${err}`);
}
console.log(pairings); //testing
return pairings;
}

parseUsers(USERS_FILE);
parsePairs(PAIRINGS_FILE);

