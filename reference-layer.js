(()=>{
  const css=`
  :root{--ref-gold:#f0c96b;--ref-gold2:#ffe7a8;--ref-violet:#8f2cff;--ref-violet2:#c66bff;--ref-bg:#04050b;--ref-panel:#090812}
  body{background:#04050b!important}
  .app{background:radial-gradient(circle at 70% 20%,rgba(76,18,130,.18),transparent 35%),linear-gradient(135deg,#03040a,#090511 55%,#03040a)!important}
  .app header{height:88px!important;background:rgba(3,4,10,.96)!important;border-bottom:1px solid rgba(240,201,107,.42)!important;box-shadow:0 8px 35px #000!important}
  .app header b{font-family:Cinzel,serif!important;color:var(--ref-gold2)!important;letter-spacing:.08em!important}
  .top-right{align-items:center!important}
  .ref-wallet{display:flex;align-items:center;gap:9px;height:46px;padding:0 15px;border:1px solid rgba(240,201,107,.65);border-radius:10px;background:linear-gradient(135deg,#160c27,#090812);box-shadow:0 0 22px rgba(143,44,255,.2),inset 0 0 20px rgba(240,201,107,.05);font-family:Cinzel,serif;color:var(--ref-gold2);margin-right:8px}
  .ref-wallet .ico{font-size:21px;color:#b96cff;text-shadow:0 0 14px #8f2cff}.ref-wallet strong{font-size:19px}.ref-wallet small{font-size:8px;color:#a89ba9;display:block;letter-spacing:.12em}
  .layout{max-width:1540px!important}
  .layout nav{width:286px!important;background:linear-gradient(180deg,#060711,#03040a)!important;border-right:1px solid rgba(240,201,107,.4)!important;padding:0 12px 20px!important;box-shadow:10px 0 45px #000!important}
  .layout nav .brand{height:192px!important;display:grid!important;place-items:center!important;border-bottom:1px solid rgba(240,201,107,.2)!important;margin-bottom:12px!important}
  .layout nav .brand strong{font:800 40px Cinzel,serif!important;color:var(--ref-gold2)!important;letter-spacing:.08em!important;text-shadow:0 0 20px rgba(240,201,107,.3)!important}
  .layout nav .brand span{display:block!important;text-align:center!important;color:#d8b8ff!important;font-size:10px!important;letter-spacing:.22em!important}
  .layout nav button{height:53px!important;border-radius:8px!important;color:#d7cddc!important;font-size:16px!important}
  .layout nav button:hover,.layout nav button.active{background:linear-gradient(90deg,rgba(143,44,255,.3),rgba(143,44,255,.04))!important;border-color:rgba(240,201,107,.35)!important;color:#ffe9b5!important;box-shadow:inset 3px 0 #9d39ff,0 0 18px rgba(143,44,255,.12)!important}
  #view{padding:0 20px 40px!important;max-width:none!important}
  .page-head{display:none!important}
  .dashboard-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 315px!important;gap:15px!important;padding-top:14px!important}
  .hero-card{height:382px!important;min-height:0!important;border-radius:0!important;background:radial-gradient(circle at 32% 48%,rgba(143,44,255,.55),transparent 18%),radial-gradient(circle at 75% 18%,rgba(62,24,120,.55),transparent 35%),linear-gradient(120deg,#10051b,#070815 58%,#160a27)!important;border:1px solid rgba(240,201,107,.7)!important;box-shadow:0 20px 60px #000!important}
  .hero-card:before{inset:7px!important;border:1px solid rgba(240,201,107,.35)!important}
  .hero-magic{left:0!important;width:48%!important;background:radial-gradient(circle at 52% 55%,rgba(198,107,255,.75),transparent 11%),radial-gradient(circle at 50% 62%,rgba(109,25,199,.55),transparent 38%)!important}
  .hero-copy h2{left:52%!important;top:25%!important;text-align:center!important;font:700 42px Cinzel,serif!important;color:#ffe9bb!important;text-shadow:0 3px 20px #000!important}
  .hero-copy h2 strong{font-size:54px!important;color:#ffe4a0!important}
  .hero-copy .eyebrow,.hero-copy p{display:none!important}
  .hero-copy .actions{left:58%!important;bottom:28px!important}
  .hero-copy .actions button{border:1px solid #f0c96b!important;background:linear-gradient(135deg,#261039,#6d184f,#261039)!important;color:#ffe9bb!important;box-shadow:0 0 25px rgba(143,44,255,.35)!important}
  .quick-grid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:12px!important;margin-top:15px!important}
  .quick-card{min-height:275px!important;padding:154px 12px 12px!important;border-radius:0!important;border:1px solid rgba(240,201,107,.5)!important;background:radial-gradient(circle at 50% 34%,rgba(143,44,255,.35),transparent 25%),linear-gradient(#100817,#05060c)!important;box-shadow:inset 0 0 45px rgba(143,44,255,.08),0 15px 30px #000!important}
  .quick-card .big-icon{top:25px!important;font-size:65px!important;color:#d7b7ff!important;text-shadow:0 0 20px #8f2cff!important}
  .quick-card h3{font:700 18px Cinzel,serif!important;color:#ffe4a0!important}.quick-card p{font-size:9px!important}.quick-card button{padding:8px 25px!important}
  .profile-panel{padding:16px!important;border-radius:0!important;border:1px solid rgba(240,201,107,.55)!important;background:linear-gradient(145deg,#0b0914,#05060c)!important;box-shadow:0 15px 40px #000!important}
  .profile-mini strong{font-size:15px!important}.profile-mini small{color:#b9adba!important}.balance{margin-top:14px!important}.balance>strong{font-size:43px!important;color:#ffe4a0!important;text-shadow:0 0 18px rgba(143,44,255,.5)!important}
  .banner{height:115px!important;margin-top:15px!important;border-radius:0!important;border:1px solid rgba(240,201,107,.55)!important;background:radial-gradient(circle at 50% 50%,rgba(108,24,198,.45),transparent 48%),linear-gradient(90deg,#09050e,#251033,#09050e)!important}
  .banner strong{font-size:22px!important;color:#ffe4a0!important}
  .ref-activity{margin-top:15px;border:1px solid rgba(240,201,107,.45);background:linear-gradient(145deg,#0b0914,#05060c);padding:18px;min-height:260px;box-shadow:0 15px 40px #000}.ref-activity h3{font:700 15px Cinzel,serif;color:#ffe4a0;margin:0 0 14px}.ref-activity .act{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:11px 0;border-bottom:1px solid rgba(240,201,107,.12);font-size:10px}.ref-activity .act:last-child{border:0}.ref-activity .act i{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#160b28;border:1px solid rgba(143,44,255,.6);color:#c66bff;font-style:normal}.ref-activity b{display:block;color:#eadcf0;font-weight:600}.ref-activity small{color:#827687}
  @media(max-width:1050px){.dashboard-grid{grid-template-columns:1fr!important}.quick-grid{grid-template-columns:repeat(2,1fr)!important}.ref-wallet{display:none}}
  @media(max-width:720px){.app header{height:62px!important}.layout nav{top:62px!important;width:270px!important;left:-280px!important}.layout nav.open{left:0!important}#view{padding:0 10px 76px!important}.dashboard-grid{display:block!important}.hero-card{height:280px!important}.hero-copy h2{left:42%!important;top:25%!important;font-size:27px!important}.hero-copy h2 strong{font-size:36px!important}.hero-copy .actions{left:54%!important;bottom:18px!important}.quick-grid{grid-template-columns:1fr 1fr!important}.quick-card{min-height:210px!important;padding-top:115px!important}.profile-panel{margin-top:12px!important}.ref-activity{display:none}}
  `;
  const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
  function enhance(){
    const app=document.querySelector('.app'), view=document.querySelector('#view'); if(!app||!view)return;
    if(!document.querySelector('.ref-wallet')){const tr=document.querySelector('.top-right');if(tr){const w=document.createElement('div');w.className='ref-wallet';w.innerHTML='<span class="ico">◇</span><div><strong class="ref-diamonds">—</strong><small>DIAMANTES</small></div>';tr.prepend(w)}}
    const w=window.me||{}; const wallet=w.wallet||{}; const d=Number(wallet.diamonds||0); const rw=document.querySelector('.ref-diamonds');if(rw)rw.textContent=d.toLocaleString();
    const nav=document.querySelector('.layout nav'); if(nav){const labels=[['notifications','Notificaciones'],['ranking','Ranking'],['chat','Chat / Trading']];labels.forEach(([key,label])=>{if(![...nav.querySelectorAll('[data-page]')].some(x=>x.dataset.page===key)){const b=document.createElement('button');b.dataset.page=key;b.innerHTML='<b>♛</b><span>'+label+'</span>';b.onclick=()=>{if(key==='chat'||key==='ranking')return;};nav.appendChild(b)}})}
    if(view.querySelector('.dashboard-grid')&&!view.querySelector('.ref-activity')){const panel=view.querySelector('.profile-panel');if(panel){const a=document.createElement('section');a.className='ref-activity';a.innerHTML='<h3>Actividad Reciente</h3><div class="act"><i>◇</i><div><b>Tu actividad aparecerá aquí</b><small>Datos reales del servidor</small></div></div><div class="act"><i>◉</i><div><b>Movimientos de cuenta</b><small>Sin datos inventados</small></div></div>';panel.appendChild(a)}}
  }
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});enhance();
})();
