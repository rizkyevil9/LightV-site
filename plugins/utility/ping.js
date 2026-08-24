export default {
  name: "ping",
  category: "utility",
  aliases: ["p", "pong"],
  description: "Check bot response time",
  usage: "ping",

  permissions: ["user"],

  async execute(ctx) {
    const start = Date.now();
    await ctx.reply("Pinging...");
    const end = Date.now();
    await ctx.reply(`Pong! Response time: ${end - start}ms`);
  }
};
