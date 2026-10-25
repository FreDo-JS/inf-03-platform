#!/usr/bin/env bash
# Kopia zapasowa bazy Tebby na VPS.
#
# Cron, codziennie o 2:30 (crontab -e):
#   30 2 * * * /opt/tebby/deploy/kopia-zapasowa.sh >> /var/log/tebby-kopia.log 2>&1
#
# Kopia, której nigdy nie odtworzyłeś, nie jest kopią. Raz w miesiącu wgraj
# najnowszy plik na pustą bazę i sprawdź, czy aplikacja wstaje — instrukcja
# w docs/wdrozenie-vps.md, sekcja „Próbne odtworzenie".

set -euo pipefail

# Kopia zawiera hasze haseł nauczycieli (schemat auth), klucze testów i prace
# uczniów. Pliki i katalog tylko dla właściciela — bez tego domyślne umask
# 022 robi z nich pliki do odczytu dla każdego konta na serwerze.
umask 077

KATALOG="${TEBBY_BACKUP_DIR:-/var/backups/tebby}"
KONTENER="${TEBBY_DB_CONTAINER:-supabase-db}"
BAZA="${TEBBY_DB_NAME:-postgres}"
UZYTKOWNIK="${TEBBY_DB_USER:-postgres}"
ILE_DNI="${TEBBY_BACKUP_DAYS:-14}"

mkdir -p "$KATALOG"
chmod 700 "$KATALOG"
PLIK="$KATALOG/tebby-$(date +%Y%m%d-%H%M).dump"

# Format custom (-Fc): mniejszy i pozwala odtwarzać wybrane tabele.
# Schemat auth bierzemy razem z public — tam siedzą konta nauczycieli.
docker exec "$KONTENER" pg_dump \
  --username="$UZYTKOWNIK" \
  --dbname="$BAZA" \
  --format=custom \
  --schema=public \
  --schema=auth \
  > "$PLIK"

# Pusty albo podejrzanie mały plik znaczy, że coś poszło nie tak — lepiej
# przerwać z błędem, niż skasować stare kopie i zostać z niczym.
ROZMIAR=$(stat -c%s "$PLIK")
if [ "$ROZMIAR" -lt 10240 ]; then
  echo "BLAD: kopia ma tylko ${ROZMIAR} bajtow — nie kasuje starych." >&2
  exit 1
fi

find "$KATALOG" -name 'tebby-*.dump' -mtime +"$ILE_DNI" -delete

echo "$(date '+%Y-%m-%d %H:%M') OK  $PLIK  ($((ROZMIAR / 1024)) KB)"
