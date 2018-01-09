module.exports = {
  strToAmt: function strToAmt(input){
      var amt = parseFloat(input)
      if(!Number.isFinite(amt)) {
        amt = "Invalid"
      }else {
        let inputLength = input.length
        let amtLength = amt.toString().length
        console.log("amt length is "+amtLength);
        if(inputLength != amtLength ) amt = "Invalid"

      }
      return amt
    },
    stringToNumber: function stringToNumber(messageText){
        var number = messageText.replace(/[^0-9]/g, '');
        //if(!Number.isFinite(number)) number = "Invalid"
        return number
    }
};
