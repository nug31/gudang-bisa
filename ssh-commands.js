import { exec } from "child_process";
import { promisify } from "util";
import readline from "readline";

const execAsync = promisify(exec);

// Configuration - Update these values with your CloudPanel information
const SSH_HOST = "145.79.11.48";
const SSH_USER = "gudangmitra";
const SITE_DIRECTORY = "/home/gudangmitra/htdocs/gudangmitra.nugjourney.com";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to execute SSH command
async function executeSSHCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(
      `ssh ${SSH_USER}@${SSH_HOST} "${command}"`
    );
    if (stderr) console.error(`Error: ${stderr}`);
    return stdout;
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    return null;
  }
}

// Available commands
const commands = {
  1: {
    name: "Check application status",
    command: `cd ${SITE_DIRECTORY} && node check-app-status.js`,
  },
  2: {
    name: "Start application",
    command: `cd ${SITE_DIRECTORY} && (pm2 start server.js --name gudang-mitra || node server.js &)`,
  },
  3: {
    name: "Stop application",
    command: `cd ${SITE_DIRECTORY} && (pm2 stop gudang-mitra || pkill -f "node server.js")`,
  },
  4: {
    name: "Restart application",
    command: `cd ${SITE_DIRECTORY} && (pm2 restart gudang-mitra || (pkill -f "node server.js" && node server.js &))`,
  },
  5: {
    name: "Test database connection",
    command: `cd ${SITE_DIRECTORY} && node server-test.js`,
  },
  6: {
    name: "View application logs",
    command: `cd ${SITE_DIRECTORY} && (pm2 logs gudang-mitra --lines 100 || tail -n 100 nohup.out)`,
  },
  7: {
    name: "List running processes",
    command: `ps aux | grep node`,
  },
  8: {
    name: "Check disk space",
    command: `df -h`,
  },
  9: {
    name: "Check memory usage",
    command: `free -m`,
  },
  10: {
    name: "Custom command",
    command: null,
  },
};

async function main() {
  console.log("CloudPanel SSH Command Helper");
  console.log("============================");
  console.log(`SSH Connection: ${SSH_USER}@${SSH_HOST}`);
  console.log(`Site Directory: ${SITE_DIRECTORY}`);
  console.log("\nAvailable commands:");

  Object.keys(commands).forEach((key) => {
    console.log(`${key}. ${commands[key].name}`);
  });

  const choice = await prompt("\nEnter command number (or q to quit): ");

  if (choice.toLowerCase() === "q") {
    console.log("Exiting...");
    rl.close();
    return;
  }

  if (commands[choice]) {
    let command = commands[choice].command;

    if (choice === "10") {
      command = await prompt("Enter custom SSH command: ");
    }

    console.log(`\nExecuting: ${command}`);
    const output = await executeSSHCommand(command);

    if (output) {
      console.log("\nOutput:");
      console.log(output);
    }

    const runAgain = await prompt("\nRun another command? (y/n): ");

    if (runAgain.toLowerCase() === "y") {
      rl.close();
      process.nextTick(() => {
        main();
      });
      return;
    }
  } else {
    console.log("Invalid choice. Please try again.");
    const runAgain = await prompt("\nTry again? (y/n): ");

    if (runAgain.toLowerCase() === "y") {
      rl.close();
      process.nextTick(() => {
        main();
      });
      return;
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error("Error:", error);
  rl.close();
});
