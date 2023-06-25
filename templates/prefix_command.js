const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");

module.exports = {
  config: {
    name: "", // Name of Command
    description: "", // Command Description
    usage: "", // Command usage
  },
  permissions: "", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute
  },
};
