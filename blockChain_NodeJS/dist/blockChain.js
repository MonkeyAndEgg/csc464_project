'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsSha256 = require('js-sha256');
var bignumber_js = require('bignumber.js');
var fs = require('fs');
var path = require('path');

const state = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
};

const Transaction = {
    generate: (rec, sen, val) => {
        state.recipientAddr = rec;
        state.senderAddr = sen;
        state.value = val;
        return Object.assign({}, state);
    }
};

const state$1 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock, timestamp) => {
        state$1.blockNumber = blockNumber;
        state$1.transaction = JSON.stringify(transaction);
        state$1.timestamp = timestamp || Date.now();
        state$1.nonce = nonce;
        state$1.prevBlock = prevBlock;
        return Object.assign({}, state$1);
    },
    hash: state => {
        return jsSha256.sha256(JSON.stringify(state));
    }
};

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const state$2 = {
    id: 0,
    url: ""
};

const NodeAction = {
    generate: (id, url) => {
        state$2.id = id;
        state$2.url = url;
        return _extends({}, state$2);
    }
};

const LEVEL_OF_DIFFICULTY = 1;
const REWARD = "[REWARD]";
const REWARD_AMOUNT = 50;

const state$3 = {
    chainId: 0,
    blocks: [],
    nodes: [],
    transactions: [],
    genesisBlock: Block.generate(0, [], 0, "", 1),
    target: Math.pow(2, 256 - LEVEL_OF_DIFFICULTY),
    storagePath: ""
};

const BlockChain = {
    init: id => {
        state$3.chainId = id;
        state$3.storagePath = path.resolve(__dirname, "../data/", `${state$3.chainId}.blockchain`);
        state$3.blocks.push(state$3.genesisBlock);
    },
    register: (id, url) => {
        if (state$3.nodes.find(item => item.id == id)) {
            return false;
        } else {
            state$3.nodes.push(NodeAction.generate(id, url));
            return true;
        }
    },

    importChain: () => {
        try {
            state$3.blocks = JSON.parse(fs.readFileSync(state$3.storagePath, "utf-8"));
        } catch (e) {
            state$3.blocks = [state$3.genesisBlock];
        }

        try {
            state$3.blocks = JSON.parse(fs.readFileSync(state$3.storagePath, "utf-8"));
        } catch (e) {
            console.log("Error: Failed to read blockchain.");
            state$3.blocks = [state$3.genesisBlock];
        } finally {
            BlockChain.verifyChain(state$3.blocks);
        }
    },
    exportChain: () => {
        fs.writeFileSync(state$3.storagePath, JSON.stringify(state$3.blocks), "utf-8");
    },
    consensus: blockChains => {
        let maxLength = 0;
        let candidate = -1;
        blockChains.forEach((item, index) => {
            console.log("Doing consensus...", item, BlockChain.verifyChain(item));

            if (item.length < maxLength) {} else if (BlockChain.verifyChain(item)) {
                maxLength = item.length;
                candidate = index;
            }
        });
        if (candidate >= 0 && (maxLength >= state$3.blocks.length || !BlockChain.verifyChain(state$3.blocks))) {
            state$3.blocks = [...blockChains[candidate]];
            BlockChain.exportChain();
            return true;
        }
        return false;
    },
    submitTransaction: (send, rec, val) => {
        state$3.transactions.push(Transaction.generate(send, rec, val));
    },
    getTransaction: () => {
        return state$3.transactions;
    },
    idPowValid: pow => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow;
            }
            return new bignumber_js.BigNumber(pow).isLessThanOrEqualTo(state$3.target);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    verifyChain: blocks => {
        try {
            if (!blocks.length) {
                throw new Error("Error: Block cannot be empty.");
            }

            if (JSON.stringify(state$3.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("Error: invalid genesis block.");
            }

            blocks.forEach((item, index) => {
                if (index > 0 && item.prevBlock != Block.hash(blocks[index - 1])) {
                    throw new Error("Error: invalid previous block.");
                }

                if (index > 0 && !BlockChain.idPowValid(Block.hash(item))) {
                    throw new Error("Error: invalid proof of work.");
                }
            });
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    mine: (transactions = []) => {
        let lastBlock = state$3.blocks[state$3.blocks.length - 1];

        transactions = [Transaction.generate(REWARD, state$3.chainId, REWARD_AMOUNT), ...transactions];

        const newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.hash(lastBlock));
        while (true) {
            let sha = Block.hash(newBlock);
            if (BlockChain.idPowValid(sha) || newBlock.nonce > 1000) {
                console.log("A block is mined: ", sha);
                break;
            }
            newBlock.nonce++;
        }

        return newBlock;
    },
    createBlock: () => {
        const newBlock = BlockChain.mine(BlockChain.transactions);

        state$3.blocks.push(newBlock);
        BlockChain.transactions = [];
        BlockChain.exportChain();
        return newBlock;
    },

    getNodes: () => {
        return state$3.nodes;
    },

    getBlocks: () => {
        return state$3.blocks;
    }
};

exports.BlockChain = BlockChain;
