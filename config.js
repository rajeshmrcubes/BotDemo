
//const accessToken ='72XFKL7GO6SKRAXJNJLXFLPKOE7BG2WZ';
module.exports = {
    accessToken: 'Q5GFWLV242J2PW3CUYV6LYTTPOA4G6JM',
    FB_APP_ID: '131280934242224',
    FB_APP_SECRET_KEY: '7bad5ff275d0479e96d82755685e5400',
    FB_CLIENT_TOKEN: 'ce7fc4d2ed7beaaaa2534c4dfd1e9185',
    FB_ACCESS_TOKEN: 'EAAB3ZAjlzh7ABAEfZCFnEpwmT2vbfkSUS9157PbXvZBXnZAbkgFp4q19XLM6ZBe4TdcIqZCjiqZAWc8N5ULgn6uVQ2wcnLaTCUZBwzOTKTuR7nINZCaOPSn1VFG12bppNXZBX0IhfRwRA3n16uhgjffOY6wnfdBDlPTIqytBuHjCX5DEHPURlBeJxZB',

    }



    const sessions = {};
    const findOrCreateSession = function(fbid) {
      let sessionId;
      // Let's see if we already have a session for the user fbid
      var sessId = Object.keys(sessions);
        for(let k = 0 ; k < sessId -1; k++){
        if (sessions[k].fbid === fbid) {
          sessionId = k;
        }
      };
      if (!sessionId) {
        sessionId = new Date().toISOString();
        sessions[sessionId] = {fbid: fbid, context: {}};
      }
      return sessionId;
    };
