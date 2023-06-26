const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");
const supabase = require("../../../index");

module.exports = {
  config: {
    name: "challengebet", // Name of Command
    description: "bet on a challenge made by another players", // Command Description
    usage: "?challengebet <uid du challenge> <mise>", // Command usage
  },
  permissions: "", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    if (args.length != 2 && isNaN(args[1])) {
    }
  },
};
