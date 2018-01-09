var date = require('./DateAndTime')
module.exports={
processXferDestBank: function processXferDestBank(sender,usrArrItm){
  console.log(date.getToDateAndTime()+" process transfer to destination bank name is being called with sender id : "+sender);
  let tobank="डेपोसित किये गए बैंक का नाम : "
  if(usrArrItm.values.tranType=="FUND_XFER__DD") tobank = tobank+"MRC\n"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP") tobank = ""
  else if(usrArrItm.values.tranType=="FUND_XFER__ORFT") {
     if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID") tobank = tobank + "SCB\n"
  }
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") {
    if(usrArrItm.values.eba == "FUND_XFER__SCB_PAYEE_ID") tobank = tobank + "SCB\n"
  }
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") tobank = tobank+"MRC\n"
  return tobank
}
}
