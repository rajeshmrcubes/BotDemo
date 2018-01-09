async function processDnldStmt(PSId, messageText, payload, multiArr){
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
