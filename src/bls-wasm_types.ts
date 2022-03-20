//declare module "bls-wasm";

declare class Common {
	constructor(size: number);

	deserializeHexStr(s: string): void;
	serializeToHexStr(): string;
	dump(msg?: string): void;
	clear(): void;
	clone(): this;
	isEqual(rhs: this): boolean;
	deserialize(v: Uint8Array): void;
	serialize(): Uint8Array;
	add(rhs: this): void;
}

export declare class Fr extends Common {
	constructor();

	setInt(x: number): void;
	deserialize(s: Uint8Array): void;
	serialize(): Uint8Array;
	setStr(s: string): void;
	getStr(): string;
	isZero(): boolean;
	isOne(): boolean;
	isEqual(rhs: this): boolean;
	setLittleEndian(a: Uint8Array): void;
	setLittleEndianMod(a: Uint8Array): void;
	setByCSPRNG(): void;
	setHashOf(a: Uint8Array): void;
}

export declare class IdType extends Common {
	constructor();

	setInt(x: number): void;
	isEqual(rhs: this): boolean;
	deserialize(s: Uint8Array): void;
	serialize(): Uint8Array;
	setStr(s: string): void;
	getStr(): string;
	setLittleEndian(a: Uint8Array): void;
	setLittleEndianMod(a: Uint8Array): void;
	setByCSPRNG(): void;
}

export declare class SecretKeyType extends Common {
	constructor();

	setInt(x: number): void;
	isZero(): boolean;
	isEqual(rhs: this): boolean;
	deserialize(s: Uint8Array): void;
	serialize(): Uint8Array;
	add(rhs: this): void;
	share(msk: SecretKeyType[], id: IdType): void;
	recover(setVec: SecretKeyType[], idVec: IdType[]): void;
	setHashOf(a: Uint8Array): void;
	setLittleEndian(a: Uint8Array): void;
	setLittleEndianMod(a: Uint8Array): void;
	setByCSPRNG(): void;
	getPublicKey(): PublicKeyType;
	sign(m: string | Uint8Array): SignatureType;
}

export declare class PublicKeyType extends Common {
	constructor();

	isZero(): boolean;
	isEqual(rhs: this): boolean;
	deserialize(s: Uint8Array): void;
	serialize(): Uint8Array;
	deserializeUncompressed(s: Uint8Array): void;
	serializeUncompressed(): Uint8Array;
	add(rhs: this): void;
	share(mpk: PublicKeyType[], id: IdType): void;
	recover(secVec: PublicKeyType[], idVec: IdType[]): void;
	isValidOrder(): boolean;
	verify(signature: SignatureType, m: Uint8Array | string): boolean;
}

export declare class SignatureType extends Common {
	constructor();

	isZero(): boolean;
	isEqual(rhs: this): boolean;
	deserialize(s: Uint8Array): void;
	serialize(): Uint8Array;
	deserializeUncompressed(s: Uint8Array): void;
	serializeUncompressed(): Uint8Array;
	add(rhs: this): void;
	recover(secVec: SignatureType[], idVec: IdType[]): void;
	isValidOrder(): boolean;
	aggregate(others: SignatureType[]): boolean;
	fastAggregateVerify(publicKeys: PublicKeyType[], message: Uint8Array): boolean;
	aggregateVerifyNoCheck(publicKeys: PublicKeyType[], messages: Uint8Array): boolean;
}
