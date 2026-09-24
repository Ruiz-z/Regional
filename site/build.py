import os

ICONS = {
 'ok': '<circle cx="8" cy="8" r="5" fill="currentColor"/>',
 'warn': '<path d="M8 2.5 14 13.5H2Z" fill="currentColor"/>',
 'danger': '<path d="M5.5 2h5L14 5.5v5L10.5 14h-5L2 10.5v-5Z" fill="currentColor"/><path d="M8 5v3.6M8 10.6v.4" stroke="var(--status-danger-soft)" stroke-width="1.8" stroke-linecap="round"/>',
 'water': '<path d="M8 1.8C8 1.8 3.2 7.2 3.2 10a4.8 4.8 0 0 0 9.6 0C12.8 7.2 8 1.8 8 1.8Z" fill="currentColor"/>',
 'off': '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.2 11.8 11.8 4.2" stroke="currentColor" stroke-width="2"/>',
 'bug': '<ellipse cx="8" cy="9" rx="3.6" ry="4.6" fill="currentColor"/><path d="M3 6l2 1.5M13 6l-2 1.5M2.5 10h2M13.5 10h-2M3.5 14l1.8-1.5M12.5 14l-1.8-1.5M6.5 3.5 5.5 2M9.5 3.5 10.5 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
 'check': '<path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 'sync': '<path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
 'info': '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 7.2v4M8 5.2v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 'chevron': '<path d="M4.5 6 8 9.5 11.5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
}
# Riego 100% automático: Normal / Regando / Corrigiendo (informativo) / Anomalía (crítico).
STATUS = {
 'normal': {'tone': 'ok', 'icon': 'ok', 'label': 'Normal'},
 'monitoreo': {'tone': 'warn', 'icon': 'warn', 'label': 'Monitoreo'},
 'intervencion': {'tone': 'danger', 'icon': 'danger', 'label': 'Intervención'},
 'regando': {'tone': 'water', 'icon': 'water', 'label': 'Regando'},
 'corrigiendo': {'tone': 'info', 'icon': 'sync', 'label': 'Corrigiendo'},
 'anomalia': {'tone': 'danger', 'icon': 'warn', 'label': 'Anomalía'},
 'online': {'tone': 'ok', 'icon': 'ok', 'label': 'Online'},
 'offline': {'tone': 'off', 'icon': 'off', 'label': 'Offline'},
}

def icon(name, size=16, cls='sr-icon'):
    return f'<svg class="{cls}" width="{size}" height="{size}" viewBox="0 0 16 16" aria-hidden="true">{ICONS[name]}</svg>'

def badge(status, prefix=None, label=None, size=None):
    s = STATUS[status]
    cls = f'sr-badge sr-tone-{s["tone"]}' + (' sr-badge-sm' if size == 'sm' else '')
    isize = 14 if size == 'sm' else 16
    text = (f'{prefix}: ' if prefix else '') + (label or s['label'])
    return f'<span class="{cls}">{icon(s["icon"], isize)}{text}</span>'

def button(text, variant='primary', href=None, extra_style='', extra_class='', onclick=None, extra_attrs=''):
    cls = f'sr-btn sr-btn-{variant} {extra_class}'.strip()
    ea = f' {extra_attrs}' if extra_attrs else ''
    if href:
        return f'<a href="{href}" class="{cls}" style="text-decoration:none;{extra_style}"{ea}>{text}</a>'
    oc = f' onclick="{onclick}"' if onclick else ''
    return f'<button type="button" class="{cls}" style="{extra_style}"{oc}{ea}>{text}</button>'

def moisture_bar(value, target=None, offline=False, hide_label=False):
    low = (not offline) and (target is not None) and (value is not None) and (value < target)
    fillcls = 'sr-moist-fill' + (' low' if low else '') + (' off' if offline else '')
    width = 100 if offline else (value or 0)
    header = ''
    if not hide_label:
        valtxt = '—' if offline else f'{value}%'
        tgt = f'<span class="sr-muted" style="font-weight:500;font-size:13px;"> / obj. {target}%</span>' if target is not None else ''
        header = f'<div class="sr-moist-head"><span class="sr-muted" style="font-size:13px;line-height:18px;font-weight:700;">Humedad</span><span class="sr-num" style="font-weight:700;">{valtxt}{tgt}</span></div>'
    target_mark = f'<div class="sr-moist-target" style="left:calc({target}% - 1px);"></div>' if target is not None else ''
    opacity = 'opacity:.35;' if offline else ''
    return f'<div class="sr-moist">{header}<div class="sr-moist-track" role="meter" aria-label="Humedad del suelo"><div class="{fillcls}" style="width:{width}%;{opacity}"></div>{target_mark}</div></div>'

def zone_card(z, variant='card'):
    row = variant == 'row'
    danger = z.get('pest') == 'intervencion' or z.get('irrigation') == 'anomalia'
    off = z.get('offline')
    cls = 'sr-zone' + (' sr-zone-row' if row else '') + (' is-danger' if danger else '') + (' is-off' if off else '')
    if row:
        badges = (badge('offline', label='Sin lectura', size='sm') if off else '') + badge(z.get('irrigation', 'normal'), size='sm') + badge(z.get('pest', 'normal'), size='sm')
        val = '—' if off else f'{z["moisture"]}%'
        sub = z.get('lastAt', '') if off else 'humedad'
        return f'''<div class="{cls}">
  <div class="sr-zone-body"><p class="sr-zone-name">{z["name"]}</p><div class="sr-row">{badges}</div></div>
  <div style="text-align:right;"><div class="sr-num" style="font-size:18px;font-weight:700;line-height:24px;">{val}</div><div class="sr-muted" style="font-size:13px;line-height:18px;">{sub}</div></div>
</div>'''
    label = None
    if z.get('detections'):
        label = STATUS[z['pest']]['label'] + f" · {z['detections']}"
    badges = (badge('offline', label='Sin lectura') if off else '') + badge(z.get('irrigation', 'normal'), prefix='Riego') + badge(z.get('pest', 'normal'), prefix='Plaga', label=label)
    crop = f'<span class="sr-muted" style="font-size:13px;">{z["crop"]}</span>' if z.get('crop') else ''
    temp = '' if off else f'<div class="sr-zone-meta"><span><span class="sr-muted" style="font-size:13px;font-weight:700;margin-right:6px;">Temp.</span><span class="sr-num" style="font-weight:700;">{z["temp"]} °C</span></span></div>'
    foot = f'<div class="sr-zone-foot">{z["lastAction"]} · {z["lastAt"]}</div>' if z.get('lastAction') else ''
    return f'''<div class="{cls}">
  <div class="sr-zone-head"><p class="sr-zone-name">{z["name"]}</p>{crop}</div>
  {moisture_bar(z.get("moisture"), z.get("target"), off)}
  {temp}
  <div class="sr-row">{badges}</div>
  {foot}
</div>'''

def cell_tone(z):
    if z.get('offline'): return 'off'
    if z.get('pest') == 'intervencion' or z.get('irrigation') == 'anomalia': return 'danger'
    if z.get('pest') == 'monitoreo': return 'warn'
    if z.get('irrigation') == 'corrigiendo': return 'info'
    if z.get('irrigation') == 'regando': return 'water'
    return 'ok'

def parcel_grid(zones, columns=4, selected=None, clickable=False):
    cells = []
    for z in zones:
        t = cell_tone(z)
        ic = {'ok': 'ok', 'warn': 'warn', 'danger': 'danger', 'water': 'water', 'info': 'sync', 'off': 'off'}[t]
        col = {'ok': 'var(--status-ok)', 'warn': 'var(--status-warn)', 'danger': 'var(--status-danger)', 'water': 'var(--accent)', 'info': 'var(--status-info)', 'off': 'var(--status-offline)'}[t]
        sel = ' is-selected' if selected == z['name'] else ''
        val = '—' if z.get('offline') else f'{z["moisture"]}%'
        key = z['pest'] if z.get('pest') and z['pest'] != 'normal' else z.get('irrigation', 'normal')
        sub = 'Sin lectura' if z.get('offline') else STATUS[key]['label']
        attrs = f' data-zone-cell="{z["name"]}" onclick="selectZone(\'{z["name"]}\')" tabindex="0" role="button" aria-label="Ver Zona {z["name"]}"' if clickable else ''
        cells.append(f'''<div class="sr-cell t-{t}{sel}"{attrs}>
    <div class="sr-cell-top"><span class="sr-cell-name">{z["name"]}</span><span style="color:{col};display:flex;">{icon(ic, 18)}</span></div>
    <div><div class="sr-cell-val">{val}</div><div class="sr-muted" style="font-size:13px;line-height:18px;">{sub}</div></div>
  </div>''')
    return f'<div class="sr-grid" style="grid-template-columns:repeat({columns},minmax(0,1fr));">{"".join(cells)}</div>'

