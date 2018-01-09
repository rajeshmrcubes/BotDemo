var date = require('./DateAndTime')
module.exports={
processXferGetFromAc: function processXferGetFromAc(sender, usrArrItm){
  console.log(date.getToDateAndTime()+" process transfer from account number is being called with sender id : "+sender);
  if(usrArrItm.values.tranType=="FUND_XFER__DD") usrArrItm.values.fromAc="11xx22xx44"
  else usrArrItm.values.fromAc="99xx88xx77"
  return usrArrItm.values.fromAc
}
}
