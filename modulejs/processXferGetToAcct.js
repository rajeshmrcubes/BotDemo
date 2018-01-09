var date = require('./DateAndTime')
module.exports={
processXferToAcct: function processXferToAcct(sender,usrArrItm){
  console.log(date.getToDateAndTime()+" process transfer to account number is being called with sender id : "+sender);
  if(usrArrItm.values.tranType=="FUND_XFER__DD") usrArrItm.values.toAc="77xx88xx99"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP") usrArrItm.values.toAc="11xx33xx55"
  else if(usrArrItm.values.tranType=="FUND_XFER__ORFT") usrArrItm.values.toAc="22xx33xx44"
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") usrArrItm.values.toAc="22xx33xx44"
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") usrArrItm.values.toAc="11xx33xx55"
  return usrArrItm.values.toAc

}
}
