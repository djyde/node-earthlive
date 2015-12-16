#!/usr/bin/env node

'use strict'

const path = require('path')
const moment = require('moment')
const request = require('superagent')
const wpp = require('wallpaper')
const fs = require('fs')
const images = require('images')

const SPLIT = 2

const WALLPAPER_WIDTH = 1440 * 2
const WALLPAPER_HEIGHT = 900 * 2

const END_POINT = `http://himawari8-dl.nict.go.jp/himawari8/img/D531106/${SPLIT}d/550`
const LATEST = 'http://himawari8.nict.go.jp/img/D531106/latest.json'

let currentDate = ''

fs.stat('./wallpaper', (err) => {
  if (err) {fs.mkdir('./wallpaper')};
})

function fetchLatestDate(){
  return new Promise((resolve, reject) => {
    request
      .get(LATEST)
      .end((err, res)=>{
        if (err) {
          reject(err)
        } else {
          currentDate = moment(res.body.date).format('YYYYMMDDHHmmss')
          resolve(moment(res.body.date).format('YYYY/MM/DD/HHmmss'))
        }
      })
  })
}

function downloadPiece(){
  return new Promise((resolve, reject) => {

    fetchLatestDate()
      .then((date) => {

        let count = 0

        for(let x = 0; x < SPLIT; x++){
          for(let y = 0; y < SPLIT; y++){
            request
              .get(`${END_POINT}/${date}_${x}_${y}.png`)
              .end((err, res) => {
                count++
                fs.writeFile(`./wallpaper/${x}_${y}.png`, res.body, (err) => {
                  if (err) {
                    reject(err)
                  } else {
                    if (count === 4) resolve();
                  }
                })
              })
          }
        }
      })
  })
}

function generate(){
  // TODO should be flexible
  console.log('generating..')
  return new Promise((resolve) => {
    images(WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
      .fill(0x00, 0x00, 0x00)
      .draw(images('./wallpaper/0_0.png'), 890, 350)
      .draw(images('./wallpaper/0_1.png'), 890, 900)
      .draw(images('./wallpaper/1_0.png'), 1440, 350)
      .draw(images('./wallpaper/1_1.png'), 1440, 900)
      .save(`./wallpaper/${currentDate}.png`, {quality: 100})

      // TODO should be a callback, but the `images` library did not provide.
      setTimeout(()=> resolve(), 5000)
  })
}

function setWallpaper(){
  wpp.set(path.resolve('./', 'wallpaper', `${currentDate}.png`)).then(()=> console.log('set wallpaper success at', currentDate))
}

function run(){
  if (currentDate) {fs.unlinkSync(`./wallpaper/${currentDate}.png`)};
  downloadPiece().then(()=> generate().then(()=> setWallpaper()))
}

setInterval(run(), 5 * 60 * 1000)
// generate()