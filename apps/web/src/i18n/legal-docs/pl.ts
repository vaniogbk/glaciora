import type { LegalDocs } from './types';

const pl: LegalDocs = {
  terms: {
    version: 'Wersja obowiązująca od 24 listopada 2026 r.',
    intro: [
      'Niniejsze ogólne warunki sprzedaży („Warunki”) mają zastosowanie do każdego zamówienia złożonego w serwisie {site} („Sklep”), prowadzonym pod marką {brand}.',
    ],
    sections: [
      {
        title: '1. Sprzedawca',
        paragraphs: [
          'Sklep prowadzi {seller}, przedsiębiorca prowadzący jednoosobową działalność gospodarczą ({legalForm}), dane rejestrowe: {registration}, adres: {address} („Sprzedawca”).',
          'Kontakt: e-mail {email}, telefon i WhatsApp {phone}. Dane te służą również do składania reklamacji i odstąpienia od umowy.',
        ],
      },
      {
        title: '2. Zakres i akceptacja',
        paragraphs: [
          'Warunki regulują umowy sprzedaży zawierane na odległość w Sklepie między Sprzedawcą a jego klientami. Są dostępne w każdej chwili w stopce strony i można je zapisać lub wydrukować.',
          'Klient akceptuje Warunki, zaznaczając odpowiednie pole przed złożeniem zamówienia. Obowiązują Warunki w brzmieniu z dnia złożenia zamówienia.',
          'Zgodnie z prawem polskim osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy umowa ta nie ma dla niej charakteru zawodowego, korzysta z przepisów o konsumentach w zakresie prawa odstąpienia od umowy, postanowień niedozwolonych oraz zgodności towaru z umową.',
        ],
      },
      {
        title: '3. Towary',
        paragraphs: [
          'Sklep oferuje sprzęt narciarski, hokejowy i do sportów zimowych renomowanych marek. Główne cechy każdego towaru (marka, model, rozmiary, kolory, stan nowy lub używany, specyfikacja) są podane na jego karcie produktu.',
          'Zdjęcia przedstawiają towar i jego kolory możliwie wiernie; odcień może się różnić w zależności od ekranu. Rozstrzygające są cechy opisane na karcie produktu.',
          'Oferty są ważne do wyczerpania zapasów. Jeżeli zamówiony towar okaże się niedostępny, klient zostaje o tym niezwłocznie poinformowany, a kwota zapłacona za ten towar zostaje mu zwrócona najpóźniej w ciągu 14 dni.',
          'Pakiet łączy kilka towarów w obniżonej cenie podanej na jego stronie. Każdy towar z pakietu podlega niniejszym Warunkom; w przypadku odstąpienia od umowy tylko co do części pakietu zwrotowi podlega cena zwróconego towaru po uwzględnieniu rabatu pakietowego.',
        ],
      },
      {
        title: '4. Ceny',
        paragraphs: [
          'Ceny są podawane w euro (EUR). Są to ceny końcowe, zawierające podatki, jeżeli mają zastosowanie. Koszty dostawy, zależne od kraju dostawy i wybranego sposobu wysyłki, doliczane są do ceny towarów i wyświetlane przed złożeniem zamówienia. Sprzedawca nie pobiera żadnych innych opłat.',
          'Obowiązuje cena wyświetlona w chwili złożenia zamówienia. Ewentualne opłaty pobierane przez bank klienta za wykonanie przelewu lub przewalutowanie ponosi klient.',
        ],
      },
      {
        title: '5. Zamówienie',
        paragraphs: ['Zamówienie składa się w następujących krokach:'],
        list: [
          'wybór towarów, rozmiaru i koloru oraz dodanie ich do koszyka;',
          'podanie adresu e-mail i adresu dostawy oraz wybór sposobu dostawy;',
          'wybór metody płatności i sprawdzenie podsumowania (towary, ceny, koszty dostawy, łączna kwota do zapłaty);',
          'akceptacja Warunków i złożenie zamówienia, co oznacza obowiązek zapłaty.',
        ],
        after: [
          'Przed złożeniem zamówienia klient może wrócić do poprzednich kroków, aby sprawdzić i poprawić wprowadzone dane. Zamówienie składa się bez zakładania konta klienta.',
          'Umowa sprzedaży zostaje zawarta z chwilą wysłania przez Sprzedawcę e-maila potwierdzającego zamówienie, który zawiera podsumowanie zamówienia i link do śledzenia.',
          'Sprzedawca może odmówić realizacji zamówienia nietypowego lub zamówienia, którego dowód zapłaty jest nieprawidłowy; klient zostaje o tym poinformowany, a wpłacone kwoty zostają mu zwrócone.',
        ],
      },
      {
        title: '6. Płatność',
        paragraphs: ['Cena jest płatna w całości przy składaniu zamówienia, jedną z metod dostępnych na etapie płatności:'],
        list: [
          'Przelew bankowy SEPA: klient przelewa dokładną kwotę z podanym numerem referencyjnym zamówienia na rachunek bankowy wskazany na etapie płatności, a następnie przed złożeniem zamówienia przesyła potwierdzenie przelewu (potwierdzenie PDF lub obraz). Numer referencyjny i kwota na potwierdzeniu są sprawdzane automatycznie. Zamówienie zostaje wysłane po faktycznym wpływie środków na rachunek Sprzedawcy.',
          'Karta płatnicza: jeżeli ta metoda jest dostępna, płatność obsługuje Mollie B.V. (Amsterdam, Holandia), licencjonowana instytucja płatnicza nadzorowana przez bank centralny Holandii (De Nederlandsche Bank). Dane karty są wprowadzane w bezpiecznym interfejsie Mollie; nigdy nie są przekazywane Sprzedawcy ani przez niego przechowywane. W zależności od banku klienta może być wymagane silne uwierzytelnienie (3-D Secure). Rachunek zostaje obciążony w chwili złożenia zamówienia.',
        ],
        after: [
          'Jeżeli przelew nie wpłynie na rachunek Sprzedawcy w ciągu 7 dni od złożenia zamówienia lub dowód zapłaty okaże się nieprawidłowy, zamówienie zostaje anulowane, o czym klient zostaje poinformowany e-mailem.',
          'Każdy zwrot płatności jest dokonywany bez kosztów dla klienta, przy użyciu takiej samej metody płatności, jakiej użyto przy zamówieniu (przelew na rachunek klienta lub uznanie karty), chyba że klient wyraźnie zgodzi się na inną metodę.',
        ],
      },
      {
        title: '7. Dostawa',
        paragraphs: [
          'Towary są dostarczane do krajów europejskich dostępnych przy składaniu zamówienia, na adres podany przez klienta. Dostępne sposoby dostawy i ich ceny są wyświetlane przed złożeniem zamówienia.',
          'O ile przy zamówieniu nie wskazano krótszego terminu, towary są dostarczane najpóźniej w ciągu 30 dni od potwierdzenia płatności. W przeciwnym razie klient może wyznaczyć Sprzedawcy dodatkowy odpowiedni termin; jeżeli dostawa nie nastąpi w tym terminie, klient może odstąpić od umowy i otrzymać zwrot wszystkich wpłaconych kwot.',
          'Klient śledzi zamówienie bez konta, na stronie „Śledź zamówienie”, za pomocą numeru wyświetlonego na końcu zamówienia i podanego w e-mailu z potwierdzeniem, albo za pomocą linku do śledzenia z tego e-maila: „W przygotowaniu”, „W drodze”, a następnie „Dostarczone”; o każdym etapie informuje e-mail.',
          'Ryzyko utraty lub uszkodzenia towarów przechodzi na klienta z chwilą, gdy klient lub wskazana przez niego osoba trzecia inna niż przewoźnik wejdzie w ich fizyczne posiadanie.',
          'Zachęcamy klienta do sprawdzenia przesyłki przy odbiorze i zgłoszenia wszelkich nieprawidłowości (uszkodzona paczka, brakujący towar) przewoźnikowi oraz Sprzedawcy pod adresem {email}. Sprawdzenie przesyłki nie ogranicza żadnych ustawowych praw klienta.',
        ],
      },
      {
        title: '8. Prawo odstąpienia od umowy',
        paragraphs: [
          'Konsument może w terminie 14 dni odstąpić od umowy bez podania przyczyny i bez ponoszenia kosztów innych niż wskazane poniżej. Termin biegnie od dnia, w którym konsument lub wskazana przez niego osoba trzecia inna niż przewoźnik weszła w fizyczne posiadanie towaru; w przypadku zamówienia kilku towarów dostarczanych osobno — od objęcia w posiadanie ostatniego z nich.',
          'Aby skorzystać z tego prawa, konsument informuje Sprzedawcę o swojej decyzji w drodze jednoznacznego oświadczenia przesłanego e-mailem na adres {email} lub pocztą na adres {address}. Może skorzystać z wzoru formularza zamieszczonego w załączniku, nie jest to jednak obowiązkowe. Do zachowania terminu wystarczy wysłanie oświadczenia przed jego upływem. Sprzedawca potwierdza e-mailem otrzymanie oświadczenia o odstąpieniu.',
          'Konsument odsyła towary niezwłocznie, nie później niż 14 dni od dnia, w którym poinformował o odstąpieniu od umowy, na adres Sprzedawcy wskazany powyżej lub na adres podany przez Sprzedawcę w potwierdzeniu odstąpienia. Bezpośrednie koszty zwrotu towarów ponosi konsument.',
          'Sprzedawca zwraca wszystkie otrzymane płatności, w tym koszty pierwotnej dostawy (z wyjątkiem dodatkowych kosztów wynikających z wybranego sposobu dostawy innego niż najtańszy zwykły sposób oferowany przez Sprzedawcę), nie później niż 14 dni od otrzymania oświadczenia o odstąpieniu. Sprzedawca może wstrzymać się ze zwrotem płatności do chwili otrzymania towarów z powrotem lub dostarczenia przez konsumenta dowodu ich odesłania, w zależności od tego, które zdarzenie nastąpi wcześniej.',
          'Konsument odpowiada wyłącznie za zmniejszenie wartości towarów wynikające z korzystania z nich w sposób wykraczający poza konieczny do stwierdzenia ich charakteru, cech i funkcjonowania (na przykład narty użyte na śniegu, zamontowane wiązania lub naostrzone łyżwy). Zalecamy odesłanie towarów w oryginalnym opakowaniu.',
          'Prawo odstąpienia od umowy nie przysługuje w odniesieniu do towarów wyprodukowanych według specyfikacji konsumenta lub służących zaspokojeniu jego zindywidualizowanych potrzeb, ani towarów dostarczanych w zapieczętowanym opakowaniu, których po otwarciu nie można zwrócić ze względu na ochronę zdrowia lub ze względów higienicznych, jeżeli opakowanie zostało otwarte po dostarczeniu.',
        ],
      },
      {
        title: '9. Zgodność towaru z umową i reklamacje',
        paragraphs: [
          'Sprzedawca ma obowiązek dostarczyć towar zgodny z umową. Odpowiada za brak zgodności towaru z umową istniejący w chwili dostarczenia i ujawniony w ciągu dwóch lat od tej chwili; brak zgodności ujawniony w tym terminie uważa się za istniejący w chwili dostarczenia, o ile nie zostanie udowodnione inaczej. Zasady te dotyczą również towarów używanych.',
          'W przypadku braku zgodności towaru z umową konsument może żądać jego naprawy lub wymiany. Jeżeli doprowadzenie do zgodności jest niemożliwe, nie nastąpiło w rozsądnym czasie lub brak zgodności jest istotny, konsument może żądać obniżenia ceny albo — jeżeli brak zgodności nie jest nieistotny — odstąpić od umowy. Koszty doprowadzenia towaru do zgodności z umową, w tym jego odesłania, ponosi Sprzedawca.',
          'Reklamacje należy kierować na adres {email} lub pocztą na adres {address}, podając numer zamówienia, opis wady i w miarę możliwości zdjęcia. Sprzedawca odpowiada na reklamację w terminie 14 dni; brak odpowiedzi w tym terminie oznacza uznanie reklamacji, zgodnie z prawem polskim.',
          'Ewentualna gwarancja udzielona przez producenta nie wyłącza ani nie ogranicza powyższych uprawnień ustawowych.',
        ],
      },
      {
        title: '10. Dane osobowe',
        paragraphs: ['Dane osobowe klienta są przetwarzane zgodnie z polityką prywatności Sklepu, dostępną w stopce strony.'],
      },
      {
        title: '11. Spory i prawo właściwe',
        paragraphs: [
          'Reklamacje i inne zgłoszenia można kierować do Sprzedawcy na adres {email}. Konsument może także bezpłatnie skorzystać z pozasądowych sposobów rozwiązywania sporów, na przykład za pośrednictwem Wojewódzkiego Inspektoratu Inspekcji Handlowej lub miejskiego albo powiatowego rzecznika konsumentów, a w sporach transgranicznych — Europejskiego Centrum Konsumenckiego w swoim kraju (sieć ECC-Net). Skorzystanie z tych procedur jest dobrowolne dla obu stron. Informacje: uokik.gov.pl.',
          'Warunki podlegają prawu polskiemu. Wybór ten nie pozbawia konsumenta ochrony przysługującej mu na podstawie bezwzględnie obowiązujących przepisów prawa państwa jego zwykłego pobytu. Konsument może wytoczyć powództwo przed sądem państwa swojego miejsca zamieszkania albo przed sądem właściwym dla adresu Sprzedawcy.',
          'W razie rozbieżności między wersjami językowymi Warunków stosuje się wykładnię najkorzystniejszą dla konsumenta.',
        ],
      },
    ],
    annex: {
      title: 'Załącznik — Wzór formularza odstąpienia od umowy',
      note: '(Formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy.)',
      lines: [
        'Adresat: {seller} ({brand}), {address}, e-mail: {email}',
        'Ja/My (*) niniejszym informuję/informujemy (*) o moim/naszym odstąpieniu od umowy sprzedaży następujących rzeczy (*):',
        'Data zawarcia umowy (*) / odbioru (*): …',
        'Numer zamówienia: …',
        'Imię i nazwisko konsumenta(-ów): …',
        'Adres konsumenta(-ów): …',
        'Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej): …',
        'Data: …',
        '(*) Niepotrzebne skreślić.',
      ],
    },
  },

  privacy: {
    version: 'Wersja obowiązująca od 24 listopada 2026 r.',
    intro: [
      'Niniejsza polityka wyjaśnia, jakie dane osobowe są przetwarzane, gdy korzystasz z serwisu {site} i robisz zakupy w sklepie {brand}, w jakim celu, jak długo i komu są udostępniane, a także jakie prawa przysługują Ci na podstawie ogólnego rozporządzenia o ochronie danych (RODO).',
    ],
    sections: [
      {
        title: '1. Administrator danych',
        paragraphs: [
          '{seller}, przedsiębiorca prowadzący jednoosobową działalność gospodarczą ({legalForm}), dane rejestrowe: {registration}, adres: {address}.',
          'W sprawach dotyczących Twoich danych: {email}. Administrator nie wyznaczył inspektora ochrony danych, ponieważ nie jest to obowiązkowe przy jego działalności.',
        ],
      },
      {
        title: '2. Przetwarzane dane',
        list: [
          'Śledzenie zamówienia: sklep nie zakłada kont klientów; numer wpisany na stronie „Śledź zamówienie” służy wyłącznie do wyświetlenia stanu zamówienia, bez imienia i nazwiska, adresu ani kwot.',
          'Zamówienie: imię i nazwisko, adres e-mail, numer telefonu, adres dostawy, zamówione towary, kwoty, sposób dostawy i płatności, numer zamówienia i historia jego realizacji.',
          'Płatność przelewem: przesłane przez Ciebie potwierdzenie przelewu (PDF lub obraz), które może zawierać imię i nazwisko posiadacza oraz dane rachunku bankowego.',
          'Płatność kartą: dane karty wprowadzasz u Mollie; otrzymujemy wyłącznie wynik płatności i identyfikator transakcji, nigdy numer karty.',
          'Kontakt z obsługą klienta: wiadomości wysyłane e-mailem lub przez WhatsApp i ich treść.',
          'Dane techniczne: adres IP, rodzaj przeglądarki, data i godzina połączeń oraz zdarzenia związane z bezpieczeństwem (próby logowania), wykorzystywane do ochrony serwisu.',
        ],
      },
      {
        title: '3. Cele i podstawy prawne',
        list: [
          'Realizacja i dostawa zamówień, weryfikacja płatności, udostępnienie śledzenia zamówienia, wysyłka e-maili związanych z zamówieniem (potwierdzenie, śledzenie), obsługa odstąpień, reklamacji i zwrotów: wykonanie umowy (art. 6 ust. 1 lit. b RODO).',
          'Prowadzenie rachunkowości i przechowywanie dokumentów: wypełnienie obowiązku prawnego (art. 6 ust. 1 lit. c RODO).',
          'Zabezpieczenie serwisu i jego administracji (ograniczenie prób logowania, zapobieganie oszustwom i fałszywym potwierdzeniom płatności), ustalenie i obrona roszczeń: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).',
          'Odpowiadanie na wiadomości: działania przed zawarciem umowy lub wykonanie umowy, gdy wiadomość dotyczy zamówienia, w pozostałych przypadkach prawnie uzasadniony interes.',
        ],
        after: [
          'Nie wysyłamy newslettera ani reklam e-mailem i nie sprzedajemy ani nie wynajmujemy Twoich danych. Dane oznaczone jako obowiązkowe są niezbędne do zawarcia umowy; bez nich zamówienie nie może zostać zrealizowane.',
        ],
      },
      {
        title: '4. Automatyczna weryfikacja potwierdzeń przelewu',
        paragraphs: [
          'Gdy przesyłasz potwierdzenie przelewu, program odczytuje je na naszych własnych serwerach, bez udziału zewnętrznych usług, i sprawdza wyłącznie, czy widnieje na nim numer zamówienia i dokładna kwota. Jeżeli weryfikacja się nie powiedzie, zamówienie nie zostaje zarejestrowane: możesz przesłać inny dokument lub napisać na adres {email}, aby Twoją płatność sprawdził człowiek. Nie podejmujemy innych zautomatyzowanych decyzji ani nie stosujemy profilowania.',
        ],
      },
      {
        title: '5. Odbiorcy i dostawcy usług',
        paragraphs: [
          'Dostęp do Twoich danych mają wyłącznie osoby prowadzące sklep. Dane są przekazywane jedynie dostawcom usług niezbędnych do jego działania, działającym na nasze polecenie:',
        ],
        list: [
          'Vercel Inc. (Stany Zjednoczone): hosting serwisu internetowego;',
          'Railway Corporation (Stany Zjednoczone): hosting aplikacji i bazy danych;',
          'Cloudflare, Inc. (Stany Zjednoczone): prywatne, szyfrowane przechowywanie potwierdzeń przelewu (usługa R2);',
          'Sendinblue SAS, marka Brevo (Francja): wysyłka e-maili dotyczących zamówień;',
          'Microsoft (Outlook.com): skrzynka e-mail obsługi klienta;',
          'Mollie B.V. (Holandia): obsługa płatności kartą; w zakresie własnych obowiązków (przeciwdziałanie oszustwom i praniu pieniędzy) Mollie działa jako odrębny administrator, zgodnie z własną polityką prywatności;',
          'przewoźnik realizujący dostawę: imię i nazwisko, adres dostawy, numer telefonu i e-mail, w celu doręczenia przesyłki;',
          'WhatsApp Ireland Ltd, gdy zdecydujesz się napisać do nas przez WhatsApp, na zasadach tej usługi;',
          'banki uczestniczące w płatności oraz, gdy wymaga tego prawo, organy publiczne.',
        ],
      },
      {
        title: '6. Przekazywanie danych poza Europejski Obszar Gospodarczy',
        paragraphs: [
          'Niektórzy dostawcy mają siedzibę w Stanach Zjednoczonych (Vercel, Railway, Cloudflare, Microsoft). Przekazywanie danych odbywa się na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony w ramach EU–US Data Privacy Framework, jeżeli dostawca posiada certyfikację, a w pozostałych przypadkach na podstawie standardowych klauzul umownych przyjętych przez Komisję Europejską. Kopię zabezpieczeń możesz otrzymać, pisząc na adres {email}.',
        ],
      },
      {
        title: '7. Okres przechowywania',
        list: [
          'Zamówienia w toku: przez czas potrzebny do ich realizacji, dostawy oraz obsługi ewentualnych odstąpień, reklamacji i zwrotów.',
          'Zamówienia i dokumenty księgowe: przez okres wymagany przez polskie przepisy podatkowe i o rachunkowości, co do zasady 5 lat od końca danego roku.',
          'Potwierdzenia przelewu: usuwane automatycznie po 400 dniach od przesłania.',
          'Wiadomości do obsługi klienta: przez czas potrzebny do obsługi zgłoszenia, a w razie potrzeby do upływu terminów przedawnienia roszczeń.',
          'Dane techniczne i dotyczące bezpieczeństwa: przez czas niezbędny do zapewnienia bezpieczeństwa serwisu, a następnie są usuwane.',
        ],
      },
      {
        title: '8. Pliki cookie i pamięć przeglądarki',
        paragraphs: [
          'Serwis używa wyłącznie plików cookie niezbędnych do jego działania. Nie stosujemy plików cookie reklamowych, analitycznych ani mediów społecznościowych, dlatego nie prosimy o zgodę.',
        ],
        list: [
          'glaciora_lang: wybrany język (1 rok);',
          'glaciora_cart: zawartość koszyka (30 dni);',
          'glaciora_at i glaciora_rt: logowanie wyłącznie administratorów sklepu (15 minut i 30 dni);',
          'glaciora_ref: numer referencyjny przelewu podczas składania zamówienia (3 godziny);',
          'glaciora_order: dostęp do śledzenia właśnie złożonego zamówienia (30 dni).',
        ],
        after: [
          'Podczas składania zamówienia wprowadzone dane są przechowywane w pamięci sesji przeglądarki, która jest czyszczona po zamknięciu karty lub po złożeniu zamówienia. Szybkość wczytywania stron jest mierzona anonimowo przez Vercel Speed Insights, bez plików cookie.',
        ],
      },
      {
        title: '9. Bezpieczeństwo',
        paragraphs: [
          'Komunikacja z serwisem jest szyfrowana (HTTPS). Strona śledzenia pokazuje wyłącznie stan zamówienia i ogranicza liczbę wyszukiwań. Hasła administratorów są przechowywane jako skróty Argon2id, ich pliki cookie logowania są niedostępne dla skryptów strony, a ich konto jest czasowo blokowane po 5 nieudanych próbach logowania. Potwierdzenia przelewu są przechowywane prywatnie i mogą je przeglądać wyłącznie administratorzy sklepu.',
        ],
      },
      {
        title: '10. Twoje prawa',
        paragraphs: [
          'Przysługuje Ci prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i przenoszenia, a także prawo sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. Aby z nich skorzystać, napisz na adres {email}; odpowiadamy w ciągu miesiąca. W razie uzasadnionych wątpliwości możemy poprosić o potwierdzenie tożsamości.',
          'Możesz wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl) lub do organu ochrony danych w kraju swojego zamieszkania.',
        ],
      },
      {
        title: '11. Osoby niepełnoletnie',
        paragraphs: ['Sklep jest przeznaczony dla osób dorosłych. Towary dla dzieci powinny być kupowane przez osobę dorosłą; nie zbieramy świadomie danych dotyczących dzieci.'],
      },
      {
        title: '12. Zmiany',
        paragraphs: ['Polityka może być aktualizowana, w szczególności w przypadku zmiany dostawcy usług. Data obowiązującej wersji jest podana na górze strony.'],
      },
    ],
  },
};

export default pl;
