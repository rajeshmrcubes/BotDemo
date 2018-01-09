module.exports={
  firstEntity:function firstEntity(message,name) {
    if(message.entities[name]!=null && message.entities[name][0] != undefined){
        /*if(message.entities[name][0].suggested){
          return 0.5;
        }else{
          return JSON.stringify(message.entities[name][0].confidence);
        }*/
        return JSON.stringify(message.entities[name][0].confidence);
      }else{
        console.log('rajesh++++++++++++++++');
        return 0.1;
      }
  }
}
