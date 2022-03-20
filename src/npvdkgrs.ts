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
import { Id, PublicKey, SecretKey, deserializeHexStrToPublicKey, deserializeHexStrToSecretKey } from "bls-wasm";
import { IdType, PublicKeyType, SecretKeyType } from "./bls-wasm_types";
import { PVSHDecode, PVSHEncode, PVSHVerify } from "./pvsh";
import { HexString, ICalculatedShare, IContribution, IParticipant } from "./model";

export function calculateContribution(
	n: number,
	t: number,
	meID: IdType,
	mePK: PublicKeyType,
	oldSh: SecretKeyType | null,
	participants: IParticipant[],
	g2: mcl.G2,
): IContribution {
	//
	if (participants.length !== n) {
		throw new Error("Participants count mismath!");
	}
	if (t > n) {
		throw new Error("The 't' cannot be grater then 'n'!");
	}
	const mskVec: SecretKeyType[] = [];
	const mpkVec: HexString[] = [];
	//Algorithm 1)
	if (oldSh) {
		mskVec.push(oldSh);
		mpkVec.push(oldSh.getPublicKey().serializeToHexStr());
	}

	while (mskVec.length < t) {
		const sk = new SecretKey();
		sk.setByCSPRNG();
		mskVec.push(sk);
		mpkVec.push(sk.getPublicKey().serializeToHexStr());
	}

	const result: IContribution = {
		contributorId: meID.serializeToHexStr(),
		contributorPk: mePK.serializeToHexStr(),
		contributions: [],
		mpkVec: mpkVec,
	};

	//Algorithm 2)
	for (const participant of participants) {
		const sh = new SecretKey();
		sh.share(mskVec, participant.id);
		const esh = PVSHEncode(
			mcl.deserializeHexStrToFr(participant.id.serializeToHexStr()),
			mcl.deserializeHexStrToG2(participant.PK.serializeToHexStr()),
			mcl.deserializeHexStrToFr(sh.serializeToHexStr()),
			g2,
		);
		result.contributions.push({
			contributeeId: participant.id.serializeToHexStr(),
			contributeePk: participant.PK.serializeToHexStr(),
			esh: esh,
		});
	}

	//Retrun...

	return result;
}

export function calculateMyKey(
	contributions: IContribution[],
	meID: IdType,
	meSK: SecretKeyType,
	g2: mcl.G2,
): ICalculatedShare {
	const errors: { senderID: string; receiverID: string; reason: string }[] = [];

	const PHForAll: {
		id: IdType; //Receiver ID
		sh: SecretKeyType; //Recovered Secret Share for me
		shItems: SecretKeyType[]; //Received Secret Share for me
		PH: PublicKeyType; //Recovered Public key for all Receiver ID
		PHItems: PublicKeyType[]; //Received Public Share for all
		ContributorIds: IdType[]; //Sender IDs of the the Shares (SHk and PHk)
	}[] = [];

	const PG = new PublicKey();
	PG.clear();

	// const SHme = new bls.SecretKey();
	for (let i = 0; i < contributions.length; i++) {
		const shareItem = contributions[i];
		const contributorId = new Id();
		contributorId.deserializeHexStr(shareItem.contributorId);
		const PGi = shareItem.mpkVec.map((PGiStr) => deserializeHexStrToPublicKey(PGiStr));
		for (let i = 0; i < shareItem.contributions.length; i++) {
			const contribution = shareItem.contributions[i];
			//Algorithm 2) create PHik
			const IDik = new Id();
			IDik.deserializeHexStr(contribution.contributeeId);
			const PHik = new PublicKey();
			PHik.share(PGi, IDik);
			//Algorithm 3) verify all contribution
			const reason = PVSHVerify(
				mcl.deserializeHexStrToFr(contribution.contributeeId),
				mcl.deserializeHexStrToG2(contribution.contributeePk),
				mcl.deserializeHexStrToG2(PHik.serializeToHexStr()),
				contribution.esh,
				g2,
			);
			if (reason) {
				errors.push({ senderID: shareItem.contributorId, receiverID: contribution.contributeeId, reason: reason });
			}
			if (errors.length > 0) {
				continue;
			}

			//Collect all PHik and IDik
			//later this will be used to recover PH
			let PHItem = PHForAll.find((item) => item.id.isEqual(IDik));
			if (!PHItem) {
				//create an empty
				PHItem = {
					id: IDik.clone(),
					sh: new SecretKey(),
					shItems: [],
					PH: new PublicKey(),
					PHItems: [],
					ContributorIds: [],
				};
				PHForAll.push(PHItem);
			}
			//save share and id
			PHItem.PHItems.push(PHik);
			PHItem.ContributorIds.push(contributorId);

			//if the contribution is generated for me
			if (meID.isEqual(IDik)) {
				//Algorithm 4) Decode share
				const SHikFr = PVSHDecode(
					mcl.deserializeHexStrToFr(contribution.contributeeId),
					mcl.deserializeHexStrToG2(contribution.contributeePk),
					mcl.deserializeHexStrToFr(meSK.serializeToHexStr()),
					contribution.esh,
				);
				//save share
				PHItem.shItems.push(deserializeHexStrToSecretKey(SHikFr.serializeToHexStr()));
			}
		}
	}

	if (errors.length > 0) {
		return { errors: errors };
	}

	for (let i = 0; i < PHForAll.length; i++) {
		//Algorith 6) recover PH from PHItem
		const PHItem = PHForAll[i];
		PHItem.PH.recover(PHItem.PHItems, PHItem.ContributorIds);
		//if SHs exists then recover SH (aka SH for me))
		if (PHItem.shItems.length > 0) {
			//Algorithm 5) recover SH
			PHItem.sh.recover(PHItem.shItems, PHItem.ContributorIds);
			if (!PHItem.sh.getPublicKey().isEqual(PHItem.PH)) {
				errors.push({ senderID: "NA", receiverID: PHItem.id.serializeToHexStr(), reason: "INVALID_SH_PH_FOR_ME" });
			}
		}
	}
	//Algorith 7) Recover global public key
	PG.recover(
		PHForAll.map((item) => item.PH),
		PHForAll.map((item) => item.id),
	);

	//Return result
	const mePH = PHForAll.find((item) => item.id.isEqual(meID));
	const result: ICalculatedShare = {
		sh: mePH?.sh.serializeToHexStr(),
		PH: mePH?.PH.serializeToHexStr(),
		PHItems: PHForAll.map((item) => {
			return { id: item.id.serializeToHexStr(), PH: item.PH.serializeToHexStr() };
		}),
		PG: PG.serializeToHexStr(),
		errors: errors,
	};
	return result;
}
