const copyToClipBoard = () => navigator.clipboard.readText().then((clipText) => document.querySelector("#pgpMessage").innerText = clipText);
