module.exports={
  getToDateAndTime:function getToDateAndTime(){
    var d =new Date();
    var currentTime =d.toLocaleDateString("En-IN")+" "+d.toLocaleTimeString("En-IN")
    return currentTime;
  }
}
