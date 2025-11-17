let landTypeMap = {};

(async function loadLandTypes() {
  try {
    const response = await fetch('./renderer/config/land_types.json');
    landTypeMap = await response.json();
    window.landTypeMap = landTypeMap;
  } catch (error) {
  }
})();

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
  if (!number) return "";
  if (number.length === 9 && /^\d{9}$/.test(number)) {
    return `${number.slice(0, 3)}.${number.slice(3, 6)}.${number.slice(6, 9)}`;
  }
  
  if (number.length === 12 && /^\d{12}$/.test(number)) {
    return `${number.slice(0, 3)}.${number.slice(3, 6)}.${number.slice(6, 9)}.${number.slice(9, 12)}`;
  }
  
  return "";
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) return "";
  return `${phoneNumber.slice(0, 3)}.${phoneNumber.slice(3, 6)}.${phoneNumber.slice(6, 10)}`;
}

function formatMST(mst) {
  if (!mst || (mst.length !== 10 && mst.length !== 13) || !/^\d{10}$|^\d{13}$/.test(mst)) return "";
  if (mst.length === 10) {
    return `${mst.slice(0, 3)}.${mst.slice(3, 6)}.${mst.slice(6, 9)}.${mst.slice(9, 10)}`;
  } else {
    return `${mst.slice(0, 3)}.${mst.slice(3, 6)}.${mst.slice(6, 9)}.${mst.slice(9, 13)}`;
  }
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
    
    if (hundred) str += words[hundred] + " trăm";
    else if (n >= 10 && !isHighestOrder) str += "không trăm"; 
    
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

function numberToAreaWords(number) {
  const numStr = typeof number === 'string' ? number : number.toString();
  const hasDecimal = numStr.includes('.');
  
  if (hasDecimal) {
    const [integerPart, decimalPart] = numStr.split('.');
    const integerNum = parseInt(integerPart, 10);
    const decimalNum = decimalPart ? parseInt(decimalPart, 10) : 0;
    
    if (isNaN(integerNum) && isNaN(decimalNum)) return "";
    if (integerNum === 0 && decimalNum === 0) return "không mét vuông";
    
    let result = "";

    if (integerNum > 0) {
      result = numberToAreaWordsInteger(integerNum);
    } else {
      result = "không";
    }
    
    if (decimalNum > 0) {
      const decimalWords = numberToAreaWordsInteger(decimalNum);
      result += (result ? " phẩy " : "") + decimalWords;
    }
    
    return result + " mét vuông";
  } else {
    const num = Number(number);
    if (!Number.isFinite(num) || isNaN(num)) return "";
    if (num === 0) return "không mét vuông";
    return numberToAreaWordsInteger(num) + " mét vuông";
  }
}

function numberToAreaWordsInteger(number) {
  number = Number(number);
  if (!Number.isFinite(number) || isNaN(number)) return "";
  if (number === 0) return "không";

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
    
    if (hundred) str += words[hundred] + " trăm";
    else if (n >= 10 && !isHighestOrder) str += "không trăm";
    
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
  return result.join(" ").replace(/ +/g, " ").trim();
}

function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

window.expandLandType = expandLandType;
window.formatCCCD = formatCCCD;
window.formatPhoneNumber = formatPhoneNumber;
window.formatMST = formatMST;
window.formatDate = formatDate;
window.formatWithCommas = formatWithCommas;
window.numberToVietnameseWords = numberToVietnameseWords;
window.numberToAreaWords = numberToAreaWords;
window.toTitleCase = toTitleCase;