function strToDateRange(input){
  console.log("strToDateRange :: called with input: %s", input)
  var dateRange = "Invalid Date"
  var dateParts = undefined
  if((input != undefined) && (input != null) && (input != "")) dateParts = input.split("/")
  var fromDateParts = undefined
  if(dateParts && dateParts[0]) fromDateParts = dateParts[0].split("-")
  var toDateParts = undefined
  if(dateParts && dateParts[1]) toDateParts = dateParts[1].split("-")
  var fromDate = undefined
  if(fromDateParts) fromDate = new Date(fromDateParts[0], fromDateParts[1] - 1, fromDateParts[2]) // month is 0-based
  var toDate = undefined
  if(toDateParts) toDate = new Date(toDateParts[0], toDateParts[1] - 1, toDateParts[2]) // month is 0-based // month is 0-based

  if((fromDate == undefined) || (fromDate == "Invalid Date") ||
   (toDate == undefined) || (toDate == "Invalid Date")){
        console.log("strToDateRange :: called with Invalid input: %s", input)
  }else{
    dateRange = fromDate.toString().substring(0, 16)+" to "+toDate.toString().substring(0, 16)
  }
  return dateRange
}
