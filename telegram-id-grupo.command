#!/bin/zsh
# Doble clic DESPUÉS de meter el bot en el grupo y escribir algo en el grupo.
# Muestra el ID del grupo (TELEGRAM_CHAT_ID) y manda un mensaje de prueba.
cd "$(dirname "$0")"; . ./.env.telegram-salou
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | python3 -c "
import sys,json
d=json.load(sys.stdin); vistos={}
for u in d.get('result',[]):
  for k in ('message','my_chat_member','chat_member'):
    c=(u.get(k) or {}).get('chat')
    if c and c['type'] in ('group','supergroup'): vistos[c['id']]=c.get('title')
for i,t in vistos.items(): print('Grupo:',t,'  TELEGRAM_CHAT_ID =',i)
if not vistos: print('Aún no veo ningún grupo: mete el bot en el grupo y escribe /start@hanakisalou_reservas_bot')
open('.grupo-id','w').write('\n'.join(map(str,vistos)))"
for id in $(cat .grupo-id 2>/dev/null); do curl -s -o /dev/null "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id=$id -d text="✅ Avisos de reservas de Hanaki Salou conectados."; done
rm -f .grupo-id; read -k1 "?Pulsa una tecla para cerrar"
