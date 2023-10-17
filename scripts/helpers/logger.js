const chalk = require('chalk');

const logger = {
    info: (message) => {
        console.log(message);
    },

    success: (message) => {
        console.log(chalk.bold.green(message));
    },

    error: (message, comment) => {
        console.log(chalk.bold.red(message), `${comment}`);
    },
    warning: (message) => {
        console.log(chalk.bold.yellow(message));
    },
};

module.exports = {
    logger,
};
