const fs = require("node:fs");
const { SlashCommandBuilder } = require("discord.js");

let s = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("starts sending blog updates"),
  async execute(interaction) {
    if (s.includes(interaction.channelId)) {
      await interaction.reply({ content: "Already running", ephemeral: true });
      return ["", -1];
    } else {
      s.push(interaction.channelId);
      await interaction.reply({ content: "Success", ephemeral: true });
    }
    return ["start", interaction.channelId];
  },
};
