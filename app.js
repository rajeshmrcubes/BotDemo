var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
require('dotenv').config();
var fs = require('fs');
const rfs = require('rotating-file-stream');
var expressValidator = require('express-validator');
const fetch = require('node-fetch');
const crypto = require('crypto');
var app = express();
var request = require('request');
const {Wit} = require('node-wit');
const accessToken = require('./config');
const url1 = 'https://graph.facebook.com/v2.6/me/messages';
var PropertiesReader = require('properties-reader');
var handleMessage = require('./modulejs/handleMessage');
var sendRequest = require('./modulejs/SendMessage')
var datendTime = require('./modulejs/DateAndTime')
var processXferRequest = require('./modulejs/processXferRequest')
var chooseIdentifucationMethod = require('./modulejs/IdentiFunctionMethod')
var chooseIdentifucation = require('./modulejs/IdentiFunction')
var showAcBal = require('./modulejs/showAcBal')
var showLast3Trans = require('./modulejs/showLast3Trans')
var processBillPay = require('./modulejs/processBillPay')
var dnldStmt = require('./modulejs/dnldStmt')
var processDnldStmt = require('./modulejs/processDnldStmt')
var processAuthenticateAndLink = require('./modulejs/processAuthenticateAndLink')
var processMyProfile = require('./modulejs/processMyProfile')
var showTransWithDateRange = require('./modulejs/showTransWithDateRange')
var showTransWithDateAndAmt = require('./modulejs/showTransWithDateAndAmt')
var sendText = require('./modulejs/sendText')
var strToAmt = require('./modulejs/StringToNumber')
//var analyzeWitAIResponse = require('./modulejs/analyzeWitAIResponse')
var addToVerifiedList = require('./modulejs/addToVerifiedList')
var processAcctOpening = require('./modulejs/processAcctOpening')
// for Facebook verificationController
const verificationController = require('./controller/verification');
console.log(verificationController);
const client = new Wit(accessToken);
//This is for witai
var options = {
    sessionId: ''
}
const {interactive} = require('node-wit');
interactive(client);
// body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var token =process.env.FB_token
//getting webhook connection for facebook
app.get('/webhook', verificationController);
//getting fb message
//var text = '';
app.post('/webhook', function (req, res) {
    console.log(datendTime.getToDateAndTime()+" post request received on webhook. with time "+datendTime.getToDateAndTime())
    var data = req.body
    // Make sure this is a page subscription
    if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
                var pageID = entry.id;
                var timeOfEvent = entry.time;
                // Iterate over each messaging event
                entry.messaging.forEach(function(event) {
                console.log("Webhook received message event: ", event);
                  if (event.message) {
                    receivedMessage(event);
                  }else if (event.delivery) {
                    receivedDelivery(event);
                  }else if (event.postback) {
                    receivedPostback(event);
                  }else if (event.referral) {
                    receivedReferral(event);
                  }else {
                    console.log("Webhook received unknown event: ", event);
                  }
                });
              });
              res.sendStatus(200);

            }
          });

