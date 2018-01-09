var callBatchSendAPI = require('./callBatchSendAPI')
var callBatchSendAPI = require('./callBatchSendAPI')
module.exports={
processMenuRequest: function processMenuRequest(PSId, messageText){
  console.log("processMenuRequest :: called with PSId: %s", PSId)

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "text":"सुविधाओं की सूची देखने के लिए नीचे हिंडोला का उपयोग करें। \nहिरसोल से नीचे सबसे लोकप्रिय लेनदेन से चुनना। हैप्पी बैंकिंग :)"
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "sharable":true,
          "elements":
          [
            {
              "title":"खाते की जानकारी",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/myaccount.png?rn=3",
              "subtitle":"खाते से जुड़ी जानकारी",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"AC_BALANCE",
                  "title":process.env.Acct_bal
                },
                {
                  "type":"postback",
                  "payload":"LAST_3_TRANS",
                  "title":process.env.LAST_3_TRANS
                },
                {
                  "type":"postback",
                  "payload":"DT_RNG",
                  "title":"पिछले लेनदेन"
                }
              ]
            },
            {
              "title":"लेनदेन और वक्तव्य/स्टेटमेंट",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/statement.png?rn=3",
              "subtitle":"आप तिथि सीमा चुन सकते हैं और कथन डाउनलोड कर सकते हैं.",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"LAST_3_TRANS",
                  "title":process.env.LAST_3_TRANS
                },
                {
                  "type":"postback",
                  "payload":"DN_STMT",
                  "title":"स्टेटमेंट डाउनलोड करें"
                }
              ]
            },
            {
              "title":"अंतरण अदायगी",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/transfer.png?rn=4",
              "subtitle":"अपने खातो मे \nइसी बैंक मे दुसरे के खाते मे\nदुसरे बैंक मे\nदुसरे देश के बैंक अकाउंट मे",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"FUND_XFER",
                  "title":"ट्रान्सफर"
                },
                {
                  "type":"postback",
                  "payload":"BILL_PAY",
                  "title":"बिल भुगतान"
                }
              ]
            },
            {
              "title":"कार्ड एप्लिकेशन और इंस्टेंट खाता खोले",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/accountopening.png?rn=3",
              "subtitle":"बैंकिंग खातों के लिए आवेदन करें \nक्रेडिट कार्ड के लिए आवेदन करें \nविदेशी मुद्रा कार्ड के लिए आवेदन करें",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"OPEN_CASA",
                  "title":"ओपन सेविंग्स अकाउंट"
                },
                {
                  "type":"postback",
                  "payload":"OPEN_CC",
                  "title":"कार्ड के लिए आवेदन करें"
                },
                {
                  "type":"postback",
                  "payload":"OPEN_COREX",
                  "title":"विदेशी मुद्रा कार्ड के लिए आवेदन करें"
                }
              ]
            },
            {
              "title":"मेरी प्रोफाइल",
              "image_url":"https://peaceful-springs-82345.herokuapp.com/myprofile.png?rn=3",
              "subtitle":"अपने प्रोफ़ाइल विवरणों को संपादित और अपडेट करें \nअपने बैंकिंग प्रोफ़ाइल को फेसबुक प्रोफ़ाइल के साथ लिंक करें। \nनिकटतम शाखा की अगुवाई करें और निर्देश प्राप्त करें।",
              "buttons":
              [
                {
                  "type":"postback",
                  "payload":"MY_PROFILE",
                  "title":"प्रोफाइल देखिये"
                },
                {
                  "type":"postback",
                  "payload":"LINK_FB",
                  "title":"अपने FB आईडी को लिंक करें"
                },
                {
                  "type":"postback",
                  "payload":"FIND_BRANCH",
                  "title":"एटीएम / सीडीएम / शाखा खोजें"
                }
              ]
            }
          ]
        }
      }
    }
  }
  messageDataArr[1] = messageData2

  var messageData3 = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "text": "आप मेनू विकल्प का उपयोग कर सकते हैं या सबसे लोकप्रिय लेनदेन नीचे सूचीबद्ध हैं",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"खाते में शेष राशि",
          "payload":"AC_BALANCE"
        },
        {
          "content_type":"text",
          "title":"धन हस्तांतरण",
          "payload":"FUND_XFER"
        },
        {
          "content_type":"text",
          "title":process.env.LAST_3_TRANS,
          "payload":"LAST_3_TRANS"
        }
      ]
    }
  }
  //messageDataArr[2] = messageData3
  callBatchSendAPI.callBatchSendAPI(messageDataArr)

  console.log(DateAndTime.getToDateAndTime()+" processMenuRequest :: sent reply to recipient %s", PSId);
}
}
