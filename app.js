#!/usr/bin/env node

'use strict'

const VERSION = 'v1.0.0'
var colors = require('colors')

if (process.argv.length <= 2) {
  print('\nUsage: jadwalsholat "CITY_NAME"')
  displayFooter()
  exit()
}

var param = process.argv[2]
if (param == '--version' || param == '-v') {
  print(VERSION.green)
  exit()
}
else if (!param.match(/^[a-zA-Z\s]+$/i)) {
  print('\nInvalid city name!'.yellow)
  displayFooter()
  exit()
}

// Check is city available
var city = require('./city')
var cityId = checkCity(param)

var Horseman = require('node-horseman')
var cheerio = require('cheerio')
var tabletojson = require('tabletojson')
var Table = require('cli-table')
var Spinner = require('cli-spinner').Spinner
var spinner = new Spinner('Collecting information... %s ')

spinner.setSpinnerString(7)
spinner.start()

var horseman = new Horseman()
  horseman
  .userAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36")
  .on('error', function(message, trace) {
    print(message)
  })
  .on('timeout', function(message) {
    print('Timeout\n')
  })
  .open('http://jadwalsholat.pkpu.or.id/monthly.php?id='+cityId)
  .evaluate(function() {
    return document.querySelector('.table_adzan tbody').innerHTML
  })
  .then(function(result) {
    jadwalsholat.load(result).parse()
  })
  .finally(function() {
    horseman.close()
    spinner.stop()
    return
  })

var jadwalsholat = {
  result: null,
  tables: null,
  checkResult() {
    return (this.result != '' ? true:false)
  },
  load(res) {
    this.parseHTML(res)
    this.result = res
    return this
  },
  parseHTML(html) {
    var table = cheerio.load(html)
    this.tables = table('tr.table_header').nextAll()
  },
  getThisDayTimeScheduleTable() {
    let header = ["Shubuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"]
    let body = []
    var tbl = new Table(),
    date = new Date().getDate(),
    table = this.tables[date-1].children

    let row = []
    for (let i=1; i<table.length; i++) {
      row.push(table[i].children[0].data)
    }
    body.push(row)

    var thisDayTable = new Table({head: header})
    for(let item in body) {
      thisDayTable.push(body[item])
    }

    print(thisDayTable.toString())
  },
  parse() {
    if (this.checkResult()) {
      print("\n\n")
      this.getThisDayTimeScheduleTable()
    }
    else {
      print("\nSorry, we can't process your request right now :(".yellow)
    }
    displayFooter()
  }
}

function checkCity(name) {
  for (let i=0; i < city.length; i++) {
    if (city[i].name.toLowerCase() == name.toLowerCase()) return city[i].id
  }
  print("\nSorry, we can't process your request, city not found.".yellow)
  displayFooter()
  exit()
}

function displayFooter() {
  print('\n\nJadwal Sholat © 2016'.blue)
  print('Visit https://github.com/nmfzone/jadwal-sholat for more information.')
}

function print(msg = '') {
  console.log(msg)
}

function exit() {
  process.exit(-1)
}
