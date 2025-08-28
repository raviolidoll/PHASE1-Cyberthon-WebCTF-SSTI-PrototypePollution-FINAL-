const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const bs58 = require("base-58");

const app = express();

// Configure Handlebars with a dangerous "eval" helper

/*
const hbs = exphbs.create({
    helpers: {
        eval: function(expression) {
            return eval(expression); // Dangerous! Allows arbitrary JS execution
        }
    }
});
*/
const hbs = exphbs.create({
    helpers: {
        eval: function(expression) {
            // Only allow process.env access
            const allowedPattern = /^process\.env\.([a-zA-Z_][a-zA-Z0-9_]*)$/;
            if (allowedPattern.test(expression.trim())) {
                const envVar = expression.trim().split(".")[2]; // Get the ENV VAR key
                return process.env[envVar] || "undefined";
            }
            return " "; // Reject any other expression
        }
    }
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const isObject = obj => obj && obj.constructor && obj.constructor === Object;

function merge(a,b){
 for (var attr in b){   
   if(isObject(a[attr]) && isObject(b[attr])){
      merge(a[attr],b[attr]);
   }
   else{
    a[attr] = b[attr];
 }
 }  
 return a 
} 

function clone(a){
  return merge({},a);
}
// Static string
const STATIC_DIR = "/G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS==";

// Step 1: Base64 encode
const base64Encoded = Buffer.from(STATIC_DIR).toString('base64');

// Step 2: Convert Base64 string to Buffer before Base58 encoding
const buffer = Buffer.from(base64Encoded, 'ascii');
const base58Encoded = bs58.encode(buffer); // The encode function should work here

console.log("Obfuscated Dir:", base58Encoded);


// GET route to display the vulnerable form
app.get("/", (req, res) => {
    res.render("vulnerable", { userInput: "" });
});

// SSTI code
app.post("/", (req, res) => {
    const userInput = req.body.template;  // User-controlled input

    // Check if input ends with a single or double quote
    if ((userInput.endsWith("'") || userInput.endsWith('"') || userInput.endsWith("--")) && userInput.length > 10) {
        return res.send("~You tripped and fell in love, Just like a Tuesday drunk. " + 
            "You should have gone all in, all in, all in~ time to shazam this!");
    }
    if (userInput.endsWith("'") || userInput.endsWith('"') || userInput.endsWith("--")) {
        return res.send("Query failed with error: You have an error in your SQL syntax; " + 
            "check the manual that corresponds to your MySQL server version for the right " + 
            "syntax to use near ''' at line 1");
    }
    if (userInput.endsWith("--+")) {
        return res.send("Unknown column 'OR' in 'where clause'");
    }
    if (userInput.endsWith(">") & userInput.startsWith("<")) {
        return res.send("NO XSS ALLOWED HERE");
    }
    //SSTI checking starts here
    // Regular expression to check if userInput is in the format "{{something}}"
     
    const sstiPattern = /^{{.*}}$/;
    
     if (sstiPattern.test(userInput)) {
        /*
        if (userInput.endsWith("{{hiddenDir}}")) {
            //const hashedDir = require('crypto').createHash('sha256').update(STATIC_DIR).digest('hex');
            return res.send(base58Encoded);
        }
        else{
            res.render("vulnerable", { userInput }); // Process SSTI input. If it is {{invalid_command}}, error will be displayed on browser. *double confirm if it's safe error output
        }
    */
    
    // Allow only {{process.env.VAR}} format
    const validEnvPattern = /^{{\s*process\.env\.([a-zA-Z_][a-zA-Z0-9_]*)\s*}}$/;

        if (validEnvPattern.test(userInput)) {
            const envVar = userInput.match(validEnvPattern)[1];

            if (envVar === "hiddenDir") {
                return res.send(base58Encoded);
            } else if (process.env[envVar]) {
                return res.send(process.env[envVar]);
            } else {
                return res.send("Hi adventurer! You're so close...have you tried solving the problem from its source?");
            }
        } else {
            return res.send("Error: eval error");
        }
     } 
    else {
         res.send("Where the birds sing and the flowers bloom, you'll find a hidden treasure"); // Default response for invalid input that are not within {{ }}
     }
    
    
    //res.render("vulnerable", { userInput });
});


// Serve static files for prototype pollution challenge
app.use('/G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS==/', 
    express.static(path.join(__dirname, 'G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctSviews'))
);


app.get("/G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS==/signup", (req, res) => {
    res.render("signup", { userInput: "" });
});


// Prototype Pollution Code ---------------------------------------------------------------------------------------------------------------

//change the string to G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS

//Exploitable Signup Route
app.post('/G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS==/signup', (req, res) => {
    
    var body = JSON.parse(JSON.stringify(req.body)); // Convert request body to object
    var copybody = clone(body); // Clone to avoid direct modification

    if (copybody.name) {
        res.cookie('name', copybody.name).json({ "done": "cookie set" }); 
        console.log("Current Cookies:", copybody.name);
    } else {
        res.json({ "error": "cookie not set" });
    }
});

//Flag Route
app.get('/G6k4iwOXZ8lJue8HTxZzcGnNsqwGVctS==/getFlag', (req, res) => {
    var adventurer = JSON.parse(JSON.stringify(req.cookies));
    //console.log("Prototype Admin:", Object.prototype.аdventurer);

    if (adventurer.аdventurer == 1) {  // This key can be injected via prototype pollution
        delete Object.prototype.аdventurer; // Clean up after exploitation
        res.send("Cyberthon{P011ut!oN_UNvE!L$_+He_TRe@$UR3_M@P}");
    } else {
        res.send("You are not authorized.");
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
