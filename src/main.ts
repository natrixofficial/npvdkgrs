/**
 * Copyright (C) 2022 Fintechlab Kft.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

import * as mcl from "mcl-wasm";
import * as bls from "bls-wasm";
import { Fp2, Fr } from "mcl-wasm";
import { Id, SecretKey, Signature, deserializeHexStrToPublicKey, deserializeHexStrToSecretKey } from "bls-wasm";
import { IdType, SignatureType } from "./bls-wasm_types";

import { IContribution, IMember } from "./model";
import { PVSHEncode, PVSHVerify, PVSHDecode, runSpeedCheck } from "./pvsh";
import { calculateContribution, calculateMyKey } from "./npvdkgrs";

async function main(): Promise<void> {
	console.log(
		"\x1b[32m%s\x1b[0m",
		" ______   ______   _    _  _____    _    _   ______       ______      _    \n" +
			"|  ___ \\ (_____ \\ | |  | |(____ \\  | |  / ) / _____)     (_____ \\    | |   \n" +
			"| |   | | _____) )| |  | | _   \\ \\ | | / / | /  ___  ___  _____) )    \\ \\  \n" +
			"| |   | ||  ____/  \\ \\/ / | |   | || |< <  | | (___)(___)(_____ (      \\ \\ \n" +
			"| |   | || |        \\  /  | |__/ / | | \\ \\ | \\____/|           | | _____) )\n" +
			"|_|   |_||_|         \\/   |_____/  |_|  \\_) \\_____/            |_|(______/ \n",
	);

	await runPVSHExample();
	runNPVDKGRSExample();
}

async function runPVSHExample(): Promise<void> {
	await mcl.init(mcl.BLS12_381);
	await bls.init(bls.BLS12_381);
	mcl.setETHserialization(false); // Ethereum serialization is off
	//mcl.setMapToMode(mcl.IRTF); // for G2.setHashOf(msg)

	const tmp = new Fp2();
	tmp.setInt(1, 0); //use this for BLS12-384 default specification
	//tmp.setInt(1, 20130831); //use this just for fun
	//tmp.setInt(93_443_160_598_893, 1_198_091_881); //use this just for fun
	const g2 = tmp.mapToG2();

	const id = new Fr();
	id.setByCSPRNG();

	const sk = new Fr();
	sk.setByCSPRNG();
	const PK = mcl.mul(g2, sk);

	const sh = new Fr();
	sh.setByCSPRNG();
	const PH = mcl.mul(g2, sh);

	const ESH = PVSHEncode(id, PK, sh, g2);
	const verificationResult = PVSHVerify(id, PK, PH, ESH, g2);
	const decodedSh = PVSHDecode(id, PK, sk, ESH);

	console.log(`PK : ${PK.serializeToHexStr()}`);
	console.log(`sk : ${sk.serializeToHexStr()}`);
	console.log(`PH : ${PH.serializeToHexStr()}`);
	console.log(`sh : ${sh.serializeToHexStr()}`);
	console.log("---------------------------------------------------------------------");
	console.log(`sh': ${decodedSh.serializeToHexStr()}`);
	console.log(`sh' is valid: ${decodedSh.isEqual(sh)}`);
	console.log(`Verification result: ${verificationResult || "No Error"}`);
	console.log(`ESH: ${ESH}`);
	console.log("---------------------------------------------------------------------");

	runSpeedCheck(40, 20, g2);
}

function runNPVDKGRSExample(): void {
	const n = 3;
	const t = 2;

	console.log("---------------------------------------------------------------------\n");

	console.log(`${t}-of-${n} threshold signature example`);
	const tmp = new Fp2();
	tmp.setInt(1, 0); //use this for BLS12-384 default specification
	//tmp.setInt(19820812, 20130831); //use this just for fun
	//tmp.setInt(93_443_160_598_893, 1_198_091_881); //use this just for fun
	const g2 = tmp.mapToG2();

	//create pariticipants
	const members: IMember[] = [];

	const publicConstributions: IContribution[] = [];

	for (let i = 0; i < n; i++) {
		const id = new Id();
		id.setByCSPRNG();
		const sk = new SecretKey();
		sk.setByCSPRNG();
		members.push({ id: id, sk: sk, PK: sk.getPublicKey(), PG: null, sh: null, PH: null });
	}

	//each member knows the participants...
	const participants = members.map((item) => {
		return { id: item.id, PK: item.PK };
	});

	//Each member creates a contribution
	console.log("All members generating share contribution to generate the threshold keys...");
	let hrstart = process.hrtime();
	for (const member of members) {
		publicConstributions.push(calculateContribution(n, t, member.id, member.PK, null, participants, g2));
	}
	let hrend = process.hrtime(hrstart);
	let avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	//Each member calculate its own key
	console.log("All members check all contribution and calculate its own keys...");
	hrstart = process.hrtime();
	for (const member of members) {
		const calculatedKey = calculateMyKey(publicConstributions, member.id, member.sk, g2);
		//console.log(JSON.stringify(aaa, null, 2));
		if (calculatedKey.sh && calculatedKey.PH && calculatedKey.PG) {
			member.sh = deserializeHexStrToSecretKey(calculatedKey.sh);
			member.PH = deserializeHexStrToPublicKey(calculatedKey.PH);
			member.PG = deserializeHexStrToPublicKey(calculatedKey.PG);
		}
	}
	hrend = process.hrtime(hrstart);
	avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	console.log("Test generated keys and create signatures");
	const msg = "NPVDKGRS is awsome!";
	const sigs: { id: IdType; sig: SignatureType }[] = [];
	//each member creates contribution to the NPVDKGRS
	while (sigs.length < t) {
		const idx = Math.floor(Math.random() * members.length);
		if (sigs.some((item) => item.id.isEqual(members[idx].id))) {
			continue;
		}
		const sig = members[idx].sh?.sign(msg); // new Signature();
		if (sig) {
			sigs.push({
				id: members[idx].id.clone(),
				sig: sig,
			});
		}
		const finalSig = new Signature();
		finalSig.recover(
			sigs.map((item) => item.sig),
			sigs.map((item) => item.id),
		);
		const sigVerified = members[0].PG?.verify(finalSig, msg);
		console.log(` => Recovered sig: ${finalSig.serializeToHexStr()}`);
		console.log(
			` => Recovered sig verification result (SigCount=${sigs.length}, threshold=${t}): ${Boolean(sigVerified)}`,
		);
	}

	/**
	 * Test resharing to totally new members
	 */
	console.log("---------------------------------------------------------------------\n");

	console.log(`${t + 1}-of-${n + 1} threshold signature with resharing to totally new members.`);
	const newMembers: IMember[] = [];

	publicConstributions.splice(0);

	for (let i = 0; i < n + 1; i++) {
		const id = new Id();
		id.setByCSPRNG();
		const sk = new SecretKey();
		sk.setByCSPRNG();
		newMembers.push({ id: id, sk: sk, PK: sk.getPublicKey(), PG: null, sh: null, PH: null });
	}

	//each member knows the participants...
	const newParticipants = newMembers.map((item) => {
		return { id: item.id, PK: item.PK };
	});

	//Each member creates a contribution
	console.log("The 't' number of old members generating share contribution to generate the threshold keys...");
	//NOTE: not all old member is necessare to reshare, t number of old members is enough
	hrstart = process.hrtime();
	while (publicConstributions.length < t) {
		const idx = Math.floor(Math.random() * members.length);
		if (publicConstributions.some((item) => item.contributorId === members[idx].id.serializeToHexStr())) {
			continue;
		}
		publicConstributions.push(
			calculateContribution(n + 1, t + 1, members[idx].id, members[idx].PK, members[idx].sh, newParticipants, g2),
		);
	}
	hrend = process.hrtime(hrstart);
	avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	//Each member calculate its own key
	console.log("All new members check all contribution and calculate its own keys...");
	hrstart = process.hrtime();
	for (const newMember of newMembers) {
		const calculatedKey = calculateMyKey(publicConstributions, newMember.id, newMember.sk, g2);
		if (calculatedKey.sh && calculatedKey.PH && calculatedKey.PG) {
			newMember.sh = deserializeHexStrToSecretKey(calculatedKey.sh);
			newMember.PH = deserializeHexStrToPublicKey(calculatedKey.PH);
			newMember.PG = deserializeHexStrToPublicKey(calculatedKey.PG);
		}
	}
	hrend = process.hrtime(hrstart);
	avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	console.log("Test newly generated keys and create signatures");
	const newSigs: { id: IdType; sig: SignatureType }[] = [];
	//each member creates contribution to the NPVDKGRS
	while (newSigs.length < t + 1) {
		const idx = Math.floor(Math.random() * newMembers.length);
		if (newSigs.some((item) => item.id.isEqual(newMembers[idx].id))) {
			continue;
		}
		const sig = newMembers[idx].sh?.sign(msg); // new Signature();
		if (sig) {
			newSigs.push({
				id: newMembers[idx].id.clone(),
				sig: sig,
			});
		}
		const finalSig = new Signature();
		finalSig.recover(
			newSigs.map((item) => item.sig),
			newSigs.map((item) => item.id),
		);
		const sigVerified = newMembers[0].PG?.verify(finalSig, msg);
		console.log(` => Recovered sig: ${finalSig.serializeToHexStr()}`);
		console.log(
			` => Recovered sig verification result (SigCount=${newSigs.length}, threshold=${t + 1}): ${Boolean(sigVerified)}`,
		);
	}

	/**
	 * Test resharing adding new members
	 */
	console.log("---------------------------------------------------------------------\n");

	console.log(`${t + 2}-of-${n + 2} threshold signature with resharing to original and added two new members.`);
	const addedNewMembers: IMember[] = [];

	publicConstributions.splice(0);

	//Copy original members
	for (let i = 0; i < members.length; i++) {
		const member = members[i];
		addedNewMembers.push({
			id: member.id.clone(),
			sk: member.sk.clone(),
			PK: member.PK.clone(),
			PG: null,
			sh: null,
			PH: null,
		});
	}
	//Add two new members
	for (let i = 0; i < 2; i++) {
		const id = new Id();
		id.setByCSPRNG();
		const sk = new SecretKey();
		sk.setByCSPRNG();
		addedNewMembers.push({ id: id, sk: sk, PK: sk.getPublicKey(), PG: null, sh: null, PH: null });
	}

	//each member knows the participants...
	const addedNewParticipants = addedNewMembers.map((item) => {
		return { id: item.id, PK: item.PK };
	});

	//Each member creates a contribution
	console.log("The 't' number of old members generating share contribution to generate the threshold keys...");
	//NOTE: not all old member is necessare to reshare, t number of old members is enough
	hrstart = process.hrtime();
	while (publicConstributions.length < t) {
		const idx = Math.floor(Math.random() * members.length);
		if (publicConstributions.some((item) => item.contributorId === members[idx].id.serializeToHexStr())) {
			continue;
		}
		publicConstributions.push(
			calculateContribution(n + 2, t + 2, members[idx].id, members[idx].PK, members[idx].sh, addedNewParticipants, g2),
		);
	}
	hrend = process.hrtime(hrstart);
	avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	//Each member calculate its own key
	console.log("All new members check all contribution and calculate its own keys...");
	hrstart = process.hrtime();
	for (const newMember of addedNewMembers) {
		const calculatedKey = calculateMyKey(publicConstributions, newMember.id, newMember.sk, g2);
		if (calculatedKey.sh && calculatedKey.PH && calculatedKey.PG) {
			newMember.sh = deserializeHexStrToSecretKey(calculatedKey.sh);
			newMember.PH = deserializeHexStrToPublicKey(calculatedKey.PH);
			newMember.PG = deserializeHexStrToPublicKey(calculatedKey.PG);
		}
	}
	hrend = process.hrtime(hrstart);
	avg = (hrend[0] * 1000 + hrend[1] / 1000000) / members.length;
	console.log(` => Done, avarage time: ${avg}ms`);

	console.log("Test newly generated keys and create signatures");
	const addedNewSigs: { id: IdType; sig: SignatureType }[] = [];
	//each member creates contribution to the NPVDKGRS
	while (addedNewSigs.length < t + 2) {
		const idx = Math.floor(Math.random() * addedNewMembers.length);
		if (addedNewSigs.some((item) => item.id.isEqual(addedNewMembers[idx].id))) {
			continue;
		}
		const sig = addedNewMembers[idx].sh?.sign(msg); // new Signature();
		if (sig) {
			addedNewSigs.push({
				id: addedNewMembers[idx].id.clone(),
				sig: sig,
			});
		}
		const finalSig = new Signature();
		finalSig.recover(
			addedNewSigs.map((item) => item.sig),
			addedNewSigs.map((item) => item.id),
		);
		const sigVerified = addedNewMembers[0].PG?.verify(finalSig, msg);
		console.log(` => Recovered sig: ${finalSig.serializeToHexStr()}`);
		console.log(
			` => Recovered sig verification result (SigCount=${addedNewSigs.length}, threshold=${t + 2}): ${Boolean(
				sigVerified,
			)}`,
		);
	}

	console.log("---------------------------------------------------------------------\n");
	console.log("Original members data, only checking purposes (never share any secret key!)");
	console.log(`PG: ${members[0].PG?.serializeToHexStr()}`);
	for (const origMember of members) {
		console.log(` => id: ${origMember.id.serializeToHexStr()}, sh: ${origMember.sh?.serializeToHexStr()}`);
		// console.log(` => sh: ${oldMember.sh?.serializeToHexStr()}`);
	}
	console.log("\nNew members data, only checking purposes (never share any secret key!)");
	console.log(`PG: ${newMembers[0].PG?.serializeToHexStr()}`);
	for (const newMember of newMembers) {
		console.log(` => id: ${newMember.id.serializeToHexStr()}, sh: ${newMember.sh?.serializeToHexStr()}`);
		// console.log(` => sh: ${newember.sh?.serializeToHexStr()}`);
	}
	console.log("\nAdded new members data, only checking purposes (never share any secret key!)");
	console.log(`PG: ${addedNewMembers[0].PG?.serializeToHexStr()}`);
	for (const newMember of addedNewMembers) {
		console.log(` => id: ${newMember.id.serializeToHexStr()}, sh: ${newMember.sh?.serializeToHexStr()}`);
		// console.log(` => sh: ${newember.sh?.serializeToHexStr()}`);
	}
}

main().catch((error) => {
	console.log(error);
});
