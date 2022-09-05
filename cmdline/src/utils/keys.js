"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatData = exports.getArmoredFile = exports.getDecryptedPrivateKey = exports.lookupEmailPubKey = exports.encryptDataAndSign = exports.getPrivateKey = exports.getPublicKeys = void 0;
const wkd_client_1 = require("@openpgp/wkd-client");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const openpgp = __importStar(require("openpgp"));
const prompt_sync_1 = __importDefault(require("prompt-sync"));
console.log('WKD > ', wkd_client_1.WKD);
const getPublicKeys = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    return yield openpgp.readKey({ armoredKey: yield (0, exports.getArmoredFile)(filename) });
});
exports.getPublicKeys = getPublicKeys;
const getPrivateKey = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    const buf = fs_1.default.readFileSync(filename);
    return yield openpgp.readPrivateKey({ binaryKey: buf });
});
exports.getPrivateKey = getPrivateKey;
const encryptDataAndSign = (data, recipientAddress, publicKeyFile, wkdServer, privateKey) => __awaiter(void 0, void 0, void 0, function* () {
    const pubKeys = !!publicKeyFile ?
        yield (0, exports.getPublicKeys)(publicKeyFile) :
        yield (0, exports.lookupEmailPubKey)(recipientAddress, wkdServer);
    const encrypted = yield openpgp.encrypt({
        message: yield openpgp.createMessage({ binary: data }),
        encryptionKeys: pubKeys,
        signingKeys: privateKey
    });
    return encrypted;
});
exports.encryptDataAndSign = encryptDataAndSign;
const lookupEmailPubKey = (email, server) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('NOT YET IMPLEMENTED: use server ', server);
    const wkd = new wkd_client_1.WKD();
    const publicKeyBytes = yield wkd.lookup({
        email
    });
    return yield openpgp.readKey({
        binaryKey: publicKeyBytes
    });
});
exports.lookupEmailPubKey = lookupEmailPubKey;
const getDecryptedPrivateKey = (privateKeyFile) => __awaiter(void 0, void 0, void 0, function* () {
    const pkey = yield (0, exports.getPrivateKey)(privateKeyFile);
    if (!pkey.isDecrypted()) {
        const prompt = (0, prompt_sync_1.default)({ hidden: true, echo: '*' });
        console.log("Enter the passphrase to decrypt your private key:");
        const passphrase = prompt({ echo: '*' });
        return yield openpgp.decryptKey({
            privateKey: pkey,
            passphrase
        });
    }
    else {
        return pkey;
    }
});
exports.getDecryptedPrivateKey = getDecryptedPrivateKey;
const getArmoredFile = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    return yield promises_1.default.readFile(filename, 'utf8');
});
exports.getArmoredFile = getArmoredFile;
const formatData = (filename, recipientAddress, publicKey, privateKeyFile, server) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield promises_1.default.readFile(filename);
    const privateKeyDecrypted = yield (0, exports.getDecryptedPrivateKey)(privateKeyFile);
    const encryptedData = yield (0, exports.encryptDataAndSign)(data, recipientAddress, publicKey, server, privateKeyDecrypted);
    console.log('Encrypted data:\n', encryptedData);
    return encryptedData;
});
exports.formatData = formatData;
