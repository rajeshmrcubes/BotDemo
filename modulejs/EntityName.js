module.exports={
getEntityName:function getEntityName(PSId,message){
   let key_name = message.entities;
   let names = Object.keys(key_name);
   var i =message.entities[names[0]][0].confidence;
   let name = names[0];
   if(names.length==0){
     name = 'rajesh';
   }else{
   for(var j =1 ; j<names.length ; j++){
   if (message.entities[names[j]][0].confidence >i) {
       i = message.entities[names[j]][0].confidence;
       name = names[j];

     }
   }
   if(name == 'smartentity' || name == 'orftentity' || name =='Bank_name_val') name='amount'
  }
   return name;

}
}
