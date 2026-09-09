#!/usr/bin/env bash
set -euo pipefail
ROOT="aurexa-ai-studio"
rm -rf "$ROOT"
mkdir -p "$ROOT"
python3 - "$ROOT" <<'PY'
import base64, json, lzma, os, sys
root=sys.argv[1]
raw=open('aurexa-ai-studio.bundle.xz.b64','rb').read()
files=json.loads(lzma.decompress(base64.b64decode(raw)).decode('utf-8'))
for path, content in files.items():
    dst=os.path.join(root,path)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst,'w',encoding='utf-8') as f: f.write(content)
PY
cd "$ROOT"
npm install --no-audit --no-fund
npm run build
