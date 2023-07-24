const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config");
const { supabase } = require("../../../index");
const reply = require("../../../utils/reply");
const { PET_TYPE, BUY_EGG, NEXT_EVOLUTION } = require("../../../utils/pet");

module.exports = {
  config: {
    name: "mypet", // Name of Command
    description: "select a type for your pet", // Command Description
    usage: "?claimpet <AIR | EARTH | FIRE | WATER | LIGHTNING>", // Command usage
  },
  permissions: "SendMessages", // User permissions needed
  owner: false, // Owner only?
  run: async (client, message, args, prefix, config, db) => {
    const type = args[0];
    // execute
    const { data, error } = await supabase
      .from("crampteur")
      .select()
      .eq("id", message.author.id);

    if (!data[0].pet_name) {
      reply(
        message,
        `🥚 Tu n'as pas adopté de cramptos. Pour cela, utilise la commande ?claimpet, cela coûte ${BUY_EGG} cramptés ! 💰`,
        "Orange"
      );

      return;
    } else {
      reply(
        message,
        `🥚 ${data[0].pet_name} est au stade ${
          data[0].pet_stage == 0 ? "d'oeuf" : data[0].pet_stage
        }. 🥚 \n
        ${
          NEXT_EVOLUTION[data[0].pet_stage]
            ? `Il peut évoluer encore une fois pour ${
                NEXT_EVOLUTION[data[0].pet_stage]
              } cramptés 💰`
            : "Il ne peut plus évoluer davantage pour l'instant !"
        }`,
        "Green"
      );

      const filename =
        data[0].pet_stage > 0
          ? "img/" + data[0].pet_type + "_E" + data[0].pet_stage + ".png"
          : "img/" + data[0].pet_type + "_EGG.png";
      message.reply({
        files: [filename],
      });
      return;
    }
  },
};
