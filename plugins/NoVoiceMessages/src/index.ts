import { findByProps, findByStoreName } from "@vendetta/metro"
import { before, instead } from "@vendetta/patcher"
import { storage as _storage } from "@vendetta/plugin";
import settings from "./settings.js";

interface ActionHandler {
    name: string,
    actionHandler(e): void
}

const SEND_VOICE_MESSAGES = 1n << 46n;

export const settingsObj = {
    voiceMessageButton: {
       byDefault: true,
        onEnable() {
            const PermissionStore = findByStoreName("PermissionStore")
            patches.voiceMessageButton.push(
                instead("can", PermissionStore, (args: [bigint, any /* channel */, ...unknown[]], fn) => {
                    if(args[0] === SEND_VOICE_MESSAGES && !args[2]) return false;
                    else return fn(...args)
                })
            )
        },
        onDisable() { unpatch("voiceMessageButton") }
    },

    voiceMessages: {
        byDefault: false,
        onEnable() {
            const MessageStoreHandlers = findByProps("handleMessageUpdate", "handleLoadMessagesSuccess")?.actions
            if (!MessageStoreHandlers) return console.error("[NoVoiceMessages] Failed to find action handlers for MessageStore!")

            patches.voiceMessages.push(
                before("LOAD_MESSAGES_SUCCESS", MessageStoreHandlers, (args) => {
                    args[0].messages &&= args[0].messages.filter(m => m.attachments?.every(a => !a.waveform))
                }),
                before("MESSAGE_CREATE", MessageStoreHandlers, (args) => {
                    if (args[0].message?.attachments?.some(a => a.waveform))
                        args[0].message = {}
                }),
                before("MESSAGE_UPDATE", MessageStoreHandlers, (args) => {
                    if (args[0].message?.attachments?.some(a => a.waveform))
                        args[0].message = {}
                }),
            )
        },
        onDisable() { unpatch("voiceMessages") }
    }
} as const

const patches: { [k in keyof typeof settingsObj]: Function[] } = {
    voiceMessageButton: [],
    voiceMessages: []
}
function unpatch(name?: keyof typeof patches) {
    if (name) {
        patches[name].forEach(fn => fn())
        patches[name].splice(0, patches[name].length)
    }
    else Object.entries(patches).forEach(([n, fns]) => {
        fns.forEach(fn => fn())
        patches[n].splice(0, patches[n].length)
    })
}

Object.entries(settingsObj).forEach(([settingName, { byDefault }]) => {
    if (!(settingName in _storage)) _storage[settingName] = byDefault
})

export default {
  onLoad: () => {
    const storage = _storage as { [k in keyof typeof settingsObj]: boolean }
    Object.entries(settingsObj).forEach(([setting, info]) => {
        if (storage[setting]) info.onEnable()
    })
  },
  onUnload: unpatch,
  settings
}