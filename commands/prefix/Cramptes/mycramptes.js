const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");

const { supabase } = require("../../../index");

module.exports = {
  config: {
    name: "mycramptes",
    description: "Get your cramptes amount",
  },
  permissions: ["SendMessages"],
  owner: false,
  run: async (client, message, args, prefix, config, db) => {
    let user;
    const { data: fetchUser, error } = await supabase
      .from("crampteur")
      .upsert({ id: message.author.id, username: message.author.username })
      .select();
    user = fetchUser;

    const amount = user[0].cramptes_amount;
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`💸 Tu as ${amount} cramptés ${user[0].username}! 💸`)
          .setColor("Blue"),
      ],
    });
  },
};
