var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
const rfs = require('rotating-file-stream');
var expressValidator = require('express-validator');
const fetch = require('node-fetch');
const crypto = require('crypto');
var app = express();
var request = require('request');
const {Wit,log} = require('node-wit');
const accessToken = require('./config');
const url1 = 'https://graph.facebook.com/v2.6/me/messages';
var timer =0;
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
/*client.message('what is the weather in London?', {})
.then((data) => {
  console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
})
.catch(console.error);*/

// body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var token ="EAAB3ZAjlzh7ABAF5VfSbfrh7CISxQiZCh3STDgmK6Ykg2pDyOWxtdpZC4OEFXdTbZCFlOdS7Upyx0y24ZBBvxZC385ZBtA06CXnM7bGDTLLbWUHGY5RkVG3P8NB0c4mZAcX1v3xPt91m2qu7k4YMbAj718ocuWZAqW3R6HHWENVJrGaIuSBH4EEPV";
//getting webhook connection for facebook
app.get('/webhook', verificationController);
//getting fb message
var text = '';
  app.post('/webhook/', function (req, res) {
   var payload = null;
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let  sender = event.sender.id
	    if (event.message && event.message.text) {
		    text = event.message.text
        //sendText(sender,  text.substring(0, 200))
        console.log("getting text "+text);
        handleMessage(sender,messaging_events,text);
      }if(event.postback){
          var payload = event.postback.payload;
          console.log("payload is "+ payload);
          if(payload === 'FUND_XFER__TMB_PAYEE_ID'){
            processXferIfDD(sender);
          }else if (payload === 'FUND_XFER__SCB_PAYEE_ID' ){
            processXferSmartOrOrft(sender);
          }else if(payload === 'FUND_XFER__PP_PAYEE_ID'){
              processXferConfirm(sender);
          }else if (payload === 'FUND_XFER__INHOUSE'){
            console.log(" rajesh kumar");
          }  else {
            handleMessage(sender,messaging_events,text);
          }
        continue;
      }
  }
    res.sendStatus(200)
});



function sendText(sender,text){
  let messageData = {text:text}
  sendRequest(sender,messageData);
}

