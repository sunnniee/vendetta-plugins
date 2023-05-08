import { findByStoreName } from "@vendetta/metro"
import { FluxDispatcher } from "@vendetta/metro/common";
import { before, instead } from "@vendetta/patcher"
import { storage } from "@vendetta/plugin";
import settings from "./settings.js";

interface ActionHandler {
    name: string,
    actionHandler(e): void
}

const SEND_VOICE_MESSAGES = 1n << 46n;

let patches = [] as (Function | Function[])[]
const unpatch = () => {
    patches.forEach(p => {
        if (typeof p === "function") p()
        else if (Array.isArray(p)) p.forEach(f => f())
    })
    const len = patches.length
    for (let i = 0; i < len; i++) patches.pop()
}

export default {
  onLoad: () => {
    const PermissionStore = findByStoreName("PermissionStore")
    const { voiceMessageButton, voiceMessages } = storage;
    patches.push(
        (voiceMessageButton ?? true) && instead("can", PermissionStore, (args: [bigint, ...unknown[]], fn) => {
            if(args[0] === SEND_VOICE_MESSAGES) return false;
            else return fn(...args)
        }),
        voiceMessages && ((() => {
            const handlers = FluxDispatcher._actionHandlers._orderedActionHandlers as {[event: string]: ActionHandler[]}
            const [LoadMessagesSuccess, MessageCreate, MessageUpdate] = Object.entries(handlers)
            .filter(([evName]) => ["LOAD_MESSAGES_SUCCESS", "MESSAGE_CREATE", "MESSAGE_UPDATE"].includes(evName))
            .map(([_, handlerArray]) => handlerArray.find(h => h.name === "MessageStore"))
            return [
                before("actionHandler", LoadMessagesSuccess, (args) => {
                    args[0].messages &&= args[0].messages.filter(m => m.attachments.every(a => !a.waveform))
                }),
                before("actionHandler", MessageCreate, (args) => {
                    if (args[0].message?.attachments?.some(a => a.waveform))
                        args[0].message = {}
                }),
                before("actionHandler", MessageUpdate, (args) => {
                    if (args[0].message?.attachments?.some(a => a.waveform))
                        args[0].message = {}
                }),
            ]
        })() as Function[]),
    )
  },
  onUnload: unpatch,
  settings
}