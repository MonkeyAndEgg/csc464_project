const superagent = require('superagent');


// initialize nodes A, B
const node1 = "A";
const node2 = "B";

const node1_port_num = 4041;
const node2_port_num = 4042;

const node1_url = `http://127.0.0.1:${node1_port_num}/`;
const node2_url = `http://127.0.0.1:${node2_port_num}/`;

// add nodes
superagent
    .post(node1_url + 'nodes')
    .query({
        id: node2,
        url: node2_url
    }).end((err, res) => {
        // send the req
    });

superagent
    .post(node2_url + 'nodes')
    .query({
        id: node1,
        url: node1_url
    }).end((err, res) => {
        // send the req
    });


// add transations
superagent
    .get(node1_url + 'blocks').end(function (err, res) {
        console.log("The block info of current node: ")
        console.log(res.text);
    });

superagent
    .get(node1_url + 'transactions').end(function (err, res) {
        console.log("The transactions info before new transactions added:")
        console.log(res.text);
    });

superagent
    .post(node1_url + 'transactions')
    .query({
        sendAddr: 'Xinhai',
        recAddr: 'Jay',
        value: 13
    }).end((err, res) => {
        // send the req
    });

superagent
    .post(node1_url + 'transactions')
    .query({
        sendAddr: 'Helen',
        recAddr: 'Gary',
        value: 9
    }).set('accept', 'json')
    .end((err, res) => {
        // send the req
    });

superagent
    .get(node1_url + 'transactions').end(function (err, res) {
        console.log("The transaction info after new transactions added:");
        console.log(res.text)
    });


// start mining for 3 times
superagent.get(node1_url + 'mine').end(function (err, res) {
    if (err) {
        console.log(err);
    }
    console.log(res.text)
});
superagent.get(node1_url + 'mine').end(function (err, res) {
    if (err) {
        console.log(err);
    }
    console.log(res.text)
});
superagent.get(node1_url + 'mine').end(function (err, res) {
    if (err) {
        console.log(err);
    }
    console.log(res.text)

// consensus
    superagent
        .put(node1_url + 'nodes/consensus')
        .end((err, res) => {
            superagent
                .get(node1_url + 'blocks').end(function (err, res) {
                    console.log("Here is the block info of node A:")
                    console.log(node1_url, res.text)
                });
        });
        
    superagent
        .put(node2_url + 'nodes/consensus')
        .end((err, res) => {
            superagent
                .get(node2_url + 'blocks').end(function (err, res) {
                    console.log("Here is the block info of node B:")
                    console.log(node2_url, res.text)
                });
        });

});
