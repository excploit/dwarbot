// --- DWAR FARM BOTU v73 (MANUAL SAFE SELECT & NATIVE EXECUTION) ---
(function() {
    console.log("Bot v73 başlatılıyor...");

    if (typeof SparkMD5 === 'undefined') {
        var script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.0/spark-md5.min.js";
        script.onload = function() { main(); };
        document.head.appendChild(script);
    } else {
        main();
    }

    function main() {
        const SECRET_KEY = "41775e02da98ddb63c980dee";
        const STORAGE_CONF = "dwar_bot_v73_conf";
        const STORAGE_STATS = "dwar_bot_v73_stats";

        // --- AYARLAR ---
        var config;
        try {
            config = JSON.parse(localStorage.getItem(STORAGE_CONF)) || { themeColor: "#2ecc71", delayMin: 1000, delayMax: 3000, panelW: 360, panelH: 600 };
        } catch (e) {
            config = { themeColor: "#2ecc71", delayMin: 1000, delayMax: 3000, panelW: 360, panelH: 600 };
        }
        var stats = JSON.parse(localStorage.getItem(STORAGE_STATS)) || {};

        // Değişkenler
        var imageCache = {}; 
        var activeRequests = {}; 
        var allItems = [];
        var activeProfs = []; 
        
        var autoActive = false; 
        var isBusy = false; 
        var isMinimized = false;
        var monitorTimer = null; 
        var uiTimer = null;
        var currentTask = null; 
        var lastHeight = config.panelH + "px";
        const MONITOR_DELAY = 2500; // 2.5 sn bekleme

        const old = document.getElementById("dwarBotPanel");
        if (old) old.remove();

        // --- CSS ---
        const styleId = "dwarBotStylesV73";
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                #dwarBotPanel { font-family: 'Segoe UI', sans-serif; font-size: 13px; color: #eee; background: #1e1e1e; border: 2px solid ${config.themeColor}; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.9); display: flex; flex-direction: column; overflow: hidden; z-index: 2147483647; resize: both; min-width: 320px; min-height: 180px; position: fixed; top: 50px; left: 50px; width: ${config.panelW}px; height: ${config.panelH}px; box-sizing: border-box; transition: border-color 0.3s; }
                .dwar-header { padding: 12px 15px; background: ${config.themeColor}; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.2); flex-shrink: 0; transition: background 0.3s; }
                .dwar-tabs { display: flex; background: #252526; border-bottom: 1px solid #333; flex-shrink: 0; }
                .dwar-tab { flex: 1; padding: 12px; background: transparent; border: none; color: #888; cursor: pointer; font-weight: 600; border-bottom: 3px solid transparent; transition: all 0.2s; }
                .dwar-tab.active { color: #fff; border-bottom-color: ${config.themeColor}; background: #2d2d2d; }
                .dwar-content { flex: 1; position: relative; overflow: hidden; background: #1e1e1e; min-height: 0; display: flex; flex-direction: column; }
                .dwar-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; flex-direction: column; overflow-y: auto; }
                .dwar-view.show { display: flex; }
                .dwar-view-padded { padding: 20px; box-sizing: border-box; } 
                .dwar-btn { flex: 1; padding: 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: white; transition: all 0.2s; box-sizing: border-box; }
                .dwar-btn:hover { opacity: 0.9; }
                .dwar-input { width: 100%; padding: 10px; background: #333; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; margin-top: 5px; margin-bottom: 5px; }
                .dwar-label { display: block; color: #ccc; font-weight: 600; font-size: 12px; margin-bottom: 2px; }
                .dwar-ctrl-group { padding: 15px; border-bottom: 1px solid #333; background: #252526; flex-shrink: 0; }
                .dwar-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #333; transition: background 0.2s; }
                .dwar-list-item:hover { background: #252526; }
                .dwar-img-box { width: 32px; height: 32px; background: #000; border: 1px solid #555; border-radius: 4px; margin-right: 12px; overflow: hidden; flex-shrink: 0; position: relative; }
                .dwar-img-inner { width: 100%; height: 100%; background-size: 100% 100%; background-position: center; background-repeat: no-repeat; image-rendering: pixelated; }
                .dwar-btn-invert { background: #eee; color: ${config.themeColor}; border: 1px solid ${config.themeColor}; }
                .dwar-btn-invert:hover { background: ${config.themeColor}; color: #fff; }
                .dwar-log { height: 130px; background: #000; border-top: 2px solid #333; padding: 8px; font-family: monospace; font-size: 11px; color: #aaa; overflow-y: auto; flex-shrink: 0; box-sizing: border-box; }
                .dwar-status-container { position: relative; height: 40px; background: #222; border-top: 1px solid #333; border-radius: 0 0 6px 6px; overflow: hidden; flex-shrink: 0; }
                .dwar-status-text { position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 2; color: #ccc; font-size: 11px; font-weight: bold; text-shadow: 0 1px 2px #000; padding-right: 20px; }
                .dwar-progress-bar { position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: linear-gradient(90deg, #004d40, #27ae60); opacity: 0.4; z-index: 1; transition: width linear; }
                .dwar-prof-filters { display: flex; gap: 5px; margin-bottom: 10px; }
                .dwar-chip { flex: 1; padding: 6px; background: #333; border: 1px solid #444; color: #888; border-radius: 15px; font-size: 11px; font-weight: bold; cursor: pointer; text-align: center; transition: all 0.2s; user-select: none; }
                .dwar-chip:hover { background: #444; }
                .dwar-chip.active { background: ${config.themeColor}; color: white; border-color: ${config.themeColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                .dwar-stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }
            `;
            document.head.appendChild(style);
        }

        // --- PANEL HTML ---
        const panel = document.createElement('div');
        panel.id = "dwarBotPanel";
        
        const header = document.createElement('div');
        header.className = "dwar-header";
        header.innerHTML = `<span>Bot v73</span><div><span id="btnMin" style="cursor:pointer;margin-right:15px;padding:5px">[_]</span><span id="btnClose" style="cursor:pointer;padding:5px">[X]</span></div>`;
        panel.appendChild(header);

        const tabs = document.createElement('div');
        tabs.className = "dwar-tabs";
        tabs.innerHTML = `<button class="dwar-tab active" data="viewMain">ANA</button><button class="dwar-tab" data="viewStats">İSTATİSTİK</button><button class="dwar-tab" data="viewSettings">AYARLAR</button>`;
        panel.appendChild(tabs);

        const content = document.createElement('div');
        content.className = "dwar-content";

        // MAIN VIEW
        const vMain = document.createElement('div');
        vMain.id = "viewMain";
        vMain.className = "dwar-view show";
        vMain.innerHTML = `
            <div class="dwar-ctrl-group">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button id="btnRef" class="dwar-btn" style="background:#444; border:1px solid #666;">YENİLE</button>
                    <button id="btnAuto" class="dwar-btn" style="background:#004d40; border:1px solid #00695c;">OTO BAŞLAT</button>
                </div>
                <div class="dwar-prof-filters">
                    <div class="dwar-chip" data-prof="1">🌿 Bitki</div>
                    <div class="dwar-chip" data-prof="2">⛏️ Maden</div>
                    <div class="dwar-chip" data-prof="4">🐟 Balık</div>
                </div>
                <input id="inpFilter" class="dwar-input" placeholder="İsim Ara (Örn: Akik|Bakır)">
            </div>
            <div id="itemList" style="flex:1; overflow-y:auto;"></div>
            <div id="logArea" class="dwar-log"></div>
        `;
        content.appendChild(vMain);

        // STATS VIEW
        const vStats = document.createElement('div');
        vStats.id = "viewStats";
        vStats.className = "dwar-view dwar-view-padded";
        vStats.innerHTML = `
            <div id="statsHeader" style="padding:20px; border-radius:8px; text-align:center; margin-bottom:20px; box-shadow:0 4px 4px rgba(0,0,0,0.3);">
                <span style="font-size:12px; opacity:0.9; display:block; margin-bottom:5px;">TOPLAM TOPLANAN</span>
                <span id="totalStat" style="font-size:32px; font-weight:bold;">0</span>
            </div>
            <div id="statsList" style="flex:1; overflow-y:auto;"></div>
        `;
        content.appendChild(vStats);

        // SETTINGS VIEW
        const vSettings = document.createElement('div');
        vSettings.id = "viewSettings";
        vSettings.className = "dwar-view dwar-view-padded";
        vSettings.innerHTML = `
            <label class="dwar-label">Tema Rengi</label><input type="color" id="confColor" value="${config.themeColor}" style="width:100%; height:40px; min-height:40px; border:none; margin-bottom:20px; cursor:pointer; border-radius:4px;">
            <label class="dwar-label">Min Gecikme (ms)</label><input type="number" id="confMin" class="dwar-input" value="${config.delayMin}">
            <label class="dwar-label">Max Gecikme (ms)</label><input type="number" id="confMax" class="dwar-input" value="${config.delayMax}">
            <div style="margin-top:auto;">
                <button id="btnSave" class="dwar-btn" style="background:#2980b9; width:100%; margin-bottom:10px;">AYARLARI KAYDET</button>
                <button id="btnReset" class="dwar-btn" style="background:#c0392b; width:100%;">İSTATİSTİKLERİ SIFIRLA</button>
            </div>
        `;
        content.appendChild(vSettings);

        panel.appendChild(content);

        const miniBtn = document.createElement('button');
        miniBtn.innerText = "OTO BAŞLAT";
        miniBtn.className = "dwar-btn";
        miniBtn.style.cssText = "display:none; margin:15px; background:#004d40; flex-shrink:0;";
        panel.insertBefore(miniBtn, content);

        // STATUS BAR
        const statusContainer = document.createElement('div');
        statusContainer.className = "dwar-status-container";
        const progressBar = document.createElement('div');
        progressBar.className = "dwar-progress-bar";
        const statusText = document.createElement('div');
        statusText.className = "dwar-status-text";
        statusText.innerText = "Hazır - Başlat Bekleniyor";
        statusContainer.appendChild(progressBar);
        statusContainer.appendChild(statusText);
        panel.appendChild(statusContainer);

        document.body.appendChild(panel);
        dragElement(panel, header);

        // --- LOGIC ---
        const btnRef = document.getElementById('btnRef');
        const btnAuto = document.getElementById('btnAuto');
        const inpFilter = document.getElementById('inpFilter');
        const btnMin = document.getElementById('btnMin');

        var activeProfs = []; 
        
        panel.querySelectorAll('.dwar-chip').forEach(chip => {
            chip.onclick = () => {
                const p = chip.getAttribute('data-prof');
                if (activeProfs.includes(p)) { activeProfs = activeProfs.filter(x => x !== p); chip.classList.remove('active'); } 
                else { activeProfs.push(p); chip.classList.add('active'); }
                filterAndRender();
            };
        });

        // Tabs
        panel.querySelectorAll('.dwar-tab').forEach(t => {
            t.onclick = () => {
                panel.querySelectorAll('.dwar-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                panel.querySelectorAll('.dwar-view').forEach(v => v.classList.remove('show'));
                document.getElementById(t.getAttribute('data')).classList.add('show');
                if(t.getAttribute('data') === 'viewStats') renderStats();
            };
        });

        // Settings
        document.getElementById('btnSave').onclick = () => {
            config.themeColor = document.getElementById('confColor').value;
            config.delayMin = parseInt(document.getElementById('confMin').value);
            config.delayMax = parseInt(document.getElementById('confMax').value);
            config.panelW = parseInt(panel.style.width);
            config.panelH = parseInt(panel.style.height);
            localStorage.setItem(STORAGE_CONF, JSON.stringify(config));
            updateTheme();
            alert("Kaydedildi!");
        };

        document.getElementById('btnReset').onclick = () => {
            if(confirm("İstatistikler silinsin mi?")) {
                stats = {};
                localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
                renderStats();
            }
        };

        function updateTheme() {
            panel.style.borderColor = config.themeColor;
            header.style.background = config.themeColor;
            document.querySelector('.dwar-tab.active').style.borderBottomColor = config.themeColor;
            panel.querySelectorAll('.dwar-chip.active').forEach(c => c.style.backgroundColor = config.themeColor);
            
            // İstatistik Başlık Teması
            const statsHeader = document.getElementById('statsHeader');
            if(statsHeader) {
                const contrastColor = getContrastColor(config.themeColor);
                statsHeader.style.backgroundColor = config.themeColor;
                statsHeader.style.color = contrastColor;
                statsHeader.querySelector('#totalStat').style.color = contrastColor; 
                statsHeader.querySelector('span').style.color = contrastColor; 
                statsHeader.querySelector('span').style.opacity = '0.9'; 
            }

            filterAndRender();
        }
        
        function getContrastColor(hexColor) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hexColor = hexColor.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
            if (!result) return '#ffffff';
            const rgb = { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
            const L = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
            return L > 0.5 ? '#000000' : '#ffffff';
        }

        function renderStats() {
            const list = document.getElementById('statsList');
            const total = document.getElementById('totalStat');
            list.innerHTML = "";
            var sum = 0;
            const sortedKeys = Object.keys(stats).sort((a,b) => stats[b] - stats[a]);
            for(var k of sortedKeys) {
                sum += stats[k];
                list.innerHTML += `<div class="dwar-stat-row"><span style="color:#ccc">${k}</span><span style="color:white;font-weight:bold">${stats[k]}</span></div>`;
            }
            total.innerText = sum;
            if(sum === 0) list.innerHTML = "<div style='text-align:center;color:#666;margin-top:20px'>Veri yok.</div>";
            updateTheme();
        }
        
        function saveStat(n) { 
            if(!stats[n]) stats[n]=0; 
            stats[n]++; 
            localStorage.setItem(STORAGE_STATS, JSON.stringify(stats)); 
        }

        btnMin.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                if(panel.style.height !== "auto") lastHeight = panel.style.height;
                panel.style.height = "auto"; panel.style.resize = "none";
                content.style.display = "none";
                panel.querySelector('.dwar-tabs').style.display = "none";
                miniBtn.style.display = "block";
                btnMin.innerText = "[ + ]";
            } else {
                panel.style.height = lastHeight; panel.style.resize = "both";
                content.style.display = "flex";
                panel.querySelector('.dwar-tabs').style.display = "flex";
                miniBtn.style.display = "none";
                btnMin.innerText = "[ _ ]";
            }
        };
        document.getElementById('btnClose').onclick = () => { panel.remove(); clearTimeout(monitorTimer); clearInterval(uiTimer); };

        function setStatus(m, t) {
            statusText.innerText = m;
            statusText.style.color = (t === 'normal') ? '#ccc' : '#fff';
            if(t === 'error') progressBar.style.background = "#c0392b";
            else progressBar.style.background = "linear-gradient(90deg, #004d40, #27ae60)";
        }
        function addLog(m, c) {
            const d = document.createElement('div');
            d.style.borderBottom = "1px solid #222"; d.style.padding = "2px 0";
            d.innerHTML = `<span style="color:#555">[${new Date().toTimeString().split(' ')[0]}]</span> <span style="color:${c||'#ccc'}">${m}</span>`;
            document.getElementById('logArea').prepend(d);
        }
        function flash(b) {
            const t = b.innerText;
            b.innerText = "⛔"; b.style.background = "#b71c1c"; b.style.color = "#fff"; b.disabled = true;
            setTimeout(() => { 
                b.innerText = t; b.style.background = "#eee"; b.style.color = config.themeColor; b.disabled = false; 
            }, 1000);
        }
        function startVisualTimer(sec, name, num) {
            clearInterval(uiTimer); 
            var l = sec;
            progressBar.style.transition = 'none'; progressBar.style.width = '100%';
            void progressBar.offsetWidth; 
            progressBar.style.transition = `width ${sec}s linear`;
            progressBar.style.width = '0%';
            setStatus(`Toplanıyor: ${name} - ${num} ... ${l}s`, 'active');
            uiTimer = setInterval(() => {
                l--;
                if(l > 0) setStatus(`Toplanıyor: ${name} - ${num} ... ${l}s`, 'active');
                else { clearInterval(uiTimer); setStatus("Tamamlanıyor...", 'wait'); }
            }, 1000);
        }

        function refreshListFromModel() {
            itemList.innerHTML = "";
            allItems = [];
            try {
                try { main_frame.main.canvas.app.hunt.model.objects_updater.send_req_conf(); } catch(e){}
                setTimeout(() => {
                    const db = main_frame.main.canvas.app.hunt.model.Objects;
                    for(var key in db) {
                        var obj = db[key];
                        if(obj && obj.type === "farm") {
                             // KURAL: Sadece Görünür (Visible) Olanları Listele
                             var isListable = obj.mc && obj.mc.visible && obj.farming === "0";
                             
                             if(isListable) {
                                 allItems.push({
                                    name: obj.name,
                                    num: obj.num,
                                    prof: obj.prof,
                                    pic: obj.pic,
                                    dbKey: key
                                });
                             }
                        }
                    }
                    allItems.sort((a,b) => a.name.localeCompare(b.name));
                    filterAndRender();
                    if(!autoActive) setStatus(`Liste güncellendi (${allItems.length})`, "normal");
                }, 500);
            } catch(e) { setStatus("Veri Hatası", "error"); }
        }

        function performModelClick(key, num) {
            try {
                const db = main_frame.main.canvas.app.hunt.model.Objects;
                const targetObj = db[key];
                
                // KURAL: Sadece Görünür (Visible) Olanları Tıkla (Parent bakma)
                var isValid = targetObj && targetObj.mc && targetObj.mc.visible;

                if (isValid) {
                    var viewObj = targetObj.mc;
                    
                    // --- MANUEL GÜVENLİ SEÇİM & AKSİYON (v73 CORE) ---
                    // 1. Durumu 'Tıklanmış' yap (this.curObj["t"] = 1)
                    if (viewObj.curObj) viewObj.curObj["t"] = 1;
                    
                    // 2. Ana kontrolcüye "Seçildi" bildirimi yap (this.baseLnk.select_obj)
                    if (viewObj.baseLnk && typeof viewObj.baseLnk.select_obj === 'function') {
                        viewObj.baseLnk.select_obj(viewObj.curObj);
                    }
                    
                    // 3. Ana kontrolcüye "Topla" emri ver (this.baseLnk.apply_control_btn)
                    if (viewObj.baseLnk && typeof viewObj.baseLnk.apply_control_btn === 'function') {
                        viewObj.baseLnk.apply_control_btn(0, 2);
                        addLog("🎯 GÜVENLİ KOMUT GÖNDERİLDİ: (0, 2)", 'lime');
                        return true;
                    }
                    
                    // Eğer üsttekiler çalışmazsa ana yöneticiyi dene (Yedek)
                    if (main_frame.main.canvas.app.hunt && main_frame.main.canvas.app.hunt.apply_control_btn) {
                        main_frame.main.canvas.app.hunt.apply_control_btn(0, 2);
                        addLog("🎯 ANA KOMUT (MAIN) GÖNDERİLDİ", 'lime');
                        return true;
                    }
                }
                return false;
            } catch (e) { 
                console.error("Perform Click Crash:", e);
                return false; 
            }
        }

        function toggleAuto() {
            if(!autoActive) {
                autoActive = true; isBusy = true;
                btnAuto.innerText = "DURDUR"; btnAuto.style.background = "#c0392b";
                miniBtn.innerText = "DURDUR"; miniBtn.style.background = "#c0392b";
                addLog("Oto Başladı", "cyan"); monitorLoop();
            } else {
                autoActive = false; isBusy = false;
                btnAuto.innerText = "OTO BAŞLAT"; btnAuto.style.background = "#004d40";
                miniBtn.innerText = "OTO BAŞLAT"; miniBtn.style.background = "#004d40";
                clearTimeout(monitorTimer); clearInterval(uiTimer);
                setStatus("Durduruldu", "normal"); addLog("Oto Durdu", "orange");
                progressBar.style.width = "0%";
                currentTask = null;
            }
        }
        btnAuto.onclick = toggleAuto; miniBtn.onclick = toggleAuto;
        btnRef.onclick = () => refreshListFromModel();
        inpFilter.oninput = () => filterAndRender();

        function filterAndRender() {
            const v = inpFilter.value.toLowerCase();
            const k = v.split('|').map(x=>x.trim()).filter(x=>x.length>0);
            const r = allItems.filter(i => {
                const nm = k.length===0 || k.some(z=>i.name.toLowerCase().includes(z));
                const pm = activeProfs.length===0 || activeProfs.includes(i.prof);
                return nm && pm;
            });
            render(r); return r;
        }

        function render(l) {
            const itemList = document.getElementById('itemList');
            itemList.innerHTML = "";
            if(l.length===0) { itemList.innerHTML = "<div style='text-align:center;padding:20px;color:#666'>Sonuç yok</div>"; return; }
            l.forEach(i => {
                const r = document.createElement('div'); r.className = "dwar-list-item";
                
                let imgUrl = `https://dwar.gen.tr/images/data/farm/${i.pic}`;
                const safeId = i.num;
                const imgClass = `img-cache-${safeId}`;
                
                if(!imageCache[safeId] && !activeRequests[safeId]) {
                    activeRequests[safeId]=1;
                    fetch(imgUrl).then(res=>res.blob()).then(b=>{
                        const fr = new FileReader();
                        fr.onloadend = () => { imageCache[safeId]=fr.result; delete activeRequests[safeId]; document.querySelectorAll(`.${imgClass}`).forEach(e=>e.style.backgroundImage=`url('${fr.result}')`); };
                        fr.readAsDataURL(b);
                    });
                }
                const bg = imageCache[safeId] ? `background-image:url('${imageCache[safeId]}')` : '';
                let imH = `<div class="dwar-img-box"><div class="dwar-img-inner ${imgClass}" style="${bg}"></div></div>`;

                r.innerHTML = `<div style="display:flex;align-items:center">${imH}<span style="font-weight:bold;color:#ccc">${i.name} <span style="color:#666;font-size:11px">(${i.num})</span></span></div>`;
                
                const b = document.createElement('button'); 
                b.innerText = "AL"; 
                b.className = "dwar-btn dwar-btn-invert";
                b.style.flex = "none"; b.style.width = "60px"; b.style.fontSize = "11px"; b.style.padding = "6px";
                b.style.backgroundColor = "#eee"; b.style.color = config.themeColor; b.style.border = `1px solid ${config.themeColor}`;
                
                b.onmouseenter = () => { if(!b.disabled) { b.style.backgroundColor = config.themeColor; b.style.color = "#fff"; } };
                b.onmouseleave = () => { if(!b.disabled) { b.style.backgroundColor = "#eee"; b.style.color = config.themeColor; } };

                b.onclick = () => {
                    if(autoActive || isBusy) { addLog("Meşgul", "orange"); flash(b); return; }
                    
                    const success = performModelClick(i.dbKey, i.num);
                    if (success) {
                        currentTask = { name: i.name, num: i.num };
                        addLog(`Manuel Başladı: ${i.name} - ${i.num}`, "cyan");
                        isBusy = true; 
                        setStatus("İşlem başlatılıyor...", "active");
                        monitorTimer = setTimeout(monitorLoop, MONITOR_DELAY); 
                    } else {
                        addLog(`Hata: ${i.name} görseli yok!`, "red");
                        flash(b);
                        refreshListFromModel();
                    }
                };
                r.appendChild(b); itemList.appendChild(r);
            });
        }

        async function autoStep() {
            if(!autoActive) return;
            setStatus("Taranıyor...", "active");
            refreshListFromModel();
            
            setTimeout(() => {
                if(!autoActive) return;
                const t = filterAndRender();
                
                if(t.length > 0) {
                    const target = t[0];
                    const success = performModelClick(target.dbKey, target.num);

                    if (success) {
                        currentTask = { name: target.name, num: target.num };
                        addLog(`Toplamaya Başlandı: ${target.name} - ${target.num}`, "cyan");
                        setStatus("İşlem başlıyor...", "wait"); 
                        monitorTimer = setTimeout(monitorLoop, MONITOR_DELAY);
                    } else {
                        addLog("Erişilemedi", "orange");
                        monitorTimer = setTimeout(autoStep, 3000);
                    }
                } else {
                    addLog("Bulunamadı", "gray"); setStatus("Yok. Bekleniyor...", "wait");
                    monitorTimer = setTimeout(autoStep, 5000);
                }
            }, 500);
        }

        async function monitorLoop() {
            try {
                const r = await fetch('https://dwar.gen.tr/hunt_conf.php?mode=farm&action=chek&xy=0&end=1');
                const t = await r.text();
                const p = new DOMParser();
                const x = p.parseFromString(t, "text/xml");
                const req = x.getElementsByTagName("req")[0];

                if(req) {
                    const st = req.getAttribute("status");
                    const ft = parseInt(req.getAttribute("ftime"));
                    const sm = parseInt(req.getAttribute("stime"));
                    const nm = req.getAttribute("name"); 
                    const nu = req.getAttribute("num");
                    const msg = req.getAttribute("msg");
                    const lf = ft - sm;

                    if(st === "0") {
                        isBusy = false;
                        progressBar.style.width = "0%";
                        if(msg && msg.trim() !== "") {
                            addLog(`HATA: ${msg}`, "red"); setStatus(`Hata: ${msg}`, "error");
                            currentTask = null;
                            if(autoActive) monitorTimer = setTimeout(autoStep, 3000);
                        } else {
                            clearInterval(uiTimer);
                            if(currentTask) {
                                addLog(`Bitti: ${currentTask.name} - ${currentTask.num}`, "orange");
                                saveStat(currentTask.name);
                                currentTask = null;
                                if(!autoActive) refreshListFromModel();
                            }
                            if(autoActive) {
                                const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                                setStatus(`Bitti. Bekle: ${(rn/1000).toFixed(1)}s`, "wait");
                                monitorTimer = setTimeout(autoStep, rn);
                            } else setStatus("Hazır", "normal");
                        }
                    } else if(st === "1" && lf > 0) {
                        isBusy = true;
                        startVisualTimer(lf, nm || (currentTask?currentTask.name:"?"), nu || (currentTask?currentTask.num:"?"));
                        monitorTimer = setTimeout(monitorLoop, (lf*1000)+1500);
                    } else {
                        clearInterval(uiTimer); isBusy = false; progressBar.style.width = "0%";
                        if(currentTask) {
                            addLog(`Bitti: ${currentTask.name} - ${currentTask.num}`, "orange");
                            saveStat(currentTask.name);
                            currentTask = null;
                            if(!autoActive) refreshListFromModel();
                        }
                        if(autoActive) {
                            const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                            setStatus(`Soğuma: ${rn/1000}s`, "wait"); monitorTimer = setTimeout(autoStep, rn);
                        } else setStatus("Hazır", "normal");
                    }
                } else {
                    clearInterval(uiTimer); isBusy = false; progressBar.style.width = "0%";
                    currentTask = null;
                    if(autoActive) {
                        const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                        setStatus(`Bekle: ${rn/1000}s`, "wait"); monitorTimer = setTimeout(autoStep, rn);
                    } else setStatus("Hazır", "normal");
                }
            } catch(e) { 
                setStatus("Bağlantı Hatası", "error"); 
                monitorTimer = setTimeout(monitorLoop, 3000); 
            }
        }

        function dragElement(e, h) {
            var p1=0,p2=0,p3=0,p4=0; h.onmousedown=dMD; h.ontouchstart=dTS;
            function dMD(z){z.preventDefault();p3=z.clientX;p4=z.clientY;document.onmouseup=cDE;document.onmousemove=eD}
            function dTS(z){var t=z.touches[0];p3=t.clientX;p4=t.clientY;document.ontouchend=cDE;document.ontouchmove=eTD}
            function eD(z){z.preventDefault();p1=p3-z.clientX;p2=p4-z.clientY;p3=z.clientX;p4=z.clientY;e.style.top=(e.offsetTop-p2)+"px";e.style.left=(e.offsetLeft-p1)+"px"}
            function eTD(z){var t=z.touches[0];p1=p3-t.clientX;p2=p4-t.clientY;p3=t.clientX;p4=t.clientY;e.style.top=(e.offsetTop-p2)+"px";e.style.left=(e.offsetLeft-p1)+"px"}
            function cDE(){document.onmouseup=null;document.onmousemove=null;document.ontouchend=null;document.ontouchmove=null}
        }
    }
})();
