const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");
const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");
const { PET_TYPE, BUY_EGG, NEXT_EVOLUTION } = require("../../../utils/pet");

module.exports = {
  config: {
    name: "claimpet", // Name of Command
    description: "select a type for your pet", // Command Description
    usage: "?claimpet <AIR | EARTH | FIRE | WATER | LIGHTNING>", // Command usage
  },
  permissions: "SendMessages", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    const type = args[0];
    if (args.length != 2 || !PET_TYPE.includes(type)) {
      reply(
        message,
        `⛔️ Mauvaise utilisation de la commande challenge ⛔️\n Tu dois l'utiliser comme cela : \n?claimpet <AIR | EARTH | FIRE | WATER | LIGHTNING> name"`,
        "Red"
      );

      return;
    }

    // execute
    const { data, error } = await supabase
      .from("crampteur")
      .select()
      .eq("id", message.author.id);

    if (data[0].cramptes_amount < BUY_EGG) {
      reply(
        message,
        `🥚 Tu n'as pas assez de cramptés pour acheter ton oeuf, cela coûte ${BUY_EGG} cramptés ! 💰`,
        "Orange"
      );

      return;
    } else {
      if (data[0].pet_stage < 0) {
        const { data: updatedCrampteur, error: errorCrampteur } = await supabase
          .from("crampteur")
          .update({
            pet_stage: 0,
            pet_type: type,
            pet_name: args[1],
            cramptes_amount: data[0].cramptes_amount - BUY_EGG,
          })
          .eq("id", message.author.id);

        reply(
          message,
          `🥚 ${data[0].username} a adopté ${args[1]} le cramptos de type ${type} 🥚\n La prochaine évolution te coûtera ${NEXT_EVOLUTION[0]} cramptés 💰`,
          "Green"
        );

        const filename = "img/" + type + "_EGG.png";
        message.reply({
          files: [filename],
        });
        return;
      } else {
        reply(
          message,
          `🥚 Tu as déjà un familier évolué tu ne peux pas choisir un autre type 🥚`,
          "Red"
        );

        return;
      }
    }
  },
};
