# NPVDKG-RS

This repository contains a mathematical presentation and some code to demonstrate our developed non-interactive publicly verifiable distributed key generation and resharing algorithm/protocol.

---

## License

Copyright (c) Fintechlab Kft. All rights reserved.

Licensed under the [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.txt) license.

## Selling exception

If you wish to release a derivative work that is not based on the [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.txt) license, email info@natrix.io for commercial licensing.

## Support

Support is provided based on commercial terms, write an email to info@natrix.io.

---

## Why is it open source?

Because I learnt a lot from the open source community and I would like to give back some new knowledge.
I hope you can use it to build new solutions not just for financial but for the whole word and a "New World Order" can rise.

---

## What is this?

The open blockchain philosophy has already showed that users want the control back. On the other side, almost every day shows us that without supervision of the financial world could lead us to anarchy. This duality is seemingly insoluble, but with new cryptography algorithms can achieve a trustless but supervisioned world.
To this we need a threshold signature scheme, where the keys can be generated and reshared in a "non-interactive publicly verifiable distributed" way.

Distributed Key Generation is a cryptographic algorithm in which multiple parties contribute to the calculation of a shared public and private key set.

Non-interactive means that only one message is sent by each party during the calculation process. No additional communication round needs to check and calculate the private keys.

Publicly Verifiable means not just the involved parties but anyone can check that the key generation process was correct, and the generated private keys can be used to create valid threshold signatures (which belongs to the generated one shared public)

Many distributed key generation protocols are existing already. Usually, they are interactive or not publicly verifiable solutions, but some of them are non-interactive or verifiable. However, none of them are non-interactive, publicly verifiable and only using pairing-based cryptography primitives.

Our goal was to design a Non-interactive Publicly Verifiable Secret sharing solution only using the math behind the BLS (Boneh–Lynn–Shacham). So the solution is very simple and can be implemented very fast almost using any language.

I would like to mention that Ethereum 2.0 is using BLS12-381.

### Math

The math of the algorithm can be found at `./math/NPVDKGRS.pdf`.
The algorithm was peer-reviewed and a preliminary security analysis token place. Later we will discuss more and update a documentation.

**I found a security issue or I just want to talk about it, what can I do?**
If you found some bug or security issue or just would like to discuss about the algorithm, please contact us at info@natrix.io.
Note: this is a second version of the algorithm, the first version contains two separate verification vectors and the verification process much slower.

### BLS12-381

The BLS signature schema and the math behind it are awesome!
For more details check this:
https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-04

It has a few properties (aggregatable, uniqueness and determinism) which seem to be quite unique in signature schemes. Without these properties, secret sharing schemes would not be possible in such a simple way.

## Running the project

1. clone the project

```
git clone https://github.com/natrixofficial/npvdkgrs.git
```

2. install dependencies

```
npm install
```

3. run the demo

```
npm start
```

### The output

The demo output contains 6 parts:

1. Publicly Verifiable Secret Sharing (PVSH) algorithm example
2. Speed test
3. 2-of-3 threshold signature key generation and signing example
4. The previous participants reshares the keys
5. The original members are adding two new members to the original group
6. Keys from part 3-4-5

#### Publicly Verifiable Secret Sharing algorithm

The `sh` is the original secret and `sh'` is the decoded secret.
`ESH` is the cipher text and the verification vector (non-interactive zero knowledge proof)

```
PK : 766af1e437612b2e402898954c451bd525ae894c7215fbb7de36ec71919613e3fb221247aeda46334df9b37a0aed9e192e4f74e9e168a0f9fa66003b9f0411ba4a65b21e5b72e101cc7066ed6f6905900138d71ba08c7f0ca4786e31268ef412
sk : f976b0f1a9408f4658c9c707cf33e927ff3536073bd6fccb9f17a663d3b65e16
PH : 7a06f44b8458ccdffe4752dd76352885e9fc3e5adc5ea68432e20cf7bae3eb5cca187cb9f6e9fb40927cd33b453fa60627c0a8599a4657e5fc83d58d884acc856e935d556cefe3804489c19388123c12d4df62905cb98984bd71ea013d7b5416
sh : cfb24eb61d2030b382fd3a996a9a9cd2725b8a35ca4176bd0851a1f3dbffee37
---------------------------------------------------------------------
sh': cfb24eb61d2030b382fd3a996a9a9cd2725b8a35ca4176bd0851a1f3dbffee37
sh' is valid: true
Verification result: No Error
ESH: 2b1d56b6118790145f2888c6430f401aab99a7cee6360299754ab14f541f3672.d7b191d4db0eb86867b811e0d4679e27c0222ecfac42439609cc8f7c4388fc0d511b96fe750b1de4a793bced6233320305d8edcb0b85ef36ca8d58f1b719f8501370f8f62ed16fcb653b65cf9854b4f83da0311d71bbf8999771a01ef5572400.bb2dd21c680bcc718cd61ec7940bdaf88830ee1e6e14d798fcce8dde3a01b22214eaea0ebc29c07a8bef2e15cae41186
```

