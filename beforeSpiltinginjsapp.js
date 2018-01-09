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
    console.log(getToDateAndTime()+" post request received on webhook. with time "+getToDateAndTime())
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
/*function readPropertyFileValue(name){
  var properties = PropertiesReader('D:/witAi/BotDemo/public/parameter.properties');
  var property = properties.get(name);
  return property;
}*/

/*function readPropertyFileValueFromEnv(Name){
  console.log(getToDateAndTime()+" name that has to interact with env varable "+Name);
  console.log(getToDateAndTime()+"  value is "+ process.env[Name]);
  return process.env[Name];
}*/

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
      console.log(getToDateAndTime()+" receivedMessage :: Received message %s from user %d for page %d at %d:", JSON.stringify(message), senderID, recipientID, timeOfMessage);
      var messageId = message.mid
      var messageText = message.text
      var messageAttachments = message.attachments
      var payload = null
      if(message.quick_reply != undefined) payload = message.quick_reply.payload
      else if(messageAttachments){
          if(messageAttachments[0].type == "location"){
            console.log(getToDateAndTime()+" receivedMessage :: Received Location for user %s. Lat = %d Long = %d ", senderID, messageAttachments[0].payload.coordinates.lat, messageAttachments[0].payload.coordinates.long)
            chooseATMCMDOrBranch(senderID)
          }else sendText(senderID, "Message with attachment received")
        }else if((messageText != undefined) && (messageText != null) && (messageText != "")){
          var witaiResp =await analyzeWitAIResponse(senderID, messageText)
          console.log(getToDateAndTime()+" witaiResp ai  "+JSON.stringify(witaiResp));
          console.log(getToDateAndTime()+" payloaaaaaaaaaaaaad value is "+payload);
          if(await chooseIdentifucation(senderID)){
            console.log(getToDateAndTime()+" value of await chooseIdentifucationMethod(senderID) is "+ await chooseIdentifucation(senderID) );
            if(strToAmt(messageText) != "Invalid") {
              console.log("if(strToAmt(messageText) != Invalid) been called  "+strToAmt(messageText));
              payload = 'FUND_XFER';
            }else handleMessage.handleMessage(senderID,witaiResp,messageText);

          }else handleMessage.handleMessage(senderID,witaiResp,messageText);

        }
      if(payload){
            console.log(getToDateAndTime()+" payload value is "+payload);
          if(process.env.INPROGTRAN != undefined){
            var multiArr = JSON.parse(process.env.INPROGTRAN)
            var usrArrItm = multiArr.PSId.find(findFunction)

          }
          if((usrArrItm != undefined) && usrArrItm.tranName != undefined){
            console.log(getToDateAndTime()+" receivedMessage :: transaction in progress for this user: %s , %s", senderID, usrArrItm.tranName)
          if(usrArrItm.tranName == "FUND_XFER") processXferRequest(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "DT_AMT") processTransWithDateAndAmt(senderID, messageText)
          else if(usrArrItm.tranName == "FUND_XFER") processXferRequest(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "DN_STMT") processDnldStmt(senderID, messageText, payload, multiArr)
          else if(usrArrItm.tranName == "BILL_PAY") processBillPay(senderID, messageText, payload, multiArr)
          }else if(payload === 'FUND_XFER'){
            processXferRequest(senderID, messageText, payload, multiArr)
          }else if(payload === 'AC_BALANCE'){
            showAcBal(senderID)
          }else if(payload === 'LAST_3_TRANS'){
            showLast3Trans(senderID)
          }else if(payload === 'DN_STMT'){
            processDnldStmt(senderID, messageText, payload, multiArr)
          }else sendText(senderID, "I am sorry, I don't know what to use this info for !!")
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
  sendRequest(PSId,messageData);
  let payload = event.postback.payload;
  if(await chooseIdentifucationMethod(PSId)){
    var multiArr = null
    if(payload === 'FUND_XFER') processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__TMB_PAYEE_ID') processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__SCB_PAYEE_ID') processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'FUND_XFER__PP_PAYEE_ID') processXferRequest(PSId, null, payload, multiArr)
        else if(payload === 'AC_BALANCE') showAcBal(PSId)
        else if(payload === 'LAST_3_TRANS') showLast3Trans(PSId)
        else if(payload === 'BILL_PAY__CANCEL') processBillPay(PSId, null, payload, multiArr)
        else if(payload === 'DN_STMT') dnldStmt(PSId)
        else if(payload === 'DN_STMT__YES') processDnldStmt(PSId, null, payload, multiArr)
        else if(payload === 'DN_STMT__NO') processDnldStmt(PSId, null, payload, multiArr)
        else if(payload === 'LINK_FB') processAuthenticateAndLink(PSId, "")
        else if(payload === 'MY_PROFILE') processMyProfile(PSId)
        else if(payload === 'AC_BALANCE') showAcBal(PSId)
        else if(payload === 'LAST_3_TRANS') showLast3Trans(PSId)
        else if(payload === 'DT_RNG') showTransWithDateRange(PSId)
        else if(payload === 'DT_AMT') showTransWithDateAndAmt(PSId)
      }else{
        console.log(getToDateAndTime()+" receivedPostback :: customer asked to verify himself ")
      }
    }

