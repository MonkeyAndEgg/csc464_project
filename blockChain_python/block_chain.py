import hashlib
from argparse import ArgumentParser
from time import time, sleep
from urllib.parse import urlparse
from uuid import uuid4

import requests
from flask import json, Flask, jsonify, request


class BlockChain:
    def __init__(self):
        self.chain = []
        self.current_transaction_log = []
        self.nodes = set()

        self.add_new_block(proof=100, prev_hash=1)

    def consensus(self) -> bool:
        temp_nodes = self.nodes
        max_len = len(self.chain)
        curr_chain = self.chain

        for node in temp_nodes:
            res = requests.get(f'http://{node}/chain')

            if res.status_code == 200:
                length = res.json()['length']
                chain = res.json()['chain']

                if length > max_len and self.check_chain(chain):
                    max_len = length
                    curr_chain = chain

        if curr_chain:
            self.chain = curr_chain
            return True
        return False

    def check_chain(self, chain) -> bool:
        temp_block = chain[0]
        index = 1

        while index < len(chain):
            block = chain[index]

            if block['prev_hash'] != self.hash(temp_block):
                return False

            if not self.valid_proof(temp_block['proof'], block['proof']):
                return False

            temp_block = block
            index += 1

        return True

    def add_new_block(self, proof, prev_hash = None):
        block = {
            'index': len(self.chain) + 1,
            'timestamp': time(),
            'transactions': self.current_transaction_log,
            'proof': proof,
            'prev_hash': prev_hash or self.hash(self.chain[-1])
        }
        self.current_transaction_log = []
        self.chain.append(block)

        return block

    def add_node(self, address: str):
        parsed_url = urlparse(address)
        self.nodes.add(parsed_url.netloc)

    def add_new_transaction(self, sender, receiver, amount):
        self.current_transaction_log.append(
            {
                'sender': sender,
                'receiver': receiver,
                'amount': amount
            }
        )
        return self.latest_block['index'] + 1

    @staticmethod
    def hash(block):
        block_str = json.dumps(block, sort_keys=True).encode()

        return hashlib.sha256(block_str).hexdigest()

    def work_proof(self, last_proof: int) -> int:
        proof = 0
        while self.valid_proof(last_proof, proof) is False:
            proof += 1
        print (proof)
        return proof

    def valid_proof(self, last_proof: int, proof: int) -> bool:
        verify = f'{last_proof}{proof}'.encode()
        verify_hash = hashlib.sha256(verify).hexdigest()
        target = 2 ** (256 - 1)
        target_hash = hashlib.sha256(f'{target}'.encode()).hexdigest()

        if verify_hash <= target_hash:
            return True
        else:
            return False

    @property
    def latest_block(self):
        return self.chain[-1]


# initial flask server
app = Flask(__name__)
# initial BlockChain
blockchain = BlockChain()

node_id = str(uuid4()).replace('-', '')

# ========================= routers ===========================
@app.route('/nodes/add', methods=['POST'])
def add_nodes():
    result = request.get_json()

    nodes = result.get("nodes")

    if nodes is None:
        return "Invalid list of nodes.", 400

    for node in nodes:
        blockchain.add_node(node)

    res = {
        "message": "Nodes are added.",
        "total_nodes": list(blockchain.nodes)
    }

    return jsonify(res), 201


@app.route('/tran/new', methods=['POST'])
def new_tran():
    result = request.get_json()
    attributes_require = ["sender", "receiver", "amount"]

    if result is None:
        print('hello')
        return "Incomplete transaction info", 400

    if not all(attr in result for attr in attributes_require):
        print('hello2')
        return "Incomplete transaction info", 400

    index = blockchain.add_new_transaction(result['sender'], result['receiver'], result['amount'])

    response = {"message": f'The current transaction is added to  #{index} block'}
    return jsonify(response), 201

@app.route('/mine', methods=['GET'])
def mine():
    prev_block = blockchain.latest_block
    prev_proof = prev_block['proof']
    proof = blockchain.work_proof(prev_proof)

    # award the miner
    blockchain.add_new_transaction(sender="0", receiver=node_id, amount=1)

    block = blockchain.add_new_block(proof, None)

    response = {
        "message": "New block added",
        "index": block['index'],
        "transactions": block['transactions'],
        "proof": block['proof'],
        "prev_hash": block['prev_hash']
    }

    return jsonify(response), 200

@app.route('/nodes/consensus', methods=['GET'])
def consensus():
    is_updated = blockchain.consensus()

    if is_updated:
        res = {
            'msg': 'The chain is updated.',
            'curr_chain': blockchain.chain
        }
    else:
        res = {
            'msg': 'The chain is the latest. Nothing updated.',
            'curr_chain': blockchain.chain
        }
    return jsonify(res), 200

@app.route('/chain', methods=['GET'])
def get_chain():
    response = {
        'chain': blockchain.chain,
        'length': len(blockchain.chain)
    }
    return jsonify(response), 200
# =============================================================

if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('-p', '--port', default=8000, type=int, help="port number")

    args = parser.parse_args()
    port = args.port

    app.run(host='0.0.0.0', port=port)