#### Speed test of PVSH Encrypt, Verify and Decrypt methods

These test were run on an 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz processor.
Note: these results are based on a Webassembly implementation using JavaScript. Native C library can achieve faster speed. This project is a demonstration only project!

Verification is the slowest because 3 pairing must be calculated!

```
Speed test of PVSH Encrypt
Execution time (20 round): 0s 198.198ms
Execution time (20 round): 0s 200.0879ms
Execution time (40 round): 0s 398.6903ms
Execution time (1 round): 9.967257499999999ms

Speed test of PVSH Encrypt and Verify
Execution time (20 round): 0s 530.4913ms
Execution time (20 round): 0s 529.4681ms
Execution time (40 round): 1s 60.1494ms
Execution time (1 round): 26.503735ms

Speed test of PVSH Encrypt, Verify and Decrypt
Execution time (20 round): 0s 646.7933ms
Execution time (20 round): 0s 642.7067ms
Execution time (40 round): 1s 289.7267ms
Execution time (1 round): 32.2431675ms

Calculated execution time from speed tests
Avg encrypt time: 9.9673ms
Avg verify  time: 16.5365ms
Avg decrypt time: 5.7394ms
```

#### 2-of-3 threshold signature key generation and signing example

```
2-of-3 threshold signature example
All members generating share contribution to generate the threshold keys...
 => Done, average time: 28.307599999999997ms
All members check all contribution and calculate its own keys...
 => Done, average time: 198.86389999999997ms
Test generated keys and create signatures
 => Recovered sig: 51b032ab42d5d0f0cd80247ffb8928eca49dfd963db7792874fa123ea838db70504e4d32c15982d7b0f39ce3974fe797
 => Recovered sig verification result (SigCount=1, threshold=2, total number=3): false
 => Recovered sig: 0c605417e6f8bc427090295142864b2fc8bc0f1f2014a57ab73eb729cff0a3f8624fb9863436b763fae91c1f6e253686
 => Recovered sig verification result (SigCount=2, threshold=2, total number=3): true
```

#### The previous participants reshares the keys

From the previous members are reshare their keys to totally new members and also changes the threshold to 3-of-4 from 2-of-3.

```
3-of-4 threshold signature with resharing to totally new members.
The 't' number of old members generating share contribution to generate the threshold keys...
 => Done, average time: 25.9265ms
All new members check all contribution and calculate its own keys...
 => Done, average time: 240.49406666666667ms
Test newly generated keys and create signatures
 => Recovered sig: 1e90a7b277cb7f39ff289b5c8afd60af9b559001d146fc26694f840020f586363b5341a627e7f0fff346334047519101
 => Recovered sig verification result (SigCount=1, threshold=3, total number=4): false
 => Recovered sig: 208cef66a563a4c720f3d033c29048837d3f51eabd154e3106ec58886cf35c84ed7aec51240171828c7be7f1c7ec4105
 => Recovered sig verification result (SigCount=2, threshold=3, total number=4): false
 => Recovered sig: 0c605417e6f8bc427090295142864b2fc8bc0f1f2014a57ab73eb729cff0a3f8624fb9863436b763fae91c1f6e253686
 => Recovered sig verification result (SigCount=3, threshold=3, total number=4): true
```

#### The original members are adding two new members to the original group

```
4-of-5 threshold signature with resharing to original and added two new members.
The 't' number of old members generating share contribution to generate the threshold keys...
 => Done, average time: 31.615633333333335ms
All new members check all contribution and calculate its own keys...
 => Done, average time: 386.0589ms
Test newly generated keys and create signatures
 => Recovered sig: 723751f26a2c3568e02d25ae3f8d267dfc41bbec4d5da221a4985c3ad0ad5b5a7a5483967410efa77177189185c26110
 => Recovered sig verification result (SigCount=1, threshold=4, total number=5): false
 => Recovered sig: f5c58ca0124614d0bf38372877c77ac0e5049a2d7223581a45e3d656205c5c2d008824b679da33b476985ce614068805
 => Recovered sig verification result (SigCount=2, threshold=4, total number=5): false
 => Recovered sig: c1169f58992ee7c6b85fcba1529c251ac2e09290729e72cb3fc808cc3a6d7340f8b8f7e96dd6b732735ba96ac39f0205
 => Recovered sig verification result (SigCount=3, threshold=4, total number=5): false
 => Recovered sig: 0c605417e6f8bc427090295142864b2fc8bc0f1f2014a57ab73eb729cff0a3f8624fb9863436b763fae91c1f6e253686
 => Recovered sig verification result (SigCount=4, threshold=4, total number=5): true
```

