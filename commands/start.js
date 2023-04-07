const fs = require("node:fs");
const { SlashCommandBuilder } = require("discord.js");

let start = 0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("starts sending blog updates"),
  async execute(interaction) {
    if (start == 1) {
      await interaction.reply({ content: "Already running", ephemeral: true });
    } else {
      start = 1;
      await interaction.reply({ content: "Success", ephemeral: true });
    }
    return ["start", interaction.channelId];
  },
};
