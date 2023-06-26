const { EmbedBuilder } = require("discord.js");

const reply = (message, content, color) => {
  message.reply({
    embeds: [new EmbedBuilder().setDescription(content).setColor(color)],
  });
};

module.exports = reply;
