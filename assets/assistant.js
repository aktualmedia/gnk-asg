(() => {
  const clean = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function response(question) {
    const text = question.toLowerCase();
    if (text.includes('prihod') && text.includes('asg')) return 'GNK ASG d.o.o. za 2025. iskazuje ukupne prihode od 504.001.681,97 EUR prema revidiranim godišnjim financijskim izvještajima.';
    if (text.includes('aktiva') || text.includes('kapital')) return 'Ukupna aktiva GNK ASG d.o.o. na dan 31.12.2025. iznosi 46.396.925,72 EUR, a kapital i rezerve 46.212.425,18 EUR.';
    if (text.includes('oib') || text.includes('adresa') || text.includes('sjedište')) return 'GNK ASG d.o.o.: Zagrebačka cesta 130, Zagreb, Hrvatska; OIB 75227917632; MBS 081512375; direktor Nermin Sefić.';
    if (text.includes('dinamo') || text.includes('grup')) return 'GNK ASG d.o.o. uključen je u grupni okvir GNK DINAMO Ltd. iz Colorada. Grupni prikaz FY 2025 na portalu navodi prihode od 4,7046 mlrd. EUR i kapital i rezerve od 3,4140 mlrd. EUR, uz posebnu napomenu o osnovi grupnog prikaza.';
    if (text.includes('bitcoin') || text.includes('coin') || text.includes('kripto') || text.includes('digital')) return 'Digital Assets Monitor prikazuje indikativne tržišne cijene odabranih coina u vodećim valutama. Prikaz je informativan i nije usluga trgovanja niti investicijski savjet.';
    if (text.includes('ai') || text.includes('umjetn')) return 'Tehnološki fokus GNK ASG portala uključuje umjetnu inteligenciju, automatizaciju, digitalne platforme, fintech i sportsku analitiku.';
    if (text.includes('reviz')) return 'Financijski pokazatelji GNK ASG d.o.o. za 2025. prikazani su kao podatci iz samostalnih godišnjih financijskih izvještaja, za koje je revizor izrazio nemodificirano mišljenje.';
    return 'Mogu odgovoriti na pitanja o javnim podatcima GNK ASG d.o.o., GNK DINAMO Ltd. grupnom okviru, tehnologiji, umjetnoj inteligenciji i digitalnoj imovini.';
  }
  function init() {
    if (document.querySelector('.float-chat-trigger')) return;
    const trigger = document.createElement('button');
    trigger.className = 'float-chat-trigger'; trigger.type = 'button'; trigger.innerHTML = '<span>✦</span> AI ASSISTANT';
    const widget = document.createElement('section'); widget.className = 'float-chat'; widget.setAttribute('aria-label','GNK ASG AI Assistant');
    widget.innerHTML = '<div class="float-chat-head"><div><strong>GNK ASG AI Assistant</strong><small>Informativni korporativni pomoćnik</small></div><button type="button" aria-label="Zatvori">×</button></div><div class="float-chat-body"><div class="float-bubble bot">Pozdrav. Pitajte me o GNK ASG-u, grupi, tehnologiji, AI-u ili digitalnoj imovini.</div></div><div class="float-chat-quick"><button type="button">Prihodi GNK ASG</button><button type="button">GNK DINAMO grupa</button><button type="button">Digital Assets</button><button type="button">AI tehnologija</button></div><form class="float-chat-form"><input type="text" placeholder="Upišite pitanje…" autocomplete="off"><button type="submit">POŠALJI</button></form><div class="chat-note">Informativni odgovori temeljeni na javno prikazanim podatcima portala.</div>';
    document.body.append(trigger, widget);
    const body = widget.querySelector('.float-chat-body'); const input = widget.querySelector('input');
    function ask(value) { if (!value.trim()) return; body.insertAdjacentHTML('beforeend','<div class="float-bubble user">' + clean(value) + '</div><div class="float-bubble bot">' + clean(response(value)) + '</div>'); body.scrollTop = body.scrollHeight; input.value = ''; }
    trigger.onclick = () => widget.classList.toggle('open'); widget.querySelector('.float-chat-head button').onclick = () => widget.classList.remove('open');
    widget.querySelector('form').onsubmit = (event) => { event.preventDefault(); ask(input.value); };
    widget.querySelectorAll('.float-chat-quick button').forEach((button) => button.onclick = () => ask(button.textContent));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
