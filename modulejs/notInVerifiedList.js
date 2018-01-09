var datendTime= require('./DateAndTime')
//Check if a given PSId is already verified.
module.exports={
notInVerifiedList: function notInVerifiedList(PSId){
  console.log(datendTime.getToDateAndTime()+" notInVerifiedList :: called with PSId: %s", PSId)
  var notverified = true
  if(process.env.MYARRAYVAR == undefined){
    process.env.MYARRAYVAR = []
    notverified = true
    console.log(datendTime.getToDateAndTime()+" notInVerifiedList :: verified list is empty")
  }else{
    var strArray = process.env.MYARRAYVAR.split(",")
    console.log(datendTime.getToDateAndTime()+" notInVerifiedList :: verified list is: %s", process.env.MYARRAYVAR)
    var found = false
    if(strArray.indexOf(PSId) > -1) found = true
    if (found){
      console.log(datendTime.getToDateAndTime()+" notInVerifiedList :: %s is present in verified list", PSId)
      notverified = false
    } else{
      console.log(datendTime.getToDateAndTime()+" notInVerifiedList :: %s is not present in verified list", PSId)
      notverified = true
    }
  }
  console.log(datendTime.getToDateAndTime()+" return notverified ", notverified)
  return notverified
}
}
