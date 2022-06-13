const express = require('express');
const bodyparser = require("body-parser");
const session = require("express-session");
const path = require("path");
const ejs = require("ejs");
const url = require("url"); 
const rateLimit = require("express-rate-limit")
const moment = require('moment')
const axios = require("axios")
const router = require('express').Router();
var os = require('os-utils');
var clc = require("cli-color");
const now = moment().format("YYYY, MM, DD, HH:mm")
const config = require('./config.json')
const Discord = require("discord.js");

const {
	JsonDatabase
} = require("wio.db");
const db = new JsonDatabase({
	databasePath: "./db/database.json"
});

// Uptimer

router.post('/link/add', (req, res) => {
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

router.post('/link/delete/:ID', (req, res) => {
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

module.exports = router;