/*    // Show transactions based on date range
function showTransWithDateAndAmt(PSId){
      console.log(getToDateAndTime()+" showTransWithDateAndAmt :: called with PSId: %s", PSId)
      var messageData = {
        "recipient":{
            "id":PSId
        },
        "message":{
            "text":"मैं यह सुविधा लाने की कोशिश कर रहा हूं ... उस पर काम चल रहा हूं"
        }
      }
      sendRequest(PSId,messageData)
      console.log(getToDateAndTime()+" showTransWithDateAndAmt sent replies to recipient %s", PSId);
    }

    // Show transactions based on date range
function showTransWithDateRange(PSId){
      console.log("showTransWithDateRange :: called with PSId: %s", PSId)
      addToInProgTran(PSId, "DT_RNG")
      var messageData = {
        "recipient":{
            "id":PSId
        },
        "message":{
            "text":"कृपया देय तिथि प्रदान करें "
        }
      }
      sendRequest(PSId,messageData)
      console.log("showTransWithDateRange sent replies to recipient %s", PSId);
    }
    //Process Bill Payment
async function processBillPay(PSId, messageText, payload, multiArr){
  console.log(getToDateAndTime()+" processBillPay :: called with PSId: %s ", PSId)
  if(await chooseIdentifucationMethod(PSId)){
      addToInProgTran(PSId, "BILL_PAY")
      var findFunction = function(element){
      if(element.key == PSId) return true
      }

    //if(!payload) payload = "xyz"
      var multiArr = JSON.parse(process.env.INPROGTRAN)
      var usrArrItm = multiArr.PSId.find(findFunction)
      if(payload == "BILL_PAY__CANCEL"){
        console.log(getToDateAndTime()+" processBillPay :: customer wants to cancel this payment PSId: %s", PSId)
        processCancelRequest(PSId, messageText)

      }else{
        processCancelRequest(PSId, messageText)
      }
    }/*else{
      var messageData={
        "recipient":{
               "id":PSId
            },
            message:{
              text:process.env.options
            }
          }
      sendRequest(PSId,messageData)
    }*/
}
//Download last month statement
/*async function processDnldStmt(PSId, messageText, payload, multiArr){
  console.log(getToDateAndTime()+ " processDnldStmt :: called with PSId: %s", PSId)
  if(await chooseIdentifucationMethod(PSId)){
    var findFunction = function(element){
      if(element.key == PSId) return true
    }
    var usrArrItm = multiArr.PSId.find(findFunction)

    if(usrArrItm.values.duration == undefined){
      if(messageText && (strToDateRange(messageText) == "Invalid Date")){
        log.info(getToDateAndTime()+ " processDnldStmt :: prompt user to enter date range.")
        var messageData = {
          "recipient":{
              "id":PSId
          },
          "message":{
              "text":"कृपया दिनांक सीमा या दिन दर्ज करें."
          }
        }
        sendRequest(PSId,messageData)
      }else{
        console.log(getToDateAndTime()+ " processDnldStmt :: Ask user to confirm duration.")
        usrArrItm.values.duration = strToDateRange(messageText)
        var frmDtStr = "आपके द्वारा प्रदान किये गए दिन हैं "+usrArrItm.values.duration+"\nकृपया सहमति दें"
        var messageData = {
          "recipient":{
            "id":PSId
          },
          "message":{
            "text": frmDtStr,
            "quick_replies":[
              {
                "content_type":"text",
                "title":"Confirm",
                "payload":"DN_STMT__YES"
              },
              {
                "content_type":"text",
                "title":"Change",
                "payload":"DN_STMT__NO"
              }
            ]
          }
        }
        sendRequest(PSId,messageData)
      }
    }else{
      if((payload != "DN_STMT__YES") && (payload != "DN_STMT__NO")){
        console.log(getToDateAndTime()+ " processDnldStmt :: prompt user to confirm duration.")
        var frmDtStr = "आपके द्वारा प्रदान किये गए दिन हैं "+usrArrItm.values.duration+"\nकृपया सहमति दें"
        var messageData = {
          "recipient":{
            "id":PSId
          },
          "message":{
            "text": frmDtStr,
            "quick_replies":[
              {
                "content_type":"text",
                "title":"Confirm",
                "payload":"DN_STMT__YES"
              },
              {
                "content_type":"text",
                "title":"Change",
                "payload":"DN_STMT__NO"
              }
            ]
          }
        }
        sendRequest(PSId,messageData)
      }
    }

    if(payload == "DN_STMT__YES"){
      var textMsg = usrArrItm.values.duration+" दिनों तक आपके खाते का विवरण "
      dnldAnyPeriodStmt(PSId, textMsg)
    }else if(payload == "DN_STMT__NO"){
      usrArrItm.values.duration = undefined
      var messageData = {
        "recipient":{
            "id":PSId
        },
        "message":{
            "text":"कृपया पुनः दिनांक सीमा/दिन दर्ज करें"
        }
      }
      sendRequest(PSId,messageData)
    }

    process.env.INPROGTRAN = JSON.stringify(multiArr)
    console.log(getToDateAndTime()+ " processDnldStmt :: Now INPROGTRAN: %s", process.env.INPROGTRAN)
    console.log(getToDateAndTime()+ " processDnldStmt :: replies sent to recipient %s", PSId);
  }
}
//Process Menu request
function processMenuRequest(PSId, messageText){
  console.log("processMenuRequest :: called with PSId: %s", PSId)

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "text":"सुविधाओं की सूची देखने के लिए नीचे हिंडोला का उपयोग करें। \nहिरसोल से नीचे सबसे लोकप्रिय लेनदेन से चुनना। हैप्पी बैंकिंग :)"
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "sharable":true,
          "elements":
          [
            {
              "title":"खाते की जानकारी",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/myaccount.png?rn=3",
              "subtitle":"खाते से जुड़ी जानकारी",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"AC_BALANCE",
                  "title":process.env.Acct_bal
                },
                {
                  "type":"postback",
                  "payload":"LAST_3_TRANS",
                  "title":process.env.LAST_3_TRANS
                },
                {
                  "type":"postback",
                  "payload":"DT_RNG",
                  "title":"पिछले लेनदेन"
                }
              ]
            },
            {
              "title":"लेनदेन और वक्तव्य/स्टेटमेंट",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/statement.png?rn=3",
              "subtitle":"आप तिथि सीमा चुन सकते हैं और कथन डाउनलोड कर सकते हैं.",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"LAST_3_TRANS",
                  "title":process.env.LAST_3_TRANS
                },
                {
                  "type":"postback",
                  "payload":"DN_STMT",
                  "title":"स्टेटमेंट डाउनलोड करें"
                }
              ]
            },
            {
              "title":"अंतरण अदायगी",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/transfer.png?rn=4",
              "subtitle":"अपने खातो मे \nइसी बैंक मे दुसरे के खाते मे\nदुसरे बैंक मे\nदुसरे देश के बैंक अकाउंट मे",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"FUND_XFER",
                  "title":"ट्रान्सफर"
                },
                {
                  "type":"postback",
                  "payload":"BILL_PAY",
                  "title":"बिल भुगतान"
                }
              ]
            },
            {
              "title":"कार्ड एप्लिकेशन और इंस्टेंट खाता खोले",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/accountopening.png?rn=3",
              "subtitle":"बैंकिंग खातों के लिए आवेदन करें \nक्रेडिट कार्ड के लिए आवेदन करें \nविदेशी मुद्रा कार्ड के लिए आवेदन करें",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"OPEN_CASA",
                  "title":"ओपन सेविंग्स अकाउंट"
                },
                {
                  "type":"postback",
                  "payload":"OPEN_CC",
                  "title":"कार्ड के लिए आवेदन करें"
                },
                {
                  "type":"postback",
                  "payload":"OPEN_COREX",
                  "title":"विदेशी मुद्रा कार्ड के लिए आवेदन करें"
                }
              ]
            },
            {
              "title":"मेरी प्रोफाइल",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/myprofile.png?rn=3",
              "subtitle":"अपने प्रोफ़ाइल विवरणों को संपादित और अपडेट करें \nअपने बैंकिंग प्रोफ़ाइल को फेसबुक प्रोफ़ाइल के साथ लिंक करें। \nनिकटतम शाखा की अगुवाई करें और निर्देश प्राप्त करें।",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"MY_PROFILE",
                  "title":"प्रोफाइल देखिये"
                },
                {
                  "type":"postback",
                  "payload":"LINK_FB",
                  "title":"अपने FB आईडी को लिंक करें"
                },
                {
                  "type":"postback",
                  "payload":"FIND_BRANCH",
                  "title":"एटीएम / सीडीएम / शाखा खोजें"
                }
              ]
            }
          ]
        }
      }
    }
  }
  messageDataArr[1] = messageData2

  var messageData3 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "text": "आप मेनू विकल्प का उपयोग कर सकते हैं या सबसे लोकप्रिय लेनदेन नीचे सूचीबद्ध हैं",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"खाते में शेष राशि",
          "payload":"AC_BALANCE"
        },
        {
          "content_type":"text",
          "title":"धन हस्तांतरण",
          "payload":"FUND_XFER"
        },
        {
          "content_type":"text",
          "title":process.env.LAST_3_TRANS,
          "payload":"LAST_3_TRANS"
        }
      ]
    }
  }
  //messageDataArr[2] = messageData3
  callBatchSendAPI(messageDataArr)

  console.log(getToDateAndTime()+" processMenuRequest :: sent reply to recipient %s", PSId);
}

//Download any period statement
function dnldAnyPeriodStmt(PSId, text){
  console.log("dnldAnyPeriodStmt :: called with PSId: %s and message: %s", PSId, text)

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "text":text
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "attachment":{
        "type":"file",
        "payload":{
          "is_reusable": false,
          "url":"https://peaceful-springs-82345.herokuapp.com/Statement.pdf"
        }
      }
    }
  }
  messageDataArr[1] = messageData2

  callBatchSendAPI(messageDataArr)

  //Delete transactions data
  var findFunction = function(element){
    if(element.key == PSId) return true
  }
  var multiArr = JSON.parse(process.env.INPROGTRAN)
  var usrArrItm = multiArr.PSId.find(findFunction)
  usrArrItm.tranName = undefined
  usrArrItm.values = undefined
  process.env.INPROGTRAN = JSON.stringify(multiArr)
  console.log("dnldAnyPeriodStmt sent replies to recipient %s", PSId);
}
//Convert String(YYYY-MM-DD) to Date
function strToDate(input){
  console.log("strToDate :: called with input: %s", input)
  var dateParts = input.split("-")
  var dateObject = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) // month is 0-based
  return dateObject
}
//Convert String(YYYY-MM-DD/YYYY-MM-DD) to Date
function strToDateRange(input){
  console.log("strToDateRange :: called with input: %s", input)
  var dateRange = "Invalid Date"
  var dateParts = undefined
  if((input != undefined) && (input != null) && (input != "")) dateParts = input.split("/")
  var fromDateParts = undefined
  if(dateParts && dateParts[0]) fromDateParts = dateParts[0].split("-")
  var toDateParts = undefined
  if(dateParts && dateParts[1]) toDateParts = dateParts[1].split("-")
  var fromDate = undefined
  if(fromDateParts) fromDate = new Date(fromDateParts[0], fromDateParts[1] - 1, fromDateParts[2]) // month is 0-based
  var toDate = undefined
  if(toDateParts) toDate = new Date(toDateParts[0], toDateParts[1] - 1, toDateParts[2]) // month is 0-based // month is 0-based

  if((fromDate == undefined) || (fromDate == "Invalid Date") ||
   (toDate == undefined) || (toDate == "Invalid Date")){
        console.log("strToDateRange :: called with Invalid input: %s", input)
  }else{
    dateRange = fromDate.toString().substring(0, 16)+" to "+toDate.toString().substring(0, 16)
  }
  return dateRange
}
//Process cancel request
function processCancelRequest(PSId, messageText){
  console.log(getToDateAndTime()+" processCancelRequest :: called with PSId: %s", PSId)

  var findFunction = function(element){
    if(element.key == PSId) return true
  }
  var inProgTranName = ""
  var inProgTranFullName = ""
  var msgToSend = process.env.No_Pending_Cancel_Request
  if(process.env.INPROGTRAN == undefined){
    console.log(getToDateAndTime()+" processCancelRequest :: No in progress transactions for any user")
  }else{
    console.log(getToDateAndTime()+" processCancelRequest :: In progress transactions for users found")
    var multiArr = JSON.parse(process.env.INPROGTRAN)
    var usrArrItm = multiArr.PSId.find(findFunction)
    if(usrArrItm == undefined){
      console.log(getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
    }else if(usrArrItm.tranName == undefined){
      console.log(getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
    }else{
      console.log(getToDateAndTime()+" processCancelRequest :: Record for current user found: %s, ongoing tranname: %s", PSId, usrArrItm.tranName)
      inProgTranName = usrArrItm.tranName
      console.log("inProgTranName "+inProgTranName);
      if (inProgTranName == "FUND_XFER") inProgTranFullName = process.env.Transfer_Request
      else if (inProgTranName == "DT_RNG") inProgTranFullName = "Search past transactions based on date tange"
      else if (inProgTranName == "DN_STMT") inProgTranFullName = "Download past statement as pdf"
      msgToSend = inProgTranFullName+" "+process.env.Inprogress_Cancel
      usrArrItm.tranName = undefined
      usrArrItm.values = undefined
      process.env.INPROGTRAN = JSON.stringify(multiArr)
    }
  }

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":msgToSend
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":process.env.Next_cmd
    }
  }
  messageDataArr[1] = messageData2
  callBatchSendAPI(messageDataArr)
  console.log("processCancelRequest :: sent reply to recipient %s", PSId);
}
//Download last month statement
function dnldStmt(PSId){
  console.log("dnldStmt :: called with PSId: %s", PSId)
  var messageData = {
    "recipient":{
        "id":PSId
    },
    "text":"Here is your last month statement",
    "message":{
      "attachment":{
        "type":"file",
        "payload":{
          "is_reusable": true,
          "url":"https://peaceful-springs-82345.herokuapp.com/Statement1month.pdf"
        }
      }
    }
  }
  sendRequest(PSId,messageData)
  console.log("dnldStmt sent replies to recipient %s", PSId);
}
async function showAcBal(PSId){
  console.log(getToDateAndTime()+" showAcBal :: called with PSId: %s ", PSId)
  if(await chooseIdentifucationMethod(PSId)){
    var messageData = {
      "recipient":{
        "id":PSId
      },
      "message": {
            "text":process.env.Bal_inq
        }

    }
    sendRequest(PSId,messageData);
  }
  console.log("showAcBal sent replies to recipient %s", PSId);
}

async function showLast3Trans(PSId){

  var today  = new Date();
  console.log(today.toLocaleDateString("hi-IN", options));

  console.log(getToDateAndTime()+" showLast3Trans :: called with PSId: %s", PSId + "time is "+ new Date())
  if(await chooseIdentifucationMethod(PSId)){
    var messageDataArr = Array()
    var messageData1 = {
      recipient:{
        "id":PSId
      },
      "message":{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"list",
            "top_element_style": "compact",
            "elements":
            [
              {
                "title": today +" को INR 1000 का डेपोसित",
                "subtitle": "A/C बैलेंस INR 145000.00"
              },
              {
                "title": today+" को INR 1000 का डेपोसित",
                "subtitle": "A/C बैलेंस INR 146000.00"
              },
              {
                "title": today+" को INR 1000 का क्रेडिट",
                "subtitle": "A/C बैलेंस INR 147000.00"
              }
            ]
          }
        }
      }
    }
    messageDataArr[0] = messageData1

    var messageData2 = {
      recipient:{
        "id":PSId
      },
      "message":{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":process.env.three_txn+"\n\n"+ process.env.show_all_txn,
            "buttons":[
              {
                "type":"web_url",
                "url":"https://peaceful-springs-82345.herokuapp.com/searchtransaction.html",
                "title":process.env.trans_his
              }
            ]
          }
        }
      }
    }
    messageDataArr[1] = messageData2

    callBatchSendAPI(messageDataArr)
    console.log(getToDateAndTime()+" showLast3Trans sent replies to recipient %s", PSId);
  }
}

function callBatchSendAPI(messageDataArr) {
  console.log(getToDateAndTime()+" callBatchSendAPI :: called for PSId: %s at time %s ", messageDataArr[0].recipient.id,getToDateAndTime())

  var id = messageDataArr[0].recipient.id
  //create form (i.e. multipart/form-data)
  const fbEnd = "https://graph.facebook.com"
  const r = request.post(fbEnd, (err, httpResponse, body) => {
      if (err) {
        return console.log(getToDateAndTime()+" callBatchSendAPI :: batch send error: ", JSON.stringify(err))
      }
      console.log(getToDateAndTime()+" callBatchSendAPI :: batch send successfull: ", JSON.stringify(body))
  });
  const form = r.form()
  const rec = "recipient=" + encodeURIComponent(JSON.stringify({"id": id})) //needs to be URLEncoded
  var batchMsgArr = Array()
  batchMsgArr[0] = {"method":"POST", "name": "senderAction", "relative_url":"v2.6/me/messages", "body": rec + "&" + "sender_action=typing_on"}

  //Loop thru and create all the messages to be sent
  for (var idx = 0; idx < messageDataArr.length; idx++){
    var msgObj = new Object()
    msgObj.method = "POST"
    msgObj.relative_url = "v2.6/me/messages"
    msgObj.name = "message"+(idx+1)
    if(idx ==0) msgObj.depends_on = "senderAction"
    else msgObj.depends_on = "message"+idx
    var messageObj = new Object()
    //text
    if(messageDataArr[idx].message.text != undefined){
      messageObj.text = messageDataArr[idx].message.text
    }
    //quick_replies
    if(messageDataArr[idx].message.quick_replies != undefined){
      messageObj.quick_replies = messageDataArr[idx].message.quick_replies
    }
    //attachment
    if(messageDataArr[idx].message.attachment != undefined){
      messageObj.attachment = messageDataArr[idx].message.attachment
    }
    console.log(getToDateAndTime()+" callBatchSendAPI :: msgObj is: %s", JSON.stringify(messageObj))
    var messageStr = "message="+encodeURIComponent(JSON.stringify(messageObj))
    msgObj.body =  rec+"&"+messageStr
    batchMsgArr[idx+1] = msgObj
  }
  const batchMessages = JSON.stringify(batchMsgArr)
  console.log(getToDateAndTime()+" callBatchSendAPI :: batchMessages are: %s", batchMessages)
  form.append("access_token", token)
  form.append('batch', batchMessages)
}

//Capture all parameters for transfer. Main entry function for transfer.
async function processXferRequest(PSId, messageText, payload, multiArr){
  console.log(getToDateAndTime()+" processXferRequest :: called for PSId: %s with payload:%s at time %s ", PSId, payload,getToDateAndTime())
  if(await chooseIdentifucationMethod(PSId)){
    addToInProgTran(PSId, "FUND_XFER")
    console.log(getToDateAndTime()+" INPROGTRAN "+process.env.INPROGTRAN );
    var findFunction = function(element){
    if(element.key == PSId) return true
    }
    var multiArr = JSON.parse(process.env.INPROGTRAN)
    var usrArrItm = multiArr.PSId.find(findFunction)
    console.log(getToDateAndTime()+" amount is "+JSON.stringify(usrArrItm));
    if(usrArrItm.values.amount == undefined){
      if(strToAmt(messageText) == "Invalid"){
        console.log(getToDateAndTime()+" processXferRequest :: prompt user to enter amount. ")
        var messageData = {
          "recipient":{
              "id":PSId
          },
          "message":{
              "text":process.env.Enter_amount
          }
        }
        sendRequest(PSId,messageData)
      }else {
        console.log(getToDateAndTime()+" processXferRequest :: prompt user to confirm amount entered. ")
        usrArrItm.values.amount = strToAmt(messageText)
        process.env.INPROGTRAN = JSON.stringify(multiArr);
        console.log(getToDateAndTime()+"  process.env.INPROGTRAN = JSON.stringify(multiArr); "+  JSON.stringify(multiArr));
        console.log(getToDateAndTime()+" usrArrItm.values.amount "+JSON.stringify(usrArrItm.values.amount));
        console.log(getToDateAndTime()+" INPROGTRAN sadadsfdfg "+process.env.INPROGTRAN );
        var frmDtStr = process.env.confirm_msg +"\n"+process.env.show_enter_amount + " "+usrArrItm.values.amount;
        var messageData = {
          "recipient":{
            "id":PSId
          },
          "message":{
            "text": frmDtStr,
            "quick_replies":[
              {
                "content_type":"text",
                "title":process.env.confirm_It,
                "payload":"FUND_XFER__AMT__YES"
              },
              {
                "content_type":"text",
                "title":process.env.reenter_amount,
                "payload":"FUND_XFER__AMT__NO"
              }
            ]
          }
        }
        sendRequest(PSId,messageData)
      }
  }else if(payload == "FUND_XFER__AMT__NO"){
  console.log(getToDateAndTime()+" processXferRequest :: prompt user to enter amount again.")
  usrArrItm.values.amount = undefined
  process.env.INPROGTRAN = JSON.stringify(multiArr);
  console.log(getToDateAndTime()+"   process.env.INPROGTRAN = JSON.stringify(multiArr); "+  JSON.stringify(multiArr));
  console.log(getToDateAndTime()+" usrArrItm.values.amount "+JSON.stringify(usrArrItm.values.amount));
  console.log(getToDateAndTime()+" INPROGTRAN sadadsfdfg "+process.env.INPROGTRAN );
  var messageData = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":process.env.Enter_amount
    }
  }
  sendRequest(PSId,messageData)
  }else if(usrArrItm.values.eba == undefined){
  console.log(getToDateAndTime()+" processXferRequest :: prompt user to choose eba.");
      if(payload == "FUND_XFER__TMB_PAYEE_ID"){
            usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
            if(usrArrItm.values.tranType == undefined) processXferIfDD(PSId)
      }else if(payload == "FUND_XFER__SCB_PAYEE_ID"){
            usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
            if(usrArrItm.values.tranType == undefined) processXferSmartOrOrft(PSId)
      }else if(payload == "FUND_XFER__PP_PAYEE_ID"){
            usrArrItm.values.eba = "FUND_XFER__PP_PAYEE_ID"
            usrArrItm.values.tranType = "FUND_XFER__PP"
      }else{
        var messageData = {
          "recipient":{
              "id":PSId
          },
          "message":{
              "text":process.env.select_amt_to_trans
          }
        }
        sendRequest(PSId,messageData)
        var messageData = {
          "recipient":{
            "id":PSId
          },
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"list",
                "top_element_style": "compact",
                "elements":
                [
                  {
                    "title": process.env.My_other_acct,
                    "subtitle": process.env.tatkal_transfer +"\n"+process.env.my_other_ac_num,
                    "image_url": "https://peaceful-springs-82345.herokuapp.com/TMB.jpg",
                    "buttons": [
                      {
                        "title": process.env.bt_my_acct,
                        "type": "postback",
                        "payload": "FUND_XFER__TMB_PAYEE_ID"
                      }
                    ]
                  },
                  {
                    "title": process.env.to_scb,
                    "subtitle":process.env.tatkal_or_EOD +"\n"+process.env.scb_ac,
                    "image_url": "https://peaceful-springs-82345.herokuapp.com/SCB.png",
                    "buttons": [
                      {
                        "title": process.env.to_scb_title,
                        "type": "postback",
                        "payload": "FUND_XFER__SCB_PAYEE_ID"
                      }
                    ]
                  },
                  {
                    "title": process.env.Real_t_Int_tran,
                    "subtitle": process.env.Real_t_Int_tran_subtitle,
                    "buttons": [
                      {
                        "title": process.env.Real_t_Int_tran_title,
                        "type": "postback",
                        "payload": "FUND_XFER__PP_PAYEE_ID"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
        sendRequest(PSId,messageData)
      }
  }else if(usrArrItm.values.tranType == undefined){
      console.log(getToDateAndTime()+" processXferRequest :: prompt user to enter transfer type.")
      if(payload == "FUND_XFER__INHOUSE"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__DD"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__ORFT"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__SMART"){
        usrArrItm.values.tranType = payload
      }else if(usrArrItm.values.eba == "FUND_XFER__TMB_PAYEE_ID"){
        processXferIfDD(PSId)
      }else if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID"){
        processXferSmartOrOrft(PSId)
      }
  }else if(payload == "FUND_XFER__EDIT"){
      usrArrItm.values.amount = undefined
      usrArrItm.values.eba = undefined
      usrArrItm.values.tranType = undefined
      process.env.INPROGTRAN = JSON.stringify(multiArr)
      processXferRequest(PSId, messageText, payload, multiArr)
    }else if(payload == "FUND_XFER__CONFIRM"){
      processXferComplete(PSId, usrArrItm)
    }
    //Ask for confirmation from user if all parameters received.
    if((usrArrItm.values.amount != undefined) &&
      (usrArrItm.values.eba != undefined) &&
      (usrArrItm.values.tranType != undefined) &&
      (payload != "FUND_XFER__CONFIRM")) processXferConfirm(PSId, usrArrItm)

    if(payload != "FUND_XFER__CONFIRM"){
      process.env.INPROGTRAN = JSON.stringify(multiArr)
      console.log(getToDateAndTime()+" processXferRequest :: Now INPROGTRAN: %s  ", process.env.INPROGTRAN)
    }
 }
}

  //Convert String to Amount
function strToAmt(input){
    var amt = parseFloat(input)
    if(!Number.isFinite(amt)) {
      amt = "Invalid"
    }else {
      let inputLength = input.length
      let amtLength = amt.toString().length
      console.log("amt length is "+amtLength);
      if(inputLength != amtLength ) amt = "Invalid"

    }
    return amt
  }

function addToInProgTran(PSId, tranName){
    console.log(getToDateAndTime()+" addToInProgTran :: called with PSId: %s & tranName: %s ", PSId, tranName)

    var findFunction = function(element){
      if(element.key == PSId) return true
    }

    if(process.env.INPROGTRAN == undefined){
      console.log(getToDateAndTime()+" addToInProgTran :: No in progress transactions for any user")
      var multiArr = new Object()
      multiArr.PSId = Array()
      multiArr.PSId[0] = new Object()
      multiArr.PSId[0].key = PSId
      multiArr.PSId[0].tranName = tranName
      multiArr.PSId[0].values = new Object()
      process.env.INPROGTRAN = JSON.stringify(multiArr)
    }else{
      console.log(getToDateAndTime()+" addToInProgTran :: In progress transactions for users found")
      var multiArr = JSON.parse(process.env.INPROGTRAN)
      var usrArrItm = multiArr.PSId.find(findFunction)
      var lstIdx = multiArr.PSId.length
        if(usrArrItm == undefined){
          console.log(getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
          multiArr.PSId[lstIdx] = new Object()
          multiArr.PSId[lstIdx].key = PSId
          multiArr.PSId[lstIdx].tranName = tranName
          multiArr.PSId[lstIdx].values = new Object()
          process.env.INPROGTRAN = JSON.stringify(multiArr)
        }else{
          console.log(getToDateAndTime()+" addToInProgTran :: Record for current user found: %s, ongoing tranname: %s", PSId, usrArrItm.tranName)
          if(usrArrItm.tranName == null){
              console.log(getToDateAndTime()+" addToInProgTran :: No transaction ongoing, setting new transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
          }else if(usrArrItm.tranName == undefined){
              console.log(getToDateAndTime()+" addToInProgTran :: No transaction ongoing, setting new transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
         }else if(usrArrItm.tranName != tranName){
              console.log(getToDateAndTime()+" addToInProgTran :: Diff transaction starting so resetting transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
          var messageData = {
            "recipient":{
                "id":PSId
            },
            "message":{
                "text":process.env.Cancel_Curret_Request
            }
          }
          sendRequest(PSId,messageData)
        }else if(usrArrItm.tranName == tranName){
          console.log(getToDateAndTime()+" addToInProgTran :: Same transaction so not resetting transaction data: %s, current tranname: %s", PSId, tranName)
        }
      }
    }
    console.log(getToDateAndTime()+" addToInProgTran :: JSON.stringify(multiArr): %s", JSON.stringify(multiArr))
  }
*/
// This gets called by facebook
function receivedDelivery(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var deliveryMessage = event.delivery;

  console.log(getToDateAndTime()+" Received delivery receipt %s for user %d and page %d at %d with message:", JSON.stringify(deliveryMessage), senderID, recipientID, timeOfMessage);
}