def alert_banner(title, body, severity='critica', extra=''):
    info = severity == 'informativa'
    role = 'status' if info else 'alert'
    cls = 'sr-alert is-info' if info else 'sr-alert'
    ic = icon('info', 20) if info else icon('bug', 24)
    return f'<div role="{role}" class="{cls}" {extra}>{ic}<div class="sr-alert-body"><p class="sr-alert-title">{title}</p><p class="sr-alert-sub">{body}</p></div></div>'

def notification_row(severity, title, meta, read=False, href='#'):
    info = severity == 'informativa'
    dotcls = 'sr-notif-dot' + ('' if not read else ' is-read')
    iconcolor = 'var(--status-info)' if info else 'var(--status-danger)'
    iconbg = 'var(--status-info-soft)' if info else 'var(--status-danger-soft)'
    ic = icon('info', 16) if info else icon('bug', 16)
    unread = '' if read else ' is-unread'
    return f'''<a href="{href}" class="sr-notif {"sr-notif-info" if info else "sr-notif-critica"}{unread}" style="text-decoration:none;display:flex;">
  <span class="{dotcls}"></span>
  <span class="sr-notif-icon" style="color:{iconcolor};background:{iconbg};">{ic}</span>
  <div class="sr-notif-body"><p class="sr-notif-title">{title}</p><p class="sr-notif-meta">{meta}</p></div>
  {icon("chevron", 14, cls="sr-notif-chev")}
</a>'''

def parcel_selector(options, value, name):
    opts = ''.join(
        f'<option value="{o[0]}"{" selected" if o[0]==value else ""}>{o[1]}</option>'
        for o in options
    )
    return f'<select class="sr-psel" aria-label="Selector de parcela" id="psel-{name}" onchange="selectParcela(\'{name}\',this.value)">{opts}</select>'

EV = {'riego': ('water', 'var(--accent-soft)', 'var(--accent)'), 'plaga': ('danger', 'var(--status-danger-soft)', 'var(--status-danger)'), 'tratamiento': ('check', 'var(--status-ok-soft)', 'var(--status-ok)'), 'corrigiendo': ('sync', 'var(--status-info-soft)', 'var(--status-info)'), 'anomalia': ('warn', 'var(--status-danger-soft)', 'var(--status-danger)')}

def timeline(events):
    items = []
    for e in events:
        ic, bg, fg = EV[e['type']]
        items.append(f'<li class="sr-tl-item"><span class="sr-tl-dot" style="background:{bg};color:{fg};">{icon(ic, 16)}</span><div><p class="sr-tl-title">{e["title"]}</p><p class="sr-tl-meta">{e["meta"]}</p></div></li>')
    return f'<ol class="sr-tl">{"".join(items)}</ol>'

def events_table(events):
    def row(e):
        ic, bg, fg = EV[e['type']]
        parts = e['meta'].split(' · ', 1)
        when = parts[0]
        detail = parts[1] if len(parts) > 1 else ''
        return f'''<tr style="border-top:1px solid var(--border);">
  <td style="padding:10px 0;white-space:nowrap;color:var(--ink-muted);font-family:var(--font-mono);font-size:13px;">{when}</td>
  <td style="padding:10px 0;"><span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:{bg};color:{fg};flex:none;">{icon(ic, 14)}</span>{e["title"]}</span></td>
  <td style="padding:10px 0;color:var(--ink-muted);">{detail}</td>
</tr>'''
    head_row = '<tr style="border-bottom:1px solid var(--border);">' + ''.join(
        f'<th style="text-align:left;font-size:12px;font-weight:700;color:var(--ink-muted);letter-spacing:.02em;padding:0 0 10px;">{h}</th>'
        for h in ('FECHA', 'EVENTO', 'DETALLE')
    ) + '</tr>'
    return f'<table style="width:100%;border-collapse:collapse;"><thead>{head_row}</thead><tbody>{"".join(row(e) for e in events)}</tbody></table>'

def connection_banner(state, since=None):
    m = {'offline': ('off', f'Sin conexión · mostrando datos de {since or "hace unos minutos"}'), 'retrying': ('sync', 'Reintentando envío…'), 'synced': ('check', 'Conectado · datos al día')}
    ic, txt = m[state]
    cls = 'sr-spin' if state == 'retrying' else ''
    return f'<div class="sr-conn sr-conn-{state}" role="status">{icon(ic, 16, cls="sr-icon " + cls)}{txt}</div>'

PARCELA_JS = '''<script>
function selectParcela(name, id){
  var root = document.querySelector('[data-parcela-scope="'+name+'"]');
  if(!root) return;
  Array.prototype.forEach.call(root.querySelectorAll('[data-parcela]'), function(el){
    el.style.display = (id==='todas' || el.getAttribute('data-parcela')===id) ? '' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', function(){
  Array.prototype.forEach.call(document.querySelectorAll('select.sr-psel[id^="psel-"]'), function(sel){
    selectParcela(sel.id.slice(5), sel.value);
  });
});
</script>'''

def head(title):
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — SmartRiego MX</title>
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/bundle.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>'''

FOOT = '</body>\n</html>\n'

def sidebar(active, admin=False):
    if admin:
        return f'''<div class="sidebar admin">
  <div><div class="brand">SmartRiego MX</div><div class="tag-admin">VISTA DE PLATAFORMA</div></div>
  <div style="display:flex;flex-direction:column;gap:2px;">
    <div class="navlink" style="opacity:.4;cursor:default;">Resumen</div>
    <a href="admin-usuarios.html" class="navlink{" active" if active=="admin-usuarios.html" else ""}">Gestión de usuarios</a>
    <a href="admin-dispositivos.html" class="navlink{" active" if active=="admin-dispositivos.html" else ""}">Dispositivos IoT</a>
    <div class="navlink" style="opacity:.4;cursor:default;">Configuración global</div>
  </div>
  <div style="margin-top:auto;border-top:1px solid rgba(223,223,212,0.16);padding-top:16px;">
    <a href="dashboard.html" style="font-size:12px;font-weight:600;color:var(--ink-on-inverse);opacity:.75;text-decoration:none;padding:0 8px;">← Volver a mi operación</a>
  </div>
</div>'''
    items = [('dashboard.html', 'Dashboard'), ('parcela.html', 'Mis parcelas'), ('gestion-parcelas.html', 'Gestionar parcelas y zonas'), ('historico.html', 'Histórico y reportes'), ('perfil.html', 'Perfil')]
    links = ''.join(f'<a href="{h}" class="navlink{" active" if h==active else ""}">{t}</a>' for h, t in items)
    footer = ''
    if active == 'dashboard.html':
        footer = '''<div class="userrow"><div class="avatar">AT</div><div><div style="font-size:13px;font-weight:700;">Ana Torres</div><div style="font-size:12px;opacity:.65;">Mi operación</div></div></div>
    <a href="admin-dispositivos.html" style="font-size:12px;font-weight:600;color:var(--ink-on-inverse);opacity:.6;text-decoration:none;padding:0 8px;">Cambiar a modo Administrador →</a>'''
    return f'''<div class="sidebar">
  <div class="brand">SmartRiego MX</div>
  <div style="display:flex;flex-direction:column;gap:2px;">{links}</div>
  <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px;border-top:1px solid rgba(223,223,212,0.16);padding-top:16px;">{footer}</div>
</div>'''

def bell(active_count, href='notificaciones.html'):
    return f'''<a href="{href}" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius-md);border:1.5px solid var(--border-strong);color:var(--ink);text-decoration:none;flex:none;" aria-label="Notificaciones">
  <svg width="18" height="18" viewBox="0 0 16 16"><path d="M3 12V7a5 5 0 0 1 10 0v5l1.2 1.6H1.8Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.3 14a1.8 1.8 0 0 0 3.4 0" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
  {'<span style="position:absolute;top:4px;right:5px;width:9px;height:9px;border-radius:999px;background:var(--status-danger);border:2px solid var(--surface);"></span>' if active_count else ''}
