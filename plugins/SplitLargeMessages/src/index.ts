import { findByProps, findByStoreName } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import settings from "./settings.js";

const unpatch: () => boolean = () => false;
storage.splitOnWords ??= false;

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

function intoChunks(content: string, maxChunkLength: number): string[] | false {
    const chunks = [] as string[];

    if (!storage.splitOnWords) {
        chunks.push(
            content.split("\n").reduce((currentChunk, paragraph) => {
                if (currentChunk.length + paragraph.length + 2 > maxChunkLength) {
                    chunks.push(currentChunk);
                    return paragraph + "\n";
                }
                if (!currentChunk) return paragraph + "\n";
                return currentChunk + paragraph + "\n";
            }, "")
        );
    }
    if (chunks.length && !chunks.some(chunk => chunk.length > maxChunkLength))
        return chunks.map(c => c.trim());

    chunks.length = 0;
    chunks.push(
        content.split(" ").reduce((currentChunk, word) => {
            if (currentChunk.length + word.length + 2 > maxChunkLength) {
                chunks.push(currentChunk);
                return word + " ";
            }
            if (!currentChunk) return word + " ";
            return currentChunk + word + " ";
        }, "")
    );

    if (chunks.some(chunk => chunk.length > maxChunkLength)) return false;
    return chunks.map(c => c.trim());
}

export default {
    onLoad() {
        const ChannelStore = findByStoreName("ChannelStore");
        const MessageActions = findByProps("sendMessage", "editMessage");
        const Constants = findByProps("MAX_MESSAGE_LENGTH");
        const maxLength = findByStoreName("UserStore").getCurrentUser()?.premiumType === 2 ? 4000 : 2000;

        Constants.MAX_MESSAGE_LENGTH = 2 ** 30;
        Constants.MAX_MESSAGE_LENGTH_PREMIUM = 2 ** 30;
        unpatch?.();
        before("sendMessage", MessageActions, args => {
            const [channelId, { content }] = args;
            if (content?.length < maxLength) return;

            const chunks = intoChunks(content, maxLength);
            if (!chunks) {
                args[1].content = "";
                return showToast("Failed to split message", getAssetIDByName("Small"));
            }
            args[1].content = chunks.shift();

            const channel = ChannelStore.getChannel(channelId);
            (async () => {
                for (const chunk of chunks) {
                    await sleep(Math.max(channel.rateLimitPerUser, 1000));
                    await MessageActions._sendMessage(
                        channelId,
                        {
                            invalidEmojis: args[1].invalidEmojis,
                            validNonShortcutEmojis: args[1].validNonShortcutEmojis,
                            tts: false,
                            content: chunk,
                        },
                        {}
                    );
                }
            })();
        });
    },
    onUnload: () => {
        unpatch();
        const Constants = findByProps("MAX_MESSAGE_LENGTH");
        Constants.MAX_MESSAGE_LENGTH = 2000;
        Constants.MAX_MESSAGE_LENGTH_PREMIUM = 4000;
    },
    settings,
};
