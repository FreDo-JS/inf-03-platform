**W skrócie:** PHP potrafi **czytać i zapisywać pliki na serwerze** (np. licznik odwiedzin, prosty dziennik) oraz **przyjmować pliki wysłane formularzem** (np. zdjęcie profilowe). Przy przesyłaniu plików najważniejsze jest bezpieczeństwo — nie wolno ufać nazwie ani typowi pliku od użytkownika.

## Odczyt i zapis — najprostszy sposób

```php
<?php
// zapis (nadpisuje plik)
file_put_contents("notatka.txt", "Pierwsza linia\n");
// dopisanie na koniec
file_put_contents("notatka.txt", "Kolejna linia\n", FILE_APPEND);

// odczyt całego pliku jako napis
$tresc = file_get_contents("notatka.txt");
// odczyt jako tablica linii
$linie = file("notatka.txt", FILE_IGNORE_NEW_LINES);
foreach ($linie as $linia) echo htmlspecialchars($linia) . "<br>";
?>
```

**Licznik odwiedzin:**

```php
$plik = "licznik.txt";
$ile = file_exists($plik) ? (int) file_get_contents($plik) : 0;
$ile++;
file_put_contents($plik, $ile);
echo "Odwiedzin: $ile";
```

## Odczyt linia po linii — fopen

```php
$f = fopen("dane.csv", "r");       // tryby: r — odczyt, w — zapis (czyści plik), a — dopisywanie
while (($linia = fgets($f)) !== false) {
    $pola = explode(";", trim($linia));
    echo $pola[0] . "<br>";
}
fclose($f);
```

## Przesyłanie pliku na serwer

**Formularz** — potrzebny `enctype="multipart/form-data"` i metoda POST:

```html
<form action="upload.php" method="post" enctype="multipart/form-data">
  <input type="file" name="zdjecie" accept="image/jpeg,image/png">
  <button>Wyślij</button>
</form>
```

**Skrypt:**

```php
<?php
if (isset($_FILES["zdjecie"]) && $_FILES["zdjecie"]["error"] === UPLOAD_ERR_OK) {
    $plik = $_FILES["zdjecie"];

    if ($plik["size"] > 2 * 1024 * 1024) die("Plik większy niż 2 MB.");

    // typ sprawdzamy na podstawie ZAWARTOŚCI, nie nazwy podanej przez użytkownika
    $typ = mime_content_type($plik["tmp_name"]);
    $rozszerzenia = ["image/jpeg" => "jpg", "image/png" => "png"];
    if (!isset($rozszerzenia[$typ])) die("Dozwolone są tylko JPG i PNG.");

    // własna, bezpieczna nazwa zamiast tej od użytkownika
    $nazwa = uniqid("img_") . "." . $rozszerzenia[$typ];
    move_uploaded_file($plik["tmp_name"], "uploads/" . $nazwa);
    echo "Zapisano.";
}
?>
```

| Element `$_FILES["pole"]` | Znaczenie |
|---|---|
| `name` | oryginalna nazwa (od użytkownika — nie ufaj jej) |
| `tmp_name` | tymczasowa ścieżka na serwerze |
| `size` | rozmiar w bajtach |
| `error` | kod błędu, `UPLOAD_ERR_OK` (0) = w porządku |

## Zasady bezpieczeństwa

1. Ogranicz **rozmiar** i **typy** plików; typ sprawdzaj po zawartości.
2. **Nadawaj własną nazwę** — oryginalna może zawierać `../` albo rozszerzenie `.php`.
3. Nigdy nie pozwól wgrać pliku `.php`, który potem da się uruchomić w katalogu `uploads`.
4. Limity serwera ustawia `php.ini`: `upload_max_filesize`, `post_max_size`.

## Na egzaminie

- `enctype="multipart/form-data"` — bez tego plik nie zostanie wysłany.
- `move_uploaded_file()` przenosi plik z katalogu tymczasowego.
- `file_put_contents` z `FILE_APPEND` dopisuje zamiast nadpisywać.

## Sprawdź się

1. Jakiego atrybutu formularza potrzeba do wysłania pliku?
2. Czym różni się tryb `"w"` od `"a"` w `fopen`?
3. Dlaczego nie zapisuje się pliku pod nazwą z `$_FILES["zdjecie"]["name"]`?

**Odpowiedzi:** 1. `enctype="multipart/form-data"` (i `method="post"`). 2. `w` czyści plik i pisze od nowa, `a` dopisuje na końcu. 3. Nazwa pochodzi od użytkownika — może zawierać niebezpieczne znaki, ścieżkę albo rozszerzenie `.php`.