/*async function analyzeWitAIResponse(PSId, messageText){
      var findFunction = function(element){
      if(element.key == PSId) return true
      }

        try{
            let witAiResp =await callDialogFlow(PSId, messageText);
            return witAiResp;
            }catch(Error){
          console.log(getToDateAndTime()+" analyzeAIResponse :: Error: %s", JSON.stringify(Error))
          console.log(getToDateAndTime()+" "+Error)
          }
}

async function callDialogFlow(PSId, messageText){
    //Send message to witai
    options.sessionId = PSId;
    console.log(getToDateAndTime()+" callDialogFlow :: options object being sent is: %s", JSON.stringify(options))
      console.log(getToDateAndTime()+" callDialogFlow :: message Text being sent is: %s", messageText)
      let witAiRequest = client.message(messageText,options);
      return   witAiRequest.then(function (response){
        return  response;
      });


}
*/
/*function sendText(PSId,text){
  let messageData = {
    "recipient":{
        "id":PSId
    },
    message: {
      text: text
    }
  }
  sendRequest(PSId,messageData);
}

function sendRequest(sender,messageData){
      console.log(getToDateAndTime()+" called sendRequest");
      request({
           	    url: url1,
           	    qs: {access_token:token},
           	    method: 'POST',
           	    json: messageData
               }, function(error, response, body) {
           	    if (error) {
                  console.log("something went wrong");
           		    console.log('Error sending messages: ', error)
           	    } else if (response.body.error) {
           		    console.log('Error: ', response.body.error)
           	    }
               })
}
*/
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

    if(data.action == 'VERIFY_SUCCESS') addToVerifiedList(data.psid);

});

