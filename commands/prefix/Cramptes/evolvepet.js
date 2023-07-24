const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");
const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");
const { PET_TYPE, BUY_EGG, NEXT_EVOLUTION } = require("../../../utils/pet");

module.exports = {
  config: {
    name: "evolvepet", // Name of Command
    description: "evolve your cramptos to the next stage", // Command Description
    usage: "?evolvepet", // Command usage
  },
  permissions: "SendMessages", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    const type = args[0];
    if (args.length != 0) {
      reply(
        message,
        `⛔️ Mauvaise utilisation de la commande challenge ⛔️\n Tu dois l'utiliser comme cela : \n?evolvepet"`,
        "Red"
      );

      return;
    }

    // execute
    const { data, error } = await supabase
      .from("crampteur")
      .select()
      .eq("id", message.author.id);

    if (data[0].pet_stage < 0) {
      reply(
        message,
        `🥚 Tu n'as pas encore acheté ton cramptos. Utilise la commande ?claimpet pour acheter ton familier ! 🥚`,
        "Red"
      );
      return;
    }

    if (data[0].pet_stage > NEXT_EVOLUTION.length - 1) {
      reply(
        message,
        `🥚 Ton familier ne semble pas pouvoir évoluer une nouvelle fois pour l'instant ! 🥚`,
        "Purple"
      );
      return;
    }

    if (data[0].cramptes_amount < NEXT_EVOLUTION[data[0].pet_stage]) {
      reply(
        message,
        `🥚 Tu n'as pas assez de cramptés pour évoluer ton cramptos, cela coûte ${
          NEXT_EVOLUTION[data[0].pet_stage]
        } cramptés ! 💰`,
        "Orange"
      );

      return;
    }

    const stage = data[0].pet_stage;

    const { data: updatedCrampteur, error: errorCrampteur } = await supabase
      .from("crampteur")
      .update({
        pet_stage: stage + 1,
        cramptes_amount: data[0].cramptes_amount - NEXT_EVOLUTION[stage],
      })
      .eq("id", message.author.id);

    reply(
      message,
      `🥚 ${data[0].pet_name}, le cramptos de ${
        data[0].username
      }, a évolué ! 🥚\n ${
        NEXT_EVOLUTION[stage + 1]
          ? `La prochaine évolution coûtera ${
              NEXT_EVOLUTION[stage + 1]
            } cramptés 💰`
          : "Il ne peut plus évoluer davantage pour l'instant !"
      }`,
      "Green"
    );

    const filename = "img/" + data[0].pet_type + "_E" + (stage + 1) + ".png";
    message.reply({
      files: [filename],
    });

    return;
  },
};
