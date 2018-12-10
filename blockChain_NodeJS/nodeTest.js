const superagent = require('superagent');

superagent.get('http://127.0.0.1:4040/blocks').end(function (err, res) {
        console.log("The block info of current node: ")
        console.log(res.text)
    });

superagent.get('http://127.0.0.1:4040/transactions').end(function (err, res) {
        console.log("The transactions info before new transactions added:")
        console.log(res.text)
    });

superagent
    .post('http://127.0.0.1:4040/transactions')
    .query({
        sendAddr: 'Xinhai',
        recAddr: 'Jay',
        value: 13
    }).end((err, res) => {
        // send the req
    });

superagent
    .post('http://127.0.0.1:4040/transactions')
    .query({
        sendAddr: 'Stan',
        recAddr: 'Jay',
        value: 20
    }).end((err, res) => {
        // send the req
    });

superagent
    .post('http://127.0.0.1:4040/transactions')
    .query({
        sendAddr: 'Gary',
        recAddr: 'Helen',
        value: 8
    }).set('accept', 'json')
    .end((err, res) => {
        // send the req
    });

superagent.get('http://127.0.0.1:4040/transactions').end(function (err, res) {
        console.log("The transaction info after new transactions added:");
        console.log(res.text)
    });

superagent.get('http://127.0.0.1:4040/mine').end(function (err, res) {
    if (err) {
        console.log(err);
    }
    console.log(res.text)
});