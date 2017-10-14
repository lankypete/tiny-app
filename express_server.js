const app = require('express')();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser())

const bcrypt = require('bcrypt');

require('dotenv').config()

const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET,
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set('view engine', 'ejs');


var urlDatabase = {
  "b2xVn2": { url: "http://www.lighthouselabs.ca", userId: "3SeL7L" },
  "Hsm5xK": { url: "http://www.google.com", userId: "3SeL7L" },
  "S160d3": { url: "http://www.worldsbiggestwindow.com", userId: "5f1eLf" },
  "S960g3": { url: "http://www.worldscleanestwindow.com", userId: "5f1eLf" }
};

const users = {
  '3SeL7L': {
    id: '3SeL7L',
    email: 'q@q.com',
    password: '$2a$10$n32PxRviA4gquu/lsTAw4.pekcPYwZqz.J7mBKCuDdrYmKTJg4VHC'
  },
  '5f1eLf': {
    id: '5f1eLf',
    email: 'f@f.com',
    password: '$2a$10$Li8HbKRZu50UA8fKvp2osOjz6PSiImw8A9mbxJ8aVMg90SuPhP9Ay'
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
  password = bcrypt.hashSync(password, 10);

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
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return undefined;
  }
}

function authorizeSession(error) {
  return (req, res, next) => {
    res.locals.user = getUserById(req.session.userId);
    if(res.locals.user) {
      next();
    } else if (!error) {
      res.redirect('/login');
    } else {
      res.redirect('/login?error=' + error);
    }
  }
}

function createURL(url, userId) {
  const URLKey = generateRandomString();
  const protocol = url.slice(0, 7);
  if( protocol !== ('https://' || 'http://') ) {
    url = "https://" + url;
  }
  urlDatabase[URLKey] = {
    url,
    userId
  }
  return URLKey;
}

function editURL(id, url, currentUserId) {
  if( urlDatabase[id].userId === currentUserId ) {
    const protocol = url.slice(0, 7);
    if( protocol !== ('https://' || 'http://') ) {
      url = "https://" + url;
    }
    urlDatabase[id].url = url;
    return true;
  } else {
    return false;
  }

}


//----------------------------------------



//---------- DELETE ---------------

// app.get('/clearcookie', (req, res) => {
//   res.clearCookie('userId');
//   res.send('cleared cookie')
// });

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});



//---------Middle Ware ------------


app.use((req, res, next) => {
  const { userId } = req.session;
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
  const error = req.query.error;
  res.render('login', { error });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = loginUser(email, password);

  if( user ) {
    req.session.userId = user.id;
    res.redirect('/urls');
  } else {
    res.redirect('/login?error=Invalid login information')
  }


});

app.post("/logout", (req, res) => {
  req.session.userId = null;
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
    req.session.userId = userId;
    res.redirect('/urls');
  } catch(error) {
    res.render('register', { error: error.message } );
  }
});


//----------- URLs ------------------


app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const userURLS = {};
  const allURLs = {};
  Object.keys(urlDatabase).forEach(function(url) {
    if( userId && ( urlDatabase[url].userId === userId ) ) {
      userURLS[url] = urlDatabase[url];
    }
    if( !userId ) {
      userURLS[url] = urlDatabase[url];
    }

    allURLs[url] = urlDatabase[url];

  });

  let templateVars = {
    urls : userURLS,
    userId,
    allURLs
  }
  res.render("urls_index", templateVars)
});

app.post("/urls", (req, res) => {
  const URLKey = createURL(req.body.longURL, req.session.userId);
  res.redirect( "/urls/" + URLKey );
});

app.get("/urls/new", authorizeSession('You must log into an account to set URLs'), (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const error = req.query.error;
  let templateVars = {
    shortURL: req.params.id,
    url: urlDatabase[req.params.id],
    error
  };
  res.render("urls_show", templateVars );
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newName = req.body.newName;
  const currentUserId = req.session.userId;
  const URLEdit = editURL(id, newName, currentUserId);
  if( URLEdit ) {
    res.redirect('/urls');
  } else {
    const error = "This is not your URL to edit";
    res.redirect('/urls/' + id + '?error=' + error)
  }

});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});


app.get("/u/:shortURL", (req, res) => {
  const url = req.url;
  const urlKey = url.substr(url.length-6, url.length-1);
  let longURL = urlDatabase[urlKey].url;
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



























