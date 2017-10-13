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


const users = {
  "userRandomID": {
    id: "666",
    email: "a@a.com",
    password: "asdf"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


//----------------------------------------


function getUserByEmail(email) {
  return Object.values(users).find( user => user.email === email );
}

function createUser(email, password) {
  if(!email) { throw new Error("Please provide an email.."); }
  if(!password) { throw new Error("Please provide a password.."); }
  if(getUserByEmail(email)) { throw new Error("User with that email already exists.."); }

  const id = generateRandomString();

  users[id] = {
    id,
    email,
    password
  };

  return id;
}

function getUserById(userId) {
  return Object.values(users).find( user => user.id === userId );
}

function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    return user;
  } else {
    return undefined;
  }
}



//----------------------------------------



//---------- DELETE ---------------

app.get('/clearcookie', (req, res) => {
  res.clearCookie('userId');
  res.send('cleared cookie')
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});



//---------Middle Ware ------------


app.use((req, res, next) => {
  const { userId } = req.cookies;
  if ( userId ) {
    res.locals.user = getUserById( userId );
  }

  res.locals.randomColor = randomColor();

  next();

});

app.get("/", (req, res) => {
  res.redirect('/urls')
});

//----------- Log In/Out --------------

app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = loginUser(email, password);

  if( user ) {
    res.cookie('userId', user.id);
  }

  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('userId');
  res.redirect('/urls');
});

//------------- Register --------------

app.get('/register', (req, res) => {

  res.render('register');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  try {
    const userId = createUser(email, password);
    res.cookie('userId', userId).redirect('/urls');
  } catch(error) {
    res.render('register', { error: error.message } );
  }
});


//----------- URLs ------------------


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

app.get("/u/:shortURL", (req, res) => {
  const url = req.url;
  const urlKey = url.substr(url.length-6, url.length-1);
  let longURL = urlDatabase[urlKey];
  res.redirect(longURL);

});


//------------------------------------------


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


function randomColor() {
  return '#' + (function co(lor){   return (lor +=
  [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)])
  && (lor.length == 6) ?  lor : co(lor); })('');
}



























