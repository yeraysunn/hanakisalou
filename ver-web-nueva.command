#!/bin/zsh
# Doble clic: arranca la web nueva de Hanaki Salou en este Mac (reservas, tarjeta y panel con datos de prueba) y la abre.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
pkill -f "servidor-local.mjs web" 2>/dev/null
(sleep 2; open "http://localhost:8792/") &
node servidor-local.mjs web 8792
