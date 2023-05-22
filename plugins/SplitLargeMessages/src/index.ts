import { findByProps, findByStoreName } from "@vendetta/metro";
import { constants } from "@vendetta/metro/common";
import { instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import settings from "./settings.js"

let unpatch: () => any;
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
    if (chunks.length && !chunks.some(chunk => chunk.length > maxChunkLength)) return chunks.map(c => c.trim());

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

export function onLoad() {
    unpatch?.()
    const maxLength = findByStoreName("UserStore").getCurrentUser()?.premiumType === 2 ? 4000 : 2000;
    constants.MAX_MESSAGE_LENGTH = Number.MAX_SAFE_INTEGER;
    constants.MAX_MESSAGE_LENGTH_PREMIUM = Number.MAX_SAFE_INTEGER;

    const ChannelStore = findByStoreName("ChannelStore");
    const MessageActions = findByProps("sendMessage", "editMessage");

    unpatch = instead("sendMessage", MessageActions, (args, sendMessage) => {
        const [channelId, { content }] = args as [string, { content: string }];
        if (content?.length < maxLength) return sendMessage(...args);

        const chunks = intoChunks(content, maxLength);
        if (!chunks) 
            return showToast("Failed to split message", getAssetIDByName("Small"));

        const channel = ChannelStore.getChannel(channelId);
        (async () => {
            for (const chunk of chunks) {
                await sendMessage(channelId, { ...args[1], content: chunk });
                await sleep(Math.max(channel.rateLimitPerUser, 1000));
            }
        })();
    })
}

export default {
    onLoad,
    onUnload: unpatch,
    settings
}