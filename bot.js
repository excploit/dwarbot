// --- DWAR FARM BOTU v39 (STATUS 0 FIX & SMART LOGIC) ---
(function() {
    console.log("Bot v39 başlatılıyor...");

    // Kütüphane Kontrolü
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
        const STORAGE_CONF = "dwar_bot_v39_conf";
        const STORAGE_STATS = "dwar_bot_v39_stats";

        let config;
        try {
            config = JSON.parse(localStorage.getItem(STORAGE_CONF)) || { themeColor: "#27ae60", delayMin: 1000, delayMax: 3000, panelW: 360, panelH: 600 };
        } catch (e) {
            config = { themeColor: "#27ae60", delayMin: 1000, delayMax: 3000, panelW: 360, panelH: 600 };
        }
        let stats = JSON.parse(localStorage.getItem(STORAGE_STATS)) || {};

        const imageCache = {}; 
        const activeRequests = {}; 
        const failedImages = {}; 
        let allItems = [];
        
        let autoActive = false; 
        let isBusy = false; 
        let isMinimized = false;
        let monitorTimer = null; 
        let uiTimer = null;
        let lastHeight = config.panelH + "px";
        
        // Mevcut görevi hafızada tutuyoruz
        let currentTask = null; 

        const old = document.getElementById("dwarBotPanel");
        if (old) old.remove();

        // --- CSS ---
        const styleId = "dwarBotStylesV39";
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
                .dwar-input { width: 100%; padding: 10px; background: #333; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; margin-top: 5px; margin-bottom: 15px; }
                .dwar-label { display: block; color: #ccc; font-weight: 600; font-size: 12px; margin-bottom: 2px; }
                .dwar-ctrl-group { padding: 15px; border-bottom: 1px solid #333; background: #252526; flex-shrink: 0; }
                .dwar-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #333; transition: background 0.2s; }
                .dwar-list-item:hover { background: #252526; }
                .dwar-img-box { width: 32px; height: 32px; background: #000; border: 1px solid #555; border-radius: 4px; margin-right: 12px; overflow: hidden; flex-shrink: 0; position: relative; }
                .dwar-img-inner { width: 100%; height: 100%; background-size: 100% 100%; background-position: center; background-repeat: no-repeat; }
                .dwar-btn-invert { background: #eee; color: ${config.themeColor}; border: 1px solid ${config.themeColor}; }
                .dwar-btn-invert:hover { background: ${config.themeColor}; color: #fff; }
                .dwar-log { height: 130px; background: #000; border-top: 2px solid #333; padding: 8px; font-family: monospace; font-size: 11px; color: #aaa; overflow-y: auto; flex-shrink: 0; box-sizing: border-box; }
                .dwar-status { padding: 12px 25px 12px 15px; background: #222; color: #ccc; font-size: 11px; font-weight: bold; border-top: 1px solid #333; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; border-radius: 0 0 6px 6px; }
                .dwar-stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }
            `;
            document.head.appendChild(style);
        }

        // --- PANEL ---
        const panel = document.createElement('div');
        panel.id = "dwarBotPanel";
        
        const header = document.createElement('div');
        header.className = "dwar-header";
        header.innerHTML = `<span>Bot v39</span><div><span id="btnMin" style="cursor:pointer;margin-right:15px;padding:5px">[_]</span><span id="btnClose" style="cursor:pointer;padding:5px">[X]</span></div>`;
        panel.appendChild(header);

        const tabs = document.createElement('div');
        tabs.className = "dwar-tabs";
        tabs.innerHTML = `<button class="dwar-tab active" data="viewMain">ANA</button><button class="dwar-tab" data="viewStats">İSTATİSTİK</button><button class="dwar-tab" data="viewSettings">AYARLAR</button>`;
        panel.appendChild(tabs);

        const content = document.createElement('div');
        content.className = "dwar-content";

        // MAIN
        const vMain = document.createElement('div');
        vMain.id = "viewMain";
        vMain.className = "dwar-view show";
        vMain.innerHTML = `
            <div class="dwar-ctrl-group">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button id="btnRef" class="dwar-btn" style="background:#444; border:1px solid #666;">YENİLE</button>
                    <button id="btnAuto" class="dwar-btn" style="background:#004d40; border:1px solid #00695c;">OTO BAŞLAT</button>
                </div>
                <input id="inpFilter" class="dwar-input" placeholder="Filtre (Örn: Akik|Bakır)" style="margin-bottom:0;">
            </div>
            <div id="itemList" style="flex:1; overflow-y:auto;"></div>
            <div id="logArea" class="dwar-log"></div>
        `;
        content.appendChild(vMain);

        // STATS
        const vStats = document.createElement('div');
        vStats.id = "viewStats";
        vStats.className = "dwar-view dwar-view-padded";
        vStats.innerHTML = `
            <div style="background:${config.themeColor}; color:white; padding:20px; border-radius:8px; text-align:center; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                <span style="font-size:12px; opacity:0.8; display:block; margin-bottom:5px;">TOPLAM TOPLANAN</span>
                <span id="totalStat" style="font-size:32px; font-weight:bold;">0</span>
            </div>
            <div id="statsList" style="flex:1; overflow-y:auto;"></div>
        `;
        content.appendChild(vStats);

        // SETTINGS
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

        const statusBar = document.createElement('div');
        statusBar.className = "dwar-status";
        statusBar.innerText = "Hazır";
        panel.appendChild(statusBar);

        document.body.appendChild(panel);
        dragElement(panel, header);

        // --- ELEMENTLER ---
        const btnRef = document.getElementById('btnRef');
        const btnAuto = document.getElementById('btnAuto');
        const inpFilter = document.getElementById('inpFilter');
        const btnMin = document.getElementById('btnMin');

        // --- MANTIKSAL İŞLEMLER ---
        
        // Tab Değişimi
        panel.querySelectorAll('.dwar-tab').forEach(t => {
            t.onclick = () => {
                panel.querySelectorAll('.dwar-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                panel.querySelectorAll('.dwar-view').forEach(v => v.classList.remove('show'));
                document.getElementById(t.getAttribute('data')).classList.add('show');
                if(t.getAttribute('data') === 'viewStats') renderStats();
            };
        });

        // Ayarlar
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
            if(confirm("İstatistikler silinecek?")) {
                stats = {};
                localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
                renderStats();
            }
        };

        function updateTheme() {
            panel.style.borderColor = config.themeColor;
            header.style.background = config.themeColor;
            document.querySelector('.dwar-tab.active').style.borderBottomColor = config.themeColor;
            filterAndRender();
        }

        // İstatistik
        function renderStats() {
            const list = document.getElementById('statsList');
            const total = document.getElementById('totalStat');
            list.innerHTML = "";
            let sum = 0;
            const sortedKeys = Object.keys(stats).sort((a,b) => stats[b] - stats[a]);
            for(let k of sortedKeys) {
                sum += stats[k];
                list.innerHTML += `<div class="dwar-stat-row"><span style="color:#ccc">${k}</span><span style="color:white;font-weight:bold">${stats[k]}</span></div>`;
            }
            total.innerText = sum;
            if(sum === 0) list.innerHTML = "<div style='text-align:center;color:#666;margin-top:20px'>Veri yok.</div>";
        }
        
        function saveStat(n) { 
            if(!stats[n]) stats[n]=0; 
            stats[n]++; 
            localStorage.setItem(STORAGE_STATS, JSON.stringify(stats)); 
        }

        // Minimize
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

        // Helperlar
        function setStatus(m, t) {
            statusBar.innerText = m;
            statusBar.style.background = t=='active'?'#004d40':t=='error'?'#b71c1c':t=='wait'?'#e65100':'#222';
            statusBar.style.color = t=='normal'?'#ccc':'#fff';
        }
        function addLog(m, c) {
            const d = document.createElement('div');
            d.style.borderBottom = "1px solid #222"; d.style.padding = "2px 0";
            d.innerHTML = `<span style="color:#555">[${new Date().toTimeString().split(' ')[0]}]</span> <span style="color:${c||'#ccc'}">${m}</span>`;
            logArea.prepend(d);
        }
        function flash(b) {
            const t = b.innerText;
            b.innerText = "⛔"; b.style.background = "#b71c1c"; b.style.color = "#fff"; b.disabled = true;
            setTimeout(() => { 
                b.innerText = t; b.style.background = "#eee"; b.style.color = config.themeColor; b.disabled = false; 
            }, 1000);
        }
        function startVisualTimer(sec, name, num) {
            clearInterval(uiTimer); let l = sec;
            setStatus(`Toplanıyor: ${name} - ${num} ... ${l}s`, 'active');
            uiTimer = setInterval(() => { l--; if(l>0) setStatus(`Toplanıyor: ${name} - ${num} ... ${l}s`, 'active'); else { clearInterval(uiTimer); setStatus("Tamamlanıyor...", 'wait'); } }, 1000);
        }

        // Bot Kontrolleri
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
                currentTask = null;
            }
        }
        btnAuto.onclick = toggleAuto; miniBtn.onclick = toggleAuto;
        btnRef.onclick = () => refreshList();
        inpFilter.oninput = () => filterAndRender();

        async function refreshList(s=false) {
            if(!s) { itemList.innerHTML = "<div style='text-align:center;padding:20px;color:yellow'>Yükleniyor...</div>"; setStatus("Liste çekiliyor..."); }
            try {
                const r = await fetch('https://dwar.gen.tr/hunt_conf.php?mode=hunt_farm');
                const t = await r.text();
                const p = new DOMParser();
                const x = p.parseFromString(t, "text/xml");
                const i = x.getElementsByTagName("item");
                allItems = [];
                for(let k=0; k<i.length; k++) allItems.push({ name: i[k].getAttribute("name"), num: i[k].getAttribute("num"), swf: i[k].getAttribute("swf") });
                allItems.sort((a,b) => a.name.localeCompare(b.name));
                filterAndRender();
                if(!s) setStatus(`Yenilendi (${allItems.length})`);
            } catch(e) { if(!s) itemList.innerHTML = "Hata"; setStatus("Liste Hatası", "error"); }
        }

        function filterAndRender() {
            const v = inpFilter.value.toLowerCase();
            const k = v.split('|').map(x=>x.trim()).filter(x=>x.length>0);
            const r = allItems.filter(i => k.length==0 ? true : k.some(z=>i.name.toLowerCase().includes(z)));
            render(r); return r;
        }

        function render(l) {
            itemList.innerHTML = "";
            if(l.length===0) { itemList.innerHTML = "<div style='text-align:center;padding:20px;color:#666'>Sonuç yok</div>"; return; }
            l.forEach(i => {
                const r = document.createElement('div'); r.className = "dwar-list-item";
                
                let imH = `<div class="dwar-img-box"></div>`;
                if(i.swf) {
                    const c = i.swf.split('.')[0];
                    const imgClass = `img-cache-${c}`;
                    if(!imageCache[c] && !activeRequests[c] && !failedImages[c]) {
                        activeRequests[c]=1;
                        fetch(`https://dwar.gen.tr/images/data/canvas/hunt_res/${c}/${c}.png`).then(res=>{if(!res.ok)throw 1;return res.blob()}).then(b=>{
                            const fr = new FileReader();
                            fr.onloadend = () => { imageCache[c]=fr.result; delete activeRequests[c]; document.querySelectorAll(`.${imgClass}`).forEach(e=>e.style.backgroundImage=`url('${fr.result}')`); };
                            fr.readAsDataURL(b);
                        }).catch(()=>{delete activeRequests[c]; failedImages[c]=1;});
                    }
                    const bg = imageCache[c] ? `background-image:url('${imageCache[c]}')` : '';
                    imH = `<div class="dwar-img-box"><div class="dwar-img-inner ${imgClass}" style="${bg}"></div></div>`;
                }

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
                    addLog(`Manuel Başladı: ${i.name} - ${i.num}`, "cyan"); 
                    currentTask = { name: i.name, num: i.num }; // Manuel takip için
                    sendReq(i.num, i.name);
                    isBusy = true; setStatus("Manuel...", "active");
                    monitorTimer = setTimeout(monitorLoop, 1000);
                };
                r.appendChild(b); itemList.appendChild(r);
            });
        }

        function sendReq(num, name) {
            const url = `https://dwar.gen.tr/hunt_conf.php?mode=farm&action=chek&xy=0&sig=${SparkMD5.hash("0"+num+SECRET_KEY)}&num=${num}&t=1`;
            fetch(url).then(r=>r.text()).then(d=>{
                const p = new DOMParser();
                const x = p.parseFromString(d, "text/xml");
                const r = x.getElementsByTagName("req")[0];
                if(r && r.getAttribute("status")=="0") {
                    const m = r.getAttribute("msg") || "Bilinmeyen";
                    addLog(`HATA (${name}): ${m}`, "red");
                    currentTask = null; // Hata ise görevi sil
                }
            }).catch(()=> { addLog("Ağ Hatası","red"); currentTask = null; });
        }

        async function autoStep() {
            if(!autoActive) return;
            setStatus("Taranıyor...", "active");
            await refreshList(true);
            const t = filterAndRender();
            if(t.length > 0) {
                const target = t[0];
                addLog(`Toplamaya Başlandı: ${target.name} - ${target.num}`, "cyan");
                currentTask = { name: target.name, num: target.num }; // Görevi hafızaya al
                sendReq(target.num, target.name);
                setStatus("Senk...", "wait"); 
                monitorTimer = setTimeout(monitorLoop, 2000);
            } else {
                addLog("Bulunamadı", "gray"); setStatus("Yok. Bekleniyor...", "wait");
                monitorTimer = setTimeout(autoStep, 5000);
            }
        }

        // --- MONITOR LOOP (DÜZELTİLEN KISIM) ---
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

                    // Eğer server isim döndürüyorsa onu esas al, yoksa hafızadaki currentTask'ı
                    const finalName = nm || (currentTask ? currentTask.name : "Bilinmeyen");

                    if(st === "0") {
                        isBusy = false;
                        if(msg && msg.trim() !== "") {
                            // GERÇEK HATA
                            addLog(`HATA: ${msg}`, "red"); setStatus(`Hata: ${msg}`, "error");
                            currentTask = null;
                            if(autoActive) monitorTimer = setTimeout(autoStep, 3000);
                        } else {
                            // BAŞARILI / BOŞTA
                            clearInterval(uiTimer);
                            // Sadece görev varsa başarı say
                            if(currentTask) {
                                addLog(`Toplama Bitti: ${currentTask.name}`, "orange");
                                saveStat(currentTask.name);
                                currentTask = null;
                            }
                            if(autoActive) {
                                const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                                setStatus(`Bitti. Bekle: ${(rn/1000).toFixed(1)}s`, "wait");
                                monitorTimer = setTimeout(autoStep, rn);
                            } else setStatus("Hazır", "normal");
                        }
                    } else if(st === "1" && lf > 0) {
                        // MEŞGUL
                        isBusy = true;
                        startVisualTimer(lf, finalName, nu || (currentTask?currentTask.num:"?"));
                        monitorTimer = setTimeout(monitorLoop, (lf*1000)+1500);
                    } else {
                        // SÜRE DOLMUŞ
                        clearInterval(uiTimer); isBusy = false;
                        if(currentTask) {
                            addLog(`Toplama Bitti: ${currentTask.name}`, "orange");
                            saveStat(currentTask.name);
                            currentTask = null;
                        }
                        if(autoActive) {
                            const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                            setStatus(`Bitti. Bekle: ${(rn/1000).toFixed(1)}s`, "wait");
                            monitorTimer = setTimeout(autoStep, rn);
                        } else setStatus("Hazır", "normal");
                    }
                } else {
                    // REQ YOK = BOŞTA
                    clearInterval(uiTimer); isBusy = false;
                    currentTask = null; // Garanti olsun
                    if(autoActive) {
                        const rn = Math.floor(Math.random()*(config.delayMax-config.delayMin))+config.delayMin;
                        setStatus(`Bekle: ${(rn/1000).toFixed(1)}s`, "wait");
                        monitorTimer = setTimeout(autoStep, rn);
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
