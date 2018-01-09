var entity = require('./EntityName')
var firstEntityName = require('./FirstEntityName')
var chooseIdentifucationMethod = require('./IdentiFunctionMethod')
var chooseIdentifucation = require('./IdentiFunction')
var processRequest = require('./processXferRequest')
var addToInProgTran = require('./addToInProg')
var stringToNumber = require('./stringToNumber')
var readPropertyFileValueFromEnv = require('./readPropertyFileValueFromEnv')
var sendText = require('./sendText')
var showLast3Trans =require('./showLast3Trans')
var showAcBal = require('./showAcBal')
var processMenuRequest = require('./processMenuRequest')
module.exports={
handleMessage: function handleMessage(PSId,message,messageText) {
      //var payload = null
      let ebaVal = null
      let bankName = null
      let entityName = entity.getEntityName(PSId,message);
      console.log("entity name is "+entityName);
      var entityNames = Object.keys(message.entities);
      console.log(" array of entity name is  "+entityNames);
      let confidence = firstEntityName.firstEntity(message,entityName);
      console.log(" confidence value is "+confidence);
      if(confidence >0.8){
        if(entityName === 'TransferValue'){
          if(chooseIdentifucation.chooseIdentifucation(PSId)){
            processRequest.processXferRequest(PSId)
          }else{
            chooseIdentifucationMethod.chooseIdentifucationMethod(PSId)
          }
        }else if(entityName === 'Cancel'){
          processCancelRequest.processCancelRequest(PSId, messageText)
        }else if(entityName === 'Account_balance'){
          showAcBal.showAcBal(PSId)
        }else if(entityName === 'Past_Transactions'){
          showLast3Trans.showLast3Trans(PSId)
        }else if(entityName === 'Menu'){
          processMenuRequest.processMenuRequest(PSId, messageText)
        }else if(stringToNumber.stringToNumber(messageText)!=" " && stringToNumber.stringToNumber(messageText).length>0 && entityName !=undefined){
              console.log(" else if for checking number and ");
      				addToInProgTran.addToInProgTran(PSId, "FUND_XFER")
      				var findFunction = function(element){
      				if(element.key == PSId) return true
      				}

      				var multiArr = JSON.parse(process.env.INPROGTRAN)
      				var usrArrItm = multiArr.PSId.find(findFunction)

              if(entityName=='fundTransfer' || entityName=='TransferValue' ){
                  if(entityNames.indexOf('fundTransfer')!= -1) entityName = entityNames[entityNames.indexOf('fundTransfer')]
                    console.log(" message text value is "+stringToNumber.stringToNumber(messageText).length+stringToNumber.stringToNumber(messageText));
                    let entityNameVal = Object.keys(message.entities[entityName][0].entities);
                    let Bank_name=JSON.stringify(message.entities[entityName][0].entities[entityNameVal[entityNameVal.indexOf('Bank_name_val')]][0].value);
                    let ebaTmb = 'tmb'
                    let ebaScb = 'scb'
                    let ebaPp = 'pp'
                    Bank_name = Bank_name.replace(/"/g, " ").trim().toString().toLowerCase()
                    console.log("Bank name is  "+Bank_name);
                    //console.log("entityNameVal value is "+JSON.stringify(message.entities[entityName][0].entities));
                    if(entityName =='fundTransfer' && entityNames.indexOf('fundTransfer')!=-1){
                    console.log("entityName =='fundTransfer' && entityNames.indexOf('Bank_name_val')!=-1 ");
                    if(entityNameVal.indexOf('Bank_name_val')!=-1){
                      if(Bank_name.toString().toLowerCase() == ebaTmb){
                        usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
                      }else if(Bank_name.toString().toLowerCase() == ebaScb){
                        usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                      }else if(Bank_name.toString().toLowerCase() == ebaPp){
                        usrArrItm.values.eba = "FUND_XFER__PP_PAYEE_ID"
                      }
                    let transtypeVals = Object.keys(message.entities[entityName][0].entities);
                    usrArrItm.values.amount = stringToNumber.stringToNumber(messageText)
                    //usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    if(transtypeVals.indexOf('smartentity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__SMART"
                      //  usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('orftentity')!=-1) {
                        usrArrItm.values.tranType = "FUND_XFER__ORFT"
                      //  usrArrItm.values.eba = "FUND_XFER__SCB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('CreditEntity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__INHOUSE"
                        //usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
                    }else if(transtypeVals.indexOf('DepositeEntity')!=-1){
                        usrArrItm.values.tranType = "FUND_XFER__DD"
                        //usrArrItm.values.eba = "FUND_XFER__TMB_PAYEE_ID"
                    }else usrArrItm.values.tranType = undefined
                      process.env.INPROGTRAN = JSON.stringify(multiArr);
                      processRequest.processXferRequest(PSId,messageText,"FUND_XFER",usrArrItm);
                    }else{
                      usrArrItm.values.amount = stringToNumber.stringToNumber(messageText)
                      process.env.INPROGTRAN = JSON.stringify(multiArr);
                      processRequest.processXferRequest(PSId,messageText,"FUND_XFER",usrArrItm)
                    }
                  }
                }
      }else{
        let newTxt ='';
          switch (entityName) {
            case (entityName):
            newTxt= readPropertyFileValueFromEnv.readPropertyFileValueFromEnv(entityName);
            break;
          default:
            console.log('something terribly wrong');
          break;
      }
      sendText.sendText(PSId,  newTxt.substring(0, 200));
    }
  }else{
      sendText.sendText(PSId, process.env.Wrong_inp);
  }
}



};