app.post('/public/webviewpost', function (req, res) {
    console.log("post request received from webview.")

    var data = req.body
    console.log("post object is: %s", JSON.stringify(data))
    res.sendStatus(200);

    if(data.action == 'VERIFY_SUCCESS') callQuickReply(data.psid);

});

//getting number from string
/*function stringToNumber(messageText){
    var number = messageText.replace(/[^0-9]/g, '');
    //if(!Number.isFinite(number)) number = "Invalid"
    return number
}*/
  // Wit Ai
/* function handleMessage(PSId,message,messageText) {
     //var payload = null
      let ebaVal = null
      let bankName = null
      let entityName = getEntityName(PSId,message);
      console.log("entity name is "+entityName);
      var entityNames = Object.keys(message.entities);
      console.log(" array of entity name is  "+entityNames);
      let confidence = firstEntity(message,entityName);
      console.log(" confidence value is "+confidence);
      if(confidence >0.8){
        if(entityName === 'TransferValue'){
          if(chooseIdentifucation(PSId)){
            /*addToInProgTran(PSId, "FUND_XFER")
            var multiArr = JSON.parse(process.env.INPROGTRAN)
            var usrArrItm = multiArr.PSId.find(findFunction)
            if(stringToNumber(messageText) != undefined) usrArrItm.values.amount = stringToNumber(messageText)
            var tmbEba = "tmb"
            var scbEba = "scb"
            var ppEba = "pp"
            if(entityNames.indexOf('Bank_name_val') != -1){
              if(message.entityNames[entityNames.indexOf('Bank_name_val')].value.toLowerCase() == tmbEba) usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
              else if(message.entityNames[entityNames.indexOf('Bank_name_val')].value.toLowerCase() == scbEba) usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
              else if(message.entityNames[entityNames.indexOf('Bank_name_val')].value.toLowerCase() == ppEba) usrArrItm.values.eba = "FUND_XFER__PP"

            }
              if(entityNames.indexOf('orftentity').toLowerCase() != -1) usrArrItm.values.tranType = "FUND_XFER__ORFT"
              else if(entityNames.indexOf('smartentity').toLowerCase() != -1) usrArrItm.values.tranType = "FUND_XFER__SMART"
              else if(entityNames.indexOf('promptpay').toLowerCase() != -1){
                usrArrItm.values.tranType = "FUND_XFER__PP"
                usrArrItm.values.eba = "FUND_XFER__PP_PAYEE_ID"
              }else if(entityNames.indexOf('DepostieEntity').toLowerCase() != -1){
                usrArrItm.values.tranType = "FUND_XFER__DD"
                usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
              }else if(entityNames.indexOf('creditEntity').toLowerCase() != -1){
                usrArrItm.values.tranType = "FUND_XFER__INHOUSE"
                usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
              }
            }
            process.env.INPROGTRAN = JSON.stringify(multiArr)*/
          /*  processXferRequest(PSId)
          }else {
            chooseIdentifucationMethod(PSId)
          }
        }else if(entityName === 'Cancel'){
          processCancelRequest(PSId, messageText)
        }else if(entityName === 'Account_balance'){
          showAcBal(PSId)
        }else if(entityName === 'Past_Transactions'){
          showLast3Trans(PSId)
        }else if(entityName === 'Menu'){
          processMenuRequest(PSId, messageText)
        }else if(stringToNumber(messageText)!=" " && stringToNumber(messageText).length>0 && entityName !=undefined){
              console.log(" else if for checking number and ");
      				addToInProgTran(PSId, "FUND_XFER")
      				var findFunction = function(element){
      				if(element.key == PSId) return true
      				}

      				var multiArr = JSON.parse(process.env.INPROGTRAN)
      				var usrArrItm = multiArr.PSId.find(findFunction)

              if(entityName=='fundTransfer' || entityName=='TransferValue' ){
                  if(entityNames.indexOf('fundTransfer')!= -1) entityName = entityNames[entityNames.indexOf('fundTransfer')]
                    console.log(" message text value is "+stringToNumber(messageText).length+stringToNumber(messageText));
                    let entityNameVal = Object.keys(message.entities[entityName][0].entities);
                    //console.log("entityNameVal value is "+JSON.stringify(message.entities[entityName][0].entities));
                    if(entityName =='fundTransfer' && entityNames.indexOf('fundTransfer')!=-1){
                    console.log("entityName =='fundTransfer' && entityNames.indexOf('Bank_name_val')!=-1 ");
                    if(entityNameVal.indexOf('Bank_name_val')!=-1){
                    let transtypeVals = Object.keys(message.entities[entityName][0].entities);
                    usrArrItm.values.amount = stringToNumber(messageText)
                    usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    if(transtypeVals.indexOf('smartentity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__SMART"
                        usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('orftentity')!=-1) {
                        usrArrItm.values.tranType = "FUND_XFER__ORFT"
                        usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('creditEntity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__INHOUSE"
                        usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('DepostieEntity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__DD"
                        usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
                    }else usrArrItm.values.tranType = undefined
                      process.env.INPROGTRAN = JSON.stringify(multiArr);
                      processXferRequest(PSId,messageText,"FUND_XFER",usrArrItm);
                    }else{
                      usrArrItm.values.amount = stringToNumber(messageText)
                      process.env.INPROGTRAN = JSON.stringify(multiArr);
                      processXferRequest(PSId,messageText,"FUND_XFER",usrArrItm)
                    }
                  }
                }
      }else{
        let newTxt ='';
          switch (entityName) {
            case (entityName):
            newTxt= readPropertyFileValueFromEnv(entityName);
            break;
          default:
            console.log('something terribly wrong');
          break;
      }
      sendText(PSId,  newTxt.substring(0, 200));
    }
  }else{
      sendText(PSId, process.env.Wrong_inp);
  }

}*/

