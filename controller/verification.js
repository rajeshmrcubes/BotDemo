
module.exports = (req, res) => {
    const hubChallenge = req.query['hub.challenge'];
    console.log('hubChallenge ' + hubChallenge);
    const hubMode = req.query['hub.mode'];
    console.log('hubMode ' + hubMode);

    const verifyTokenMatches = req.query['hub.verify_token'] ;
  console.log('verifyTokenMatches ' + verifyTokenMatches);
    if (verifyTokenMatches==="my_webhook_token_go_here") {
        res.status(200).send(hubChallenge);
    } else {
        res.status(403).send('Wrong Token');
    }
};