function sendRequest(sender,messageData){
  console.log("called sendRequest");
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
app.get('/',function(req,res){
  //res.send('Hello world');
  res.sendFile(path.join(__dirname + '/resform.html'));
  //res.sendFile(path.join(__dirname + '/mecustomerverification.html'));
});
app.get('/public/',function(req,res){
  //res.send('Hello world');
  //res.sendFile(path.join(__dirname + '/resform.html'));
  res.sendFile(path.join(__dirname + '/mecustomerverification.html'));
});
// For webview posts.
app.post('/webviewpost', function (req, res) {
  console.log("post request received from webview.")

  var data = req.body
  console.log("post object is: %s", JSON.stringify(data))
  res.sendStatus(200);

  if(data.action == 'VERIFY_SUCCESS') callQuickReply(data.psid);

});

app.post('/public/webviewpost', function (req, res) {
  console.log("post request received from webview.")

  var data = req.body
  console.log("post object is: %s", JSON.stringify(data))
  res.sendStatus(200);

  if(data.action == 'VERIFY_SUCCESS') callQuickReply(data.psid);

});


// Wit Ai
var confidence;

function handleMessage(sender,message,text) {
    var entityName = getEntityName(message);
    console.log(" entityName " + entityName);
    const transfer = firstEntity(message[0].message.nlp,entityName);
    if(transfer >0.82 ){
      let newTxt ='';
      console.log('nameValue is '+nameValue);
      if((entityName =='number' && nameValue=='amount') || (entityName =='amount')){
        var timer1 = Date.now();
        if(timer1-timer > (15000*60)){
            chooseIdentifucationMethod(sender,'आपका FB messenger बैंक से लिंक्ड नही है');
        }else{
          timer =  Date.now();
            newTxt= 'कृपया उस धन की राशि दर्ज करें जिसे आप ट्रांसफर करना चाहते हैं।';
            sendText(sender,  newTxt.substring(0, 200));
        }
      }else if((entityName =='number' && nameValue=='options') || (entityName =='options' && nameValue=='number')){
            callQuickReply(sender);
      }else if (entityName === 'number'){
        var timer1 = Date.now();
          if(timer1-timer > (15000*60)  ){
              newTxt= 'मुझे माफ़ करें, ये इन्फोर्मेशन मेरे पास नही है';
              sendText(sender,  newTxt.substring(0, 200));
          }else{
                timer =  Date.now();
                moneyToTransfer(sender)
              }
      }else if (entityName === 'knowBal'){
              timer1 = Date.now();
              console.log(timer1-timer);
                if(timer1-timer > (15000*60) ){
                    newTxt= 'मुझे माफ़ करें, ये इन्फोर्मेशन मेरे पास नही है';
                    sendText(sender,  newTxt.substring(0, 200));
                }else{
                      timer =  Date.now();
                      showAcBal(sender)
            }
          }else if (entityName === 'transHis'){
           timer1 = Date.now();
              if(timer1-timer > (15000*60)){
                  newTxt= 'मुझे माफ़ करें, ये इन्फोर्मेशन मेरे पास नही है';
                  sendText(sender,  newTxt.substring(0, 200));
              }else{
                    timer =  Date.now();
                    showLast3Trans(sender);
          }
        } else if (entityName === 'msg_confirm' || entityName === 'confirm'){
              timer1 = Date.now();
                if(timer1-timer > (1000*60)){
                    newTxt= 'मुझे माफ़ करें, ये इन्फोर्मेशन मेरे पास नही है';
                    sendText(sender,newTxt);
                }else{
                      timer =  Date.now();
                      getBankInfo(sender);
                    }
        }else{
        switch (entityName) {
        case 'Bye_message':
          newTxt= 'आपका स्वागत है, जल्द ही फिर मिलेंगे!';
          break;
        case 'options':
          newTxt= 'मुझे माफ़ करें, ये इन्फोर्मेशन मेरे पास नही है';
          break;
        case 'greeting':
        newTxt= 'नमस्कार, मैं CHATBOT हूँ ...'+'मैं आपकी बैंकिंग से जुड़े काम मे सहायता कर सकता हूँ';
        break;
        case 'help_value':
        newTxt= 'बेशक, मुझे आपकी सहायता करने के लिए बनाया गया है';
        break;
        case 'intent':
          newTxt= 'नमस्ते, मैं CHATBOT हूँ ...'+'मैं आपकी बैंकिंग से जुड़े काम मे सहायता कर सकता हूँ';
          break;
        default:
          console.log('something terribly wrong');
        break;
    }
    sendText(sender,  newTxt.substring(0, 200));
  }

  } else {
  sendText(sender,  'क्या आप कृपया अधिक विशिष्ट हो सकते हैं');
  }
}
function moneyToTransfer(sender){
        newTxt= 'आपके के द्वारा दी गयी अमाउंट THB '+text + " है | \n "+"कृपया कन्फर्म करें";
          var messageData ={
              "text": newTxt,
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"मैं कन्फर्म करता हूँ",
                  "payload":"FUND_XFER__AMT__YES"
                },
                {
                  "content_type":"text",
                  "title":"रिएंटर अमाउंट",
                  "payload":"FUND_XFER__AMT__NO"
                }
              ]
            }
            console.log("message data is "+ JSON.stringify(messageData));
            sendRequest(sender,messageData);
}
//Get fee for transfer.
function processXferGetReceiveDate(PSId){
  //log.info("processXferGetReceiveDate :: called with PSId: %s", PSId)
  var rcvDt = new Date()
  if(usrArrItm.values.tranType == "FUND_XFER__SMART") rcvDt.setDate(rcvDt.getDate() + 1)
  return rcvDt.toString().substring(0, 16)
}