</a>'''

OUT = os.path.dirname(__file__)
TOKENS_SOURCE = os.path.join(OUT, '..', 'design', 'canvas', 'ds', 'smartriego', 'tokens.css')
TOKENS_TARGET = os.path.join(OUT, 'assets', 'tokens.css')

def sync_tokens():
    # design/canvas/ds/smartriego/tokens.css es la fuente de verdad del design
    # system (compartida con los prototipos .dc.html). Editar tokens acá, no
    # en site/assets/tokens.css directamente, o se pierde en el próximo build.
    with open(TOKENS_SOURCE) as f:
        tokens = f.read()
    with open(TOKENS_TARGET, 'w') as f:
        f.write(tokens)

def write(name, content):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(content)

sync_tokens()

# ---- data ----
zonesNorte = [
    {'name': 'A1', 'moisture': 58, 'irrigation': 'regando', 'ha': 0.6, 'target': 45, 'temp': 26.8},
    {'name': 'A2', 'moisture': 52, 'irrigation': 'corrigiendo', 'ha': 0.5, 'target': 45, 'temp': 27.0},
    {'name': 'A3', 'moisture': 49, 'ha': 0.5, 'target': 45, 'temp': 26.5},
    {'name': 'B1', 'moisture': 41, 'irrigation': 'anomalia', 'ha': 0.5, 'target': 45, 'temp': 28.1},
    {'name': 'B2', 'moisture': 46, 'pest': 'monitoreo', 'ha': 0.6, 'target': 45, 'temp': 27.3},
    {'name': 'B3', 'moisture': 31, 'pest': 'intervencion', 'ha': 0.5, 'target': 45, 'temp': 27.4, 'detections': 7},
]
zone_history = {
    'A1': [{'type': 'riego', 'title': 'Riego ejecutado', 'meta': 'Hoy 07:10 · 14 min'}],
    'A2': [{'type': 'corrigiendo', 'title': 'Corrección por lluvia insuficiente', 'meta': 'Hoy 08:15 · riego de respaldo iniciado'}],
    'A3': [{'type': 'riego', 'title': 'Riego ejecutado', 'meta': 'Ayer 06:45 · 15 min'}],
    'B1': [{'type': 'anomalia', 'title': 'Anomalía de riego detectada', 'meta': 'Hoy 09:50 · 3 riegos sin subir humedad'}],
    'B2': [{'type': 'plaga', 'title': 'Monitoreo de plaga iniciado', 'meta': 'Hoy 09:00 · nivel bajo'}],
    'B3': [
        {'type': 'plaga', 'title': 'Plaga confirmada por cámara', 'meta': 'Hoy 10:05 · 7 detecciones'},
        {'type': 'anomalia', 'title': 'Anomalía de riego detectada', 'meta': 'Hoy 09:50 · 3 riegos sin subir humedad'},
        {'type': 'riego', 'title': 'Riego ejecutado', 'meta': 'Ayer 06:30 · 16 min'},
    ],
}
zonesSur = [
    {'name': 'C1', 'moisture': 55},
    {'name': 'C2', 'offline': True},
    {'name': 'C3', 'moisture': 51},
    {'name': 'C4', 'moisture': 48},
    {'name': 'C5', 'moisture': 50},
    {'name': 'C6', 'moisture': 53, 'irrigation': 'regando'},
]
events_main = [
    {'type': 'plaga', 'title': 'Plaga confirmada en Parcela Norte · B3', 'meta': 'Hoy 10:05 · 7 detecciones'},
    {'type': 'anomalia', 'title': 'Anomalía de riego en Parcela Norte · B1', 'meta': 'Hoy 09:50 · 3 riegos sin subir humedad'},
    {'type': 'corrigiendo', 'title': 'Corrección por lluvia insuficiente en Parcela Norte · A2', 'meta': 'Hoy 08:15 · riego de respaldo iniciado'},
    {'type': 'riego', 'title': 'Riego ejecutado en Parcela Sur · C6', 'meta': 'Hoy 06:30 · 18 min'},
]
events_parcela = [
    {'type': 'plaga', 'title': 'Plaga confirmada por cámara', 'meta': 'Hoy 10:05 · 7 detecciones'},
    {'type': 'anomalia', 'title': 'Anomalía de riego detectada', 'meta': 'Hoy 09:50 · 3 riegos sin subir humedad'},
    {'type': 'riego', 'title': 'Riego ejecutado', 'meta': 'Ayer 06:30 · 16 min'},
]
events_historico = [
    {'type': 'tratamiento', 'title': 'Tratamiento aplicado en B3', 'meta': 'Hoy 10:12'},
    {'type': 'plaga', 'title': 'Plaga confirmada en B3', 'meta': 'Hoy 10:05 · 7 detecciones'},
    {'type': 'anomalia', 'title': 'Anomalía de riego en B1', 'meta': 'Hoy 09:50 · 3 riegos sin subir humedad'},
    {'type': 'corrigiendo', 'title': 'Riego de respaldo en A2', 'meta': 'Hoy 08:15 · lluvia insuficiente'},
]
events_zona = [
    {'type': 'plaga', 'title': 'Plaga confirmada por cámara', 'meta': 'Hoy 10:05 · 7 detecciones'},
    {'type': 'anomalia', 'title': 'Anomalía de riego', 'meta': 'Hoy 09:50'},
]
zonas_movil = [
    {'name': 'Zona A1', 'moisture': 58, 'irrigation': 'regando', 'pest': 'normal'},
    {'name': 'Zona A2', 'moisture': 52, 'irrigation': 'corrigiendo', 'pest': 'normal'},
    {'name': 'Zona A3', 'moisture': 49, 'irrigation': 'normal', 'pest': 'normal'},
    {'name': 'Zona B1', 'moisture': 41, 'irrigation': 'anomalia', 'pest': 'normal'},
    {'name': 'Zona B2', 'moisture': 46, 'irrigation': 'normal', 'pest': 'monitoreo'},
    {'name': 'Zona B3', 'moisture': 31, 'irrigation': 'normal', 'pest': 'intervencion', 'detections': 7},
]

notifs = [
    ('critica', 'Foco de plaga confirmado · Zona B3', 'Parcela Norte · 7 detecciones · hace 4 min', False, 'parcela.html'),
    ('critica', 'Anomalía de riego · Zona B1', 'Parcela Norte · 3 riegos sin subir humedad · hace 20 min', False, 'parcela.html'),
    ('informativa', 'Corrección por lluvia insuficiente · Zona A2', 'Parcela Norte · el sistema pospuso el riego, no fue suficiente, inició riego de respaldo · hace 1 h', True, 'parcela.html'),
    ('informativa', 'Corrección por lluvia insuficiente · Zona C4', 'Parcela Sur · riego de respaldo iniciado · ayer', True, 'parcela.html'),
]

# ---- 1. Login ----
login = head('Iniciar sesión') + f'''
<div style="width:100%;min-height:100vh;box-sizing:border-box;display:flex;background:var(--bg);">
  <div style="width:480px;position:relative;overflow:hidden;background:var(--surface-inverse);flex:none;">
    <svg viewBox="0 0 480 800" width="480" height="800" style="position:absolute;inset:0;height:100%;">
      <rect x="0" y="-40" width="200" height="420" rx="8" fill="var(--primary)"/>
      <rect x="216" y="520" width="140" height="120" rx="8" fill="var(--suede-green)"/>
      <rect x="216" y="360" width="80" height="48" rx="8" fill="var(--accent)"/>
      <rect x="32" y="360" width="48" height="10" rx="5" fill="var(--ink-on-inverse)" opacity="0.55"/>
      <rect x="88" y="360" width="72" height="10" rx="5" fill="var(--ink-on-inverse)" opacity="0.55"/>
      <rect x="32" y="384" width="96" height="10" rx="5" fill="var(--ink-on-inverse)" opacity="0.55"/>
      <rect x="32" y="408" width="64" height="10" rx="5" fill="var(--ink-on-inverse)" opacity="0.55"/>
      <rect x="104" y="408" width="40" height="10" rx="5" fill="var(--ink-on-inverse)" opacity="0.55"/>
    </svg>
    <div style="position:absolute;left:40px;bottom:64px;right:40px;color:var(--ink-on-inverse);">
      <div style="font-family:var(--font-display);font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-.01em;">SmartRiego<br>MX</div>
      <div style="margin-top:12px;font-size:15px;line-height:22px;opacity:.75;max-width:320px;">Riego y control de plagas por zona, en tiempo real.</div>
    </div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
    <div style="width:380px;display:flex;flex-direction:column;gap:28px;">
      <div><h1 style="margin:0;font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--ink);">Bienvenido de vuelta</h1>
      <p style="margin:6px 0 0;font-size:15px;line-height:22px;color:var(--ink-muted);">Entra para ver el estado de tus parcelas.</p></div>
      <div style="display:flex;flex-direction:column;gap:18px;">
        <div class="sr-field"><label for="email">Correo</label><input id="email" type="email" value="ana.torres@smartriego.mx"></div>
        <div class="sr-field"><label for="pass">Contraseña</label><input id="pass" type="password" value="••••••••••"></div>
        <div style="display:flex;justify-content:flex-end;"><a href="#" style="font-size:13px;color:var(--accent);text-decoration:none;font-weight:600;">¿Olvidaste tu contraseña?</a></div>
      </div>
      {button('Iniciar sesión', 'primary', href='dashboard.html', extra_style='width:100%;justify-content:center;padding:12px 16px;font-size:16px;')}
      <div style="text-align:center;font-size:13px;color:var(--ink-muted);border-top:1px solid var(--border);padding-top:18px;">SmartRiego MX · plataforma de agricultura de precisión</div>
    </div>
  </div>