/*function processAddXferBankName(PSId,messageText){
  var payload=null
  addToInProgTran(PSId, "FUND_XFER")
  var findFunction = function(element){
    if(element.key == PSId) return true
  }

  var multiArr = JSON.parse(process.env.INPROGTRAN)
  var usrArrItm = multiArr.PSId.find(findFunction)
  //usrArrItm.values.amount = number
      console.log(getToDateAndTime()+" processAddXferBankName :: prompt user to confirm amount entered. ")
      usrArrItm.values.toBankName = messageText
      process.env.INPROGTRAN = JSON.stringify(multiArr);
      console.log(getToDateAndTime()+" INPROGTRAN sadadsfdfg "+process.env.INPROGTRAN );
      processXferConfirm(PSId,usrArrItm)
      //processXferRequest(PSId)
  }

  function processToXferConfirmPageWithBankName(PSId,number,message,ebaVal,bankName){
    addToInProgTran(PSId, "FUND_XFER")
    var findFunction = function(element){
    if(element.key == PSId) return true
    }

    var multiArr = JSON.parse(process.env.INPROGTRAN)
    var usrArrItm = multiArr.PSId.find(findFunction)
    usrArrItm.values.amount = number
    usrArrItm.values.eba = ebaVal
      usrArrItm.values.tranType=message

    process.env.INPROGTRAN = JSON.stringify(multiArr);
       processXferConfirm(PSId,usrArrItm)
  }
  function processToXferConfirmPage(PSId,number,message,ebaVal){
      //var payload=null
      if(chooseIdentifucationMethod(PSId)){
      addToInProgTran(PSId, "FUND_XFER")
      var findFunction = function(element){
        if(element.key == PSId) return true
      }

      var multiArr = JSON.parse(process.env.INPROGTRAN)
      var usrArrItm = multiArr.PSId.find(findFunction)
      usrArrItm.values.amount = number
      usrArrItm.values.eba = ebaVal
      usrArrItm.values.tranType=message

      process.env.INPROGTRAN = JSON.stringify(multiArr);
  	  if(usrArrItm.values.toBankName == undefined){
        if(number!= "Invalid"){
          console.log(getToDateAndTime()+" processToXferConfirmPage :: prompt user to enter amount. ")
          var messageData = {
            "recipient":{
                "id":PSId
            },
            "message":{
                "text":"कृपया बैंक का नाम बताईये"
            }
          }

          sendRequest(PSId,messageData)
        }
      }
    }
  }
*/
//getting entity name from wit ai Response
/*function getEntityName(PSId,message){
   let key_name = message.entities;
   let names = Object.keys(key_name);
   var i =message.entities[names[0]][0].confidence;
   let name = names[0];
   if(names.length==0){
     name = 'rajesh';
   }else{
   for(var j =1 ; j<names.length ; j++){
   if (message.entities[names[j]][0].confidence >i) {
       i = message.entities[names[j]][0].confidence;
       name = names[j];

     }
   }
   if(name == 'smartentity' || name == 'orftentity' || name =='Bank_name_val') name='amount'
  }
   return name;

}
*/
/*function firstEntity(message,name) {
  if(message.entities[name]!=null && message.entities[name][0] != undefined){
      /*if(message.entities[name][0].suggested){
        return 0.5;
      }else{
        return JSON.stringify(message.entities[name][0].confidence);
      }*/
      return JSON.stringify(message.entities[name][0].confidence);
    }else{
      console.log('rajesh++++++++++++++++');
      return 0.1;
    }
}
*/
/*async function chooseIdentifucation(PSId){
  try{
    var verifiedFlag = await checkIfVerified(PSId)
  }catch(Error){
    console.log(getToDateAndTime()+" chooseIdentifucation :: Error while calling checkIfVerified: %s", JSON.stringify(Error))
  }
  return verifiedFlag;
}
*/
/*async function chooseIdentifucationMethod(PSId){
  console.log(getToDateAndTime()+" chooseIdentifucationMethod ");
      try{
        var verifiedFlag = await checkIfVerified(PSId)
      }catch(Error){
        console.log(getToDateAndTime()+" chooseIdentifucationMethod :: Error while calling checkIfVerified: %s", JSON.stringify(Error))
      }
    if(!verifiedFlag){
      console.log(getToDateAndTime()+"  verified flag value is "+verifiedFlag);
    var messageData = {
      "recipient":{
        "id":PSId
      },
     "message":{
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":process.env.not_linked+"\n"+process.env.to_be_linked +"\n"+"\n"+
                    process.env.option1+"\n"+
                    process.env.option2+"\n\n"+
                    process.env.continue+"\n",
        "buttons":[
          {
                "type":"web_url",
                "url":"http://localhost:3030?PSId="+PSId,
                "title":"विकल्प 1",
                "webview_height_ratio":"tall",
                "webview_share_button":"show"
          },
          {
            "type":"web_url",
            "url":"http://localhost:3030/public?PSId="+PSId,
            "title":"विकल्प 2",
            "webview_height_ratio":"tall",
            "webview_share_button":"show"
            }
          ]
        }
      }
    }
  }
      console.log("XXXXXXXXXXXXX "+JSON.stringify(messageData));
        sendRequest(PSId,messageData);
    }
    return verifiedFlag;
}

*/
/*async function checkIfVerified(PSId){
	  console.log(getToDateAndTime()+" checkIfVerified :: called with PSId: %s", PSId)
	  var verifiedFlag = false
	  return new Promise(function(resolve, reject) {
		if(notInVerifiedList(PSId)){
		  console.log(getToDateAndTime()+" checkIfVerified :: PSID not verified")
		  resolve(verifiedFlag)
		}else{
		  verifiedFlag = true
		   console.log(getToDateAndTime()+" checkIfVerified :: PSID is present in verified list")
		  resolve(verifiedFlag)
		}
	  })
	}

  //Check if a given PSId is already verified.
  function notInVerifiedList(PSId){
    console.log(getToDateAndTime()+" notInVerifiedList :: called with PSId: %s", PSId)
    var notverified = true
    if(process.env.MYARRAYVAR == undefined){
      process.env.MYARRAYVAR = []
      notverified = true
      console.log(getToDateAndTime()+" notInVerifiedList :: verified list is empty")
    }else{
      var strArray = process.env.MYARRAYVAR.split(",")
      console.log(getToDateAndTime()+" notInVerifiedList :: verified list is: %s", process.env.MYARRAYVAR)
      var found = false
      if(strArray.indexOf(PSId) > -1) found = true
      if (found){
        console.log(getToDateAndTime()+" notInVerifiedList :: %s is present in verified list", PSId)
        notverified = false
      } else{
        console.log(getToDateAndTime()+" notInVerifiedList :: %s is not present in verified list", PSId)
        notverified = true
      }
    }
    return notverified
  }

  //Add to verified list in the cache and send response to customer.

*/
/*function addToVerifiedList(PSId){
    console.log(getToDateAndTime()+" addToVerifiedList :: called with PSId: %s", PSId)
    var findFunction = function(element){
      if(element.key == PSId) return true
    }

    if(process.env.MYARRAYVAR == undefined) process.env.MYARRAYVAR = []
    var strArray = process.env.MYARRAYVAR.split(",")
    if(Array.isArray(strArray)){
      strArray.push(PSId)
      process.env.MYARRAYVAR = strArray
      console.log(getToDateAndTime()+" addToVerifiedList :: added %s to verified list", PSId)
      console.log(getToDateAndTime()+" addToVerifiedList :: contains %d PSIds", strArray.length)
    }
    //Send message that verification successful.
    var messageData = {
      "recipient":{
        "id":PSId
      },
      "message":{
       "text": process.env.linked_msg+"\n"+process.env.linked_msg_to_use,
         "quick_replies":[
           {
             "content_type":"text",
             "title":process.env.Acct_bal,
             "payload":"AC_BALANCE"
           },
           {
             "content_type":"text",
             "title":process.env.trans_money,
             "payload":"FUND_XFER"

           },
           {
             "content_type":"text",
             "title":process.env.LAST_3_TRANS,
             "payload":"LAST_3_TRANS"

           }
         ]
       }
    }
    sendRequest(PSId,messageData)

    //Reset any running transactions
    var multiArr = undefined
    if(process.env.INPROGTRAN != undefined) multiArr = JSON.parse(process.env.INPROGTRAN)
    if(multiArr != undefined){
      var usrArrItm = multiArr.PSId.find(findFunction)
      if(usrArrItm != undefined){
        usrArrItm.tranName = undefined
        usrArrItm.values = undefined
        process.env.INPROGTRAN = JSON.stringify(multiArr)
        console.log(getToDateAndTime()+" addToVerifiedList :: Now INPROGTRAN: %s", process.env.INPROGTRAN)
      }
    }

    console.log(getToDateAndTime()+" addToVerifiedList sent 2 replies to recipient %s", PSId)
  }

  // Ask customer to choose if it's DD
  function processXferIfDD(sender){
     var messageDataArr = Array()
    var messageData1 = {
          "recipient":{
          "id":sender
          },
        "message":{
        "text": "आप क्या करना पसंद करेंगे.\n(1)विथड्रा अपने प्राइमरी अकाउंट से \n(2)डेपोसित अपने प्राइमरी अकाउंट मे ",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"विथड्रा",
            "payload":"FUND_XFER__INHOUSE"
          },
          {
            "content_type":"text",
            "title":"डेपोसित",
            "payload":"FUND_XFER__DD"
          }
        ]
      }

    }
    messageDataArr[0]=messageData1;
    callBatchSendAPI(messageDataArr)
}
*/
  // Ask customer to choose if it's smart or ORFT transfer