#### Keys from part 3-4-5

You can check that the PG won't change during the key resharing.
Notice the ID-s at part 3 and 5 are the same and part 4 has totally different ID-s.

```
Original members data, only checking purposes (never share any secret key!)
PG: 4e6379003c780cad54feee763a4c6005d2cc4774f33a52eafadd835354e297b2c143117c7d6b8e89bd39f20737843b082f3c104421a3e04d950e833190cc23819326a3b5c79f96bba6e29730122ca719f699d9a59fcd901fd5a4496747f77097
 => id: 483d6d5dc46be1dd291e49768b793cd175804f158c630b99be63b4713b11052c, sh: 5d745372595d8717ab23de839be33703cd435da99227aaf64d4101e900d04619
 => id: c0dd676c50826bc70c77e5fd6b70d0be776b92bbc0e9006e1711c9b6d0951f60, sh: b47d8369d4f7433d1b278a60ea46522577a04f88b6ec35a8c9a42e0ae0209441
 => id: 10ef0457aa7d3e55569348fadd6a80a5caa703277e2c2c42465d7db071dc9f49, sh: ecdeb4280649f84288762ad015b9e1051cc6e862f1b947bd661f7109fd97af4b

New members data, only checking purposes (never share any secret key!)
PG: 4e6379003c780cad54feee763a4c6005d2cc4774f33a52eafadd835354e297b2c143117c7d6b8e89bd39f20737843b082f3c104421a3e04d950e833190cc23819326a3b5c79f96bba6e29730122ca719f699d9a59fcd901fd5a4496747f77097
 => id: ff307bea2ca3f8acefebdf13d33bbf87ed1c279c6c953a58ca9de6228e78e45e, sh: 3b2cd3abbd060f95824810e469e76f40bb5cd722289624f00e64ba6dd3daf01d
 => id: f059f1055eb607ed785ae49704b02a59593c26b9560026b844068c6fe65cd832, sh: b08e96dc42401b8c7356a9765c518fb5dc7e55f46ee294995cffd59c0bf71061
 => id: 56416ef3ff4b4db9050e9cb39f6eb8546e4a1b64656bff8e331b8b96aa429929, sh: 956eed9aeedcdd4beab9a257487dfb24a1341b621b7587251abaf397528bd844
 => id: d19d82cbb4b5257353bfe64797e34bda8e2a6c59bfdfcbae30b8268fe947cb2f, sh: c495172ac1c8ee081ec64591b52fe121baec05ebcbab4ffa2e85dff5c3c8b836

Added new members data, only checking purposes (never share any secret key!)
PG: 4e6379003c780cad54feee763a4c6005d2cc4774f33a52eafadd835354e297b2c143117c7d6b8e89bd39f20737843b082f3c104421a3e04d950e833190cc23819326a3b5c79f96bba6e29730122ca719f699d9a59fcd901fd5a4496747f77097
 => id: 483d6d5dc46be1dd291e49768b793cd175804f158c630b99be63b4713b11052c, sh: f94e897f909960fe349693d1820df7e09de7ea5e8343ead16702860acabd146f
 => id: c0dd676c50826bc70c77e5fd6b70d0be776b92bbc0e9006e1711c9b6d0951f60, sh: 4632bcedc97e60c5c37aa25637ce53f8262f81bd697c6bcea448ff3afcadc83f
 => id: 10ef0457aa7d3e55569348fadd6a80a5caa703277e2c2c42465d7db071dc9f49, sh: ee0f9e6345c5b21a9e6181bd95f257041dd9554f8d1de6a90538c56783a3a85f
 => id: b94def4438700d46d665801b0a4d4f2c3dcf117f756c193bdfa5edc0ca8aba0e, sh: 2145027f6dbf451589059ac1bd28ae234d10e4c1aa9b4e2d154e49ac1d1ef83c
 => id: 167bf4803bba2385d1ac34a0f498e35cdfbe7c61292ce048a320a134d0e61e19, sh: 10dadf5add8d98cf9775651f58a36695d4e0bf53b81222961525aa8d1de91459
```