</div>
''' + FOOT
write('index.html', login)

# ---- 2. Dashboard ----
humedad_chart = '''<svg viewBox="0 0 960 160" width="100%" height="160" role="img" aria-label="Humedad reciente por zona, últimas horas">
  <line x1="30" y1="16" x2="30" y2="130" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="30" y1="130" x2="940" y2="130" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="30" y1="16" x2="940" y2="16" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <line x1="30" y1="73" x2="940" y2="73" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="22" y="134" text-anchor="end" font-size="11" fill="var(--ink-muted)">0%</text>
  <text x="22" y="77" text-anchor="end" font-size="11" fill="var(--ink-muted)">50%</text>
  <text x="22" y="20" text-anchor="end" font-size="11" fill="var(--ink-muted)">100%</text>
  <polyline points="60,60 200,55 340,62 480,58 620,60 760,57 900,58" fill="none" stroke="var(--chart-water)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="60,95 200,92 340,90 480,88 620,85 760,87 900,84" fill="none" stroke="var(--chart-savings)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="60,110 200,105 340,101 480,100 620,103 760,108 900,109" fill="none" stroke="var(--status-warn)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 5"/>
  <g font-size="11" fill="var(--ink-muted)" text-anchor="middle"><text x="60" y="146">08:00</text><text x="200" y="146">10:00</text><text x="340" y="146">12:00</text><text x="480" y="146">14:00</text><text x="620" y="146">16:00</text><text x="760" y="146">18:00</text><text x="900" y="146">Ahora</text></g>
</svg>'''
consumo_chart_mini = '''<svg viewBox="0 0 960 120" width="100%" height="120" role="img" aria-label="Consumo de agua, minutos regados por día, escala 0 a 60 minutos">
  <line x1="30" y1="10" x2="30" y2="95" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="30" y1="95" x2="940" y2="95" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="30" y1="52" x2="940" y2="52" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <line x1="30" y1="10" x2="940" y2="10" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="22" y="99" text-anchor="end" font-size="11" fill="var(--ink-muted)">0</text>
  <text x="22" y="56" text-anchor="end" font-size="11" fill="var(--ink-muted)">30</text>
  <text x="22" y="14" text-anchor="end" font-size="11" fill="var(--ink-muted)">60</text>
  <g fill="var(--chart-water)">
    <rect x="50" y="55" width="60" height="40" rx="3"/><rect x="150" y="40" width="60" height="55" rx="3"/><rect x="250" y="60" width="60" height="35" rx="3"/><rect x="350" y="30" width="60" height="65" rx="3"/><rect x="450" y="45" width="60" height="50" rx="3"/><rect x="550" y="35" width="60" height="60" rx="3"/><rect x="650" y="50" width="60" height="45" rx="3"/>
  </g>
  <g font-size="11" fill="var(--ink-muted)" text-anchor="middle"><text x="80" y="110">Lun</text><text x="180" y="110">Mar</text><text x="280" y="110">Mié</text><text x="380" y="110">Jue</text><text x="480" y="110">Vie</text><text x="580" y="110">Sáb</text><text x="680" y="110">Dom</text></g>
</svg>'''
dashboard = head('Dashboard') + f'''
<div class="page">
  {sidebar('dashboard.html')}
  <div class="main" data-parcela-scope="dash">
    <div class="topbar">
      <div>
        <h1 class="h1">Buenos días, Ana</h1>
        <div style="margin-top:10px;">{parcel_selector([('todas','Todas mis parcelas'),('norte','Parcela Norte'),('sur','Parcela Sur')], 'norte', 'dash')}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">{bell(2)}{button('Ver histórico','secondary',href='historico.html')}</div>
    </div>
    <div class="content">

      <div data-parcela="norte">{alert_banner('Foco de plaga confirmado','Parcela Norte · Zona B3 · 7 detecciones confirmadas · hace 4 min', extra='style="margin-bottom:12px;"')}</div>
      <div data-parcela="norte">{alert_banner('Anomalía de riego','Parcela Norte · Zona B1 · 3 riegos seguidos sin subir humedad · hace 20 min')}</div>
      <div data-parcela="norte">{alert_banner('Corrección por lluvia insuficiente','Parcela Norte · Zona A2 · el sistema pospuso el riego, no fue suficiente, inició riego de respaldo · hace 1 h', severity='informativa')}</div>

      <div class="panel" data-parcela="todas">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Humedad reciente por zona</div>
        <div style="display:flex;gap:16px;font-size:12px;color:var(--ink-muted);margin-bottom:6px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:var(--chart-water);margin-right:6px;"></span>A1</span>
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:var(--chart-savings);margin-right:6px;"></span>A2</span>
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:var(--status-warn);margin-right:6px;"></span>B1</span>
        </div>
        {humedad_chart}
      </div>

      <div style="display:flex;gap:20px;" data-parcela="todas">
        <div class="panel" style="flex:1;">
          <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Consumo de agua (minutos regados)</div>
          {consumo_chart_mini}
        </div>
        <div class="panel" style="width:280px;flex:none;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:14px;font-weight:700;">Estado de plagas por zona</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">{badge('normal',label='Normal')}<span class="sr-num" style="font-weight:700;">10</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">{badge('monitoreo')}<span class="sr-num" style="font-weight:700;">1</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">{badge('intervencion')}<span class="sr-num" style="font-weight:700;">1</span></div>
          </div>
        </div>
      </div>

      <div data-parcela="norte">
        <div class="section-title">Parcela Norte</div>
        <a href="parcela.html" class="parcel-card" style="border:2px solid var(--status-danger);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div><div style="font-size:16px;font-weight:700;">Parcela Norte</div><div style="font-size:13px;color:var(--ink-muted);margin-top:2px;">Vid · 3.2 ha · 6 zonas</div></div>
            {badge('intervencion', label='1 zona en intervención')}
          </div>
          {parcel_grid(zonesNorte, 6, 'B3')}
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink-muted);border-top:1px solid var(--border);padding-top:12px;">
            <span>Última lectura · hace 3 min</span><span style="color:var(--accent);font-weight:600;">Ver parcela →</span>
          </div>
        </a>
      </div>
      <div data-parcela="sur">
        <div class="section-title">Parcela Sur</div>
        <a href="parcela.html" class="parcel-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div><div style="font-size:16px;font-weight:700;">Parcela Sur</div><div style="font-size:13px;color:var(--ink-muted);margin-top:2px;">Vid · 2.1 ha · 6 zonas</div></div>
            {badge('normal', label='Todo normal')}
          </div>
          {parcel_grid(zonesSur, 6)}
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink-muted);border-top:1px solid var(--border);padding-top:12px;">
            <span>Última lectura · hace 5 min</span><span style="color:var(--accent);font-weight:600;">Ver parcela →</span>
          </div>
        </a>
      </div>

      <div>
        <div class="section-title">Actividad reciente</div>
        <div class="panel">{events_table(events_main)}</div>
      </div>
    </div>
  </div>
