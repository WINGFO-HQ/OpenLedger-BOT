const axios = require("axios");
const crypto = require("crypto");
const colors = require("../config/colors");
const logger = require("../config/logger");
const { BASE_URL, HEADERS } = require("./constants");
const { generateRandomCapacity, printDivider } = require("./utils");

class HttpHeartbeatClient {
  constructor(authToken, address) {
    this.authToken = authToken.startsWith("Bearer")
      ? authToken
      : `Bearer ${authToken}`;
    this.address = address;
    this.identity = Buffer.from(address).toString("base64");
    this.capacity = generateRandomCapacity();
    this.id = crypto.randomUUID();
    this.intervalId = null;
    this.isRunning = false;

    this.heartbeatPayload = {
      message: {
        worker: {
          Identity: this.identity,
          ownerAddress: this.address,
          type: "LWEXT",
          Host: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
        },
        capacity: {
          AvailableMemory: this.capacity.AvailableMemory,
          AvailableStorage: this.capacity.AvailableStorage,
          AvailableGPU: this.capacity.AvailableGPU,
          AvailableModels: this.capacity.AvailableModels,
        },
        worker: {
          Identity: this.identity,
          Host: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
          ownerAddress: this.address,
          pending_jobs_count: 0,
          type: "LWEXT",
        },
      },
      msgType: "HEARTBEAT",
      workerID: this.identity,
      workerType: "LWEXT",
    };
  }

  async sendHeartbeat() {
    try {
      const response = await axios.post(
        `${BASE_URL}/ext/api/v2/nodes/communicate`,
        this.heartbeatPayload,
        {
          headers: {
            ...HEADERS,
            Authorization: this.authToken,
            "Content-Type": "application/json",
            Origin: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
          },
          timeout: 30000,
          family: 4,
        }
      );

      if (response.data?.status === 200) {
        logger.info(`${colors.info}Heartbeat sent successfully${colors.reset}`);

        if (response.data?.data?.job) {
          logger.info(
            `${colors.info}Job received: ${JSON.stringify(
              response.data.data.job
            )}${colors.reset}`
          );
        }

        if (response.data?.data?.next_heartbeat) {
          const nextHeartbeatMs = response.data.data.next_heartbeat;
          logger.info(
            `${colors.info}Next heartbeat in ${nextHeartbeatMs}ms${colors.reset}`
          );

          if (this.intervalId) {
            clearTimeout(this.intervalId);
          }

          this.intervalId = setTimeout(() => {
            this.sendHeartbeat();
          }, nextHeartbeatMs);
        }

        return response.data;
      } else {
        logger.warn(
          `${
            colors.warning
          }Unexpected response from heartbeat: ${JSON.stringify(
            response.data
          )}${colors.reset}`
        );
      }
    } catch (error) {
      if (error.response) {
        logger.error(
          `${colors.error}Failed to send heartbeat (${
            error.response.status
          }): ${
            error.response?.data?.message ||
            JSON.stringify(error.response?.data)
          }${colors.reset}`
        );
      } else if (error.request) {
        logger.error(
          `${colors.error}No response received for heartbeat: ${error.message}${colors.reset}`
        );
      } else {
        logger.error(
          `${colors.error}Error setting up heartbeat request: ${error.message}${colors.reset}`
        );
      }

      logger.info(
        `${colors.info}Retrying heartbeat in 30 seconds...${colors.reset}`
      );
      if (this.intervalId) {
        clearTimeout(this.intervalId);
      }
      this.intervalId = setTimeout(() => {
        this.sendHeartbeat();
      }, 30000);
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn(`${colors.warning}Heartbeat already running${colors.reset}`);
      return;
    }

    logger.success(
      `${colors.success}Starting HTTP heartbeat for ${this.address}${colors.reset}`
    );
    printDivider();

    this.sendHeartbeat();
    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info(
        `${colors.info}Heartbeat stopped for ${this.address}${colors.reset}`
      );
    }
  }
}

module.exports = HttpHeartbeatClient;
