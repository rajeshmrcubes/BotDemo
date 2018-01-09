var handleMessage = require('./handleMessage');
var sendRequest = require('./SendMessage')
var datendTime = require('./DateAndTime')
var processXferRequest = require('./processXferRequest')
var chooseIdentifucationMethod = require('./IdentiFunctionMethod')
var chooseIdentifucation = require('./IdentiFunction')
var showAcBal = require('./showAcBal')
var showLast3Trans = require('./showLast3Trans')
var processBillPay = require('./processBillPay')
var dnldStmt = require('./dnldStmt')
var processDnldStmt = require('./processDnldStmt')
//var processAuthenticateAndLink = require('./processAuthenticateAndLink')
//var processMyProfile = require('./processMyProfile')
var showTransWithDateRange = require('./showTransWithDateRange')
var showTransWithDateAndAmt = require('./showTransWithDateAndAmt')
var sendText = require('./sendText')
var strToAmt = require('./StringToNumber')
//var analyzeWitAIResponse = require('./analyzeWitAIResponse')
var addToVerifiedList = require('./addToVerifiedList')
module.exports={
receivedMessage:  async function receivedMessage(event) {
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
}
async function analyzeWitAIResponse(PSId, messageText){
          var findFunction = function(element){
          if(element.key == PSId) return true
          }

            try{
                let witAiResp =callDialogFlow.callDialogFlow(PSId, messageText);
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
