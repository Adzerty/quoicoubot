const { EmbedBuilder } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const config = require("../../../config/config");
const dateformat = import("dateformat");

const fetch = require("node-fetch");

const supabaseUrl = config.Supabase.URL;
const supabaseKey = config.Supabase.KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const riotKey = config.Riot.KEY;

module.exports = {
  config: {
    name: "lolbetvalidate", // Name of Command
    description: "Validate a previous bet", // Command Description
    usage: "?lolbetverify", // Command usage
  },
  permissions: ["SendMessages"], // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute
    const { data: bet, errorLolbet } = await supabase
      .from("lolbet")
      .select()
      .eq("crampteur_id", message.author.id)
      .eq("finished", false);

    if (bet.length == 0) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`⛔️ Aucun pari à valider ⛔️`)
            .setColor("Red"),
        ],
      });

      return;
    }

    const matchsFetch = await fetch(
      `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${bet[0].puuid}/ids?count=1`,
      {
        headers: {
          "X-Riot-Token": riotKey,
        },
      }
    );

    const resMatchs = await matchsFetch.json();

    const id = resMatchs[0];

    const matchFetch = await fetch(
      `https://europe.api.riotgames.com/lol/match/v5/matches/${id}`,
      {
        headers: {
          "X-Riot-Token": riotKey,
        },
      }
    );
    const resMatch = await matchFetch.json();

    if (bet[0].match_beginning_timestamp <= resMatch.info.gameStartTimestamp) {
      if (
        resMatch.info.gameStartTimestamp - bet[0].match_beginning_timestamp <
        1000000
      ) {
        const participant = resMatch.info.participants.find(
          (p) => p.puuid == bet[0].puuid
        );

        const { data: betUpdated, errorLolbetUpdated } = await supabase
          .from("lolbet")
          .update({ finished: true })
          .eq("id", bet[0].id);

        if (participant.win == bet[0].win_or_lose) {
          const { data, error: errorIncrement } = await supabase.rpc(
            "increment",
            {
              x: bet[0].bet * bet[0].multiplier,
              row_id: message.author.id,
            }
          );

          message.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🎉 Pari réussi ! Tu as gagné ${
                    bet[0].bet * bet[0].multiplier
                  } cramptés ! 🎉`
                )
                .setColor("Green"),
            ],
          });
        } else {
          message.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(`🫣 Aie aie aie tu as perdu tes cramptés 🫣`)
                .setColor("Red"),
            ],
          });
        }
        return;
      }
    } else {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⏰ La game est toujours en cours, il n'est pas possible de valider le pari ! ⏰`
            )
            .setColor("Yellow"),
        ],
      });

      return;
    }

    const { data: betUpdated, errorLolbetUpdated } = await supabase
      .from("lolbet")
      .update({ finished: true })
      .eq("id", bet[0].id);

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `👋 Le pari est trop vieux, c'est ciao les cramptos 👋`
          )
          .setColor("Red"),
      ],
    });
  },
};
