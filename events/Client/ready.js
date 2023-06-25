const client = require("../../index");
const config = require("../../config/config.js");
const colors = require("colors");
const { EmbedBuilder } = require("discord.js");

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = config.Supabase.URL;
const supabaseKey = config.Supabase.KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  name: "ready.js",
};

const REACT_LUCK = 0.15;

const channelID = "1122502928176009296";

let firstReaction;

const checkForReaction = async (client) => {
  const r = Math.random();
  console.log(r);
  if (r < REACT_LUCK) {
    const won = Math.floor(Math.random() * 50) + 5;

    const channel = await client.channels.cache.get(channelID);
    const res = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${won} cramptés sauvages sont apparus, soit le premier à réagir pour les remporter`
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
        time: 60000,
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

        res.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🎉 ${firstReaction.username} a remporté les ${won} cramptés !`
              )
              .setColor("Purple"),
          ],
        });
      })
      .catch((collected) => {
        console.log(collected);
        res.reply("You reacted with neither a thumbs up, nor a thumbs down.");
      });
  }
};

client.once("ready", async () => {
  console.log(
    "\n" + `[READY] ${client.user.tag} is up and ready to go.`.brightGreen
  );

  setInterval(checkForReaction, 1000 * 60 * 5, client);
});
