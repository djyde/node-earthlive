'use strict'

const moment = require('moment')
const lwip = require('lwip')
const request = require('superagent')

const SPLIT = 1

const WALLPAPER_WIDTH = 1440
const WALLPAPER_HEIGHT = 900

const END_POINT = `http://himawari8-dl.nict.go.jp/himawari8/img/D531106/${SPLIT}d/550`
const LATEST = 'http://himawari8.nict.go.jp/img/D531106/latest.json'



function fetchLatestDate(){
  return new Promise((resolve, reject) => {
    request
      .get(LATEST)
      .end((err, res)=>{
        if (err) {
          reject(err)
        } else {
          resolve(moment(res.body.date).format('YYYY/MM/DD/HHmmss'))
        }
      })
  })
}

function downloadPiece(x, y){
  return new Promise((resolve, reject) => {
    fetchLatestDate()
      .then((date) => {
        request
          .get(`${END_POINT}/${date}_${x}_${y}.png`)
          .end((err, res) => {
            err ? reject(err) : resolve(res.body)
          })
      })
  })
}

// get lwip image object from buffer
function getImage(buffer){
  return new Promise((resolve, reject) => {
    lwip.open(buffer, 'png', (err, image) => {
      err ? reject(err) : resolve(image)
    })
  })
}

function run(){

    // create a wallpaper canvas
    new Promise((resolve, reject) => {
      lwip.create(WALLPAPER_WIDTH, WALLPAPER_HEIGHT, 'black', (err, canvas) => {
          err ? reject(err) : resolve(canvas)
      })
    })

    .then((canvas) => {
      // download all splited piece as buffer

      downloadPiece(0, 0)
        .then((pieceBuffer) => getImage(pieceBuffer))
        .then((pieceImage) => {
          canvas.paste(445, 175, pieceImage, (err, wallpaper) => {
            wallpaper.writeFile('./wallpaper.png', (err) => err ? console.log(err) : 'Generated!')
          })
        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
}

run()