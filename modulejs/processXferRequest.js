var datendTime = require('./DateAndTime')
var identify = require('./IdentiFunctionMethod')
var amount = require('./StringToNumber')
var Inprong = require('./addToInProg')
var sendMsg = require('./SendMessage')
var processXferConfirm = require('./processXferConfirm')
var processXferComplete = require('./processXferComplete')
var processXferIfDD = require('./processXferIfDD')
var processXferSmartOrOrft = require('./processXferSmartOrOrft')
module.exports={
processXferRequest: async function processXferRequest(PSId, messageText, payload, multiArr){
  console.log(datendTime.getToDateAndTime()+" processXferRequest :: called for PSId: %s with payload:%s at time %s ", PSId, payload,datendTime.getToDateAndTime())
  if(identify.chooseIdentifucationMethod(PSId)){
    Inprong.addToInProgTran(PSId, "FUND_XFER")
    console.log(datendTime.getToDateAndTime()+" INPROGTRAN "+process.env.INPROGTRAN );
    var findFunction = function(element){
    if(element.key == PSId) return true
    }
    var multiArr = JSON.parse(process.env.INPROGTRAN)
    var usrArrItm = multiArr.PSId.find(findFunction)
    console.log(datendTime.getToDateAndTime()+" amount is "+JSON.stringify(usrArrItm));
    if(usrArrItm.values.amount == undefined){
      if(amount.strToAmt(messageText) == "Invalid"){
        console.log(datendTime.getToDateAndTime()+" processXferRequest :: prompt user to enter amount. ")
        var messageData = {
          "recipient":{
              "id":PSId
          },
          "message":{
              "text":process.env.Enter_amount
          }
        }
        sendMsg.sendRequest(PSId,messageData)
      }else {
        console.log(datendTime.getToDateAndTime()+" processXferRequest :: prompt user to confirm amount entered. ")
        usrArrItm.values.amount = amount.strToAmt(messageText)
        process.env.INPROGTRAN = JSON.stringify(multiArr);
        console.log(datendTime.getToDateAndTime()+"  process.env.INPROGTRAN = JSON.stringify(multiArr); "+  JSON.stringify(multiArr));
        console.log(datendTime.getToDateAndTime()+" usrArrItm.values.amount "+JSON.stringify(usrArrItm.values.amount));
        console.log(datendTime.getToDateAndTime()+" INPROGTRAN sadadsfdfg "+process.env.INPROGTRAN );
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
        sendMsg.sendRequest(PSId,messageData)
      }
  }else if(payload == "FUND_XFER__AMT__NO"){
  console.log(datendTime.getToDateAndTime()+" processXferRequest :: prompt user to enter amount again.")
  usrArrItm.values.amount = undefined
  process.env.INPROGTRAN = JSON.stringify(multiArr);
  console.log(datendTime.getToDateAndTime()+"   process.env.INPROGTRAN = JSON.stringify(multiArr); "+  JSON.stringify(multiArr));
  console.log(datendTime.getToDateAndTime()+" usrArrItm.values.amount "+JSON.stringify(usrArrItm.values.amount));
  console.log(datendTime.getToDateAndTime()+" INPROGTRAN sadadsfdfg "+process.env.INPROGTRAN );
  var messageData = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":process.env.Enter_amount
    }
  }
  sendMsg.sendRequest(PSId,messageData)
  }else if(usrArrItm.values.eba == undefined){
  console.log(datendTime.getToDateAndTime()+" processXferRequest :: prompt user to choose eba.");
      if(payload == "FUND_XFER__TMB_PAYEE_ID"){
            usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
            if(usrArrItm.values.tranType == undefined)  processXferIfDD.processXferIfDD(PSId)
      }else if(payload == "FUND_XFER__SCB_PAYEE_ID"){
            usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
            if(usrArrItm.values.tranType == undefined) processXferSmartOrOrft.processXferSmartOrOrft(PSId)
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
        sendMsg.sendRequest(PSId,messageData)
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
        sendMsg.sendRequest(PSId,messageData)
      }
  }else if(usrArrItm.values.tranType == undefined){
      console.log(datendTime.getToDateAndTime()+" processXferRequest :: prompt user to enter transfer type.")
      if(payload == "FUND_XFER__INHOUSE"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__DD"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__ORFT"){
        usrArrItm.values.tranType = payload
      }else if(payload == "FUND_XFER__SMART"){
        usrArrItm.values.tranType = payload
      }else if(usrArrItm.values.eba == "FUND_XFER__TMB_PAYEE_ID"){
        processXferIfDD.processXferIfDD(PSId)
      }else if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID"){
        processXferSmartOrOrft.processXferSmartOrOrft(PSId)
      }
  }else if(payload == "FUND_XFER__EDIT"){
      usrArrItm.values.amount = undefined
      usrArrItm.values.eba = undefined
      usrArrItm.values.tranType = undefined
      process.env.INPROGTRAN = JSON.stringify(multiArr)
      processXferRequest(PSId, messageText, payload, multiArr)
    }else if(payload == "FUND_XFER__CONFIRM"){
      processXferComplete.processXferComplete(PSId, usrArrItm)
    }
    //Ask for confirmation from user if all parameters received.
    if((usrArrItm.values.amount != undefined) &&
      (usrArrItm.values.eba != undefined) &&
      (usrArrItm.values.tranType != undefined) &&
      (payload != "FUND_XFER__CONFIRM")) processXferConfirm.processXferConfirm(PSId, usrArrItm)

    if(payload != "FUND_XFER__CONFIRM"){
      process.env.INPROGTRAN = JSON.stringify(multiArr)
      console.log(datendTime.getToDateAndTime()+" processXferRequest :: Now INPROGTRAN: %s  ", process.env.INPROGTRAN)
    }
 }
}

}
