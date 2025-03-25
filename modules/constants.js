const BASE_URL = "https://apitn.openledger.xyz";
const REWARDS_URL = "https://rewardstn.openledger.xyz";

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US;q=0.9,en;q=0.8",
  "Sec-Ch-Ua":
    '"Chromium";v="134", "Not_A_Brand";v="24", "Google Chrome";v="134"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  Priority: "u=1,i",
};

const ORIGIN = "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc";

module.exports = {
  BASE_URL,
  REWARDS_URL,
  HEADERS,
  ORIGIN,
};
