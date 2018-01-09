var datendTime = require('./DateAndTime')
var callDialogFlow = require('./callDialogFlow')

module.exports={
  analyzeWitAIResponse: async function analyzeWitAIResponse(PSId, messageText){
      var findFunction = function(element){
      if(element.key == PSId) return true
      }

        try{
            let witAiResp =callDialogFlow.callDialogFlow(PSId, messageText);
            console.log(datendTime.getToDateAndTime()+" analyzeAIResponse :: witAiResp: %s", JSON.stringify(witAiResp))

            return witAiResp;
            }catch(Error){
          console.log(datendTime.getToDateAndTime()+" analyzeAIResponse :: Error: %s", JSON.stringify(Error))
          console.log(datendTime.getToDateAndTime()+" "+Error)
          }
}
}
