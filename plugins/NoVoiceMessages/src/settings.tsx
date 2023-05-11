import { ReactNative } from "@vendetta/metro/common";
import { ErrorBoundary, Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import { settingsObj } from "./index.js";

function onToggle(name: keyof typeof settingsObj, value: boolean) {
    storage ?? {}
    storage[name] = value;
    if (value) settingsObj[name].onEnable()
    else settingsObj[name].onDisable()
}

export default () => {
    useProxy(storage);

    return (
    <ErrorBoundary>
        <ReactNative.ScrollView>
            <Forms.FormSwitchRow
                label="Remove voice message button from chat"
                onValueChange={(v) => onToggle("voiceMessageButton", v)}
                value={storage.voiceMessageButton}
            />
            <Forms.FormSwitchRow
                label="Remove voice messages altogether"
                subLabel="Requires restart to remove already received voice messages"
                onValueChange={(v) => onToggle("voiceMessages", v)}
                value={storage.voiceMessages}
            />
        </ReactNative.ScrollView>
    </ErrorBoundary>
    );
};