# -*- coding: utf-8 -*-
"""يعيد كتابة سطر FIREBASE_PRIVATE_KEY في .env.local سطراً واحداً من ملف حساب الخدمة."""
import io, json, sys

sa = json.load(io.open("service-account.json", encoding="utf-8"))
raw = sa["private_key"]
esc = raw.replace("\r\n", "\n").replace("\n", "\\n")
key_line = 'FIREBASE_PRIVATE_KEY="' + esc + '"'

src = io.open(".env.local", encoding="utf-8").read().splitlines()

out = []
i = 0
while i < len(src):
    line = src[i]
    if line.startswith("FIREBASE_PRIVATE_KEY="):
        out.append(key_line)
        # تجاوز أي بقايا من كتلة PEM متعدّدة الأسطر
        i += 1
        while i < len(src) and (
            src[i].startswith("MII")
            or src[i].startswith("-----END")
            or (src[i] and "=" not in src[i] and not src[i].startswith("#"))
        ):
            i += 1
        continue
    out.append(line)
    i += 1

io.open(".env.local", "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")

# تحقّق صارم
chk = io.open(".env.local", encoding="utf-8").read()
hits = [l for l in chk.splitlines() if l.startswith("FIREBASE_PRIVATE_KEY=")]
ok = (
    len(hits) == 1
    and "BEGIN PRIVATE KEY" in hits[0]
    and "END PRIVATE KEY" in hits[0]
    and chk.count("MII") == 1
)
print("raw key len :", len(raw))
print("line len    :", len(hits[0]) if hits else 0)
print("single line :", len(hits) == 1)
print("RESULT      :", "OK" if ok else "FAILED")
sys.exit(0 if ok else 1)
