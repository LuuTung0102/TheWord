function expandLandType(raw) {
  if (!raw) return "";
  return raw
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((code) => {
      const c = code.toUpperCase();
      return landTypeMap[c] || code;
    })
    .join(" và ");
}

function formatCCCD(number) {
  if (!number || number.length !== 12 || !/^\d{12}$/.test(number)) return "";
  return `${number.slice(0, 3)}.${number.slice(3, 6)}.${number.slice(
    6,
    9
  )}.${number.slice(9, 12)}`;
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) return "";
  return `${phoneNumber.slice(0, 4)}.${phoneNumber.slice(4, 7)}.${phoneNumber.slice(7, 10)}`;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatWithCommas(n) {
  if (n == null || n === "") return "";
  const s = n.toString().replace(/[^0-9]/g, "");
  if (!s) return "";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToVietnameseWords(number) {
  number = Number(number);
  if (!Number.isFinite(number) || isNaN(number)) return "";
  if (number === 0) return "không đồng";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const words = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

  function readThreeDigits(n, isHighestOrder = false) {
    n = Number(n);
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let str = "";
    
    // Explicitly handle hundreds place (including zero)
    if (hundred) str += words[hundred] + " trăm";
    else if (n >= 10 && !isHighestOrder) str += "không trăm"; // Add 'không trăm' only for middle chunks
    
    if (ten > 1) {
      str += (str ? " " : "") + words[ten] + " mươi";
      if (unit) {
        if (unit === 1) str += " mốt";
        else if (unit === 5) str += " lăm";
        else str += " " + words[unit];
      }
    } else if (ten === 1) {
      str += (str ? " " : "") + "mười";
      if (unit) {
        if (unit === 5) str += " lăm";
        else str += " " + words[unit];
      }
    } else if (ten === 0 && unit) {
      if (hundred) str += " lẻ";
      if (unit) str += (str ? " " : "") + words[unit];
    }
    return str;
  }

  let i = 0;
  let result = [];
  while (number > 0) {
    const chunk = number % 1000;
    if (chunk) {
      const isHighestOrder = Math.floor(number / 1000) === 0;
      const chunkWords = readThreeDigits(chunk, isHighestOrder);
      result.unshift((chunkWords + (units[i] ? " " + units[i] : "")).trim());
    }
    number = Math.floor(number / 1000);
    i++;
  }
  return (result.join(" ").replace(/ +/g, " ").trim() + " đồng chẵn")
    .replace(/ +/g, " ")
    .trim();
}

// Make utility functions available globally
window.expandLandType = expandLandType;
window.formatCCCD = formatCCCD;
window.formatPhoneNumber = formatPhoneNumber;
window.formatDate = formatDate;
window.formatWithCommas = formatWithCommas;
window.numberToVietnameseWords = numberToVietnameseWords;

console.log('✅ Utils functions loaded successfully');