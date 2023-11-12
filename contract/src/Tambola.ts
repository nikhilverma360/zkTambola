import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Poseidon,
  CircuitValue,
  prop,
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
  for (let i in random_numbers) {
    let thisNumber = new RandomNumber(
      CircuitString.fromString(random_numbers[i])
    );
    randomNumbersTree.setLeaf(BigInt(i), thisNumber.hash());
  }

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  return randomNumbersTree;
}

export class Tambola extends SmartContract {
  @state(Field) commitmentRandomnumbers = State<Field>();

  init() {
    super.init();

    //store the root of the merkle tree in the app state
    this.commitmentRandomnumbers.set(createRandomNumbersMerkleTree().getRoot());
  }
  @method updateRandomList(RandomListRoot: Field) {
    let commitment = this.commitmentRandomnumbers.get();
    this.commitmentRandomnumbers.assertEquals(commitment);

    this.commitmentRandomnumbers.set(RandomListRoot);
  }

  @method validateRandomNumber(
    randomNumber: RandomNumber,
    path: RandomNumbersWitness
  ) {
    let commitment = this.commitmentRandomnumbers.get();
    this.commitmentRandomnumbers.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    path
      .calculateRoot(Poseidon.hash(randomNumber.toFields()))
      .assertEquals(commitment);
  }
}
