import { BlockChain } from "./blockChain"

// Test 1
const testMine = () => {
    BlockChain.init(1000)
    BlockChain.submitTransaction("aa", "bb", 100)
    BlockChain.submitTransaction("cc", "dd", 200)
    BlockChain.mine(BlockChain.getTransaction())
}

testMine();