/*function processXferSmartOrOrft(sender){
    var messageDataArr = Array();
    var messageData1 ={
      "recipient":{
        "id":sender
      },
      "message":{
        "text": "ट्रान्सफर करने के लिए 2 विकल्प अवेलेबल है -\n(1)तुरंत ट्रान्सफर\n"+
                "(2)आज/अगले वोर्किंग डे मे \n\nकृपया अपने ट्रान्सफर विकल्प को चूने",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"तुरंत",
            "payload":"FUND_XFER__ORFT"
          },
          {
            "content_type":"text",
            "title":"आज के अंत मे",
            "payload":"FUND_XFER__SMART"
          }
        ]
      }
    }
    messageDataArr[0]=messageData1;
    callBatchSendAPI(messageDataArr);
  }
//getting from account Number
function processXferGetFromAc(sender, usrArrItm){
  console.log(getToDateAndTime()+" process transfer from account number is being called with sender id : "+sender);
  if(usrArrItm.values.tranType=="FUND_XFER__DD") usrArrItm.values.fromAc="11xx22xx44"
  else usrArrItm.values.fromAc="99xx88xx77"
  return usrArrItm.values.fromAc
}
// getting to account Number
function processXferToAcct(sender,usrArrItm){
  console.log(getToDateAndTime()+" process transfer to account number is being called with sender id : "+sender);
  if(usrArrItm.values.tranType=="FUND_XFER__DD") usrArrItm.values.toAc="77xx88xx99"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP") usrArrItm.values.toAc="11xx33xx55"
  else if(usrArrItm.values.tranType=="FUND_XFER__ORFT") usrArrItm.values.toAc="22xx33xx44"
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") usrArrItm.values.toAc="22xx33xx44"
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") usrArrItm.values.toAc="11xx33xx55"
  return usrArrItm.values.toAc

}
//getting destination bank names
function processXferDestBank(sender,usrArrItm){
  console.log(getToDateAndTime()+" process transfer to destination bank name is being called with sender id : "+sender);
  let tobank="डेपोसित किये गए बैंक का नाम : "
  if(usrArrItm.values.tranType=="FUND_XFER__DD") tobank = tobank+"MRC\n"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP") tobank = ""
  else if(usrArrItm.values.tranType=="FUND_XFER__ORFT") {
     if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID") tobank = tobank + "SCB\n"
  }
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") {
    if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID") tobank = tobank + "SCB\n"
  }
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") tobank = tobank+"MRC\n"
  return tobank
}
// getting transfer fee
function processXferGetFee(sender,usrArrItm){
  console.log(getToDateAndTime()+"  get fee function is called with sender id "+sender);
  let fee = process.env.fee_val
  if(usrArrItm.values.tranType=="FUND_XFER__ORFT")  fee = fee +" 35.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") fee = fee +" 20.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") fee = fee +" 0.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP")  fee = fee +" 0.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__DD") fee = fee +" 0.00"
  return fee;
}
//getting recieve date
function processXferGetRececiveDate(sender,usrArrItm){
  console.log(getToDateAndTime()+"  getting recieve date for sender id "+ sender);
  let rcv_date = new Date();
  if(usrArrItm.values.tranType=="FUND_XFER__SMART") rcv_date.setDate(rcv_date.getDate()+1)
  return rcv_date.toString().substring(0,16)
}

function processXferComplete(sender,usrArrItm){
   console.log(getToDateAndTime()+" process transfer complete page ")
    let trnsDetail = process.env.trans_dtl+"\n"+process.env.Txn_Id+" : NT171337993\n"+
                   process.env.Xfer_from_acct+" : "+processXferGetFromAc(sender, usrArrItm)+"\n"+
                   process.env.Xfer_to_acct+" : "+processXferToAcct(sender,usrArrItm)+"\n"+
                   processXferDestBank(sender,usrArrItm)+
                   process.env.Xfer_amount+" : "+usrArrItm.values.amount+"\n"+
                   process.env.Xfer_fee+" : "+processXferGetFee(sender,usrArrItm)+"\n"+
                   process.env.Xfer_date+" : "+ Date().toString().substring(0,16)+"\n"+
                   process.env.receive_date+" : "+processXferGetRececiveDate(sender,usrArrItm)+"\n\n"+
                   process.env.trans_on_to_me
        var messageDataArr = Array()
        var messageData1={
          "recipient":{
            "id":sender
          },
          "message":{
            "text":process.env.txn_complete_msg
          }
        }
        messageDataArr[0]=messageData1
        //console.log(" 1st message is attached ");
        var messageData2={
          "recipient":{
            "id":sender
          },
              "message":{
              "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "sharable":true,
                  "image_aspect_ratio":"square",
                  "elements":
                  [
                    {
                      "title":"ट्रान्सफर से जुड़े सलाह",
                      "image_url":"https://peaceful-springs-82345.herokuapp.com/Correct.png",
                      "subtitle":process.env.trans_as_pdf,
                      "default_action": {
                        "type": "web_url",
                        "url": "https://peaceful-springs-82345.herokuapp.com/transfercompletion.html",
                        "webview_height_ratio": "tall"
                    },
                      "buttons":
                      [
                        {
                          "type":"postback",
                          "payload":"FUND_XFER__DN_PDF",
                          "title":"pdf डाउनलोड"
                        },
                        {
                          "type":"web_url",
                          "url":"https://peaceful-springs-82345.herokuapp.com/transfercompletion.html",
                          "title":"डिटेल्स देखें"
                        },
                        {
                          "type": "element_share",
                          "share_contents": {
                            "attachment": {
                              "type": "template",
                              "payload": {
                                "template_type": "generic",
                                "elements": [
                                  {
                                    "title": "Banking with MRC on Messenger is so cool.",
                                    "subtitle": "Open a MRC account and give it a go..",
                                    "image_url": "https://peaceful-springs-82345.herokuapp.com/TMB.jpg",
                                    "default_action": {
                                      "type": "web_url",
                                      "url": "http://m.me/mrcube.retailbanking?ref=1468726026538987"
                                    },
                                    "buttons": [
                                      {
                                        "type": "web_url",
                                        "url": "http://m.me/mrcube.retailbanking?ref=1468726026538987",
                                        "title": "Open MRC account and enjoy higher returns."
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          messageDataArr[1]=messageData2
            //console.log(" 2nd message is attached ");
          var messageData3 = {
              "recipient":{
                "id":sender
              },
              "message":{
                "text":trnsDetail
              }
            }
            messageDataArr[2] = messageData3
            //  console.log(" 3rdt message is attached ");
            callBatchSendAPI(messageDataArr)

            //Delete transactions data
            var findFunction = function(element){
              if(element.key == sender) return true
            }
            var multiArr = JSON.parse(process.env.INPROGTRAN)
            var usrArrItm = multiArr.PSId.find(findFunction)
            usrArrItm.tranName = undefined
            usrArrItm.values = undefined
            process.env.INPROGTRAN = JSON.stringify(multiArr)
            console.log("process.env.INPROGTRAN = JSON.stringify(multiArr) "+ JSON.stringify(multiArr));

}
//Capture all parameters for transfer. Main entry function for transfer.
function processXferConfirm(sender,usrArrItm){
    let trnsDetail = process.env.trans_confirm+"\n"+process.env.Txn_Id+" : NT171337993\n"+
                     process.env.Xfer_from_acct+" : "+processXferGetFromAc(sender, usrArrItm)+"\n"+
                     process.env.Xfer_to_acct+" : "+processXferToAcct(sender,usrArrItm)+"\n"+
                     processXferDestBank(sender,usrArrItm)+
                     process.env.Xfer_amount+" : "+usrArrItm.values.amount+"\n"+
                     process.env.Xfer_fee+" : "+processXferGetFee(sender,usrArrItm)+"\n"+
                     process.env.Xfer_date+" : "+ Date().toString().substring(0,16)+"\n"+
                     process.env.receive_date+" : "+processXferGetRececiveDate(sender,usrArrItm)+"\n\n"+
                     process.env.trans_on_to_me
      var messageData ={
        "recipient":{
          "id":sender
        },
        "message":{
          "text": trnsDetail,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"मै सहमत हूँ",
              "payload":"FUND_XFER__CONFIRM"
            },
            {
              "content_type":"text",
              "title":"रिएंटर अमाउंट",
              "payload":"FUND_XFER__EDIT"
            }
          ]
        }
    }
    sendRequest(sender,messageData)

  }
*/
const logDirectory = path.join(__dirname, 'log')
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
// create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})

//setting port
app.set('port',process.env.PORT || 3030);
// providing the JSon
app.listen(app.get('port') ,function(req,res){
  console.log(Date.now());
  console.log("time is "+getToDateAndTime());
console.log('Webhook server is listening, port 3030');
});

/*function getToDateAndTime(){
  var d =new Date();
  var currentTime =d.toLocaleDateString("En-IN")+" "+d.toLocaleTimeString("En-IN")
  return currentTime;
}
*/
