var datendTime = require('./DateAndTime')
var verification = require('./verifiedList')
module.exports={
  chooseIdentifucation: function chooseIdentifucation(PSId){
    console.log(datendTime.getToDateAndTime()+" chooseIdentifucationMethod ");
        try{
          var verifiedFlag = verification.checkIfVerified(PSId)
          console.log("verifiedFlag "+(verifiedFlag));
        }catch(Error){
          console.log(datendTime.getToDateAndTime()+" chooseIdentifucationMethod :: Error while calling checkIfVerified: %s", JSON.stringify(Error))
        }

      return verifiedFlag;
  }

}
