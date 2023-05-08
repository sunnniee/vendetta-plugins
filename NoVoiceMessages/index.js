(function(i,v,m,r,a,g,d){"use strict";function S(){return d.useProxy(a.storage),React.createElement(m.ReactNative.ScrollView,null,React.createElement(g.Forms.FormSwitchRow,{label:"Remove voice message button from chat",subLabel:"Restart plugin to apply (for both settings)",onValueChange:function(o){a.storage.voiceMessageButton=o},value:a.storage.voiceMessageButton??!0}),React.createElement(g.Forms.FormSwitchRow,{label:"Remove voice messages altogether",onValueChange:function(o){a.storage.voiceMessages=o},value:a.storage.voiceMessages??!1}))}const E=1n<<46n;let s=[];var h={onLoad:function(){const o=v.findByStoreName("PermissionStore"),{voiceMessageButton:t,voiceMessages:u}=a.storage;s.push((t??!0)&&r.instead("can",o,function(c,f){return c[0]===E?!1:f(...c)}),u&&function(){const c=m.FluxDispatcher._actionHandlers._orderedActionHandlers,[f,b,A]=Object.entries(c).filter(function(e){let[n]=e;return["LOAD_MESSAGES_SUCCESS","MESSAGE_CREATE","MESSAGE_UPDATE"].includes(n)}).map(function(e){let[n,l]=e;return l.find(function(M){return M.name==="MessageStore"})});return[r.before("actionHandler",f,function(e){e[0].messages&&=e[0].messages.filter(function(n){return n.attachments.every(function(l){return!l.waveform})})}),r.before("actionHandler",b,function(e){e[0].message?.attachments?.some(function(n){return n.waveform})&&(e[0].message={})}),r.before("actionHandler",A,function(e){e[0].message?.attachments?.some(function(n){return n.waveform})&&(e[0].message={})})]}())},onUnload:function(){s.forEach(function(t){typeof t=="function"?t():Array.isArray(t)&&t.forEach(function(u){return u()})});const o=s.length;for(let t=0;t<o;t++)s.pop()},settings:S};return i.default=h,Object.defineProperty(i,"__esModule",{value:!0}),i})({},vendetta.metro,vendetta.metro.common,vendetta.patcher,vendetta.plugin,vendetta.ui.components,vendetta.storage);
