const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

let messages = {};
const regex =
  /\*\*(?:January|February|March|April|May|June|July|August|September|October|November|December) \d+, \d+:?\*\*/i;

async function get() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/ucdavis/ecs132/master/Blog.md"
    );
    if (!response.ok) {
      return "";
    }
    return response.text();
  } catch (error) {
    console.log(error);
  }
}

function make_embed(txt) {
  let found = txt.match(regex);
  if (found == null) return;
  let title = txt.substring(0, found.index + found[0].length);
  let desc = txt.substring(found.index + found[0].length);
  desc = desc.replace(/```[ \t]*r/, "```r");
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setURL("https://github.com/ucdavis/ecs132/blob/master/Blog.md")
    .setDescription(desc);
  return embed;
}

function find_snippet(str, index) {
  str = str.substring(index);
  let newest = str.search(regex);
  if (newest === -1) {
    return [-1, -1];
  }
  let until = str.substring(newest + 1).search(regex);
  if (until === -1) {
    return [-1, -1];
  }
  let message = str.substring(newest, until + newest);
  return [message, until + newest + index];
}

async function thing(id) {
  let d = await get();
  if (d == undefined) {
    return;
  }
  if (fs.existsSync("data/" + id)) {
    data = fs.readFileSync("data/" + id, "utf8");
  } else {
    data = "";
    fs.openSync("data/" + id, "w");
  }
  if (fs.existsSync("data/" + id + "_raw")) {
    raw = fs.readFileSync("data/" + id + "_raw", "utf8");
  } else {
    raw = "";
    fs.openSync("data/" + id + "_raw", "w");
  }
  let [message, index] = find_snippet(d, 0);
  if (message === -1) {
    if (fs.existsSync("data/" + id) && fs.statSync("data/" + id).size > 2)
      return;
  }
  let first = message;
  let second = "";

  let write = [];
  if (data !== message) {
    if (fs.existsSync("data/" + id + "_previous")) {
      previous = fs.readFileSync("data/" + id + "_previous", "utf8");
    } else {
      previous = "";
      fs.openSync("data/" + id + "_previous", "w");
    }
    if (fs.existsSync("data/" + id + "_third")) {
      third = fs.readFileSync("data/" + id + "_third", "utf8");
    } else {
      third = "";
      fs.openSync("data/" + id + "_third", "w");
    }

    while (data !== message && index < d.length) {
      if (message === previous) {
        fs.writeFile("data/" + id, first, (err) => {
          if (err) {
            console.error(err);
          }
        });
        return [write, 1, 0];
      }
      if (message === third) {
        fs.writeFile("data/" + id, first, (err) => {
          if (err) {
            console.error(err);
          }
        });
        fs.writeFile("data/" + id + "_previous", second, (err) => {
          if (err) {
            console.error(err);
          }
        });
        return [write, 1, 1];
      }
      if (!raw.includes(message)) write.unshift(message);
      [message, index] = find_snippet(d, index);
      if (second === "") {
        second = message;
      }
      if (message === -1) {
        break;
      }
    }

    fs.writeFile("data/" + id, first, (err) => {
      if (err) {
        console.error(err);
      }
    });
    fs.writeFile("data/" + id + "_previous", data, (err) => {
      if (err) {
        console.error(err);
      }
    });
    fs.writeFile("data/" + id + "_third", previous, (err) => {
      if (err) {
        console.error(err);
      }
    });
    fs.writeFile("data/" + id + "_raw", d, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  return [write, 0, 0];
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    let [com, id] = await command.execute(interaction);
    if (com === "start") {
      (async function send_messages() {
        let [ret1, ret2, ret3] = await thing(id);
        if (ret1 !== undefined && ret1.length != 0) {
          if (ret2 == 1 && ret3 == 0) {
            if (!messages.hasOwnProperty(id)) {
              messages[id] = {};
              return;
            }
            if (messages[id].first == "" || messages[id].first == undefined) {
              return;
            }
            messages[id].first.then((sent) => {
              sent.edit({ embeds: [make_embed(ret1[0])] });
            });
          }
          if (ret2 == 1 && ret3 == 1) {
            if (!messages.hasOwnProperty(id)) {
              messages[id] = {};
              return;
            }
            if (messages[id].first == "" || messages[id].first == undefined) {
              return;
            }
            messages[id].first.then((sent) => {
              sent.edit({ embeds: [make_embed(ret1[1])] });
            });
            if (!messages.hasOwnProperty(id)) {
              messages[id] = {};
              return;
            }
            if (messages[id].second == "" || messages[id].second == undefined) {
              return;
            }
            messages[id].second.then((sent) => {
              sent.edit({ embeds: [make_embed(ret1[0])] });
            });
          }
          if (ret2 == 0 && ret3 == 0) {
            let num = 0;
            ret1.forEach(function (el) {
              var run = setTimeout(function () {
                try {
                  if (!messages.hasOwnProperty(id)) {
                    messages[id] = {};
                  }
                  messages[id].second = messages[id].first;
                  messages[id].first = client.channels.cache
                    .get(id)
                    .send({ embeds: [make_embed(el)] });
                } catch (error) {
                  console.error(error);
                }
                clearTimeout(run);
              }, 1500 * num);
              num++;
            });
          }
        }
        setTimeout(send_messages, 60000);
      })();
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(token);
