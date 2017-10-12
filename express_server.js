const app = require('express')();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require("cookie-parser");
app.use(cookieParser())

app.set('view engine', 'ejs');


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use((req, res, next) => {
  const { username } = req.cookies;
  res.locals.username = username;
  next();
});

app.get("/", (req, res) => {
  res.redirect('/urls')
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  //res.locals.username = undefined;
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let templateVars = { urls : urlDatabase }
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newName = req.body.newName;
  urlDatabase[id] = newName;
  console.log(urlDatabase)
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  const URLKey = generateRandomString();
  urlDatabase[URLKey] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const url = req.url;
  const urlKey = url.substr(url.length-6, url.length-1);
  let longURL = urlDatabase[urlKey];
  res.redirect(longURL);

});

app.listen(PORT, () => {
 console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let arr = [];
  for(let i = 0; i < 6; i++) {
    const numberOrLetter = Math.round(Math.random());
    let random;
    if(numberOrLetter) {
      random = Math.floor( Math.random() * (122 - 97) + 97);
    } else {
      random = Math.floor( Math.random() * (57 - 48) + 48);
    }
    if(random > 105) {
      random = String.fromCharCode(random).toUpperCase();
    } else {
      random = String.fromCharCode(random);
    }
    arr.push(random);
  }
  return arr.join('');
}



























