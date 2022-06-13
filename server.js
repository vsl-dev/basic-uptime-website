const express = require('express');
const bodyparser = require("body-parser");
const session = require("express-session");
const path = require("path");
const ejs = require("ejs");
const url = require("url"); 
const rateLimit = require("express-rate-limit")
const moment = require('moment')
const axios = require("axios")
const app = express();
var os = require('os-utils');
var clc = require("cli-color");
const config = require('./config.json')
const port = 8080
const {
	JsonDatabase
} = require("wio.db");
const db = new JsonDatabase({
	databasePath: "./db/database.json"
});

// View engines & others

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.engine("html", ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/web/views"));
app.use(express.static(path.join(__dirname, "/web/public")));
app.use('/assets', express.static('assets'));
app.set('json spaces', 1)

// Discord oauth2

const passport = require("passport");
const { Strategy } = require("passport-discord");

     passport.serializeUser((user, done) => {
   done(null, user);
 });
 passport.deserializeUser((obj, done) => {
   done(null, obj);
 });

let strategy = new Strategy({
  clientID: "BOT_ID",
  clientSecret: "YOUR_SECRET",
  callbackURL: "https://example.com/callback",
  scope: ["identify"]
}, (accesToken, refreshToken, profile, done) => {
  process.nextTick( () => done(null, profile))
})
passport.use(strategy)

app.use(session({
  secret: "vsldev",
  resave: false,
  saveUninitialized: false
}));

 app.use(passport.initialize());
 app.use(passport.session());

global.checkAuth = (req, res, next) => {
      if (req.isAuthenticated()) return next();
      req.session.backURL = req.url; 
      res.redirect("/login");
    }

app.get("/login", (req, res, next) => {
      if (req.session.backURL) {
        req.session.backURL = req.session.backURL; 
      } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer).pathname;
          req.session.backURL = parsed;
      } else {
        req.session.backURL = "/";
       }
      next();
    },
    passport.authenticate("discord",{ prompt: 'none' }))

app.get ("/callback", passport.authenticate("discord" , {
  failureredirect :"/error?statuscode=400&message=Failed+to+login+website"
}), (req , res) => {
  res.redirect(req.session.backURL || '/');
 });

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
        req.logout();
        res.redirect("/");
      });
});

// Pages

app.get('/', (req, res) => {
	res.render('uptime', {
		user: req.user,
		db, config
	})
})

app.get('/uptime', (req, res) => {
	res.render('uptime', {
		user: req.user,
		db, config
	})
})

app.get('/dashboard', (req, res) => {
	if(!req.user) return res.redirect('/login')
	const vsl = Object.values(db.fetch('links'))
	const vsldev = vsl.filter(x => x.link_owner == req.user.id)
	res.render('dashboard', {
		user: req.user,
		db, config, vsldev
	})
})

app.get('/discord', (req, res) => {
	res.redirect(config.discord_server)
})

// Uptimer

app.post('/uptime/link/add', (req, res) => {
	if(!req.user) return res.json({"error": "Invalid discord id."})
	var vsl = Object.values(db.fetch('links'))
	var lnkhas = vsl.filter(x => x.link == req.body.link)
    if ((lnkhas == "") == false) {
	res.redirect('/dashboard')
	} else {
	const id = makeid(25)
	var Data = {
		link_id: id,
		link_owner: req.user.id,
		link: req.body.link,
		link_when_added: now
	}
	db.set(`links.${id}`, Data)
	res.redirect('/dashboard?success=true')
}
})

app.post('/uptime/link/delete/:ID', (req, res) => {
	try {
	const owner = db.fetch(`links.${req.params.ID}`).link_owner
	if((req.user.id == owner) == true) {
	db.delete(`links.${req.params.ID}`)
	res.redirect('/dashboard?succes=true')
	} else {
	res.redirect('/dashboard?brh')
	}
	} catch (err) {
		res.redirect('/dashboard?success=false&error=true')
	}
})

setInterval(() => {
  var links = db.get("links");
  if (!links) return;
  var linkA = Object.values(links);
  var lnks = linkA.map(c => c.link);
  lnks.forEach(link => {
	  const request = require('request');
request(link, function (error, response, body) {
	console.log('Pinged - ' + link)
	})})
}, 50000);

// Functions


function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
			charactersLength));
	}
	return result;
}

app.listen(8080, () => {
	console.log("Server running on port - " + port)
	console.log("https://github.com/vsl-dev")
})
