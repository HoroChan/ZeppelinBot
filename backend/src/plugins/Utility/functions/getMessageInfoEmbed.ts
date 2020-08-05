import { PluginData } from "knub";
import { UtilityPluginType } from "../types";
import { Constants, EmbedOptions } from "eris";
import moment from "moment-timezone";
import humanizeDuration from "humanize-duration";
import { chunkMessageLines, preEmbedPadding, trimEmptyLines, trimLines } from "../../../utils";
import { getDefaultPrefix } from "knub/dist/commands/commandUtils";

const MESSAGE_ICON = "https://cdn.discordapp.com/attachments/740650744830623756/740685652152025088/message.png";

export async function getMessageInfoEmbed(
  pluginData: PluginData<UtilityPluginType>,
  channelId: string,
  messageId: string,
): Promise<EmbedOptions | null> {
  const message = await pluginData.client.getMessage(channelId, messageId).catch(() => null);
  if (!message) {
    return null;
  }

  const embed: EmbedOptions = {
    fields: [],
  };

  embed.author = {
    name: `Message:  ${message.id}`,
    icon_url: MESSAGE_ICON,
  };

  const createdAt = moment(message.createdAt, "x");
  const messageAge = humanizeDuration(Date.now() - message.createdAt, {
    largest: 2,
    round: true,
  });

  const editedAt = message.editedTimestamp && moment(message.editedTimestamp, "x");
  const editAge =
    message.editedTimestamp &&
    humanizeDuration(Date.now() - message.editedTimestamp, {
      largest: 2,
      round: true,
    });

  const type =
    {
      [Constants.MessageTypes.DEFAULT]: "Regular message",
      [Constants.MessageTypes.CHANNEL_PINNED_MESSAGE]: "System message",
      [Constants.MessageTypes.GUILD_MEMBER_JOIN]: "System message",
      [Constants.MessageTypes.USER_PREMIUM_GUILD_SUBSCRIPTION]: "System message",
      [Constants.MessageTypes.USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1]: "System message",
      [Constants.MessageTypes.USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2]: "System message",
      [Constants.MessageTypes.USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3]: "System message",
      [Constants.MessageTypes.CHANNEL_FOLLOW_ADD]: "System message",
      [Constants.MessageTypes.GUILD_DISCOVERY_DISQUALIFIED]: "System message",
      [Constants.MessageTypes.GUILD_DISCOVERY_REQUALIFIED]: "System message",
    }[message.type] || "Unknown";

  embed.fields.push({
    name: preEmbedPadding + "Message information",
    value: trimEmptyLines(
      trimLines(`
      ID: \`${message.id}\`
      Channel: <#${message.channel.id}>
      Channel ID: \`${message.channel.id}\`
      Created: **${messageAge} ago** (\`${createdAt.format("MMM D, YYYY [at] H:mm [UTC]")}\`)
      ${editedAt ? `Edited at: **${editAge} ago** (\`${editedAt.format("MMM D, YYYY [at] H:mm [UTC]")}\`)` : ""}
      Type: **${type}**
      Link: [**Go to message ➔**](https://discord.com/channels/${pluginData.guild.id}/${message.channel.id}/${
        message.id
      })
    `),
    ),
  });

  const authorCreatedAt = moment(message.author.createdAt);
  const authorAccountAge = humanizeDuration(Date.now() - message.author.createdAt, {
    largest: 2,
    round: true,
  });

  const authorJoinedAt = message.member && moment(message.member.joinedAt);
  const authorServerAge =
    message.member &&
    humanizeDuration(Date.now() - message.member.joinedAt, {
      largest: 2,
      round: true,
    });

  embed.fields.push({
    name: preEmbedPadding + "Author information",
    value: trimLines(`
      Name: **${message.author.username}#${message.author.discriminator}**
      ID: \`${message.author.id}\`
      Created: **${authorAccountAge} ago** (\`${authorCreatedAt.format("MMM D, YYYY [at] H:mm [UTC]")}\`)
      ${
        authorJoinedAt
          ? `Joined: **${authorServerAge} ago** (\`${authorJoinedAt.format("MMM D, YYYY [at] H:mm [UTC]")}\`)`
          : ""
      }
      Mention: <@!${message.author.id}>
    `),
  });

  const textContent = message.content || "<no text content>";
  const chunked = chunkMessageLines(textContent, 1014);
  for (const [i, chunk] of chunked.entries()) {
    embed.fields.push({
      name: i === 0 ? preEmbedPadding + "Text content" : "[...]",
      value: chunk,
    });
  }

  if (message.attachments.length) {
    embed.fields.push({
      name: preEmbedPadding + "Attachments",
      value: message.attachments[0].url,
    });
  }

  if (message.embeds.length) {
    const prefix = pluginData.guildConfig.prefix || getDefaultPrefix(pluginData.client);
    embed.fields.push({
      name: preEmbedPadding + "Embeds",
      value: `Message contains an embed, use \`${prefix}source\` to see the embed source`,
    });
  }

  return embed;
}