</div>
{PARCELA_JS}
''' + FOOT
write('dashboard.html', dashboard)

# ---- 3. Parcela ----
import json as _json

def _zone_panel_inner(z, done=False):
    label = None
    if z.get('detections'):
        label = STATUS[z['pest']]['label'] + f" · {z['detections']}"
    action = ('<div style="display:flex;align-items:center;gap:8px;color:var(--status-ok);font-weight:700;font-size:14px;">' + icon('check', 18) + 'Zona atendida</div>') if done \
        else button('Marcar atendida', 'primary', extra_style='justify-content:center;', onclick=f"markAtendida('{z['name']}')")
    return f'''<div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-size:17px;font-weight:700;">Zona {z["name"]}</div><div style="font-size:13px;color:var(--ink-muted);">Vid · {z.get("ha", 0.5)} ha</div></div>
          <div style="display:flex;align-items:baseline;gap:8px;"><span style="font-family:var(--font-mono);font-weight:700;font-size:32px;">{"—" if z.get("offline") else str(z["moisture"]) + "%"}</span><span style="font-size:13px;color:var(--ink-muted);">/ objetivo {z.get("target", 45)}%</span></div>
          {moisture_bar(z.get("moisture"), z.get("target", 45), z.get("offline", False), hide_label=True)}
          <div style="display:flex;align-items:baseline;gap:6px;font-size:14px;"><span style="font-weight:700;color:var(--ink-muted);">Temp.</span><span style="font-family:var(--font-mono);font-weight:700;">{z.get("temp", "—")} °C</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">{badge(z.get("irrigation", "normal"), prefix="Riego")}{badge(z.get("pest", "normal"), prefix="Plaga", label=label)}</div>
          {action}'''

def _grid_cell_inner(z):
    t = cell_tone(z)
    ic = {'ok': 'ok', 'warn': 'warn', 'danger': 'danger', 'water': 'water', 'info': 'sync', 'off': 'off'}[t]
    col = {'ok': 'var(--status-ok)', 'warn': 'var(--status-warn)', 'danger': 'var(--status-danger)', 'water': 'var(--accent)', 'info': 'var(--status-info)', 'off': 'var(--status-offline)'}[t]
    val = '—' if z.get('offline') else f'{z["moisture"]}%'
    key = z['pest'] if z.get('pest') and z['pest'] != 'normal' else z.get('irrigation', 'normal')
    sub = 'Sin lectura' if z.get('offline') else STATUS[key]['label']
    return t, f'<div class="sr-cell-top"><span class="sr-cell-name">{z["name"]}</span><span style="color:{col};display:flex;">{icon(ic, 18)}</span></div><div><div class="sr-cell-val">{val}</div><div class="sr-muted" style="font-size:13px;line-height:18px;">{sub}</div></div>'

_border_color = {'ok': 'var(--border)', 'warn': 'var(--status-warn)', 'danger': 'var(--status-danger)', 'water': 'var(--border)', 'info': 'var(--status-info)', 'off': 'var(--status-offline)'}

def _zone_done(z):
    zd = dict(z)
    zd['pest'] = 'normal'
    zd.pop('detections', None)
    return zd

_zones_done = {z['name']: _zone_done(z) for z in zonesNorte}

ZONE_PANEL_JS = _json.dumps({z['name']: _zone_panel_inner(z) for z in zonesNorte})
ZONE_PANEL_DONE_JS = _json.dumps({name: _zone_panel_inner(zd, done=True) for name, zd in _zones_done.items()})
ZONE_BORDER_JS = _json.dumps({z['name']: _border_color[cell_tone(z)] for z in zonesNorte})
ZONE_BORDER_DONE_JS = _json.dumps({name: _border_color[cell_tone(zd)] for name, zd in _zones_done.items()})
GRID_CELL_DONE_JS = _json.dumps({name: _grid_cell_inner(zd)[1] for name, zd in _zones_done.items()})
GRID_TONE_DONE_JS = _json.dumps({name: _grid_cell_inner(zd)[0] for name, zd in _zones_done.items()})
ZONE_HISTORY_JS = _json.dumps({name: events_table(evs) for name, evs in zone_history.items()})
ZONE_HISTORY_DONE_JS = _json.dumps({
    name: events_table([{'type': 'tratamiento', 'title': 'Marcada como atendida', 'meta': 'Ahora'}] + evs)
    for name, evs in zone_history.items()
})

SELECTZONE_JS = f'''<script>
var ZONE_PANEL = {ZONE_PANEL_JS};
var ZONE_PANEL_DONE = {ZONE_PANEL_DONE_JS};
var ZONE_BORDER = {ZONE_BORDER_JS};
var ZONE_BORDER_DONE = {ZONE_BORDER_DONE_JS};
var GRID_CELL_DONE = {GRID_CELL_DONE_JS};
var GRID_TONE_DONE = {GRID_TONE_DONE_JS};
var ZONE_HISTORY = {ZONE_HISTORY_JS};
var ZONE_HISTORY_DONE = {ZONE_HISTORY_DONE_JS};
function selectZone(id){{
  if(!ZONE_PANEL[id]) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-zone-cell]'), function(c){{ c.classList.remove('is-selected'); }});
  var cell = document.querySelector('[data-zone-cell="'+id+'"]');
  if(cell) cell.classList.add('is-selected');
  document.getElementById('zone-card-inner').innerHTML = ZONE_PANEL[id];
  document.getElementById('zone-card').style.borderColor = ZONE_BORDER[id];
  document.getElementById('zone-history').innerHTML = ZONE_HISTORY[id];
}}
function markAtendida(id){{
  ZONE_PANEL[id] = ZONE_PANEL_DONE[id];
  ZONE_BORDER[id] = ZONE_BORDER_DONE[id];
  ZONE_HISTORY[id] = ZONE_HISTORY_DONE[id];
  var cell = document.querySelector('[data-zone-cell="'+id+'"]');
  if(cell){{
    var wasSelected = cell.classList.contains('is-selected');
    cell.className = 'sr-cell t-' + GRID_TONE_DONE[id] + (wasSelected ? ' is-selected' : '');
    cell.innerHTML = GRID_CELL_DONE[id];
  }}
  selectZone(id);
}}
</script>'''

parcela = head('Detalle de parcela') + f'''
<div class="page">
  {sidebar('parcela.html')}
  <div class="main">
    <div style="padding:20px 32px;border-bottom:1px solid var(--border);">
      <a href="dashboard.html" class="back">← Volver al dashboard</a>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
        <div><h1 class="h1">Parcela Norte</h1><p class="sub">Vid · 3.2 ha · 6 zonas</p></div>
        {badge('intervencion', label='1 zona en intervención')}
      </div>
    </div>
    <div class="content" style="flex-direction:row;align-items:flex-start;">
      <div class="panel" style="flex:1;">
        <div style="font-size:14px;font-weight:700;margin-bottom:14px;">Plano de la parcela</div>
        {parcel_grid(zonesNorte, 3, 'B3', clickable=True)}
      </div>
      <div style="width:380px;flex:none;display:flex;flex-direction:column;gap:16px;">
        <div class="panel" id="zone-card" style="border:2px solid var(--status-danger);display:flex;flex-direction:column;gap:14px;">
          <div id="zone-card-inner">{_zone_panel_inner(zonesNorte[5])}</div>
        </div>
        <div class="panel"><div style="font-size:14px;font-weight:700;margin-bottom:12px;">Historial de la zona</div><div id="zone-history">{events_table(zone_history['B3'])}</div></div>
      </div>
    </div>
  </div>
</div>
{SELECTZONE_JS}
''' + FOOT
write('parcela.html', parcela)

# ---- 4. Notificaciones ----
notif_rows = ''.join(notification_row(*n) for n in notifs)
notificaciones = head('Notificaciones') + f'''
<div class="page">
  {sidebar('notificaciones.html')}
  <div class="main">
    <div style="padding:20px 32px;border-bottom:1px solid var(--border);">
      <a href="dashboard.html" class="back">← Volver al dashboard</a>
      <h1 class="h1" style="margin-top:6px;">Notificaciones</h1>
      <p class="sub">2 críticas sin atender · 2 informativas</p>
    </div>
    <div class="content">
      <div class="panel" style="padding:0;">{notif_rows}</div>
    </div>
  </div>