async function receivedMessage(event) {
      var senderID = event.sender.id
      var recipientID = event.recipient.id
      var timeOfMessage = event.timestamp
      var message = event.message
      var findFunction = function(element){
      if(element.key == senderID) return true
      }

      //Send typing on message and then do processing.
      var messageData = {
          recipient: {
          id: senderID
        },
        sender_action: "typing_on"
      }
      sendRequest.sendRequest(senderID,messageData);
      console.log(datendTime.getToDateAndTime()+" receivedMessage :: Received message %s from user %d for page %d at %d:", JSON.stringify(message), senderID, recipientID, timeOfMessage);
      var messageId = message.mid
      var messageText = message.text
      var messageAttachments = message.attachments
      var payload = null
      if(message.quick_reply != undefined) payload = message.quick_reply.payload
      else if(messageAttachments){
          if(messageAttachments[0].type == "location"){
            console.log(datendTime.getToDateAndTime()+" receivedMessage :: Received Location for user %s. Lat = %d Long = %d ", senderID, messageAttachments[0].payload.coordinates.lat, messageAttachments[0].payload.coordinates.long)
            chooseATMCMDOrBranch(senderID)
          }else sendText.sendText(senderID, "Message with attachment received")
        }else if((messageText != undefined) && (messageText != null) && (messageText != "")){
          var witaiResp = await analyzeWitAIResponse(senderID, messageText)
          console.log(datendTime.getToDateAndTime()+" witaiResp ai  "+JSON.stringify(witaiResp));
          //console.log(datendTime.getToDateAndTime()+" payloaaaaaaaaaaaaad value is "+payload);
          if(chooseIdentifucation.chooseIdentifucation(senderID)){
            console.log(datendTime.getToDateAndTime()+" value of await chooseIdentifucationMethod(senderID) is "+ chooseIdentifucation.chooseIdentifucation(senderID) );
            if(strToAmt.strToAmt(messageText) != "Invalid") {
              console.log("if(strToAmt(messageText) != Invalid) been called  "+strToAmt.strToAmt(messageText));
              payload = 'FUND_XFER';
            }else handleMessage.handleMessage(senderID,witaiResp,messageText);

          }else handleMessage.handleMessage(senderID,witaiResp,messageText);

        }
      if(payload){
            console.log(datendTime.getToDateAndTime()+" payload value is "+payload);
          if(process.env.INPROGTRAN != undefined){
            var multiArr = JSON.parse(process.env.INPROGTRAN)
            var usrArrItm = multiArr.PSId.find(findFunction)

          }
          if((usrArrItm != undefined) && usrArrItm.tranName != undefined){
            console.log(datendTime.getToDateAndTime()+" receivedMessage :: transaction in progress for this user: %s , %s", senderID, usrArrItm.tranName)
          if(usrArrItm.tranName == "FUND_XFER") processXferRequest.processXferRequest(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "DT_AMT") processTransWithDateAndAmt.processTransWithDateAndAmt(senderID, messageText)
          else if(usrArrItm.tranName == "FUND_XFER") processXferRequest.processXferRequest(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "DN_STMT") processDnldStmt.processDnldStmt(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "BILL_PAY") processBillPay.processBillPay(senderID, messageText, payload, multiArr)
          }else if(payload === 'FUND_XFER'){
            processXferRequest.processXferRequest(senderID, messageText, payload, multiArr)
          }else if(payload === 'AC_BALANCE'){
            showAcBal.showAcBal(senderID)
          }else if(payload === 'LAST_3_TRANS'){
            showLast3Trans.showLast3Trans(senderID)
          }else if(payload === 'DN_STMT'){
            processDnldStmt.processDnldStmt(senderID, messageText, payload, multiArr)
          }else sendText.sendText(senderID, "I am sorry, I don't know what to use this info for !!")
        }

}

