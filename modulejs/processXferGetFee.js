var date = require('./DateAndTime')
module.exports={
processXferGetFee: function processXferGetFee(sender,usrArrItm){
  console.log(date.getToDateAndTime()+"  get fee function is called with sender id "+sender);
  let fee = process.env.fee_val
  if(usrArrItm.values.tranType=="FUND_XFER__ORFT")  fee = fee +" 35.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__SMART") fee = fee +" 20.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__INHOUSE") fee = fee +" 0.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__PP")  fee = fee +" 0.00"
  else if(usrArrItm.values.tranType=="FUND_XFER__DD") fee = fee +" 0.00"
  return fee;
}
}
