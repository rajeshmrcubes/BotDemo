var DateAndTime = require('./DateAndTime')
var sendRequest = require('./SendMessage')
var IdentiFunctionMethod = require('./IdentiFunctionMethod')
var callBatchSendAPI = require('./callBatchSendAPI')
module.exports={
  showLast3Trans: async function showLast3Trans(PSId){
    /*var options = {
    sessionId: ''
  }*/
  var today  = new Date();
  //console.log(today.toLocaleDateString("hi-IN", options));

  console.log(DateAndTime.getToDateAndTime()+" showLast3Trans :: called with PSId: %s", PSId + "time is "+ new Date())
  if(IdentiFunctionMethod.chooseIdentifucationMethod(PSId)){
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

    callBatchSendAPI.callBatchSendAPI(messageDataArr)
    console.log(DateAndTime.getToDateAndTime()+" showLast3Trans sent replies to recipient %s", PSId);
  }
}
}
