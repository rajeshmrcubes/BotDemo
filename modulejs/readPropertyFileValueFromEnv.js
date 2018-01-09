var DateAndTime = require('./DateAndTime')
module.exports={
readPropertyFileValueFromEnv: function readPropertyFileValueFromEnv(Name){
  console.log(DateAndTime.getToDateAndTime()+" name that has to interact with env varable "+Name);
  console.log(DateAndTime.getToDateAndTime()+"  value is "+ process.env[Name]);
  return process.env[Name];
}
}
