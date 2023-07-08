const { client, supabase } = require("../../index");
const config = require("../../config/config.js");
const colors = require("colors");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready.js",
};

const REACT_LUCK = 0.1;

const channelID = "1122502928176009296";

let firstReaction;

const checkForReaction = async (client) => {
  const r = Math.random();
  console.log(r);
  if (r < REACT_LUCK) {
    let won = Math.floor(Math.random() * 120) + 15;

    const channel = await client.channels.cache.get(channelID);
    const res = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `🚨 ${won} cramptés sauvages sont apparus, soit le premier à réagir pour les remporter 🚨`
          )
          .setColor("Purple"),
      ],
    });

    res.react("🤙");

    const collectorFilter = (reaction, user) => {
      if (["🤙"].includes(reaction.emoji.name) && user.bot == false) {
        firstReaction = user;
        return true;
      } else {
        return false;
      }
      return;
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

        const { data, error: errorIncrement } = await supabase.rpc(
          "increment",
          {
            x: won,
            row_id: firstReaction.id,
          }
        );

        const { data: crampteur, error: crampteurError } = await supabase
          .from("crampteur")
          .select("username, cramptes_amount")
          .eq("id", firstReaction.id);

        console.log(crampteur);

        res.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🎉 ${crampteur[0].username} a remporté les ${won} cramptés !\nIl a désormais ${crampteur[0].cramptes_amount} cramptés 🎉`
              )
              .setColor("Purple"),
          ],
        });
      })
      .catch((collected) => {
        console.log(collected);
        res.reply("😢 Pas de chances, les cramptés ont disparu");
      });
  }
};

client.once("ready", async () => {
  console.log(
    "\n" + `[READY] ${client.user.tag} is up and ready to go.`.brightGreen
  );

  setInterval(checkForReaction, 1000, client);
});
