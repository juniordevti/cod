 // ==UserScript==
// @name        BASIC BOTS MANAGER
// @namespace  https://wormax.io
// @version      1.0
// @description  DISABLE ANY OTHER REVIVE / CONTROL SCRIPT.
// @author       ©WFBM APP | telegram : @wfbm_app
// @match       https://wormax.io/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    const PREFIX = '__pf';
    const OVERLAY_ID = PREFIX + 'Overlay';
    const LIST_ID = PREFIX + 'List';
    const STATUS_ID = PREFIX + 'Status';
    let currentTargetName = null;

    function createParentOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const d = document.createElement('div');
        d.id = OVERLAY_ID;
        d.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:rgba(0,0,0,0.88);color:#fff;border:2px solid #4CAF50;border-radius:10px;padding:14px 18px;font-family:"Segoe UI",monospace;font-size:13px;min-width:220px;max-width:280px;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none;box-shadow:0 0 20px rgba(0,0,0,0.8),0 0 5px rgba(76,175,80,0.3);';
        const h = document.createElement('div');
        h.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
        const t = document.createElement('span');
        t.textContent = 'BASIC WFBM';
        t.style.cssText = 'font-weight:bold;font-size:15px;color:#4CAF50;';
        const s = document.createElement('span');
        s.id = STATUS_ID;
        s.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#f44336;display:inline-block;';
        s.title = 'Not connected';
        h.appendChild(t);
        h.appendChild(s);
        d.appendChild(h);
        const sep = document.createElement('div');
        sep.style.cssText = 'border-bottom:1px solid #333;margin-bottom:8px;';
        d.appendChild(sep);
        const l = document.createElement('div');
        l.id = LIST_ID;
        l.style.cssText = 'max-height:400px;overflow-y:auto;';
        l.innerHTML = '<div style="color:#888;font-style:italic;padding:4px 0;">Waiting...</div>';
        d.appendChild(l);
        document.body.appendChild(d);
    }

    function sendSelectToGame(idx) {
        const iframe = document.querySelector('iframe#SnakeGame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'PF_SELECT_TARGET', index: idx }, '*');
        }
    }

    function updateOverlay(data) {
        const list = document.getElementById(LIST_ID);
        const statusDot = document.getElementById(STATUS_ID);
        if (!list || !statusDot) return;
        const inGame = data.inGame === true;
        const isDead = data.isDead === true;
        statusDot.style.background = inGame ? (isDead ? '#FF9800' : '#4CAF50') : '#f44336';
        if (!inGame) {
            list.innerHTML = '<div style="color:#888;font-style:italic;padding:4px 0;">Not in game</div>';
            return;
        }
        const members = data.members || [];
        if (members.length === 0) {
            list.innerHTML = '<div style="color:#888;font-style:italic;padding:4px 0;">No party members</div>';
            return;
        }
        if (data.targetName !== undefined && data.targetName !== null) {
            currentTargetName = data.targetName;
        }
        list.innerHTML = '';
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const online = m.online;
            const isTarget = m.name === currentTargetName && online;
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #222;';
            const left = document.createElement('span');
            left.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;';
            const dot = document.createElement('span');
            dot.style.cssText = 'font-size:11px;color:' + (online ? '#4CAF50' : '#f44336');
            dot.textContent = online ? '●' : '○';
            const ns = document.createElement('span');
            ns.style.cssText = online ? 'color:#ddd;' : 'color:#888;text-decoration:line-through;';
            ns.textContent = (i + 1) + '. ' + (m.name || '---');
            if (isTarget) {
                ns.textContent += ' 🎯';
                ns.style.color = '#4CAF50';
                ns.style.fontWeight = 'bold';
            }
            left.appendChild(dot);
            left.appendChild(ns);
            row.appendChild(left);
            if (online) {
                const btn = document.createElement('button');
                btn.textContent = isTarget ? '✓' : '+';
                btn.setAttribute('data-idx', i);
                btn.style.cssText = 'margin-left:8px;padding:2px 8px;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;' +
                    (isTarget ? 'background:#4CAF50;color:#000;font-weight:bold;' : 'background:#333;color:#aaa;');
                // Robust mouse + touch/pointer handling.
                // pointerdown fires immediately and avoids conflicts with the game canvas.
                var targetPressHandled = false;

                function handleTargetPress(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (e.type === 'click' && targetPressHandled) {
                        targetPressHandled = false;
                        return false;
                    }

                    if (e.type === 'pointerup') {
                        targetPressHandled = true;
                    }

                    var idx = parseInt(this.getAttribute('data-idx'), 10);
                    if (!Number.isNaN(idx)) {
                        sendSelectToGame(idx);
                    }
                    return false;
                }

                btn.addEventListener('pointerup', handleTargetPress, { passive: false });
                btn.addEventListener('click', handleTargetPress, { passive: false });

                // Prevent the browser from treating the button press as scrolling/gesture.
                btn.style.touchAction = 'none';
                btn.style.webkitUserSelect = 'none';
                btn.style.userSelect = 'none';
                btn.style.webkitTouchCallout = 'none';
                row.appendChild(btn);
            }
            list.appendChild(row);
        }
    }

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'PF_PARTY_DATA_V43') {
            updateOverlay(event.data);
        }
    });

    createParentOverlay();

    function injectPatch() {
        const iframe = document.querySelector('iframe#SnakeGame');
        if (!iframe) { setTimeout(injectPatch, 1000); return; }
        try {
            const win = iframe.contentWindow;
            const doc = win.document;
            if (win.__PF_V43_INJECTED__) return;
            if (!win.nesc) { setTimeout(injectPatch, 1000); return; }
            win.__PF_V43_INJECTED__ = true;

            const script = doc.createElement('script');
            script.textContent = `
(function(){
if(window.__PF_V43_RUNNING__)return;
window.__PF_V43_RUNNING__=true;
var targetName=null;
var lastLogTime=0;
var forceInterval=null;
var origMove=null;
var wasDead=false;
var reviveAttempts=0;
var reviveTimeout=null;
var s={members:{},myId:null,inGame:false,isDead:false,patched:false,reviving:false,myX:0,myY:0};

function gv(){try{return !!window.nesc?.INSTANCE_2?.gameView;}catch(e){return false;}}
function getMyView(){
try{
var g=window.nesc?.INSTANCE_2?.gameView;
if(!g)return null;
var m=g.getPlayerSnakeId();
if(!m)return null;
var v=m.intValue_0();
if(v===0)return null;
return g.getSnakeView_0(v);
}catch(e){return null;}
}
function isSnakeAlive(view){
if(!view)return false;
var snake=view.snake;
if(!snake)return false;
if(snake.alive_0!==undefined)return !!snake.alive_0;
if(snake.disappearingTime_0!==undefined)return snake.disappearingTime_0<=0;
if(snake.dead_0!==undefined)return !snake.dead_0;
return true;
}
function ingame(){
try{
var view=getMyView();
if(!view)return false;
if(!isSnakeAlive(view))return false;
s.myX=view.x_0||0;
s.myY=view.y_0||0;
return true;
}catch(e){return false;}
}
function getOnlineMembers(){
try{
var g=window.nesc?.INSTANCE_2?.gameView;
if(!g)return[];
var party=g.getParty()?.array||[];
var myId=g.getPlayerSnakeId()?.intValue_0()||0;
var list=[];
for(var i=0;i<party.length;i++){
var id=party[i].intValue_0();
if(id===myId)continue;
var view=g.getSnakeView_0(id);
if(view&&view.snake&&isSnakeAlive(view)){
list.push({name:view.snake.name_0,id:id});
}
}
return list;
}catch(e){return[];}
}
function selectTargetByIndex(idx){
var members=getOnlineMembers();
if(idx>=0&&idx<members.length){
targetName=members[idx].name;
lastLogTime=0;
restartForceMove();
}
}
function resolveTargetView(){
if(!targetName)return null;
try{
var g=window.nesc?.INSTANCE_2?.gameView;
if(!g)return null;
var party=g.getParty()?.array||[];
for(var i=0;i<party.length;i++){
var id=party[i].intValue_0();
var view=g.getSnakeView_0(id);
if(view&&view.snake&&view.snake.name_0===targetName&&isSnakeAlive(view)){
return view;
}
}
return null;
}catch(e){return null;}
}
function findReviveView(root){
if(!root)return null;
if(root.onRevive&&typeof root.onRevive.accept==="function")return root;
if(root.children&&typeof root.children.size_0==="number"){
for(var i=0;i<root.children.size_0;i++){
var f=findReviveView(root.children.get_3(i));
if(f)return f;
}
}
if(root.getChildren&&typeof root.getChildren==="function"){
var ch=root.getChildren();
if(ch&&typeof ch.size_0==="number"){
for(var j=0;j<ch.size_0;j++){
var f2=findReviveView(ch.get_3(j));
if(f2)return f2;
}
}
}
return null;
}
function patchRewardedVideo(){
if(s.patched)return;
try{
var p=nesca.RewardedVideoManager.prototype;
p.canShow=function(){return true;};
p.isLoading_0=function(){return false;};
p.load_5=function(){this.place="";};
p.doShow=function(a,b){if(b&&typeof b.onRewarded==="function")b.onRewarded();};
p.show_0=function(a,b){this.place=a;if(b){if(typeof b.onRewarded==="function")b.onRewarded();if(typeof b.onFinished==="function")b.onFinished(true);}};
p.skipLoad=function(){return true;};
s.patched=true;
console.log('✅ RewardedVideo patched');
}catch(e){console.log('Patch error:',e);}
}
function revive(){
if(s.reviving)return;
s.reviving=true;
reviveAttempts++;
console.log('🔄 Revive attempt #'+reviveAttempts);
try{
var app=nesc&&nesc.INSTANCE_2;
var root=app&&app.uiStage&&app.uiStage.root;
var view=findReviveView(root);
if(view&&view.onRevive&&typeof view.onRevive.accept==="function"){
console.log('✅ Found ReviveView, calling accept');
view.onRevive.accept(window.jl?jl.valueOf_32(false):false);
}else if(window.__wormaxReviveButton&&window.__wormaxReviveButton.clickListener){
console.log('✅ Using __wormaxReviveButton');
window.__wormaxReviveButton.clickListener.clicked(null,0,0);
}else if(nesc.portal&&nesc.portal.revive){
console.log('✅ Using portal.revive');
nesc.portal.revive().handle_2(function(r){console.log('Revive OK');},function(e){console.log('Revive fail:',e);});
}else{
console.log('❌ No revive method found');
}
}catch(e){console.log('Revive error:',e);}
setTimeout(function(){s.reviving=false;},3000);
}
function restartForceMove(){
if(!origMove)origMove=nesc.game.move;
if(forceInterval)return;
forceInterval=setInterval(function(){
var tv=resolveTargetView();
var mv=getMyView();
if(!tv||!mv)return;
var dx=tv.x_0-mv.x_0;
var dy=tv.y_0-mv.y_0;
var dir=Math.atan2(dy,dx);
origMove.call(nesc.game,dir,Date.now());
var now=Date.now();
if(now-lastLogTime>1000){
console.log('🚀 dir:',dir.toFixed(2),'dist:',Math.sqrt(dx*dx+dy*dy).toFixed(0));
lastLogTime=now;
}
},16);
}
function stopForceMove(){
if(forceInterval){clearInterval(forceInterval);forceInterval=null;}
}
function activateBoost(){
try{
var mv=getMyView();
if(!mv||!isSnakeAlive(mv))return;
var snake=mv.snake;
if(!snake)return;
var TURBO=window.nescg2?.TURBO;
if(!TURBO)return;
var game=window.nesc?.game;
if(!game||!game.useSkill)return;
if(snake.canUseSkill&&snake.canUseSkill(TURBO)){
game.useSkill(TURBO);
}
}catch(e){}
}
window.addEventListener('message',function(e){
if(e.data&&e.data.type==='PF_SELECT_TARGET'){
selectTargetByIndex(e.data.index);
}
});
function collect(){
try{
var g=window.nesc?.INSTANCE_2?.gameView;
if(!g)return{inGame:false,isDead:false,myId:null,members:[],targetName:targetName};
var m=g.getPlayerSnakeId();
var mv=m?m.intValue_0():0;
var ig=ingame();
var dead=gv()&&!ig;
s.inGame=ig;
s.isDead=dead;
s.myId=mv;

if(dead&&!wasDead){
console.log('💀 Player died');
patchRewardedVideo();
stopForceMove();
if(reviveTimeout)clearTimeout(reviveTimeout);
reviveTimeout=setTimeout(function(){
revive();
},1500);
}
if(!dead&&wasDead){
console.log('✅ Player revived');
if(targetName)restartForceMove();
}
wasDead=dead;

if(!ig)return{inGame:false,isDead:dead,myId:mv,members:[],targetName:targetName};
var p=g.getParty()?.array||[];
var cn={};
for(var i=0;i<p.length;i++){
var id=p[i].intValue_0();
if(id===mv)continue;
var view=g.getSnakeView_0(id);
var alive=isSnakeAlive(view);
var n=view&&view.snake?view.snake.name_0:null;
if(alive&&!n){for(var k in s.members){if(s.members[k].id===id){n=k;break;}}}
if(n){cn[n]=true;s.members[n]={id:id,online:alive,last:Date.now(),name:n};}
}
var now=Date.now();
var mem=[];
for(var nm in s.members){
var mb=s.members[nm];
if(cn[nm]){mb.online=true;mb.last=now;}
else{mb.online=false;}
mem.push({id:mb.id,online:mb.online,name:mb.name});
}
mem.sort(function(a,b){if(a.online&&!b.online)return -1;if(!a.online&&b.online)return 1;return (a.name||'').localeCompare(b.name||'');});
s.last=now;
return{inGame:true,isDead:false,myId:mv,members:mem,targetName:targetName};
}catch(e){return{inGame:false,isDead:false,myId:null,members:[],targetName:targetName};}
}
function send(d){
if(window.parent&&window.parent!==window){
window.parent.postMessage({type:'PF_PARTY_DATA_V43',inGame:d.inGame,isDead:d.isDead,myId:d.myId,members:d.members,targetName:d.targetName,timestamp:Date.now()},'*');
}
}
function loop(){send(collect());}
function wait(cb){var n=0;var iv=setInterval(function(){n++;if(gv()){clearInterval(iv);cb();}else if(n>300){clearInterval(iv);cb();}},200);}
wait(function(){loop();setInterval(loop,50);});
})();
`;
            doc.body.appendChild(script);
        } catch(e) {
            setTimeout(injectPatch, 2000);
        }
    }

    injectPatch();
})();
