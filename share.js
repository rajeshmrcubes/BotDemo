var express = require('express')
var bodyParser = require('body-parser')
var dotenv = require('dotenv').config();
var app = express();
var amount = require('./modulejs/xyz')
//require('./public')
require('dotenv').config();
//amount.strToAmt("50000");
//var value = amount.sum(10,20);
console.log(" value is "+amount.strToAmt("50000"));
// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// POST /login gets urlencoded bodies
app.post('/login', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  res.send('welcome, ' + 'Rajesh')
})

// POST /api/users gets JSON bodies
app.post('/api/users', jsonParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  // create user in req.body
})

app.set('port',process.env.PORT || 3000);
// providing the JSon
app.listen(app.get('port') ,function(req,res){
  console.log(Date.now());
  console.log(process.env.Bye_message);
console.log('Webhook server is listening, port 3030');
});
