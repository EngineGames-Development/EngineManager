export const SecurePDF = {
  createSecurePDF: async (masterPassword: string, filename = "masterpassword.pdf") => {
    if (!masterPassword) {
      alert("Please enter a master password first!");
      return;
    }
    
    const pdfLib = await import(
      "https://cdn.jsdelivr.net/npm/pdf-lib@1.21.0/+esm"
    );

    const { PDFDocument, StandardFonts, rgb } = pdfLib.default;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("Secure PDF by EngineManager", {
      x: 50,
      y: 350,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });

    const passwordMessage = `
Important: This is your master password:
${masterPassword}

Keep it safe. If you lose it, it cannot be recovered.
Print or store it securely.
`;
    page.drawText(passwordMessage, {
      x: 50,
      y: 250,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfArrayBuffer = new Uint8Array(pdfBytes).buffer;

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(masterPassword),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("engine-manager-pdf-salt"),
        iterations: 200_000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      pdfArrayBuffer
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    const encryptedBlob = new Blob([combined], { type: "application/octet-stream" });
    const encryptedLink = document.createElement("a");
    encryptedLink.href = URL.createObjectURL(encryptedBlob);
    encryptedLink.download = filename.replace(".pdf", ".enc");
    encryptedLink.click();

    const printableBlob = new Blob([new Uint8Array(pdfArrayBuffer)], { type: "application/pdf" });
    const printableLink = document.createElement("a");
    printableLink.href = URL.createObjectURL(printableBlob);
    printableLink.download = filename;
    printableLink.click();

    alert(
      "Your PDF has been encrypted (AES-256) and a printable backup has been downloaded. Keep your master password safe!"
    );
  },
};