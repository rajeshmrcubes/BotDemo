'use strict'
const bunyan = require('bunyan')
const log = bunyan.createLogger({name: "pastTrans"})
//Set Bunyan log level to TRACE or DEBUG or INFO
log.level("debug")

const msgToFBUsr = require('./mmsgToFBUsr')
const verifyNLink = require('./verifyNLink')
const sessData = require('./sessData')
const cancelTrans = require('./cancelTrans')
const util = require('./util')
// Show account balance
async function showAcBal(PSId){
  log.info("showAcBal :: called with PSId: %s", PSId)
  if(await verifyNLink.chooseIdentificationMethod(PSId)){
    var messageData = {
      "messaging_type": "RESPONSE",
      "recipient":{
          "id":PSId
      },
      "message":{
          "text":"Available Balance for your account ending xxxxx6655 is THB 157823.65."
      }
    }
    msgToFBUsr.callSendAPI(messageData)
    var messageData = {
      "messaging_type": "RESPONSE",
      "recipient":{
          "id":PSId
      },
      "message":{
          "text":"Ledger Balance for your account ending xxxxx6655 is THB 157823.65."
      }
    }
    msgToFBUsr.callSendAPI(messageData)
  }
  log.info("showAcBal sent replies to recipient %s", PSId);
}
module.exports = {
    showAcBal: showAcBal
}
