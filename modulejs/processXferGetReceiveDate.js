var date = require('./DateAndTime')
module.exports={
processXferGetRececiveDate: function processXferGetRececiveDate(sender,usrArrItm){
  console.log(date.getToDateAndTime()+"  getting recieve date for sender id "+ sender);
  let rcv_date = new Date();
  if(usrArrItm.values.tranType=="FUND_XFER__SMART") rcv_date.setDate(rcv_date.getDate()+1)
  return rcv_date.toString().substring(0,16)
}
}
