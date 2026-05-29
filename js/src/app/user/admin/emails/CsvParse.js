import fs from "fs";

//Configuration Constants
const SENDER_NAME = "Patina Network"
const SENDER_EMAIL = "bella.patinanetwork@gmail.com"
const APP_PASSWORD = ""
const USERS_FILE = "js/src/app/user/admin/emails/users-test.csv"

function validateCSV(csv) {
    const requiredHeaders = ['Timestamp','Name','Email','Intro','LinkedIn','Industry','Preferences','Topics','Anything'];
    const headers = csv[0];
    return requiredHeaders.every(header => headers.includes(header)); //returns true if all requiredheaders are present, false otherwise
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
        const csvArray = lines.map(line => line.split(",").map(cell => cell.trim()));
        
        if (!validateCSV(csvArray)) {
            throw new Error("Invalid CSV: missing required headers.");
        }

        const headerIndex = csvArray[0].reduce((acc, header, index) => {
            acc[header] = index;
            return acc;
        }, {});

        for (let i = 1; i < csvArray.length; i++) {
            const row = csvArray[i];
            const email = row[headerIndex['Email']].toLowerCase();
            users.set(email, {
                name: row[headerIndex['Name']],
                intro: row[headerIndex['Intro']],
                linkedin: row[headerIndex['LinkedIn']],
                industry: row[headerIndex['Industry']],
                preferences: row[headerIndex['Preferences']],
                topics: row[headerIndex['Topics']],
                anything: row[headerIndex['Anything']]
            }); 
       
        }
    }
    catch (err){
        console.error(`Error parsing CSV: ${err}`);
    }
    console.log(users); 
    return users;
}

parseUsers(USERS_FILE);