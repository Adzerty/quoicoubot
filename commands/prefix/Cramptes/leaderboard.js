const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");
const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");

module.exports = {
  config: {
    name: "leaderboard", // Name of Command
    description: "get the 10 users with the most of cramptes", // Command Description
    usage: "?leaderboard", // Command usage
  },
  permissions: "SendMessages", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute
    const { data, error } = await supabase
      .from("crampteur")
      .select("username, cramptes_amount")
      .order("cramptes_amount", { ascending: false });

    let leaderboard = "";

    data.forEach(
      (u, i) =>
        (leaderboard += `${i + 1} - ${u.username.toLocaleUpperCase()} - ${
          u.cramptes_amount
        } cramptés \n`)
    );
    reply(message, `🏆 Leaderboard : \n${leaderboard}`, "Yellow");
  },
};
