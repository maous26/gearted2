#!/bin/bash

# Login et récupérer le token
TOKEN=$(curl -s -X POST https://empowering-truth-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fodemusic@gmail.com","password":"votre_mot_de_passe"}' \
  | jq -r '.data.tokens.accessToken')

echo "Token obtenu: ${TOKEN:0:20}..."

# Nettoyer la base de données
curl -X DELETE https://empowering-truth-production.up.railway.app/api/admin/clean-database \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'