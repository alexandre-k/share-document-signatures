// array buffer to URLBase64
export const bufferToBase64Url = (buff: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buff)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

// Base64 to array buffer
export const base64ToBuffer = (val: string) => Uint8Array.from(atob(val), c => c.charCodeAt(0));

