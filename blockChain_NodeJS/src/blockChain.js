import { Transaction } from './transaction'
import { Block } from "./block"
import { NodeAction } from "./node"
import {BigNumber} from 'bignumber.js';

import * as fs from "fs"
import * as path from "path"

const LEVEL_OF_DIFFICULTY = 1
const REWARD = "[REWARD]";
const REWARD_AMOUNT = 50;

const state = {
    chainId: 0,
    blocks: [],
    nodes: [],
    transactions: [],
    genesisBlock: Block.generate(0, [], 0, "", 1),
    target: 2 ** (256 - LEVEL_OF_DIFFICULTY),
    storagePath: ""
};

export const BlockChain = {
    init: (id) => {
        state.chainId = id;
        state.storagePath = path.resolve(__dirname, "../data/", `${state.chainId}.blockchain`)
        state.blocks.push(state.genesisBlock)
    },
    register: (id, url) => {
        if (state.nodes.find(item => item.id == id)) {
            return false
        } else {
            state.nodes.push(NodeAction.generate(id, url));
            return true
        }
    },

    importChain: () => {
        try {
            state.blocks = JSON.parse(fs.readFileSync(state.storagePath, "utf-8"))
        } catch (e) {
            state.blocks = [state.genesisBlock]
        }

        try {
            state.blocks = JSON.parse(fs.readFileSync(state.storagePath, "utf-8"))
        } catch (e) {
            console.log("Error: Failed to read blockchain.")
            state.blocks = [state.genesisBlock]
        } finally {
            BlockChain.verifyChain(state.blocks)
        }
    },
    exportChain: () => {
        fs.writeFileSync(state.storagePath, JSON.stringify(state.blocks), "utf-8")
    },
    consensus: (blockChains) => {
        let maxLength = 0;
        let candidate = -1;
        blockChains.forEach((item, index) => {
            console.log("Doing consensus...", item, BlockChain.verifyChain(item))

            if (item.length < maxLength) {

            } else if (BlockChain.verifyChain(item)) {
                maxLength = item.length;
                candidate = index;
            }
        })
        if (candidate >= 0 && (maxLength >= state.blocks.length || !BlockChain.verifyChain(state.blocks))) {
            state.blocks = [...blockChains[candidate]]
            BlockChain.exportChain()
            return true
        }
        return false
    },
    submitTransaction: (send, rec, val) => {
        state.transactions.push(Transaction.generate(send, rec, val))
    },
    getTransaction: () => {
        return state.transactions
    },
    idPowValid: (pow) => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow
            }
            return new BigNumber(pow).isLessThanOrEqualTo(state.target)
        } catch (e) {
            console.log(e)
            return false
        }
    },
    verifyChain: (blocks) => {
        try {
            if (!blocks.length) {
                throw new Error("Error: Block cannot be empty.");
            }
            
            if (JSON.stringify(state.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("Error: invalid genesis block.");
            }

            blocks.forEach((item, index) => {
                if (index > 0 && item.prevBlock != Block.hash(blocks[index - 1])) {
                    throw new Error("Error: invalid previous block.");
                }
               
                if (index > 0 && !BlockChain.idPowValid(Block.hash(item))) {
                    throw new Error("Error: invalid proof of work.")
                }
            })
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }
    },
    mine: (transactions = []) => {
        let lastBlock = state.blocks[state.blocks.length - 1]

        transactions = [Transaction.generate(REWARD, state.chainId, REWARD_AMOUNT), ...transactions]

        const newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.hash(lastBlock))
        while (true) {
            let sha = Block.hash(newBlock)
            if (BlockChain.idPowValid(sha) || newBlock.nonce > 1000) {
                console.log("A block is mined: ", sha)
                break;
            }
            newBlock.nonce++
        }

        return newBlock;
    },
    createBlock: () => {
        const newBlock = BlockChain.mine(BlockChain.transactions)

        state.blocks.push(newBlock)
        BlockChain.transactions = []
        BlockChain.exportChain()
        return newBlock
    },

    getNodes: () => {
        return state.nodes
    },
    
    getBlocks: () => {
        return state.blocks
    }
}
