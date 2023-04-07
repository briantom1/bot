const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
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

function find_snippet(str, index) {
  str = str.substring(index);
  let newest = str.search(
    /\*\*(?:January|February|March|April|May|June|July|August|September|October|November|December) \d+, \d+:?\*\*/i
  );
  if (newest === -1) {
    return [-1, -1];
  }
  let until = str
    .substring(newest + 1)
    .search(
      /\*\*(?:January|February|March|April|May|June|July|August|September|October|November|December) \d+, \d+:?\*\*/i
    );
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
  let [message, index] = find_snippet(d, 0);
  if (message === -1) {
    if (fs.existsSync("data/" + id) && fs.statSync("data/" + id).size > 2)
      return;
  }
  let first = message;

  let write = [];
  if (data !== message) {
    while (data !== message && index < d.length) {
      write.unshift(message);
      [message, index] = find_snippet(d, index);
      if (message === -1) {
        break;
      }
    }

    fs.writeFile("data/" + id, first, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  return write;
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
      setInterval(async () => {
        let ret = await thing(id);
        if (ret !== [] && ret !== undefined) {
          let num = 0;
          ret.forEach(function (el) {
            var run = setTimeout(function () {
              client.channels.cache.get(id).send(el);
              clearTimeout(run);
            }, 1500 * num);

            num++;
          });
        }
      }, 60000);
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(token);