</div>
''' + FOOT
write('notificaciones.html', notificaciones)

# ---- 4b. Perfil ----
perfil = head('Perfil') + f'''
<div class="page">
  {sidebar('perfil.html')}
  <div class="main">
    <div style="padding:20px 32px;border-bottom:1px solid var(--border);">
      <a href="dashboard.html" class="back">← Volver al dashboard</a>
      <h1 class="h1" style="margin-top:6px;">Perfil</h1>
      <p class="sub">Ana Torres · Agricultor</p>
    </div>
    <div class="content" style="max-width:520px;">
      <div class="panel" style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:52px;height:52px;border-radius:999px;background:var(--primary);color:var(--on-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">AT</div>
          <div><div style="font-size:16px;font-weight:700;">Ana Torres</div><div style="font-size:13px;color:var(--ink-muted);">Agricultor · 2 parcelas asignadas</div></div>
        </div>
        <div class="sr-field"><label for="p-name">Nombre</label><input id="p-name" type="text" value="Ana Torres"></div>
        <div class="sr-field"><label for="p-email">Correo</label><input id="p-email" type="email" value="ana.torres@smartriego.mx"></div>
        <button type="button" class="sr-btn sr-btn-primary" style="align-self:flex-start;">Guardar cambios</button>
        <div style="border-top:1px solid var(--border);padding-top:16px;display:flex;flex-direction:column;gap:8px;">
          <div class="sr-field"><label>Contraseña</label><div style="font-family:var(--font-mono);font-size:15px;color:var(--ink-muted);">••••••••••</div></div>
          <button type="button" id="pw-reset-btn" class="sr-btn sr-btn-secondary" style="align-self:flex-start;" onclick="document.getElementById('pw-reset-msg').style.display='flex'; this.style.display='none';">Recuperar contraseña</button>
          <div id="pw-reset-msg" style="display:none;align-items:center;gap:8px;font-size:13px;color:var(--ink-muted);">{icon('check', 16)}Te enviamos un correo a ana.torres@smartriego.mx con instrucciones para restablecer tu contraseña.</div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:14px;font-weight:700;">Notificaciones</div>
        <label style="display:flex;align-items:center;gap:10px;font-size:14px;"><input type="checkbox" checked style="width:16px;height:16px;accent-color:var(--primary);">Recibir alertas críticas por correo</label>
        <label style="display:flex;align-items:center;gap:10px;font-size:14px;"><input type="checkbox" checked style="width:16px;height:16px;accent-color:var(--primary);">Recibir notificaciones informativas</label>
      </div>
      <a href="index.html" class="sr-btn sr-btn-secondary" style="margin-top:20px;text-decoration:none;display:inline-flex;">Cerrar sesión</a>
    </div>
  </div>
</div>
''' + FOOT
write('perfil.html', perfil)

# ---- 5. Histórico ----
chart = '''<svg viewBox="0 0 960 220" width="100%" height="220" role="img" aria-label="Minutos regados por día, últimos 7 días, con línea de referencia">
  <line x1="40" y1="20" x2="40" y2="180" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="40" y1="180" x2="940" y2="180" stroke="var(--chart-grid)" stroke-width="1"/>
  <line x1="40" y1="20" x2="940" y2="20" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <line x1="40" y1="100" x2="940" y2="100" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="30" y="184" text-anchor="end" font-size="11" fill="var(--ink-muted)">0</text>
  <text x="30" y="104" text-anchor="end" font-size="11" fill="var(--ink-muted)">30</text>
  <text x="30" y="24" text-anchor="end" font-size="11" fill="var(--ink-muted)">60</text>
  <line x1="40" y1="88" x2="940" y2="88" stroke="var(--chart-target)" stroke-width="2" stroke-dasharray="5 5"/>
  <polygon points="40,180 168,140 296,150 424,100 552,120 680,90 808,110 936,70 936,180" fill="var(--chart-water)" opacity="0.14"/>
  <polyline points="40,180 168,140 296,150 424,100 552,120 680,90 808,110 936,70" fill="none" stroke="var(--chart-water)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="var(--chart-water)"><circle cx="40" cy="180" r="4"/><circle cx="168" cy="140" r="4"/><circle cx="296" cy="150" r="4"/><circle cx="424" cy="100" r="4"/><circle cx="552" cy="120" r="4"/><circle cx="680" cy="90" r="4"/><circle cx="808" cy="110" r="4"/><circle cx="936" cy="70" r="4"/></g>
  <g font-size="11" fill="var(--ink-muted)" text-anchor="middle"><text x="40" y="200">Lun</text><text x="168" y="200">Mar</text><text x="296" y="200">Mié</text><text x="424" y="200">Jue</text><text x="552" y="200">Vie</text><text x="680" y="200">Sáb</text><text x="808" y="200">Dom</text><text x="936" y="200">Hoy</text></g>
</svg>'''
historico = head('Histórico y reportes') + f'''
<div class="page">
  {sidebar('historico.html')}
  <div class="main">
    <div style="padding:20px 32px;border-bottom:1px solid var(--border);">
      <a href="dashboard.html" class="back">← Volver al dashboard</a>
      <h1 class="h1" style="margin-top:6px;">Histórico y reportes</h1>
    </div>
    <div class="content">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <select class="sr-psel" aria-label="Filtrar por parcela"><option>Todas mis parcelas</option><option>Parcela Norte</option><option>Parcela Sur</option></select>
        <select class="sr-psel" aria-label="Filtrar por zona"><option>Zona: todas</option><option>A1</option><option>A2</option><option>A3</option><option>B1</option><option>B2</option><option>B3</option></select>
        <input type="date" class="sr-date" aria-label="Desde" value="2026-09-16">
        <span style="color:var(--ink-muted);font-size:13px;">–</span>
        <input type="date" class="sr-date" aria-label="Hasta" value="2026-09-22">
      </div>
      <div style="display:flex;gap:20px;">
        <div class="stat"><div class="stat-label">MINUTOS REGADOS (7 DÍAS)</div><div class="stat-val">312 min</div></div>
        <div class="stat"><div class="stat-label">AHORRO ESTIMADO vs. tiempo fijo de referencia</div><div class="stat-val" style="color:var(--primary);">−23%</div></div>
        <div class="stat"><div class="stat-label">INTERVENCIONES DE PLAGA</div><div class="stat-val" style="color:var(--status-danger);">1</div></div>
      </div>
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <div style="font-size:14px;font-weight:700;">Minutos regados por día</div>
          <div style="display:flex;gap:16px;font-size:12px;color:var(--ink-muted);">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--chart-water);margin-right:6px;"></span>Minutos regados</span>
            <span><span style="display:inline-block;width:10px;height:2px;background:var(--chart-target);margin-right:6px;vertical-align:middle;"></span>Referencia por zona/cultivo</span>
          </div>
        </div>
        {chart}
      </div>
      <div class="panel"><div style="font-size:14px;font-weight:700;margin-bottom:12px;">Timeline de intervenciones</div>{events_table(events_historico)}</div>
    </div>
  </div>
