
import { sha256 } from "js-sha256"
const state = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

export const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock,timestamp) => {
        state.blockNumber = blockNumber;
        state.transaction = JSON.stringify(transaction);
        state.timestamp = timestamp || Date.now();
        state.nonce = nonce;
        state.prevBlock = prevBlock;
        return Object.assign({},state)
    },
    hash: (state) => {
        return sha256(JSON.stringify(state))
    }
};