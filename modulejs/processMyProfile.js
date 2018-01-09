//Authenticate and link FB Id to Bank A/C
var date = require('./DateAndTime')
var callBatchSendAPI = require('./callBatchSendAPI')
var chooseIdentifucationMethod = require('./IdentiFunctionMethod')
module.exports={
  //Process my profile
  processMyProfile: async function processMyProfile(PSId){
    console.log(date.getToDateAndTime()+" processMyProfile :: called with PSId: %s", PSId)
    if(chooseIdentifucationMethod.chooseIdentifucationMethod(PSId)){
      var profData = "Salutaion : Mr.\n"+
                    "First Name : Joesph\n"+
                    "Last Name : Mentaka\n"+
                    "Citizen Id : S*5*0*4*J\n"+
                    "Mobile Number : 9*3*7*5*\n"

      var messageDataArr = Array()
      var messageData1 = {
        "recipient":{
            "id":PSId
        },
        "message":{
          "text":profData
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
              "template_type":"button",
              "text":"आप पते, प्रोफ़ाइल तस्वीर सहित सभी विवरण देख सकते हैं / संशोधित कर सकते हैं। नीचे दिए गए \"प्रोफ़ाइल देखें / संशोधित करें \" बटन पर क्लिक करें",
              "buttons":[
                {
                  "type":"web_url",
                  "url":"https://peaceful-springs-82345.herokuapp.com/showprofile.html",
                  "title":"देखें/प्रोफ़ाइल संशोधन"
                }
              ]
            }
          }
        }
      }
      messageDataArr[1] = messageData2

      callBatchSendAPI.callBatchSendAPI(messageDataArr)
      console.log(date.getToDateAndTime()+" processMyProfile :: sent replies to recipient %s", PSId)
    }
  }

}