</div>
''' + FOOT
write('historico.html', historico)

# ---- 6. Dispositivos (Admin) ----
dispositivos = head('Dispositivos IoT') + f'''
<div class="page">
  {sidebar('admin-dispositivos.html', admin=True)}
  <div class="main">
    <div class="topbar">
      <div><h1 class="h1">Dispositivos IoT</h1><p class="sub">3 dispositivos registrados en toda la plataforma</p></div>
      {button('+ Registrar dispositivo','primary', onclick="document.getElementById('newdev').style.display='flex'; this.style.display='none';")}
    </div>
    <div class="content">
      <div id="newdev" class="panel" style="display:none;border:2px solid var(--primary);flex-direction:column;gap:14px;">
        <div style="font-size:15px;font-weight:700;">Nuevo dispositivo registrado</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div><div class="stat-label">NOMBRE</div><div style="font-size:14px;font-weight:600;margin-top:2px;">ESP32-04</div></div>
          <div><div class="stat-label">ASIGNAR A</div><div style="font-size:14px;font-weight:600;margin-top:2px;">Parcela Sur · sin zona</div></div>
          <div style="flex:1;min-width:260px;"><div class="stat-label">API KEY</div>
            <div style="font-family:var(--font-mono);font-size:13px;background:var(--surface-sunken);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;margin-top:2px;word-break:break-all;">sr_live_8f3a1c2e9b47d0f6a2c8e451</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--ink-muted);">Copia esta clave ahora: no vuelve a mostrarse completa.</div>
      </div>
      <div class="panel" style="padding:0;">
        <div class="drow dhead"><div>DISPOSITIVO</div><div>PARCELA / ZONA</div><div>ESTADO</div><div>ÚLTIMA LECTURA</div><div></div></div>
        <div class="drow"><div style="font-weight:700;">ESP32-01</div><div style="color:var(--ink-muted);">Parcela Norte · B3</div><div>{badge('online', size='sm')}</div><div style="font-family:var(--font-mono);color:var(--ink-muted);">hace 2 min</div><a href="#" style="color:var(--accent);font-weight:600;font-size:13px;text-decoration:none;">Ver API key</a></div>
        <div class="drow"><div style="font-weight:700;">RPi-02</div><div style="color:var(--ink-muted);">Parcela Sur · C6</div><div>{badge('online', size='sm')}</div><div style="font-family:var(--font-mono);color:var(--ink-muted);">hace 5 min</div><a href="#" style="color:var(--accent);font-weight:600;font-size:13px;text-decoration:none;">Ver API key</a></div>
        <div class="drow"><div style="font-weight:700;">ESP32-03</div><div style="color:var(--ink-muted);">Parcela Sur · C2</div><div>{badge('offline', size='sm')}</div><div style="font-family:var(--font-mono);color:var(--ink-muted);">hace 42 min</div><a href="#" style="color:var(--accent);font-weight:600;font-size:13px;text-decoration:none;">Ver API key</a></div>
      </div>
    </div>
  </div>
</div>
''' + FOOT
write('admin-dispositivos.html', dispositivos)

# ---- 7. Gestión de usuarios (Admin) ----
usuarios = head('Gestión de usuarios') + f'''
<div class="page">
  {sidebar('admin-usuarios.html', admin=True)}
  <div class="main">
    <div class="topbar">
      <div><h1 class="h1">Gestión de usuarios</h1><p class="sub">2 Agricultores dados de alta</p></div>
      {button('+ Nuevo Agricultor','primary', onclick="document.getElementById('newuser').style.display='flex'; this.style.display='none';")}
    </div>
    <div class="content">
      <div id="newuser" class="panel" style="display:none;border:2px solid var(--primary);flex-direction:column;gap:14px;">
        <div style="font-size:15px;font-weight:700;">Nuevo Agricultor dado de alta</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div><div class="stat-label">NOMBRE</div><div style="font-size:14px;font-weight:600;margin-top:2px;">Luis Herrera</div></div>
          <div><div class="stat-label">CORREO</div><div style="font-size:14px;font-weight:600;margin-top:2px;">luis.herrera@smartriego.mx</div></div>
        </div>
        <div style="font-size:12px;color:var(--ink-muted);">Se envió un correo de bienvenida con instrucciones para crear su contraseña.</div>
      </div>
      <div class="panel" style="padding:0;">
        <div class="drow dhead" style="grid-template-columns:1.4fr 1.4fr 1fr 1fr auto;"><div>NOMBRE</div><div>CORREO</div><div>PARCELAS</div><div>ESTADO</div><div></div></div>
        <div class="drow" style="grid-template-columns:1.4fr 1.4fr 1fr 1fr auto;"><div style="font-weight:700;">Ana Torres</div><div style="color:var(--ink-muted);">ana.torres@smartriego.mx</div><div style="color:var(--ink-muted);">2</div><div>{badge('online', label='Activo', size='sm')}</div><a href="#" style="color:var(--accent);font-weight:600;font-size:13px;text-decoration:none;">Editar</a></div>
        <div class="drow" style="grid-template-columns:1.4fr 1.4fr 1fr 1fr auto;"><div style="font-weight:700;">Marco Díaz</div><div style="color:var(--ink-muted);">marco.diaz@smartriego.mx</div><div style="color:var(--ink-muted);">1</div><div>{badge('online', label='Activo', size='sm')}</div><a href="#" style="color:var(--accent);font-weight:600;font-size:13px;text-decoration:none;">Editar</a></div>
      </div>
    </div>
  </div>
</div>
''' + FOOT
write('admin-usuarios.html', usuarios)

# ---- 8. Gestión de mis parcelas y zonas (Agricultor) ----
gestion = head('Gestión de parcelas y zonas') + f'''
<div class="page">
  {sidebar('gestion-parcelas.html')}
  <div class="main">
    <div class="topbar">
      <div><h1 class="h1">Mis parcelas y zonas</h1><p class="sub">2 parcelas · 12 zonas</p></div>
      {button('+ Nueva parcela','primary', onclick="document.getElementById('newparcela').style.display='flex'; this.style.display='none';")}
    </div>
    <div class="content">
      <div id="newparcela" class="panel" style="display:none;border:2px solid var(--primary);flex-direction:column;gap:14px;">
        <div style="font-size:15px;font-weight:700;">Nueva parcela creada</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div><div class="stat-label">NOMBRE</div><div style="font-size:14px;font-weight:600;margin-top:2px;">Parcela Este</div></div>
          <div><div class="stat-label">UBICACIÓN</div><div style="font-size:14px;font-weight:600;margin-top:2px;">Ensenada, BC</div></div>
          <div><div class="stat-label">CULTIVO</div><div style="font-size:14px;font-weight:600;margin-top:2px;">Vid</div></div>
        </div>
      </div>
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:16px;font-weight:700;">Parcela Norte</div>
          {button('+ Nueva zona','secondary', onclick="document.getElementById('newzona-norte').style.display='flex'; this.style.display='none';", extra_attrs='id="newzonabtn-norte"')}
        </div>
        <div id="newzona-norte" class="panel" style="display:none;border:2px solid var(--primary);flex-direction:column;gap:12px;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:700;">Nueva zona</div>
          <div class="sr-field"><label for="nz-name">Nombre</label><input id="nz-name" type="text" value="Zona A4"></div>
          <div class="sr-field"><label for="nz-thr">Umbral objetivo</label><input id="nz-thr" type="text" value="45%"></div>
          <div style="display:flex;justify-content:flex-end;">{button('Guardar','primary', onclick="document.getElementById('newzona-norte').style.display='none'; document.getElementById('newzonabtn-norte').style.display='';")}</div>
        </div>
        <div class="drow dhead" style="grid-template-columns:1fr 1fr auto;"><div>ZONA</div><div>UMBRAL OBJETIVO</div><div></div></div>
        <div class="drow" style="grid-template-columns:1fr 1fr auto;align-items:center;"><div style="font-weight:700;">Zona A1</div><div style="color:var(--ink-muted);">45%</div>{button('Editar','secondary', onclick="document.getElementById('edit-a1').style.display='flex'; this.style.display='none';", extra_style='padding:4px 10px;font-size:13px;', extra_attrs='id="editbtn-a1"')}</div>
        <div id="edit-a1" class="panel" style="display:none;border:1.5px solid var(--border-strong);flex-direction:row;align-items:flex-end;gap:12px;margin:-4px 0 8px;">
          <div class="sr-field" style="flex:1;"><label for="a1-thr">Umbral objetivo</label><input id="a1-thr" type="text" value="45%"></div>
          {button('Guardar','primary', onclick="document.getElementById('edit-a1').style.display='none'; document.getElementById('editbtn-a1').style.display='';")}
        </div>
        <div class="drow" style="grid-template-columns:1fr 1fr auto;align-items:center;"><div style="font-weight:700;">Zona B3</div><div style="color:var(--ink-muted);">45%</div>{button('Editar','secondary', onclick="document.getElementById('edit-b3').style.display='flex'; this.style.display='none';", extra_style='padding:4px 10px;font-size:13px;', extra_attrs='id="editbtn-b3"')}</div>
        <div id="edit-b3" class="panel" style="display:none;border:1.5px solid var(--border-strong);flex-direction:row;align-items:flex-end;gap:12px;margin:-4px 0 0;">
          <div class="sr-field" style="flex:1;"><label for="b3-thr">Umbral objetivo</label><input id="b3-thr" type="text" value="45%"></div>
          {button('Guardar','primary', onclick="document.getElementById('edit-b3').style.display='none'; document.getElementById('editbtn-b3').style.display='';")}
        </div>
      </div>
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:16px;font-weight:700;">Parcela Sur</div>
          {button('+ Nueva zona','secondary', onclick="document.getElementById('newzona-sur').style.display='flex'; this.style.display='none';", extra_attrs='id="newzonabtn-sur"')}
        </div>
        <div id="newzona-sur" class="panel" style="display:none;border:2px solid var(--primary);flex-direction:column;gap:12px;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:700;">Nueva zona</div>
          <div class="sr-field"><label for="nzs-name">Nombre</label><input id="nzs-name" type="text" value="Zona C7"></div>
          <div class="sr-field"><label for="nzs-thr">Umbral objetivo</label><input id="nzs-thr" type="text" value="40%"></div>
          <div style="display:flex;justify-content:flex-end;">{button('Guardar','primary', onclick="document.getElementById('newzona-sur').style.display='none'; document.getElementById('newzonabtn-sur').style.display='';")}</div>
        </div>
        <div class="drow dhead" style="grid-template-columns:1fr 1fr auto;"><div>ZONA</div><div>UMBRAL OBJETIVO</div><div></div></div>
        <div class="drow" style="grid-template-columns:1fr 1fr auto;align-items:center;"><div style="font-weight:700;">Zona C6</div><div style="color:var(--ink-muted);">40%</div>{button('Editar','secondary', onclick="document.getElementById('edit-c6').style.display='flex'; this.style.display='none';", extra_style='padding:4px 10px;font-size:13px;', extra_attrs='id="editbtn-c6"')}</div>
        <div id="edit-c6" class="panel" style="display:none;border:1.5px solid var(--border-strong);flex-direction:row;align-items:flex-end;gap:12px;margin:-4px 0 0;">
          <div class="sr-field" style="flex:1;"><label for="c6-thr">Umbral objetivo</label><input id="c6-thr" type="text" value="40%"></div>
          {button('Guardar','primary', onclick="document.getElementById('edit-c6').style.display='none'; document.getElementById('editbtn-c6').style.display='';")}
        </div>
      </div>
    </div>
  </div>
