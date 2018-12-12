const args = require('args');
const axios = require('axios');
const Koa = require('koa');

args.option('port', 'The port on which the app will be running', 4040)

const router = require('koa-router')();
const flags = args.parse(process.argv);
const blockChain = require('./dist/blockChain').BlockChain

const app = new Koa();
blockChain.init(1)

app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.host} ${ctx.request.url}...`);
    await next();
});

router.get('/blocks', async (ctx, next) => {
    console.log(JSON.stringify(blockChain.getBlocks()))
    ctx.response.body = JSON.stringify(blockChain.getBlocks());
});

router.get('/blocks/:id', async (ctx, next) => {
    var id = ctx.params.id;
    if (id == null) {
        console.log("invalid parameter")
        ctx.response.body = "invalid parameter"
    }
    let blocks = blockChain.getBlocks();
    if (+id > blocks.length) {
        console.log("block wasn't found!")
        ctx.response.body = "block wasn't found!"
    } else {
        ctx.response.body = JSON.stringify(blocks[+id]);
    }
});

router.get('/nodes', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getNodes());
});
router.post('/nodes', async (ctx, next) => {

    let nodeId = ctx.query.id;
    let nodeUrl = ctx.query.url || '';

    if (!nodeId || !nodeUrl) {
        ctx.response.body = "invalid parameter"
    } else {
        console.log("receive data", nodeId, nodeUrl)
        if (blockChain.register(nodeId, nodeUrl)) {
            ctx.response.body = `Added node ${nodeId} `;
        } else {
            ctx.response.body = `The node ${nodeId} already exists！ `;
        }
    }
});

router.get('/transactions', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getTransaction());
});
router.post('/transactions', async (ctx, next) => {
    var sendAddr = ctx.query.sendAddr || '',
        recAddr = ctx.query.recAddr || '',
        value = +ctx.query.value || 0;

    if (!sendAddr || !recAddr || !value) {
        ctx.response.body = "invalid parameter"
    } else {
        console.log("receive data", sendAddr, recAddr, value)

        blockChain.submitTransaction(sendAddr, recAddr, value)
        ctx.response.body = `transactions from ${sendAddr} to ${recAddr} of ${value} successfully`;
    }
});

router.get('/mine', async (ctx, next) => {
    const newBlock = blockChain.createBlock(blockChain.getTransaction())
    console.log(blockChain.getBlocks())
    ctx.response.body = `The block #${newBlock.blockNumber} is mined.`;
});

router.put('/nodes/consensus', async (ctx, next) => {

    let reqs = blockChain.getNodes().map(node => axios.get(`${node.url}blocks`))

    if (!reqs.length) {
        ctx.response.body = "No update required.";
    } else {
        await axios.all(reqs).then(axios.spread((...blockChains) => {
            if (blockChain.consensus(blockChains.map(res=> res.data ))) {
                ctx.response.body = "Consensus reached.";
            } else {
                ctx.response.body = "Failed to reach consensus.";
            }
        }))
    }
});


app.use(router.routes());
app.listen(flags.port);
console.log(`Server is running now. Port Number: ${flags.port}.`);