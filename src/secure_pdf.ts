export const SecurePDF = {
  async createSecurePDF(
    masterPassword: string,
    filename = "masterpassword.pdf"
  ) {
    if (!masterPassword) {
      alert("Please enter a master password first!");
      return;
    }
 
    if (!window.PDFLib) {
      alert("PDF library not loaded");
      return;
    }
 
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const enc = new TextEncoder();
 
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
 
    page.drawText(
      `MASTER PASSWORD\n\n${masterPassword}\n\nKEEP THIS SAFE.\nIF LOST, IT CANNOT BE RECOVERED.`,
      {
        x: 50,
        y: 250,
        size: 12,
        font,
      }
    );
 
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = new Uint8Array(pdfBytes).buffer;
 
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
 
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(masterPassword),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
 
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 600_000,
        hash: "SHA-512",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
 
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      pdfBuffer
    );
 
    const out = new Uint8Array(
      salt.byteLength + iv.byteLength + encrypted.byteLength
    );
 
    out.set(salt, 0);
    out.set(iv, salt.byteLength);
    out.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
 
    const encBlob = new Blob([out], { type: "application/octet-stream" });
    const encUrl = URL.createObjectURL(encBlob);
    const encLink = document.createElement("a");
    encLink.href = encUrl;
    encLink.download = filename.replace(".pdf", ".enc");
    encLink.click();
    URL.revokeObjectURL(encUrl);
 
    alert(
      "Encrypted backup (.enc) created.\n\nTo read it, you'll need to decrypt it with your master password " +
      "(PBKDF2-SHA512, 600,000 iterations, AES-GCM). Keep your master password safe — it CANNOT be recovered."
    );
  },
};