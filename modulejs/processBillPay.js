var sendRequest = require('./SendMessage')
var date = require('./DateAndTime')
var processCancelRequest = require('./processCancelRequest')
var addToInProg = require('./addToInProg')
var chooseIdentifucationMethod = require('./IdentiFunctionMethod')
var callBatchSendAPI = require('./callBatchSendAPI')
module.exports={
  processBillPay:async function processBillPay(PSId, messageText, payload, multiArr){
  console.log(date.getToDateAndTime()+" processBillPay :: called with PSId: %s ", PSId)
  if(chooseIdentifucationMethod.chooseIdentifucationMethod(PSId)){
      addToInProg.addToInProgTran(PSId, "BILL_PAY")
      var findFunction = function(element){
      if(element.key == PSId) return true
      }

    //if(!payload) payload = "xyz"
      var multiArr = JSON.parse(process.env.INPROGTRAN)
      var usrArrItm = multiArr.PSId.find(findFunction)
      var billDtlsMsg = "For this payment bill details are as given below :-\n"
      if(usrArrItm.values.biller == "BILL_PAY__BILLER_SPS"){
                    billDtlsMsg = billDtlsMsg + "Biller Name : SP Services\n"+
                   "Amount Due : SGD 120.00\n"+
                   "Pay By : 15th December 2017"
      }else if(usrArrItm.values.biller == "BILL_PAY__BILLER_SPF"){
                    billDtlsMsg = billDtlsMsg + "Biller Name : Singapore Police Force\n"+
                   "Amount Due : SGD 0.00\n"+
                   "Pay By : N/A"
      }else if(usrArrItm.values.biller == "BILL_PAY__BILLER_STC"){
                    billDtlsMsg = billDtlsMsg + "Biller Name : Singapore Town Council\n"+
                   "Amount Due : SGD 60.00\n"+
                   "Pay By : More than 15 days away"
       }
       var msgSent = false
       if(payload == "BILL_PAY__BILLER_SPS"){
         console.log(date.getToDateAndTime()+" processBillPay :: Ask user if he wants to make full payment or Partial payment.")
         usrArrItm.values.biller = "BILL_PAY__BILLER_SPS"
         msgSent = true
         var messageData = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "You can choose to make full payment or part payment. Please decide and click on one of the buttons.",
             "quick_replies":[
               {
                 "content_type":"text",
                 "title":"Full Payment",
                 "payload":"BILL_PAY__FULL"
               },
               {
                 "content_type":"text",
                 "title":"Part Payment",
                 "payload":"BILL_PAY__PART"
               }
             ]
           }
         }
         sendRequest.sendRequest(PSId,messageData)
       }else if(payload == "BILL_PAY__BILLER_SPF"){
         console.log(date.getToDateAndTime()+" processBillPay :: Inform user that payment is not due PSId: %s", PSId)
         usrArrItm.values.biller = "BILL_PAY__BILLER_SPF"
         msgSent = true
         var messageData = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "Biller is not showing any payment due, you can still make a payment if you choose to. Please decide and click on one of the buttons.",
             "quick_replies":[
               {
                 "content_type":"text",
                 "title":"Make Payment",
                 "payload":"BILL_PAY__PART"
               },
               {
                 "content_type":"text",
                 "title":"Cancel",
                 "payload":"BILL_PAY__CANCEL"
               }
             ]
           }
         }
          sendRequest.sendRequest(PSId,messageData)
       }else if(payload == "BILL_PAY__BILLER_STC"){
         console.log(date.getToDateAndTime()+" processBillPay :: Inform user that payment due date is further away. PSId: %s", PSId)
         usrArrItm.values.biller = "BILL_PAY__BILLER_STC"
         msgSent = true
         var messageData = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "Payment due date is more than 15 days away, you can schedule this payment near the due date if you want to earn some interest.\n\nPlease decide and click on one of the buttons.",
             "quick_replies":[
               {
                 "content_type":"text",
                 "title":"Pay Now",
                 "payload":"BILL_PAY__NOW"
               },
               {
                 "content_type":"text",
                 "title":"Schedule to pay later",
                 "payload":"BILL_PAY__LATER"
               }
             ]
           }
         }
          sendRequest.sendRequest(PSId,messageData)
       }else if(payload == "BILL_PAY__FULL"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer wants to make full payment PSId: %s", PSId)
         usrArrItm.values.amount = "120.00"
         usrArrItm.values.paymentDate = "BILL_PAY__NOW"
       }else if(payload == "BILL_PAY__PART" || payload == "BILL_PAY__NOW" || payload == "BILL_PAY__LATER"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer wants to make some payment PSId: %s", PSId)
         if(payload == "BILL_PAY__LATER"){
           usrArrItm.values.paymentDate = "BILL_PAY__LATER"
         }else{
           usrArrItm.values.paymentDate = "BILL_PAY__NOW"
         }
       }else if(payload == "BILL_PAY__SUGSTD_SCHDL"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer wants to make payment 1 day before paymnet due date. PSId: %s", PSId)
         usrArrItm.values.paymentDate = "BILL_PAY__SUGSTD_SCHDL"
       }else if(payload == "BILL_PAY__CHOOSE_DATE"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer wants to schedule payment date. PSId: %s", PSId)
         msgSent = true
         var messageDataArr = Array()
         var messageData1 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": billDtlsMsg
           }
         }
         messageDataArr[0] = messageData1

         var messageData2 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "Please enter the date you want me to process this payment."
           }
         }
         messageDataArr[1] = messageData2
         callBatchSendAPI.callBatchSendAPI(messageDataArr)
       }else if(payload == "BILL_PAY__CANCEL"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer wants to cancel this payment PSId: %s", PSId)
         processCancelRequest.processCancelRequest(PSId, messageText)
       }else if(payload == "Amount"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer has provided bill payment amount. PSId: %s", PSId)
         usrArrItm.values.amount = messageText
       }else if(payload == "Date"){
         console.log(date.getToDateAndTime()+" processBillPay :: customer has provided payment date. PSId: %s", PSId)
         usrArrItm.values.paymentDate = strToDate(messageText).toString().substring(0, 16)
       }

       //If amount is not present then ask customer to enter the amount
       //If payment date is not present then ask customer to enter payment date
       //If payment date is not now then ask customer to enter payment date
       //If biller, amount and date is present ask him to choose source of funds
       if(!msgSent && !usrArrItm.values.biller){
         console.log(date.getToDateAndTime()+" processBillPay :: prompt user to choose biller.")
         var messageDataArr = Array()
         var messageData1 = {
           "recipient":{
               "id":PSId
           },
           "message":{
               "text":"Please choose the biller for payment. Last 3 payments biller are listed below. You can click on \"View My Billers\" to see/add other billers."
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
                 "template_type":"list",
                 "top_element_style": "compact",
                 "elements":
                 [
                   {
                     "title": "SP Services",
                     "subtitle": "Billing Cycle : 4th of every Month\n"+
                                 "Amount Due : SGD 120.00\n"+
                                 "Pay By : 15th of every Month",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/SPS.png",
                     "buttons": [
                       {
                         "title": "Pay Bill",
                         "type": "postback",
                         "payload": "BILL_PAY__BILLER_SPS"
                       }
                     ]
                   },
                   {
                     "title": "Singapore Police Force",
                     "subtitle": "Amount Due : SGD 0.00\n"+
                                 "Pay By : N/A",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/SPF.png",
                     "buttons": [
                       {
                         "title": "Pay Bill",
                         "type": "postback",
                         "payload": "BILL_PAY__BILLER_SPF"
                       }
                     ]
                   },
                   {
                     "title": "Singapore Town Council",
                     "subtitle": "Billing Cycle : 14th of every Month\n"+
                                 "Amount Due : SGD 60.00\n"+
                                 "Pay By : 28th of every month",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/STC.png",
                     "buttons": [
                       {
                         "title": "Pay Bill",
                         "type": "postback",
                         "payload": "BILL_PAY__BILLER_STC"
                       }
                     ]
                   }
                 ],
                 "buttons": [
                   {
                     "title": "View My Billers",
                     "type": "web_url",
                     "url": "http://peaceful-springs-82345.herokuapp.com/addViewBiller.html?rnd=1"
                   }
                 ]
               }
             }
           }
         }
         messageDataArr[1] = messageData2
         callBatchSendAPI.callBatchSendAPI(messageDataArr)
       }else if(!msgSent && usrArrItm.values.biller && !usrArrItm.values.amount){
         console.log(date.getToDateAndTime()+" processBillPay :: prompt user to enter bill amount to be paid.")
         var messageDataArr = Array()
         var messageData1 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": billDtlsMsg
           }
         }
         messageDataArr[0] = messageData1

         var messageData2 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "Please enter the amount you want to pay to this biller."
           }
         }
         messageDataArr[1] = messageData2
         callBatchSendAPI.callBatchSendAPI(messageDataArr)
       }else if(!msgSent && usrArrItm.values.amount && !usrArrItm.values.paymentDate){
         console.log(date.getToDateAndTime()+" processBillPay :: prompt user to choose payment date.")
         var messageDataArr = Array()
         var messageData1 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": billDtlsMsg
           }
         }
         messageDataArr[0] = messageData1

         var messageData2 = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "Please enter the date on which you want me to process this payment."
           }
         }
         messageDataArr[1] = messageData2
         callBatchSendAPI.callBatchSendAPI(messageDataArr)
       }else if(!msgSent && (usrArrItm.values.paymentDate == "BILL_PAY__LATER")){
         console.log(date.getToDateAndTime()+" processBillPay :: prompt user to choose date.")
         var messageData = {
           "recipient":{
             "id":PSId
           },
           "message":{
             "text": "I am scheduling the paymnet 1 day before due date. You can decide to pay on another date.\n\nPlease decide and click on one of the buttons.",
             "quick_replies":[
               {
                 "content_type":"text",
                 "title":"Okay",
                 "payload":"BILL_PAY__SUGSTD_SCHDL"
               },
               {
                 "content_type":"text",
                 "title":"Another Date",
                 "payload":"BILL_PAY__CHOOSE_DATE"
               }
             ]
           }
         }
          sendRequest.sendRequest(PSId,messageData)
       }else if(!msgSent && usrArrItm.values.paymentDate && !usrArrItm.values.payFrmAcct){
         console.log(date.getToDateAndTime()+" processBillPay :: prompt user to choose account to pay from.")
         var messageDataArr = Array()
         var messageData1 = {
           "recipient":{
               "id":PSId
           },
           "message":{
               "text":"Please choose which account or card you want to use to pay this bill."
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
                 "template_type":"list",
                 "top_element_style": "compact",
                 "elements":
                 [
                   {
                     "title": "Savings A/C# 11xx33xx55",
                     "subtitle": "Available Balance : SGD 12456.52",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/savingsac.png",
                     "buttons": [
                       {
                         "title": "Pay",
                         "type": "postback",
                         "payload": "BILL_PAY__SOF_SAVINGS"
                       }
                     ]
                   },
                   {
                     "title": "Checking A/C# 99xx77xx44",
                     "subtitle": "Available Balance : SGD -1000.50",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/checkingac.png",
                     "buttons": [
                       {
                         "title": "Pay",
                         "type": "postback",
                         "payload": "BILL_PAY__SOF_CHECKING"
                       }
                     ]
                   },
                   {
                     "title": "Credit Card 9988xxxx4433xxxx",
                     "subtitle": "Available Limit : SGD 10000.50\n"+
                                 "Utilized Limit : SGD 460.00",
                     "image_url": "https://peaceful-springs-82345.herokuapp.com/creditcard.png",
                     "buttons": [
                       {
                         "title": "Pay",
                         "type": "postback",
                         "payload": "BILL_PAY__SOF_CREDITCARD"
                       }
                     ]
                   }
                 ]
               }
             }
           }
         }
         messageDataArr[1] = messageData2
        callBatchSendAPI.callBatchSendAPI(messageDataArr)
       }

     process.env.INPROGTRAN = JSON.stringify(multiArr)
     console.log(date.getToDateAndTime()+" processBillPay :: sent replies to recipient %s", PSId)
     }
   }
 }
