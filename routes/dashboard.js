const express = require('express');
const bodyparser = require("body-parser");
const session = require("express-session");
const path = require("path");
const ejs = require("ejs");
const url = require("url"); 
const rateLimit = require("express-rate-limit")
const moment = require('moment')
const axios = require("axios")
const fileBytes = require('file-bytes');
const base64 = require('tinybase64');
var bytes = require('bytes');
const router = require('express').Router();
var os = require('os-utils');
var clc = require("cli-color");
const config = require('/home/runner/WelcomeBrownStructuresss/config.json')
// const Discord = require("discord.js");
// const INTENTS = Object.entries(Discord.Intents.FLAGS).filter(([K]) => !["GUILD_PRESENCES", "GUILD_MEMBERS"].includes(K)).reduce((t, [, V]) => t | V, 0)
// const client = new Discord.Client({intents: INTENTS})  
// client.login(process.env.token)
const {
	JsonDatabase
} = require("wio.db");
const db = new JsonDatabase({
	databasePath: "./db/database.json"
});


// Pages

router.get('/', (req, res) => {
	if(!req.user) return res.redirect('/login')
	const vsl = Object.values(db.fetch('links'))
	const vsldev = vsl.filter(x => x.link_owner == req.user.id)
	res.render('dashboard', {
		user: req.user,
		db, config, vsldev
	})
})


module.exports = router;