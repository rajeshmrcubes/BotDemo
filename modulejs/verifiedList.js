var datendTime = require('./DateAndTime')
var sendMessage = require('./SendMessage')
var notInVerifiedList = require('./notInVerifiedList')
//var addToVerifiedList = require('./addToVerifiedList')
module.exports={
checkIfVerified:  function checkIfVerified(PSId){
	  console.log(datendTime.getToDateAndTime()+" checkIfVerified :: called with PSId: %s", PSId)
	  var verifiedFlag = true
	 /*return new Promise(function(resolve, reject) {
		if(notInVerifiedList.notInVerifiedList(PSId)){
		  console.log(datendTime.getToDateAndTime()+" checkIfVerified :: PSID not verified")
			console.log(datendTime.getToDateAndTime()+" checkIfVerified :: PSID not verified rajesh " +resolve(verifiedFlag));
		  resolve(verifiedFlag)
		}else{
		  verifiedFlag = true
		   console.log(datendTime.getToDateAndTime()+" checkIfVerified :: PSID is present in verified list")
		  resolve(verifiedFlag)
		}
	})*/
	if(notInVerifiedList.notInVerifiedList(PSId)){
		verifiedFlag = false;
		console.log(" verifiedFlag is "+ verifiedFlag);
	}
		return verifiedFlag

	}


}
