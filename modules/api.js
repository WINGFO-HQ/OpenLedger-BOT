const axios = require("axios");
const colors = require("../config/colors");
const logger = require("../config/logger");
const { printDivider, formatTime } = require("./utils");
const { BASE_URL, REWARDS_URL, HEADERS } = require("./constants");

async function checkAppVersion(token) {
  try {
    const authToken = token.startsWith("Bearer") ? token : `Bearer ${token}`;

    const response = await axios.get(
      `${BASE_URL}/ext/api/v2/auth/app_version`,
      {
        params: { platform: "extension" },
        headers: {
          ...HEADERS,
          Authorization: authToken,
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "none",
        },
        timeout: 30000,
        family: 4,
      }
    );

    logger.info(`${colors.info}[VERSION CHECK]${colors.reset}`);
    logger.info(
      `${colors.info}▸ Platform   : ${colors.accountName}${response.data.platform}${colors.reset}`
    );
    logger.info(
      `${colors.info}▸ Version    : ${colors.accountName}${response.data.version}${colors.reset}`
    );
    logger.info(
      `${colors.info}▸ Status     : ${colors.accountName}${
        response.data.under_maintenance ? "Under Maintenance" : "Online"
      }${colors.reset}`
    );
    printDivider();

    return response.data;
  } catch (error) {
    logger.error(
      `${colors.error}Failed to check app version: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function getUserInfo(token) {
  try {
    const authToken = token.startsWith("Bearer") ? token : `Bearer ${token}`;

    const response = await axios.get(`${BASE_URL}/ext/api/v2/users/me`, {
      headers: {
        ...HEADERS,
        Authorization: authToken,
      },
      timeout: 30000,
      family: 4,
    });

    printDivider();
    logger.info(`${colors.accountInfo}[USER INFO]${colors.reset}`);
    logger.info(
      `${colors.accountInfo}▸ Address    : ${colors.accountName}${response.data.data.address}${colors.reset}`
    );
    logger.info(
      `${colors.accountInfo}▸ ID         : ${colors.accountName}${response.data.data.id}${colors.reset}`
    );
    logger.info(
      `${colors.accountInfo}▸ Referral   : ${colors.accountName}${response.data.data.referral_code}${colors.reset}`
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(
        `${colors.accountWarning}Failed to get user info: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}${colors.reset}`
      );
    } else if (error.request) {
      logger.error(
        `${colors.accountWarning}Failed to get user info: No response received (${error.code}) - Check your network connection${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.accountWarning}Failed to get user info: ${error.message}${colors.reset}`
      );
    }
    return null;
  }
}

async function getClaimDetails(token) {
  try {
    const authToken = token.startsWith("Bearer") ? token : `Bearer ${token}`;

    const response = await axios.get(
      `${REWARDS_URL}/ext/api/v2/claim_details`,
      {
        headers: {
          ...HEADERS,
          Authorization: authToken,
        },
        timeout: 30000,
        family: 4,
      }
    );

    printDivider();
    logger.info(`${colors.faucetInfo}[CLAIM DETAILS]${colors.reset}`);
    logger.info(
      `${colors.faucetInfo}▸ Tier       : ${colors.accountName}${response.data.data.tier}${colors.reset}`
    );
    logger.info(
      `${colors.faucetInfo}▸ Daily Point : ${colors.accountName}${response.data.data.dailyPoint}${colors.reset}`
    );

    const status = response.data.data.claimed
      ? `${colors.faucetWait}Claimed${colors.reset}`
      : `${colors.faucetSuccess}Available${colors.reset}`;
    logger.info(`${colors.faucetInfo}▸ Status     : ${status}`);

    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(
        `${colors.faucetError}Failed to get claim details: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}${colors.reset}`
      );
    } else if (error.request) {
      logger.error(
        `${colors.faucetError}Failed to get claim details: No response received (${error.code}) - Check your network connection${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.faucetError}Failed to get claim details: ${error.message}${colors.reset}`
      );
    }
    return null;
  }
}

async function getStreakInfo(token) {
  try {
    const authToken = token.startsWith("Bearer") ? token : `Bearer ${token}`;

    const response = await axios.get(`${REWARDS_URL}/ext/api/v2/streak`, {
      headers: {
        ...HEADERS,
        Authorization: authToken,
      },
      timeout: 30000,
      family: 4,
    });

    printDivider();
    logger.info(`${colors.taskInProgress}[STREAK INFO]${colors.reset}`);
    const claimedDays = response.data.data.filter(
      (day) => day.isClaimed
    ).length;
    logger.info(
      `${colors.taskInProgress}▸ Current    : ${colors.taskComplete}${claimedDays} days${colors.reset}`
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(
        `${colors.taskFailed}Failed to get streak info: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}${colors.reset}`
      );
    } else if (error.request) {
      logger.error(
        `${colors.taskFailed}Failed to get streak info: No response received (${error.code}) - Check your network connection${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.taskFailed}Failed to get streak info: ${error.message}${colors.reset}`
      );
    }
    return null;
  }
}

async function claimReward(token) {
  try {
    const authToken = token.startsWith("Bearer") ? token : `Bearer ${token}`;

    const response = await axios.get(`${REWARDS_URL}/ext/api/v2/claim_reward`, {
      headers: {
        ...HEADERS,
        Authorization: authToken,
      },
      timeout: 30000,
      family: 4,
    });

    if (response.data.status === "SUCCESS") {
      printDivider();
      logger.success(`${colors.faucetSuccess}[CLAIM SUCCESS]${colors.reset}`);
      logger.info(
        `${colors.faucetInfo}▸ Message    : ${colors.faucetSuccess}Daily reward claimed successfully!${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Next Claim : ${colors.faucetSuccess}${formatTime(
          response.data.data.nextClaim
        )}${colors.reset}`
      );
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(
        `${colors.faucetError}Failed to claim reward: ${
          error.response.status
        } - ${JSON.stringify(error.response.data)}${colors.reset}`
      );
    } else if (error.request) {
      logger.error(
        `${colors.faucetError}Failed to claim reward: No response received (${error.code}) - Check your network connection${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.faucetError}Failed to claim reward: ${error.message}${colors.reset}`
      );
    }
    return null;
  }
}

module.exports = {
  checkAppVersion,
  getUserInfo,
  getClaimDetails,
  getStreakInfo,
  claimReward,
};