</div>
''' + FOOT
write('gestion-parcelas.html', gestion)

# ---- Mobile ----
def mobile_wrap(inner):
    return f'<div class="mobile-shell">{inner}</div>'

def tabs(active):
    def cls(n): return 'tab active' if n==active else 'tab'
    return f'''<div class="tabbar">
  <a href="m-inicio.html" class="{cls('inicio')}"><svg width="20" height="20" viewBox="0 0 16 16"><rect x="1" y="7" width="14" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 7 8 2l6 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Inicio</a>
  <a href="m-notificaciones.html" class="{cls('alertas')}"><svg width="20" height="20" viewBox="0 0 16 16"><path d="M8 2.5 14 13.5H2Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Alertas</a>
  <a href="#" class="{cls('perfil')}"><svg width="20" height="20" viewBox="0 0 16 16"><circle cx="8" cy="5.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Perfil</a>
</div>'''

home_inner = f'''
  <div style="padding:20px 20px 12px;flex:none;"><div style="font-size:13px;color:var(--ink-muted);">Hola, Ana</div><h1 style="margin:2px 0 0;font-family:var(--font-display);font-size:22px;font-weight:700;">Mis parcelas</h1></div>
  <div style="padding:0 20px 12px;flex:none;">{connection_banner('synced')}</div>
  <div style="flex:1;overflow-y:auto;padding:4px 20px 20px;display:flex;flex-direction:column;gap:12px;">
    <a href="m-parcela.html" class="prow">
      <div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-size:16px;font-weight:700;">Parcela Norte</div>{badge('intervencion', label='Intervención', size='sm')}</div>
      <div style="font-size:13px;color:var(--ink-muted);">Vid · 3.2 ha · 6 zonas</div>
      <div style="font-size:12px;color:var(--status-danger);font-weight:700;">Zona B3 requiere atención</div>
    </a>
    <a href="m-parcela.html" class="prow">
      <div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-size:16px;font-weight:700;">Parcela Sur</div>{badge('normal', label='Normal', size='sm')}</div>
      <div style="font-size:13px;color:var(--ink-muted);">Vid · 2.1 ha · 6 zonas</div>
      <div style="font-size:12px;color:var(--ink-muted);">Última lectura · hace 5 min</div>
    </a>
  </div>
  {tabs('inicio')}
'''
write('m-inicio.html', head('Inicio (móvil)') + mobile_wrap(f'<div style="display:flex;flex-direction:column;height:100%;">{home_inner}</div>') + FOOT)

rows = ''.join(
    f'<a href="m-zona.html" style="display:block;text-decoration:none;color:inherit;">{zone_card(z, "row")}</a>' if z['name'] == 'Zona B3' else zone_card(z, 'row')
    for z in zonas_movil
)
parcela_movil_inner = f'''
  <div style="padding:20px 20px 12px;flex:none;">
    <a href="m-inicio.html" class="back">← Mis parcelas</a>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><h1 style="margin:0;font-family:var(--font-display);font-size:21px;font-weight:700;">Parcela Norte</h1>{badge('intervencion', size='sm')}</div>
    <div style="font-size:13px;color:var(--ink-muted);margin-top:2px;">Vid · 3.2 ha · 6 zonas</div>
  </div>
  <div style="flex:1;overflow-y:auto;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);margin:0 16px 16px;">{rows}</div>
'''
write('m-parcela.html', head('Parcela Norte (móvil)') + mobile_wrap(f'<div style="display:flex;flex-direction:column;height:100%;">{parcela_movil_inner}</div>') + FOOT)

zona_movil_inner = f'''
  <div style="padding:16px 16px 0;flex:none;">{connection_banner('synced')}</div>
  <div style="padding:14px 20px 8px;flex:none;">
    <a href="m-parcela.html" class="back">← Parcela Norte</a>
    <h1 style="margin:6px 0 0;font-family:var(--font-display);font-size:22px;font-weight:700;">Zona B3</h1>
    <div style="font-size:13px;color:var(--ink-muted);">Vid · 0.5 ha</div>
  </div>
  <div style="flex:1;overflow-y:auto;padding:8px 20px 24px;display:flex;flex-direction:column;gap:16px;">
    {alert_banner('Foco de plaga confirmado', '7 detecciones confirmadas · hace 4 min')}
    <div class="panel" style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="font-family:var(--font-mono);font-weight:700;font-size:34px;">31%</span><span style="font-size:13px;color:var(--ink-muted);">/ objetivo 45%</span></div>
      {moisture_bar(31, 45, hide_label=True)}
      <div style="display:flex;justify-content:space-between;font-size:14px;"><span style="color:var(--ink-muted);font-weight:700;">Temperatura</span><span style="font-family:var(--font-mono);font-weight:700;">27.4 °C</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">{badge('normal', prefix='Riego')}{badge('intervencion', prefix='Plaga', label='Intervención · 7')}</div>
    </div>
    <div class="panel"><div style="font-size:14px;font-weight:700;margin-bottom:10px;">Mini-histórico</div>{timeline(events_zona)}</div>
    {button('Marcar como atendida','primary', extra_style='justify-content:center;')}
  </div>
'''
write('m-zona.html', head('Zona B3 (móvil)') + mobile_wrap(f'<div style="display:flex;flex-direction:column;height:100%;">{zona_movil_inner}</div>') + FOOT)

m_notif_rows = ''.join(notification_row(*n) for n in notifs)
m_notif_inner = f'''
  <div style="padding:20px 20px 12px;flex:none;"><h1 style="margin:0;font-family:var(--font-display);font-size:22px;font-weight:700;">Notificaciones</h1></div>
  <div style="flex:1;overflow-y:auto;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);margin:0 16px 16px;">{m_notif_rows}</div>
  {tabs('alertas')}
'''
write('m-notificaciones.html', head('Notificaciones (móvil)') + mobile_wrap(f'<div style="display:flex;flex-direction:column;height:100%;">{m_notif_inner}</div>') + FOOT)

print('done')
