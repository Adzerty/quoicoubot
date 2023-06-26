const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");

const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");

const { v4: uuidv4 } = require("uuid");
module.exports = {
  config: {
    name: "challenge", // Name of Command
    description: "Challenge another user and let a third user ", // Command Description
    usage: "?challenge <user> <amount of cramptes> <description>", // Command usage
  },
  permissions: "", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute

    if (args.length < 3 || isNaN(args[1])) {
      reply(
        message,
        `⛔️ Mauvaise utilisation de la commande challenge ⛔️\n Tu dois l'utiliser comme cela : \n?challenge <pseudo discord> <mise> "<description du challenge>"`,
        "Red"
      );

      return;
    }

    const other = args[0];
    const cramptes = args[1];
    const description = args
      .slice(2, args.length)
      .toString()
      .replaceAll(",", " ");

    const { data: challenged, error: errorChallenged } = await supabase
      .from("crampteur")
      .select("id, username")
      .eq("username", other);

    console.log(challenged);

    if (challenged.length == 0) {
      reply(
        message,
        `⛔️ Challenge impossible ! Le challengé n'existe pas. ⛔️`,
        "Red"
      );

      return;
    }

    if (challenged.cramptes_amount < cramptes) {
      reply(
        message,
        `⛔️ Challenge impossible ! Le challengé n'a pas assez cramptés. ⛔️`,
        "Red"
      );

      return;
    }

    const res = await message.reply(
      `🚨 ${message.author.username} challenge ${other} pour ${cramptes} cramptés !\n\nLe challenge est le suivant : ${description}\n\n<@${challenged[0].id}> acceptes-tu ? `
    );

    res.react("👍");
    res.react("👎");

    const collectorFilter = (reaction, user) => {
      console.log(user.id);
      console.log(challenged[0].id);
      console.log(
        ["👍", "👎"].includes(reaction.emoji.name) &&
          user.id === challenged[0].id
      );
      return (
        ["👍", "👎"].includes(reaction.emoji.name) &&
        user.id === challenged[0].id
      );
    };

    res
      .awaitReactions({
        filter: collectorFilter,
        max: 1,
        time: 1000 * 60 * 5,
        errors: ["time"],
      })
      .then(async (collected) => {
        const reaction = collected.first();

        console.log(reaction);

        if (reaction._emoji.name == "👍") {
          const { data: challengedIncrement, error: errorCIncrement } =
            await supabase.rpc("increment", {
              x: -1 * cramptes,
              row_id: challenged[0].id,
            });

          const { data: playerIncrement, error: errorPIncrement } =
            await supabase.rpc("increment", {
              x: -1 * cramptes,
              row_id: message.author.id,
            });

          const uuid = uuidv4();
          const { data: newChallenge, error: errorChallenge } = await supabase
            .from("challenge")
            .insert({
              id: uuid,
              challenger_id: message.author.id,
              challenger_name: message.author.username,
              challenged_id: challenged[0].id,
              challenged_name: challenged[0].username,
              description: description,
              bet: cramptes,
            });

          res.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🥊 ${other} a accepté le challenge suivant :  ${uuid} !`
                )
                .setColor("Purple"),
            ],
          });
        } else {
          res.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(`💩 ${other} a refusé le challenge !`)
                .setColor("Purple"),
            ],
          });
        }
      })
      .catch((collected) => {
        console.log(collected);
        res.reply(
          `😢 Une erreur est survenue pendant la création du challenge`
        );
      });
  },
};