function getBankInfo(sender){
  var messageData = {
   "attachment":{
     "type":"template",
     "payload":{
       "template_type":"list",
       "top_element_style": "compact",
       "elements":
       [
         {
           "title": "बैंक में मेरे दूसरे खाते मे ",
           "subtitle": "बैंक में आपके खातों के बीच नि:शुल्क तत्काल ट्रांसफर\n"+
                       "मुख्य A/C# : 11xx22xx33",
           "image_url": "https://peaceful-springs-82345.herokuapp.com/TMB.jpg",
           "buttons": [
             {
               "title": "मेरे दुसरे अकाउंट मे",
               "type": "postback",
               "payload": "FUND_XFER__TMB_PAYEE_ID"
             }
           ]
         },
         {
           "title": "SCB बैंक मे",
           "subtitle": "तत्काल या बिज़नस दिन के अंत तक ट्रांसफर\n"+
                       "A/C# : 22xx33xx44",
           "image_url": "https://peaceful-springs-82345.herokuapp.com/SCB.png",
           "buttons": [
             {
               "title": "SCB a/c मे ट्रांसफर",
               "type": "postback",
               "payload": "FUND_XFER__SCB_PAYEE_ID"
             }
           ]
         },
         {
           "title": "रियल टाइम इमीडियेट ट्रांसफर",
           "subtitle": "अपनी नागरिकता आईडी या मोबाइल नंबर का उपयोग करके ट्रांसफर करें",
           "buttons": [
             {
               "title": "PP से ट्रांसफर",
               "type": "postback",
               "payload": "FUND_XFER__PP_PAYEE_ID"
             }
           ]
         }
       ]
     }
   }
 }
 sendRequest(sender,messageData);
}
var nameValue = '';
function getEntityName(message){
  console.log("% "+JSON.stringify(message[0].message.nlp));
  var obj = message[0].message.nlp;
  var key_name = message[0].message.nlp.entities;
  var names = Object.keys(key_name);
  var i =obj.entities[names[0]][0].confidence;
  var name = names[0];
      console.log("object keys are "+ names);
      nameValue = names[1];
      console.log("lenght is  "+ names.length);
      //var i = names.length;
    for(var j =1 ; j<names.length ; j++){
    console.log("name values goes here "+i);
    if (obj.entities[names[j]][0].confidence >i) {
        i = obj.entities[names[j]][0].confidence;
        name = names[j];
      }
    }
    return name;
}
function firstEntity(nlp,name) {
  if(nlp.entities[name]!=null && nlp.entities[name][0] != undefined){
      if(nlp.entities[name][0].suggested){
        return 0.5;
      }else{
        return JSON.stringify(nlp.entities[name][0].confidence);
      }
    }else{
      console.log('rajesh++++++++++++++++');
      return 0.1;
    }
}
function chooseIdentifucationMethod(sender,text){
  console.log("sendButtonMessage ");
  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":text+"\nआप अपने अकाउंट को FB messenger से लिंक्ड नीचे दिए गए माध्यम से कर सकते हैं" +"\n"+"\n"+
                    "(1) आईबी यूजर आईडी और पासवर्ड के वेलिडेशन के द्वारा\n"+
                    "(2) अपनी नागरिकता आईडी और सेविंग अकाउंट प्रोवाइड करके \n"+
                    "\nकंटिन्यू करने  के लिए नीचे दिए गए किसी एक विकल्प को चुनें --",
        "buttons":[
          {
                "type":"web_url",
                "url":"http://localhost:3030?PSId="+sender,
                "title":"विकल्प 1",
                "webview_height_ratio":"tall",
                "webview_share_button":"show"
          },
          {
            "type":"web_url",
            "url":"http://localhost:3030/public?PSId="+sender,
            "title":"विकल्प 2",
            "webview_height_ratio":"tall",
            "webview_share_button":"show"
          }
        ]
      }
    }
}

sendRequest(sender,messageData);
//callQuickReply(sender,messageData)
}

function callQuickReply(sender){
  var messageData = {
    "text": "आप मेनू विकल्प का उपयोग कर सकते हैं और  पोपुलर ट्रांसेक्सन नीचे अवेलेबल है।",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"अकाउंट बैलेंस",
          "payload":"AC_BALANCE"
        },
        {
          "content_type":"text",
          "title":"ट्रांसफर मनी",
          "payload":"FUND_XFER"

        },
        {
          "content_type":"text",
          "title":"अंतिम तीन ट्रांसेक्सन",
          "payload":"LAST_3_TRANS"

        }
      ]
    }
    timer = Date.now();
    sendRequest(sender,messageData);
  }


  // Ask customer to choose if it's DD
  function processXferIfDD(sender){
    var messageData = {
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

        sendRequest(sender,messageData)
    }


  // Ask customer to choose if it's smart or ORFT transfer
  function processXferSmartOrOrft(sender){
    var messageData ={
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
    sendRequest(sender,messageData)
  }

  //Capture all parameters for transfer. Main entry function for transfer.
  function processXferConfirm(sender){
    var messageData ={
        "text": "xxxxxxxxxxx",
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
    sendRequest(sender,messageData)

  }


function showAcBal(sender){

      var messageData = {
            "text":"आपके खाते  मे  बची हुई अमाउंट THB 157823.65 है जो की xxxxx6655 समाप्त होती है"
        }

      sendRequest(sender,messageData)
    }


  // Show last 3 transactions
  function showLast3Trans(sender){

    var messageData = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"list",
            "top_element_style": "compact",
            "elements":
            [
              {
                "title": "Debit of THB 1000.00 on 26th October 2017",
                "subtitle": "A/C Balance THB 145000.00"
              },
              {
                "title": "Debit of THB 1000.00 on 26th October 2017",
                "subtitle": "A/C Balance THB 146000.00"
              },
              {
                "title": "Credit of THB 1000.00 on 25th October 2017",
                "subtitle": "A/C Balance THB 147000.00"
              }
            ]
          }
        }
      }
    sendRequest(sender,messageData)

  }


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
console.log('Webhook server is listening, port 3030');
});
