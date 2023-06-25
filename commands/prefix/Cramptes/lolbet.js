const { EmbedBuilder } = require("discord.js");
const { supabase } = require("../../../index");
const config = require("../../../config/config");
const dateformat = import("dateformat");

const fetch = require("node-fetch");

const riotKey = config.Riot.KEY;

const WIN = "WIN";
const LOSE = "LOSE";

// const MULTIPLY_GAME_NON_STARTED = 2.5;
// const REASON_GAME_NON_STARTED =
//   "L'invocateur n'a pas encore commencé son match";

const MULTIPLY_GAME_BEGINNING = 1.8;
const REASON_GAME_BEGINNING =
  "L'invocateur vient tout juste de commencer sa game (moins de 5 minutes)";

const MULTIPLY_GAME_MIDDLE = 1.5;
const REASON_GAME_MIDDLE =
  "L'invocateur a récemment commencé son match (entre 5 et 20 minutes)";

const MULTIPLY_GAME_LATE = 1.1;
const REASON_GAME_LATE =
  "L'invocateur a commencé son match (plus de 20 minutes)";

const MULTIPLY_RANKED = 2.5 - MULTIPLY_GAME_BEGINNING;
const REASON_RANKED = "L'invocateur est en partie classée";

module.exports = {
  config: {
    name: "lolbet", // Name of Command
    description: "Bet on the next lol game of the given summoner", // Command Description
    usage: "?lolbet summonername bet", // Command usage
  },
  permissions: ["SendMessages"], // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    // execute

    if (
      args.length != 3 ||
      isNaN(args[1]) ||
      (args[2] != WIN && args[2] != LOSE)
    ) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Mauvaise utilisation de la commande lolbet ⛔️\n Tu dois l'utiliser comme cela : \n?lolbet <pseudo_d'invocateur> <mise> <WIN ou LOSE>`
            )
            .setColor("Red"),
        ],
      });

      return;
    }

    const summoner = args[0].replaceAll("_", " ");
    const cramptes = args[1];
    const winOrLose = args[2];

    const { data: bet, errorLolbet } = await supabase
      .from("lolbet")
      .select()
      .eq("crampteur_id", message.author.id)
      .eq("finished", false);

    console.log(bet);

    //Check if the user already has a bet started
    //if the bet isn't finished send a message to alert
    if (bet && bet.length > 0) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Impossible de valider le pari ! Tu as déjà parié  ${
                bet[0].bet
              } cramptés le ${new Date(
                bet[0].created_at
              ).toDateString()} à ${new Date(
                bet[0].created_at
              ).toTimeString()} pour la ${
                bet[0].win_or_lose == WIN ? "victoire" : "défaite"
              } du prochain match de ${bet[0].summoner_name}  ⛔️`
            )
            .setColor("Orange"),
        ],
      });

      return;
    }

    //If not
    const { data: user, errorUser } = await supabase
      .from("crampteur")
      .select()
      .eq("id", message.author.id);

    console.log("USER :");
    console.log(user);

    //check if the user has enough cramptes
    //if the user hasn't enough send a message to alert
    if (user[0].cramptes_amount < cramptes) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Impossible de valider le pari ! Tu n'as pas assez de cramptés\n
			  Mise : ${cramptes}\n
			  Total personnel : ${user[0].cramptes_amount} ⛔️`
            )
            .setColor("Orange"),
        ],
      });

      return;
    }
    //If he has
    //Bet creation

    const summonerNameFetch = await fetch(
      "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" +
        summoner,
      {
        headers: {
          "X-Riot-Token": riotKey,
        },
      }
    );

    const res = await summonerNameFetch.json();
    let puuid;
    let summonerId;

    if (res.status && res.status.status_code) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Impossible de valider le pari, l'invocateur n'existe pas ⛔️`
            )
            .setColor("Red"),
        ],
      });

      return;
    } else {
      puuid = res.puuid;
      summonerId = res.id;
    }

    const summonerSpectatorFetch = await fetch(
      `https://euw1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
      {
        headers: {
          "X-Riot-Token": riotKey,
        },
      }
    );

    const resSummonerSpectate = await summonerSpectatorFetch.json();
    console.log("SPECTATE : ");
    console.log(resSummonerSpectate);

    let multiply = 0;
    let reasons = [];

    let beginning = null;

    //Not in game
    if (resSummonerSpectate.status) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `⛔️ Impossible de valider le pari, l'invocateur ne joue pas actuellement ⛔️`
            )
            .setColor("Red"),
        ],
      });

      return;
    } else {
      //If the game started in the 5 minutes : x1.8
      //If the game started between 5 and 20 minutes : x1.5
      //If the game started 20 minutes ago : x1.2
      const gameDuration = resSummonerSpectate.gameLength;

      if (gameDuration < 300) {
        multiply = MULTIPLY_GAME_BEGINNING;
        reasons.push(REASON_GAME_BEGINNING);
      } else {
        if (gameDuration < 1200) {
          multiply = MULTIPLY_GAME_MIDDLE;
          reasons.push(REASON_GAME_MIDDLE);
        } else {
          multiply = MULTIPLY_GAME_LATE;
          reasons.push(REASON_GAME_LATE);
        }
      }

      const queueId = resSummonerSpectate.gameQueueConfigId;
      beginning = resSummonerSpectate.gameStartTime;

      //Ranked match
      //If its ranked game : +0.5 multiplier
      if (queueId == 420 || queueId == 440 || queueId == 700) {
        multiply += MULTIPLY_RANKED;
        reasons.push(REASON_RANKED);
      }
    }

    //create a bet and send a message to inform

    console;

    const { data: newBet, errorLolbet2 } = await supabase
      .from("lolbet")
      .insert({
        summoner_name: summoner,
        puuid: puuid,
        bet: cramptes,
        multiplier: multiply,
        crampteur_id: user[0].id,
        match_beginning_timestamp: beginning,
      });

    console.log(errorLolbet2);

    const { data, error: errorIncrement } = await supabase.rpc("increment", {
      x: cramptes * -1,
      row_id: message.author.id,
    });

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `✅ Pari validé ! \n
			  ${user[0].username} a misé ${cramptes} cramptés sur la ${
              winOrLose == WIN ? "victoire" : "défaite"
            } de ${summoner}\n
			
			Si tu remportes ton pari tu remporteras ${
        cramptes * multiply
      } (x${multiply}) cramptés pour l${
              reasons.length > 1 ? "es raisons suivantes" : "a raison suivante"
            }\n
			${reasons.map((r) => {
        return "-" + r + "\n";
      })}✅`
          )
          .setColor("Green"),
      ],
    });
  },
};
