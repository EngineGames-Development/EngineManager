document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const passwordcontainer = document.getElementById("password-container");
  const websiteinputbox = document.getElementById("websiteinputbox");
  const addcontainer = document.querySelector(".add-container");
  const masterpasswordcontainer = document.querySelector(".master-password-container");
  const onlineBtn = document.getElementById("onlineBtn");
  const addBtn = document.getElementById("add-button");
  const addpasswordBtn = document.getElementById("addpasswordBtn");
  const generate = document.querySelector(".generate");
  const thinking = document.querySelector(".thinking")
  const printer = document.querySelector('.print');
  const paper = document.querySelector('.paper');

  const onlinePopup = container.querySelector(".popup");

  const onlineEnterBtn = onlinePopup.querySelector("button:first-of-type");
  const onlineCancelBtn = onlinePopup.querySelector("button:last-of-type");
  const dontShowCheckbox = onlinePopup.querySelector("input[type='checkbox']");

  const cancelbuttons = document.querySelector(".cancel-btn");
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  const toggle = document.querySelector(".toggle-password");
  const passwordinput = document.querySelector(".input-password");

  const websiteError = document.getElementById("websiteError");
  const passwordError = document.getElementById("passwordError");

  websiteinputbox.addEventListener("input", () => {
    const value = websiteinputbox.value.trim();
    if (value === "") {
      websiteinputbox.style.borderBottom = "2px solid #ff0000";
      websiteError.textContent = "Website is required";
      websiteError.style.display = "block";
    } else if (!domainRegex.test(value)) {
      websiteinputbox.style.borderBottom = "2px solid #ff0000";
      websiteError.textContent = "Enter a valid domain";
      websiteError.style.display = "block";
    } else {
      websiteinputbox.style.borderBottom = "2px solid #00aa00";
      websiteError.textContent = "";
      websiteError.style.display = "none";
    }
  });

  function checkComplexity(password) {
    return {
      length: password.length >= 14,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    };
  }

  function estimateEntropy(password) {
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^A-Za-z0-9]/.test(password)) pool += 32;
    return Math.log2(Math.pow(pool, password.length));
  }

  function checkPredictability(password) {
    const patterns = [
      /(.)\1{2,}/,
      /1234|2345|3456/,
      /abcd|bcde|cdef/,
      /qwerty|asdf|zxcv/i,
      /password|admin|welcome/i,
      /\b\d{4}\b/
    ];
    return patterns.some(rx => rx.test(password));
  }

  function validatePasswordUI() {
    const value = passwordinput.value.trim();
    const complexity = checkComplexity(value);
    const entropy = estimateEntropy(value);
    const predictable = checkPredictability(value);

    if (value === "") {
      passwordinput.style.borderBottom = "2px solid #ff0000";
      passwordError.textContent = "Password is required";
      passwordError.style.display = "block";
      return false;
    }

    if (!complexity.length) {
      passwordinput.style.borderBottom = "2px solid #ff0000";
      passwordError.textContent = "Password must be at least 14 characters";
      passwordError.style.display = "block";
      return false;
    }

    if (entropy < 60 || predictable) {
      passwordinput.style.borderBottom = "2px solid #ff0000";
      passwordError.textContent = "Password is too predictable";
      passwordError.style.display = "block";
      return false;
    }

    if (!complexity.lower || !complexity.upper || !complexity.number || !complexity.symbol) {
      passwordinput.style.borderBottom = "2px solid #ff0000";
      passwordError.textContent =
        "Password must include uppercase, lowercase, number, and symbol";
      passwordError.style.display = "block";
      return false;
    }

    passwordinput.style.borderBottom = "2px solid #00aa00";
    passwordError.textContent = "";
    passwordError.style.display = "none";
    return true;
  }

  passwordinput.addEventListener("input", () => {
    validatePasswordUI();
  });

  function triggerPrint() {
    printer.classList.add('active');
    paper.classList.add('active');
  }

  printer.addEventListener('click', () => {
    triggerPrint();
  });

  printer.addEventListener('animationend', () => {
    printer.classList.remove('active');
    paper.classList.remove('active');
  });

  generate.addEventListener("click", () => {
    generate.classList.remove('spin');
    void generate.offsetWidth;
    generate.classList.add('spin');

    passwordinput.classList.add("changed")
    setTimeout(() => passwordinput.classList.remove("changed"), 1000);

    const length = parseInt(passwordinput.getAttribute('data-length')) || 24;
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
    const password = [];
    const maxValid = Math.floor(256 / charset.length) * charset.length;
    const buffer = new Uint8Array(length * 2);

    while (password.length < length) {
      crypto.getRandomValues(buffer);
      for (const byte of buffer) {
        if (byte < maxValid) {
          password.push(charset[byte % charset.length]);
          if (password.length === length) break;
        }
      }
    }

    passwordinput.value = password.join('');
    validatePasswordUI();
  });

  async function generateMemorablePassword({wordCount = 7, seperator = "-"} = {}) {
    const res = await fetch("./wordlist.txt");
    const text = await res.text();
    const words = text.split("\n").map(line => line.split("\t")[1]).filter(Boolean);
    const Symbols = "!@#$%^&*";
    const Numbers = "0123456789";
    const secureRandom = max => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % max;
    };
    let parts = [];
    for (let i = 0; i < wordCount; i++) {
      let word = words[secureRandom(words.length)];
      word = word.charAt(0).toUpperCase() + word.slice(1);
      parts.push(word);
    }
    parts.splice(secureRandom(parts.length), 0, Numbers[secureRandom(Numbers.length)]);
    parts.splice(secureRandom(parts.length), 0, Symbols[secureRandom(Symbols.length)]);
    return parts.join(seperator);
  }

  thinking.addEventListener("click", async () => {
    thinking.classList.remove("scale");
    void thinking.offsetWidth;
    thinking.classList.add("scale");
    passwordinput.classList.add("changed")
    setTimeout(() => passwordinput.classList.remove("changed"), 1000);
    passwordinput.value = await generateMemorablePassword({wordCount: 8, seperator: "-"});
    validatePasswordUI();
  });

  if (passwordcontainer.children.length === 0) {
    let passwordtext = document.createElement("h1");
    passwordtext.innerText = "No passwords yet!";
    passwordtext.id = "password-text";
    passwordcontainer.appendChild(passwordtext);
  }

  toggle.addEventListener("click", () => {
    if (passwordinput.type === "password") {
      passwordinput.type = "text";
      toggle.classList.add("active");
    } else {
      passwordinput.type = "password";
      toggle.classList.remove("active");
    }
  });

  onlineBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (localStorage.getItem("skipPopup") === "true") {
      window.location.href = "Online.html";
    } else {
      container.style.display = "flex";
    }
  });

  addBtn.addEventListener("click", () => {
    addcontainer.style.display = "flex";
  });

  addpasswordBtn.addEventListener("click", () => {
    const websiteValue = websiteinputbox.value.trim();
    let websiteValid = true;

    if (websiteValue === "") {
      websiteValid = false;
      websiteinputbox.style.borderBottom = "2px solid #ff0000";
      websiteError.textContent = "Website is required";
      websiteError.style.display = "block";
    } else if (!domainRegex.test(websiteValue)) {
      websiteValid = false;
      websiteinputbox.style.borderBottom = "2px solid #ff0000";
      websiteError.textContent = "Enter a valid domain";
      websiteError.style.display = "block";
    } else {
      websiteValid = true;
      websiteinputbox.style.borderBottom = "2px solid #00aa00";
      websiteError.textContent = "";
      websiteError.style.display = "none";
    }

    const passwordValid = validatePasswordUI();

    if (websiteValid && passwordValid) {
      addcontainer.style.display = "none";
      masterpasswordcontainer.style.display = "flex";
    }
  });

  onlineEnterBtn.addEventListener("click", () => {
    if (dontShowCheckbox.checked) localStorage.setItem("skipPopup", "true");
    container.style.display = "none";
    window.location.href = "Online.html";
  });

  onlineCancelBtn.addEventListener("click", () => {
    container.style.display = "none";
  });

  cancelbuttons.addEventListener("click", () => {
    addcontainer.style.display = "none";
  });
});