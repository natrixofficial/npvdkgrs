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

import { IdType, PublicKeyType, SecretKeyType } from "./bls-wasm_types";

export type HexString = string;

export interface IParticipant {
	id: IdType;
	PK: PublicKeyType;
}

export interface IMember {
	id: IdType;
	sk: SecretKeyType;
	PK: PublicKeyType;
	sh: SecretKeyType | null;
	PH: PublicKeyType | null;
	PG: PublicKeyType | null;
}

export interface IContribution {
	contributorId: HexString; //sender
	contributorPk: HexString;
	contributions: {
		contributeeId: HexString; //receiver
		contributeePk: HexString;
		esh: HexString;
	}[];
	mpkVec: HexString[];
}

export interface ICalculatedShare {
	sh?: string;
	PH?: string;
	PHItems?: { id: string; PH: string }[];
	PG?: string;
	errors: { senderID: string; receiverID: string; reason: string }[];
}
