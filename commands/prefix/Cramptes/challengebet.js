const { EmbedBuilder, Colors } = require("discord.js");
const config = require("../../../config/config");
const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  config: {
    name: "challengebet", // Name of Command
    description: "bet on a challenge made by another players", // Command Description
    usage: "?challengebet <uid du challenge> <challenger> <mise>", // Command usage
  },
  permissions: "", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    if (args.length != 3 && isNaN(args[2])) {
      reply(
        message,
        `⛔️ Mauvaise utilisation de la commande ! \n Tu dois l'utiliser comme cela : \n?challengebet <uuid du challenge> <mise>"`,
        "Red"
      );

      return;
    }

    const { data: challenge, error: errorChallenge } = await supabase
      .from("challenge")
      .select()
      .eq("id", args[0]);

    if (challenge.length != 1) {
      reply(message, `⛔️ Le challenge n'existe pas ! ⛔️`);
      return;
    }

    if (
      challenge[0].challenger_id == message.author.id ||
      challenge[0].challenged_id == message.author.id
    ) {
      reply(
        message,
        `⛔️ Tu ne peux pas parier sur un challenge dans lequel tu es impliqué ! ⛔️`
      );
      return;
    }

    const { data: challenger, error: errorChallenger } = await supabase
      .from("crampteur")
      .select()
      .eq("username", args[1]);

    const { data: user, error: errorUser } = await supabase
      .from("crampteur")
      .select()
      .eq("id", message.author.id);

    if (user[0].cramptes_amount < args[2]) {
      reply(message, `⛔️ Tu n'as pas assez de cramptés ! ⛔️`);
      return;
    }

    const cramptes = args[2];

    const { data, error } = await supabase.from("challengebet").insert({
      id: uuidv4(),
      challenge: challenge[0].id,
      challenger: challenger[0].id,
      user: message.author.id,
      username: user[0].username,
      bet: cramptes,
    });

    await supabase.rpc("increment", {
      x: -1 * cramptes,
      row_id: user[0].id,
    });

    reply(
      message,
      `✅ ${user[0].username} a parié ${cramptes} cramptés sur la victoire de ${challenger[0].username} ! ✅`,
      "Green"
    );
  },
};
