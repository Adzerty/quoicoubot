const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");

const { supabase } = require("../../../index");

const { v4: uuidv4 } = require("uuid");
module.exports = {
  config: {
    name: "challengevalidate", // Name of Command
    description: "Validate a challenge", // Command Description
    usage: "?challengevalidate <uuid>", // Command usage
  },
  permissions: "", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute

    if (args.length != 1) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Mauvaise utilisation de la commande challengevalidate ⛔️\n Tu dois l'utiliser comme cela : \n?challengevalidate <uuid du challenge>"`
            )
            .setColor("Red"),
        ],
      });

      return;
    }

    const uuid = args[0];

    const { data: challenge, error: errorChallenge } = await supabase
      .from("challenge")
      .select()
      .eq("id", uuid)
      .eq("finished", false);

    console.log(challenge);

    if (challenge.length == 0) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Challenge impossible ! Le challenge n'existe pas ou plus. ⛔️`
            )
            .setColor("Red"),
        ],
      });

      return;
    }

    const res = await message.reply(
      `Le challenge entre ${challenge[0].challenger_name} et ${challenge[0].challenged_name} est terminé !\nLes autres, votez pour décider du vainqueur\n\nLe challenge était : ${challenge[0].description}\n\n🔴 = ${challenge[0].challenger_name}\n🔵 = ${challenge[0].challenged_name}`
    );

    res.react("🔴");
    res.react("🔵");

    const collectorFilter = (reaction, user) => {
      return (
        ["🔵", "🔴"].includes(reaction.emoji.name) &&
        !user.bot &&
        user.id != challenge[0].challenged_id &&
        user.id != challenge[0].challenger_id
      );
    };

    res
      .awaitReactions({
        filter: collectorFilter,
        max: 1,
        time: 1000 * 60 * 10,
        errors: ["time"],
      })
      .then(async (collected) => {
        const reaction = collected.first();

        if (reaction._emoji.name == "🔴") {
          const { data: challengerIncrement, error: errorCIncrement } =
            await supabase.rpc("increment", {
              x: 2 * challenge[0].bet,
              row_id: challenge[0].challenger_id,
            });

          const { data: updatedChallenge, error: errorChallenge } =
            await supabase
              .from("challenge")
              .update({ finished: true })
              .eq("id", challenge[0].id);

          res.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🥊 ${
                    challenge[0].challenger_name
                  } a gagné le challenge !\nIl a gagné ${
                    challenge[0].bet * 2
                  } cramptés`
                )
                .setColor("Green"),
            ],
          });
        } else {
          const { data: challengerIncrement, error: errorCIncrement } =
            await supabase.rpc("increment", {
              x: 2 * challenge[0].bet,
              row_id: challenge[0].challenged_id,
            });

          const { data: updatedChallenge, error: errorChallenge } =
            await supabase
              .from("challenge")
              .update({ finished: true })
              .eq("id", challenge[0].id);

          res.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🥊 ${
                    challenge[0].challenged_name
                  } a gagné le challenge !\nIl a gagné ${
                    challenge[0].bet * 2
                  } cramptés`
                )
                .setColor("Green"),
            ],
          });
        }
      })
      .catch((collected) => {
        console.log(collected);
        res.reply(
          `😢 Une erreur est survenue pendant la validation du challenge`
        );
      });
  },
};