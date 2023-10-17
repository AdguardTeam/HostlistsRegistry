const chalk = require('chalk');

/**
 * Logger utility for displaying messages with different styles using Chalk.
 *
 */
const logger = {
    // Log a success message with bold green text.
    success: (message) => {
        console.log(chalk.bold.green(message));
    },
    // Log an error message with red text and an optional comment without color
    error: (message, comment) => {
        console.log(chalk.bold.red(message), `${comment}`);
    },
    // Log a warning message with yellow bold text.
    warning: (message) => {
        console.log(chalk.bold.yellow(message));
    },
};

module.exports = {
    logger,
};
