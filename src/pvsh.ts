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
import { Fr, G2 } from "mcl-wasm";

function _appendBuffer(buffer1: ArrayBufferLike, buffer2: ArrayBufferLike): Uint8Array {
	const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	return tmp;
}

export function PVSHEncode(id: Fr, PK: G2, sh: Fr, g2: G2): string {
	//Algorithm 1)
	const r = new mcl.Fr();
	r.setByCSPRNG();

	//Algorithm 2)
	const Q = mcl.hashAndMapToG1(_appendBuffer(id.serialize(), PK.serialize()));

	//Algorithm 3)
	const e = mcl.pairing(Q, mcl.mul(PK, r));
	const eh = mcl.hashToFr(e.serialize());

	e.clear();
	//Algorithm 4)
	const c = mcl.add(sh, eh);
	//Algorithm 5)
	const U = mcl.mul(g2, r);

	//Algorithm 6)
	const H = mcl.hashAndMapToG1(`${Q.serializeToHexStr()}.${c.serializeToHexStr()}.${U.serializeToHexStr()}`);
	//Algorithm 7)
	const V = mcl.mul(H, mcl.div(eh, r));
	eh.clear();

	//Algorithm 8)
	const resultStr = `${c.serializeToHexStr()}.${U.serializeToHexStr()}.${V.serializeToHexStr()}`;

	r.clear();
	Q.clear();
	c.clear();
	U.clear();
	V.clear();

	return resultStr;
}

export function PVSHVerify(id: Fr, PK: G2, PH: G2, ESH: string, g2: G2): string {
	//Deserialize necessary values from ESH
	const ESHArray = ESH.split(".");
	if (ESHArray.length != 3) {
		throw Error("Invalid ESH");
	}

	const c = mcl.deserializeHexStrToFr(ESHArray[0]);
	const U = mcl.deserializeHexStrToG2(ESHArray[1]);
	const V = mcl.deserializeHexStrToG1(ESHArray[2]);

	//Algorithm 1) //in real implementation Q is an input parameter...
	const Q = mcl.hashAndMapToG1(_appendBuffer(id.serialize(), PK.serialize()));

	//Algorithm 2)
	const H = mcl.hashAndMapToG1(`${Q.serializeToHexStr()}.${ESHArray[0]}.${ESHArray[1]}`);

	//Algorithm 3)
	const e1 = mcl.pairing(H, mcl.mul(g2, c));
	const e2 = mcl.mul(mcl.pairing(H, PH), mcl.pairing(V, U));
	//Algorithm 4)
	if (!e1.isEqual(e2)) {
		return "Inconsistent (c, U, V)!";
	}

	return "";
}

export function PVSHDecode(id: Fr, PK: G2, sk: Fr, ESH: string): Fr {
	const ESHArray = ESH.split(".");
	if (ESHArray.length != 3) {
		throw Error("Invalid ESH");
	}

	const c = mcl.deserializeHexStrToFr(ESHArray[0]);
	const U = mcl.deserializeHexStrToG2(ESHArray[1]);

	//Algorithm 1)
	const Q = mcl.hashAndMapToG1(_appendBuffer(id.serialize(), PK.serialize()));

	//Algorithm 2)
	const e = mcl.pairing(mcl.mul(Q, sk), U);
	const eh = mcl.hashToFr(e.serialize());
	//Algorithm 3)
	const sh = mcl.sub(c, eh);

	return sh;
}

function speedCheckGeneric(maxCount: number, partialCount: number, breakOnError: boolean, func: () => void): number {
	const hrstart = process.hrtime();
	let hrend = process.hrtime(hrstart);
	let hrstartStep = process.hrtime();
	for (let i = 1; i <= maxCount; i++) {
		try {
			func();
		} catch (error) {
			console.log(error);
			if (breakOnError) {
				break;
			}
		}
		if (i % partialCount === 0) {
			hrend = process.hrtime(hrstartStep);
			console.info(`Execution time (${partialCount} round): %ds %dms`, hrend[0], hrend[1] / (1000 * 1000));
			hrstartStep = process.hrtime();
		}
	}
	hrend = process.hrtime(hrstart);
	const avg = (hrend[0] * 1000 + hrend[1] / (1000 * 1000)) / maxCount;
	console.info(`Execution time (${maxCount} round): %ds %dms`, hrend[0], hrend[1] / (1000 * 1000));
	console.info("Execution time (1 round): %fms", avg);
	return avg;
}

function speedCheck_PVSH_Full(maxCount: number, partialCount: number, breakOnError: boolean, g2: G2): number {
	console.log("\nSpeed test of PVSH Encrypt, Verify and Decrypt ");
	return speedCheckGeneric(maxCount, partialCount, breakOnError, () => {
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
		if (verificationResult || !decodedSh.isEqual(sh)) {
			console.log("B");
		}
	});
}

function speedCheck_PVSH_Without_Decrypt(
	maxCount: number,
	partialCount: number,
	breakOnError: boolean,
	g2: G2,
): number {
	console.log("\nSpeed test of PVSH Encrypt and Verify ");
	return speedCheckGeneric(maxCount, partialCount, breakOnError, () => {
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
		// const decodedSh = PVSHDecode(sk, ESH, g2);
		if (verificationResult) {
			// if (verificationResult || !decodedSh.isEqual(sh)) {
			console.log("B");
		}
	});
}

function speedCheck_PVSH_Without_Verify(maxCount: number, partialCount: number, breakOnError: boolean, g2: G2): number {
	console.log("\nSpeed test of PVSH Encrypt");
	return speedCheckGeneric(maxCount, partialCount, breakOnError, () => {
		const id = new Fr();
		id.setByCSPRNG();
		const sk = new Fr();
		sk.setByCSPRNG();
		const PK = mcl.mul(g2, sk);

		const sh = new Fr();
		sh.setByCSPRNG();
		const PH = mcl.mul(g2, sh);

		const ESH = PVSHEncode(id, PK, sh, g2);
		if (!PH || !ESH) {
			// if (verificationResult || !decodedSh.isEqual(sh)) {
			console.log("B");
		}
	});
}

export function runSpeedCheck(maxCount: number, partialCount: number, g2: G2): void {
	const encrypt = speedCheck_PVSH_Without_Verify(maxCount, partialCount, true, g2);
	const encryptVerify = speedCheck_PVSH_Without_Decrypt(maxCount, partialCount, true, g2);
	const full = speedCheck_PVSH_Full(maxCount, partialCount, true, g2);
	console.log("\nCalculated execution time from speed tests");
	console.log(`Avg encrypt time: ${Math.round(encrypt * 10000) / 10000}ms`);
	console.log(`Avg verify  time: ${Math.round((encryptVerify - encrypt) * 10000) / 10000}ms`);
	console.log(`Avg decrypt time: ${Math.round((full - encryptVerify) * 10000) / 10000}ms`);
}
