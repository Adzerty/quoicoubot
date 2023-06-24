const { EmbedBuilder, PermissionsBitField, codeBlock } = require("discord.js");
const client = require("../../index");
const config = require("../../config/config.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = config.Supabase.URL;
const supabaseKey = config.Supabase.KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const FIND_CRAMPTES = 0.05;

module.exports = {
  name: "messageCreate",
};

const checkForQuoicoubeh = (msg) => {
  if (
    msg.content.endsWith("quoi") ||
    msg.content.endsWith("quoi ?") ||
    msg.content.endsWith("quoi.") ||
    msg.content.endsWith("quoi !")
  ) {
    msg.reply("Quoicoubeh");
  }
};

const checkForCramptes = async (msg) => {
  const r = Math.random();
  if (r < FIND_CRAMPTES) {
    let user;
    const won = Math.floor(Math.random() * 25) + 5;
    const { data, error: errorIncrement } = await supabase.rpc("increment", {
      x: won,
      row_id: msg.author.id,
    });

    const { data: fetchUser, error: errorFetch } = await supabase
      .from("crampteur")
      .upsert({ id: msg.author.id, username: msg.author.username })
      .select();
    user = fetchUser;

    msg.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `WTF tu viens de gagner ${won} cramptés ! Tu as maintenant ${user[0].cramptes_amount} cramptés ${user[0].username} !`
          )
          .setColor("Blue"),
      ],
    });
  }
};

client.on("messageCreate", async (message) => {
  if (message.channel.type !== 0) return;
  if (message.author.bot) return;

  const prefix =
    (await db.get(`guild_prefix_${message.guild.id}`)) || config.Prefix || "?";

  if (!message.content.startsWith(prefix)) {
    await checkForCramptes(message);
    checkForQuoicoubeh(message);
    return;
  }
  if (!message.guild) return;
  if (!message.member)
    message.member = await message.guild.fetchMember(message);

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();
  if (cmd.length == 0) return;

  let command = client.prefix_commands.get(cmd);

  if (!command) return;

  if (command) {
    if (command.permissions) {
      if (
        !message.member.permissions.has(
          PermissionsBitField.resolve(command.permissions || [])
        )
      )
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🚫 Unfortunately, you are not authorized to use this command.`
              )
              .setColor("Red"),
          ],
        });
    }

    if ((command.owner, command.owner == true)) {
      if (config.Users?.OWNERS) {
        const allowedUsers = []; // New Array.

        config.Users.OWNERS.forEach((user) => {
          const fetchedUser = message.guild.members.cache.get(user);
          if (!fetchedUser) return allowedUsers.push("*Unknown User#0000*");
          allowedUsers.push(`${fetchedUser.user.tag}`);
        });

        if (!config.Users.OWNERS.some((ID) => message.member.id.includes(ID)))
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🚫 Sorry but only owners can use this command! Allowed users:\n**${allowedUsers.join(
                    ", "
                  )}**`
                )
                .setColor("Red"),
            ],
          });
      }
    }

    try {
      command.run(client, message, args, prefix, config, db);
    } catch (error) {
      console.error(error);
    }
  }
});
