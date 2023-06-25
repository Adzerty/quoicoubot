const { EmbedBuilder } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const config = require("../../../config/config");

const supabaseUrl = config.Supabase.URL;
const supabaseKey = config.Supabase.KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
