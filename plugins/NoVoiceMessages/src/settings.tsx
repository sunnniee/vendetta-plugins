import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

export default () => {
    useProxy(storage);

    return (
        <ReactNative.ScrollView>
            <Forms.FormSwitchRow
                label="Remove voice message button from chat"
                subLabel="Restart plugin to apply (for both settings)"
                onValueChange={(v) => {
                    storage.voiceMessageButton = v
                }}
                value={storage.voiceMessageButton ?? true}
            />
            <Forms.FormSwitchRow
                label="Remove voice messages altogether"
                onValueChange={(v) => {
                    storage.voiceMessages = v
                }}
                value={storage.voiceMessages ?? false}
            />
        </ReactNative.ScrollView>
    );
};