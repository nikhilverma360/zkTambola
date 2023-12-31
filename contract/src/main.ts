import {
  Tambola,
  RandomNumber,
  RandomNumbersWitness,
  createRandomNumbersMerkleTree,
} from './Tambola.js';
// import {
//   RandomNumber,
//   RandomNumbersWitness,
//   createRandomNumbersMerkleTree,
// } from './utils.js';
import { Mina, PrivateKey, AccountUpdate, CircuitString, Field } from 'o1js';

const useProof = false;
const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const { privateKey: deployerKey, publicKey: deployerAccount } =
  Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } =
  Local.testAccounts[1];

//               The Local Deployment
// ----------------------------------------------------

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

const zkAppInstance = new Tambola(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

const commitment1 = zkAppInstance.commitmentRandomnumbers.get();
console.log('Root after init:', commitment1.toString());
// ----------------------------------------------------

//                The Transaction 1 
// ----------------------------------------------------
console.log('----------Initiating Transaction 1---------------')
const randomNumbersTree = createRandomNumbersMerkleTree();
let w = randomNumbersTree.getWitness(BigInt(0));
let witness = new RandomNumbersWitness(w);
const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.validateRandomNumber(
    new RandomNumber(
      CircuitString.fromString('0x00bd58530a64b04f552f2f6a8319e91d70f6b12b')
    ),
    witness
  );
});

console.log('Creating an execution proof...');
let time0 = Date.now();
await txn1.prove();
let time1 = Date.now();
console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
await txn1.sign([senderKey]).send();

console.log('after transaction : ', txn1.toPretty());

// ----------------------------------------------------

// ----------------------------------------------------

//                The Transaction 2 
// ----------------------------------------------------
console.log('----------Initiating Transaction 2---------------')
const txn2 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.updateRandomList(
    Field(randomNumbersTree.getRoot()),
  );
});

console.log('Creating an execution proof...');
let time2 = Date.now();
await txn2.prove();
let time3 = Date.now();
console.log('creating proof took', (time2 - time3) / 1e3, 'seconds');
await txn2.sign([senderKey]).send();

console.log('after transaction : ', txn1.toPretty());

// ----------------------------------------------------

console.log('Shutting down');
