import {
  Field,
  CircuitValue,
  prop,
  Poseidon,
  CircuitString,
  MerkleTree,
  MerkleWitness,
} from 'o1js';
import { random_numbers } from './random_numbers.js';


let randomNumbersTree = new MerkleTree(10);
export class RandomNumbersWitness extends MerkleWitness(10) {}

export class RandomNumber extends CircuitValue {
  @prop address: CircuitString;

  constructor(address: CircuitString) {
    super(address);
    this.address = address;
  }

  hash(): Field {
    return Poseidon.hash(this.toFields());
  }
}

export function createRandomNumbersMerkleTree() {
  //generates the merkle tree from the list of nft holders
  for (let i in random_numbers) {
    let thisNumber = new RandomNumber(
      CircuitString.fromString(random_numbers[i])
    );
    randomNumbersTree.setLeaf(BigInt(i), thisNumber.hash());
  }

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  return randomNumbersTree;
}