async function receivedPostback(event){
  var PSId = event.sender.id;
  var recipientId = event.recipient.id;
  //sending message on processing
  var messageData = {
    recipient: {
      id: PSId
    },
    sender_action: "typing_on"
  }
  sendRequest.sendRequest(PSId,messageData);
  let payload = event.postback.payload;
  if(payload === 'OPEN_CASA') processAcctOpening.processAcctOpening(PSId)
  else{
  if(chooseIdentifucationMethod.chooseIdentifucationMethod(PSId)){
    var multiArr = null
    if(payload === 'FUND_XFER') processXferRequest.processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__TMB_PAYEE_ID') processXferRequest.processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__SCB_PAYEE_ID') processXferRequest.processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__PP_PAYEE_ID') processXferRequest.processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'AC_BALANCE') showAcBal.showAcBal(PSId)
        else if(payload === 'LAST_3_TRANS') showLast3Trans.showLast3Trans(PSId)
        else if(payload === 'BILL_PAY__CANCEL') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'DN_STMT') dnldStmt.dnldStmt(PSId)
        else if(payload === 'DN_STMT__YES') processDnldStmt.processDnldStmt(PSId, null, payload, multiArr)
        else if(payload === 'DN_STMT__NO') processDnldStmt.processDnldStmt(PSId, null, payload, multiArr)
        else if(payload === 'LINK_FB') processAuthenticateAndLink.processAuthenticateAndLink(PSId, "")
        else if(payload === 'MY_PROFILE') processMyProfile.processMyProfile(PSId)
        else if(payload === 'AC_BALANCE') showAcBal.showAcBal(PSId)
        else if(payload === 'LAST_3_TRANS') showLast3Trans.showLast3Trans(PSId)
        else if(payload === 'DT_RNG') showTransWithDateRange.showTransWithDateRange(PSId)
        else if(payload === 'DT_AMT') showTransWithDateAndAmt.showTransWithDateAndAmt(PSId)
        else if(payload === 'BILL_PAY__BILLER_SPS') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__BILLER_SPF') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__BILLER_STC') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__FULL') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__PART') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__NOW') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__LATER') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__SUGSTD_SCHDL') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY__CHOOSE_DATE') processBillPay.processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'BILL_PAY') processBillPay.processBillPay(PSId, null, payload, multiArr)

      }else{
        console.log(datendTime.getToDateAndTime()+" receivedPostback :: customer asked to verify himself ")
      }
    }
    }

async function analyzeWitAIResponse(PSId, messageText){
          var findFunction = function(element){
          if(element.key == PSId) return true
          }

            try{
                let witAiResp =await callDialogFlow(PSId, messageText);
                return witAiResp;
                }catch(Error){
              console.log(datendTime.getToDateAndTime()+" analyzeAIResponse :: Error: %s", JSON.stringify(Error))
              console.log(datendTime.getToDateAndTime()+" "+Error)
              }
    }

async function callDialogFlow(PSId, messageText){
        //Send message to witai
        options.sessionId = PSId;
        console.log(datendTime.getToDateAndTime()+" callDialogFlow :: options object being sent is: %s", JSON.stringify(options))
          console.log(datendTime.getToDateAndTime()+" callDialogFlow :: message Text being sent is: %s", messageText)
          let witAiRequest = client.message(messageText,options);
          return   witAiRequest.then(function (response){
            return  response;
          });


  }

// This gets called by facebook
function receivedDelivery(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var deliveryMessage = event.delivery;

  console.log(datendTime.getToDateAndTime()+" Received delivery receipt %s for user %d and page %d at %d with message:", JSON.stringify(deliveryMessage), senderID, recipientID, timeOfMessage);
}

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname + '/resform.html'));
});

app.get('/public/',function(req,res){
  res.sendFile(path.join(__dirname + '/mecustomerverification.html'));
});
// For webview posts.
app.post('/webviewpost', function (req, res) {
    console.log("post request received from webview.")

    var data = req.body
    console.log("post object is: %s", JSON.stringify(data))
    res.sendStatus(200);

    if(data.action == 'VERIFY_SUCCESS') addToVerifiedList.addToVerifiedList(data.psid);

});

app.post('/public/webviewpost', function (req, res) {
    console.log("post request received from webview.")

    var data = req.body
    console.log("post object is: %s", JSON.stringify(data))
    res.sendStatus(200);

    if(data.action == 'VERIFY_SUCCESS') callQuickReply(data.psid);

});

const logDirectory = path.join(__dirname, 'log')
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
// create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})

/*//setting port
app.set('port',process.env.PORT || 3030);
// providing the JSon
app.listen(app.get('port') ,function(req,res){
  console.log(Date.now());
  console.log("time is "+Date.now());
console.log('Webhook server is listening, port 3030');
});

if (module === require.main) {
  app.listen(app.get('port'), function(req,res) {
    //log.info('running on port', app.get('port'))
      console.log('running on port', app.get('port'))
  })
}*/
var server = app.listen(process.env.PORT || 3030, function () {
  var port = server.address().port;
  console.log("Express is working on port " + port);
});
