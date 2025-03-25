process.env.NODE_OPTIONS = "--dns-result-order=ipv4first";

const readline = require("readline");
const fs = require("fs");
const CountdownTimer = require("./config/countdown");
const colors = require("./config/colors");
const logger = require("./config/logger");
const HttpHeartbeatClient = require("./modules/httpClient");
const { showMenu } = require("./modules/menu");
const {
  getTokens,
  getAddresses,
  printDivider,
  formatTime,
} = require("./modules/utils");
const {
  getUserInfo,
  getClaimDetails,
  getStreakInfo,
  claimReward,
} = require("./modules/api");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startCountdown(nextClaimTime, accountIndex) {
  try {
    const now = new Date().getTime();
    const nextClaim = new Date(nextClaimTime).getTime();
    const timeLeft = Math.floor((nextClaim - now) / 1000);

    if (timeLeft > 0) {
      printDivider();
      logger.info(
        `${colors.info}[Account #${accountIndex}] [COUNTDOWN]${colors.reset}`
      );
      const timer = new CountdownTimer({
        showCursor: false,
        message: `${colors.timerCount}▸ Next claim in: ${colors.reset}`,
        format: "HH:mm:ss",
        clearOnComplete: true,
      });
      await timer.start(timeLeft);
      return timeLeft * 1000;
    }
    return 0;
  } catch (error) {
    logger.error(
      `${colors.error}[Account #${accountIndex}] Countdown error: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000;
  }
}

async function startHeartbeat() {
  try {
    const addresses = getAddresses();
    const httpClients = [];

    let token;
    try {
      token = fs.readFileSync("data.txt", "utf8").trim();
      logger.success(
        `${colors.success}Token loaded from data.txt${colors.reset}`
      );
    } catch (error) {
      logger.error(
        `${colors.error}Failed to read token from data.txt: ${error.message}${colors.reset}`
      );
      return;
    }

    for (const account of addresses) {
      logger.info(
        `${colors.info}Starting heartbeat for Account #${account.index}...${colors.reset}`
      );

      const httpClient = new HttpHeartbeatClient(token, account.address);
      httpClient.start();
      httpClients.push(httpClient);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    process.on("SIGINT", () => {
      httpClients.forEach((client) => client.stop());
      process.exit(0);
    });
  } catch (error) {
    logger.error(
      `${colors.error}Heartbeat setup failed: ${error.message}${colors.reset}`
    );
  }
}

async function runAutoClaim(accountData) {
  logger.info(
    `${colors.menuOption}[Account #${accountData.index}] Time: ${
      colors.info
    }${formatTime(new Date())}${colors.reset}`
  );

  try {
    const userInfo = await getUserInfo(accountData.token);
    if (!userInfo) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get user info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const claimDetails = await getClaimDetails(accountData.token);
    if (!claimDetails) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get claim details. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const streakInfo = await getStreakInfo(accountData.token);
    if (!streakInfo) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get streak info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    if (!claimDetails.data.claimed) {
      const claimResult = await claimReward(accountData.token);
      if (claimResult?.status === "SUCCESS") {
        return startCountdown(claimResult.data.nextClaim, accountData.index);
      }
      return 60 * 60 * 1000;
    } else {
      printDivider();
      logger.warn(
        `${colors.faucetWait}[Account #${accountData.index}] [CLAIM STATUS]${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Status     : ${colors.faucetWait}Already claimed today${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Next Claim : ${colors.faucetWait}${formatTime(
          claimDetails.data.nextClaim
        )}${colors.reset}`
      );
      return startCountdown(claimDetails.data.nextClaim, accountData.index);
    }
  } catch (error) {
    logger.error(
      `${colors.error}[Account #${accountData.index}] Auto claim process failed: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000;
  }
}

async function startAutoClaimLoop() {
  const accounts = getTokens();

  while (true) {
    const delays = await Promise.all(
      accounts.map(async (account, index) => {
        await new Promise((resolve) => setTimeout(resolve, index * 2000));
        return runAutoClaim(account);
      })
    );

    const minDelay = Math.min(...delays);
    await new Promise((resolve) => setTimeout(resolve, minDelay));
  }
}

async function main() {
  while (true) {
    const choice = await showMenu(rl);

    switch (choice) {
      case "1":
        logger.info(
          `${colors.info}Starting Auto Claim for multiple accounts...${colors.reset}`
        );
        await startAutoClaimLoop();
        break;

      case "2":
        logger.info(
          `${colors.info}Starting Heartbeat for multiple accounts...${colors.reset}`
        );
        await startHeartbeat();
        break;

      case "3":
        logger.info(`${colors.info}Exiting...${colors.reset}`);
        rl.close();
        process.exit(0);
        break;

      default:
        logger.error(
          `${colors.error}Invalid option. Please try again.${colors.reset}`
        );
        break;
    }

    if (choice === "1" || choice === "2") {
      break;
    }
  }
}

main().catch((error) => {
  logger.error(
    `${colors.error}Program failed: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
