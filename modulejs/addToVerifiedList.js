//Add to verified list in the cache and send response to customer.
var datendTime = require('./DateAndTime')
var sendMessage = require('./SendMessage')
module.exports={
addToVerifiedList :function addToVerifiedList(PSId){
  console.log(datendTime.getToDateAndTime()+" addToVerifiedList :: called with PSId: %s", PSId)
  var findFunction = function(element){
    if(element.key == PSId) return true
  }

  if(process.env.MYARRAYVAR == undefined) process.env.MYARRAYVAR = []
  var strArray = process.env.MYARRAYVAR.split(",")
  if(Array.isArray(strArray)){
    strArray.push(PSId)
    process.env.MYARRAYVAR = strArray
    console.log(datendTime.getToDateAndTime()+" addToVerifiedList :: added %s to verified list", PSId)
    console.log(datendTime.getToDateAndTime()+" addToVerifiedList :: contains %d PSIds", strArray.length)
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
  sendMessage.sendRequest(PSId,messageData)

  //Reset any running transactions
  var multiArr = undefined
  if(process.env.INPROGTRAN != undefined) multiArr = JSON.parse(process.env.INPROGTRAN)
  if(multiArr != undefined){
    var usrArrItm = multiArr.PSId.find(findFunction)
    if(usrArrItm != undefined){
      usrArrItm.tranName = undefined
      usrArrItm.values = undefined
      process.env.INPROGTRAN = JSON.stringify(multiArr)
      console.log(datendTime.getToDateAndTime()+" addToVerifiedList :: Now INPROGTRAN: %s", process.env.INPROGTRAN)
    }
  }

  console.log(datendTime.getToDateAndTime()+" addToVerifiedList sent 2 replies to recipient %s", PSId)
}
}
