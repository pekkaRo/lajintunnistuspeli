import React, { useCallback, useEffect, useState } from 'react';
import {
  Leaf,
  Fish,
  Award,
  ArrowRight,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { fallbackImages } from './imageFallbacks';

type Species = {
  name: string;
  hints: string[];
  funFact: string;
  wikiTitle: string;
};

type Category = {
  name: string;
  emoji: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  items: Species[];
};

type ImageAttribution = {
  src: string;
  thumb: string;
  descriptionUrl?: string;
  credit?: string;
  license?: string;
  licenseUrl?: string;
};

type ImageCache = Record<
  string,
  {
    status: 'loading' | 'loaded' | 'error';
    data?: ImageAttribution;
    error?: string;
    source?: 'fallback' | 'api';
  }
>;

type CategoryStats = {
  sessions: number;
  lastScore?: {
    correct: number;
    total: number;
    timestamp: number;
  };
};

const categories: Record<string, Category> = {
  marjat: {
    name: 'Metsämarjat',
    emoji: '🫐',
    icon: Leaf,
    color: 'bg-purple-500',
    items: [
      {
        name: 'Mustikka',
        wikiTitle: 'Vaccinium myrtillus',
        hints: [
          'Kasvaa havumetsissä',
          'Tummansinisiä marjoja',
          'Värjää kielen siniseksi',
          'Marjat ovat pyöreitä'
        ],
        funFact: 'Mustikan syöminen parantaa näköä hämärässä!'
      },
      {
        name: 'Puolukka',
        wikiTitle: 'Vaccinium vitis-idaea',
        hints: [
          'Kasvaa kangasmetsissä',
          'Kirkkaan punaisia marjoja',
          'Marjat ovat hieman happamia',
          'Talvivihreä kasvi'
        ],
        funFact: 'Puolukat säilyvät luonnostaan pitkään!'
      },
      {
        name: 'Karpalo',
        wikiTitle: 'Vaccinium oxycoccos',
        hints: ['Kasvaa soilla', 'Isoja punaisia marjoja', 'Kelluu vedessä', 'Hapan maku'],
        funFact: 'Karpalot pomppivat lattialla!'
      },
      {
        name: 'Tyrni',
        wikiTitle: 'Hippophae rhamnoides',
        hints: [
          'Kasvaa rannoilla',
          'Kirkkaankeltaisia marjoja',
          'Okaiset oksat',
          'Marjat tiheissä rypäleissä'
        ],
        funFact: 'Tyrni sisältää paljon C-vitamiinia!'
      },
      {
        name: 'Mesimarja',
        wikiTitle: 'Rubus arcticus',
        hints: [
          'Kasvaa kosteissa metsissä',
          'Keltaisia tai punaisia marjoja',
          'Muistuttaa vadelmaa',
          'Makeanhapan maku'
        ],
        funFact: 'Mesimarja on Lapin kulta!'
      }
    ]
  },
  sienet: {
    name: 'Sienet',
    emoji: '🍄',
    icon: Leaf,
    color: 'bg-amber-600',
    items: [
      {
        name: 'Suppilovahvero',
        wikiTitle: 'Cantharellus tubaeformis',
        hints: ['Suppilo- tai maljanmuotoinen', 'Harmaa tai ruskea', 'Kasvaa syksyllä', 'Hyvä ruokasieni'],
        funFact: 'Yksi parhaista sienistä paistettavaksi!'
      },
      {
        name: 'Herkkutatti',
        wikiTitle: 'Boletus edulis',
        hints: ['Ruskea lakki', 'Valkoinen jalka', 'Pehmeä lakki', 'Kasvaa syksyllä'],
        funFact: 'Suomalaisten suosikkisieni!'
      },
      {
        name: 'Keltavahvero',
        wikiTitle: 'Cantharellus cibarius',
        hints: ['Keltainen suppilo', 'Poimuinen pinta', 'Kasvaa ryhmissä', 'Hyvä ruokasieni'],
        funFact: 'Kasvaa samoilla paikoilla joka vuosi!'
      },
      {
        name: 'Valkokärpässieni',
        wikiTitle: 'Amanita virosa',
        hints: ['Valkoinen lakki valkoisilla täplillä', 'Myrkyllinen!', 'Näyttää sadun sieneltä', 'Iso'],
        funFact: 'Myrkyllinen - älä koskaan syö!'
      },
      {
        name: 'Punakärpässieni',
        wikiTitle: 'Amanita muscaria',
        hints: ['Punainen lakki valkoisilla täplillä', 'Myrkyllinen!', 'Kasvaa koivujen lähellä', 'Tunnetuin myrkyllinen'],
        funFact: 'Käytettiin kärpästen myrkyttämiseen!'
      },
      {
        name: 'Karvarousku',
        wikiTitle: 'Lactarius torminosus',
        hints: ['Violetin sävyinen', 'Maitoa erittyy', 'Kasvaa koivujen alla', 'Hyvä suolattuna'],
        funFact: 'Pitää suolata ennen syömistä!'
      },
      {
        name: 'Isohapero',
        wikiTitle: 'Russula paludosa',
        hints: ['Iso ja vaalea', 'Ontto jalka', 'Kasvaa koivumetsissä', 'Hyvä keitettyä'],
        funFact: 'Voi kasvaa kämmenen kokoiseksi!'
      },
      {
        name: 'Korvasieni',
        wikiTitle: 'Gyromitra esculenta',
        hints: ['Näyttää korvalta', 'Ruskea ja ryppyinen', 'Kasvaa keväällä', 'Kasvaa vanhoilla puupaikoilla'],
        funFact: 'Yksi ensimmäisistä kevään sienistä!'
      },
      {
        name: 'Mustatorvisieni',
        wikiTitle: 'Craterellus cornucopioides',
        hints: ['Musta ja torvimainen', 'Kasvaa syksyllä', 'Hyvä aromisieni', 'Kasvaa lehtimetsissä'],
        funFact: 'Kutsutaan metsän tryffeliksi!'
      },
      {
        name: 'Lampaankääpä',
        wikiTitle: 'Albatrellus ovinus',
        hints: ['Kasvaa puun kyljessä', 'Pehmeä', 'Valkoinen', 'Ei syötäväksi'],
        funFact: 'Käytettiin ennen tulenarkoihin!'
      }
    ]
  },
  hedelmät: {
    name: 'Hedelmät',
    emoji: '🍎',
    icon: Leaf,
    color: 'bg-red-500',
    items: [
      {
        name: 'Omena',
        wikiTitle: 'Apple',
        hints: ['Kasvaa puussa', 'Punainen, vihreä tai keltainen', 'Pyöreä', 'Rapea'],
        funFact: 'Siemenistä voi kasvaa uusi puu!'
      },
      {
        name: 'Kirsikka',
        wikiTitle: 'Cherry',
        hints: ['Pieni ja pyöreä', 'Punainen', 'Sisällä kivi', 'Kasvaa kesällä'],
        funFact: 'Kirsikkapuut kukkivat kauniisti!'
      },
      {
        name: 'Luumu',
        wikiTitle: 'Plum',
        hints: ['Soikea', 'Tummansininen tai punainen', 'Iso kivi sisällä', 'Mehukas'],
        funFact: 'Kuivattu luumu on ihana!'
      },
      {
        name: 'Päärynä',
        wikiTitle: 'Pear',
        hints: ['Kasvaa puussa', 'Vihreä tai keltainen', 'Muoto kuin lamppu', 'Makea'],
        funFact: 'Kypsyy parhaiten pois puusta!'
      }
    ]
  },
  puutarhamarjat: {
    name: 'Puutarhamarjat',
    emoji: '🍓',
    icon: Leaf,
    color: 'bg-pink-500',
    items: [
      {
        name: 'Karviainen',
        wikiTitle: 'Ribes uva-crispa',
        hints: ['Vihreä tai punainen', 'Okaiset pensaat', 'Pyöreä', 'Hapan maku'],
        funFact: 'Voi syödä vihreänäkin!'
      },
      {
        name: 'Valkoviinimarja',
        wikiTitle: 'White currant',
        hints: ['Pienet vaaleat marjat', 'Kasvavat tertuissa', 'Läpikuultavia', 'Hapahko'],
        funFact: 'Hyvää mehua!'
      },
      {
        name: 'Mansikka',
        wikiTitle: 'Garden strawberry',
        hints: ['Punainen', 'Siemenet ulkopuolella', 'Kasvaa maassa', 'Makea'],
        funFact: 'Ei oikeasti ole marja!'
      }
    ]
  },
  yrtit: {
    name: 'Yrtit',
    emoji: '🌿',
    icon: Leaf,
    color: 'bg-green-500',
    items: [
      {
        name: 'Tilli',
        wikiTitle: 'Anethum graveolens',
        hints: ['Hennot lehdet', 'Tuoksuu voimakkaasti', 'Käytetään kalan kanssa', 'Höyhenmäiset'],
        funFact: 'Laitetaan uusiin perunoihin!'
      },
      {
        name: 'Persilja',
        wikiTitle: 'Parsley',
        hints: ['Kiharat tai sileät lehdet', 'Tummanvihreä', 'Mieto maku', 'Koristeluna'],
        funFact: 'Sisältää paljon C-vitamiinia!'
      },
      {
        name: 'Basilika',
        wikiTitle: 'Basil',
        hints: ['Pyöreät lehdet', 'Tuoksuu voimakkaasti', 'Italialaisessa ruuassa', 'Kasvaa lämpimässä'],
        funFact: 'Sopii tomaatin kanssa!'
      },
      {
        name: 'Ruohosipuli',
        wikiTitle: 'Allium schoenoprasum',
        hints: ['Pitkät vihreät varret', 'Maistuu sipulilta', 'Ontot varret', 'Käytetään tuoreena'],
        funFact: 'Voi kasvattaa ikkunalaudalla!'
      },
      {
        name: 'Pinaatti',
        wikiTitle: 'Spinacia oleracea',
        hints: ['Isot vihreät lehdet', 'Rautapitoista', 'Salaateissa ja keitossa', 'Tummanvihreä'],
        funFact: 'Tekee vahvaksi!'
      },
      {
        name: 'Minttu',
        wikiTitle: 'Mentha',
        hints: [
          'Tuoksuu raikkaalta',
          'Vihreät sahalaitaiset lehdet',
          'Käytetään teehen ja jälkiruoissa',
          'Kasvaa nopeasti puutarhassa'
        ],
        funFact: 'Mintusta saa virkistävää teetä ja makua jäätelöön!'
      }
    ]
  },
  juurekset: {
    name: 'Juurekset',
    emoji: '🥕',
    icon: Leaf,
    color: 'bg-orange-500',
    items: [
      {
        name: 'Porkkana',
        wikiTitle: 'Carrot',
        hints: ['Oranssi', 'Kasvaa maan alla', 'Pitkä ja suippo', 'Raaputtamalla saa rapeaa'],
        funFact: 'Parantaa näköä!'
      },
      {
        name: 'Peruna',
        wikiTitle: 'Potato',
        hints: ['Kasvaa maan alla', 'Ruskea kuori', 'Pyöreähkö', 'Tärkein suomalainen ruoka'],
        funFact: 'Monipuolisin juures!'
      },
      {
        name: 'Punajuuri',
        wikiTitle: 'Beetroot',
        hints: ['Tummanpunainen', 'Pyöreä', 'Värjää kaiken punaiseksi', 'Makea'],
        funFact: 'Antaa rosollin värin!'
      },
      {
        name: 'Retiisi',
        wikiTitle: 'Radish',
        hints: ['Pieni ja pyöreä', 'Punainen tai valkoinen', 'Polttava maku', 'Syödään tuoreena'],
        funFact: 'Kasvaa nopeasti!'
      },
      {
        name: 'Nauris',
        wikiTitle: 'Turnip',
        hints: ['Pyöreä valkoinen', 'Purppura yläosa', 'Mieto maku', 'Vanhempi kuin peruna'],
        funFact: 'Oli tärkein juures ennen!'
      },
      {
        name: 'Palsternakka',
        wikiTitle: 'Parsnip',
        hints: ['Kermanvalkoinen', 'Näyttää porkkanalta', 'Makea', 'Käytetään keitoissa'],
        funFact: 'Maistuu makeammalta pakkasen jälkeen!'
      }
    ]
  },
  vihannekset: {
    name: 'Vihannekset',
    emoji: '🥒',
    icon: Leaf,
    color: 'bg-lime-500',
    items: [
      {
        name: 'Kesäkurpitsa',
        wikiTitle: 'Zucchini',
        hints: ['Vihreä ja pitkä', 'Kasvaa nopeasti', 'Sileä kuori', 'Mieto maku'],
        funFact: 'Voi kasvaa metrin pituiseksi!'
      },
      {
        name: 'Salaatti',
        wikiTitle: 'Lettuce',
        hints: ['Vihreät lehdet', 'Rapea ja mehukas', 'Syödään tuoreena', 'Kasvaa nopeasti'],
        funFact: 'Monta eri tyyppiä!'
      },
      {
        name: 'Kurkku',
        wikiTitle: 'Cucumber',
        hints: ['Vihreä ja pitkä', 'Mehukas sisältä', 'Kasvaa köynnöksenä', 'Raikas'],
        funFact: 'On melkein 95% vettä!'
      },
      {
        name: 'Raparperi',
        wikiTitle: 'Rhubarb',
        hints: ['Pitkät punaiset varret', 'Hapan', 'Isot lehdet', 'Käytetään piirakoissa'],
        funFact: 'Herkullista piirakkaa!'
      },
      {
        name: 'Valkokaali',
        wikiTitle: 'Cabbage',
        hints: ['Pyöreä ja tiivis', 'Vaaleanvihreä', 'Lehdet kerroksia', 'Salaateissa ja keitoissa'],
        funFact: 'Siitä tehdään hapankaalia!'
      },
      {
        name: 'Varsiselleri',
        wikiTitle: 'Celery',
        hints: ['Vihreät rapeaa varret', 'Kasvaa nippuna', 'Kirpeä', 'Käytetään keitoissa'],
        funFact: 'Hyvä raakana dipissä!'
      },
      {
        name: 'Munakoiso',
        wikiTitle: 'Eggplant',
        hints: ['Tummanvioletti', 'Kiiltävä kuori', 'Munan muotoinen', 'Lämpimissä ruuissa'],
        funFact: 'On oikeasti marja!'
      }
    ]
  },
  kalat: {
    name: 'Kalat',
    emoji: '🐟',
    icon: Fish,
    color: 'bg-blue-500',
    items: [
      {
        name: 'Muikku',
        wikiTitle: 'Coregonus albula',
        hints: ['Pieni hopeanhohtoinen', 'Elää järvissä', 'Parvikala', 'Paistetaan kokonaisina'],
        funFact: 'Kalastetaan nuotalla!'
      },
      {
        name: 'Silakka',
        wikiTitle: 'Baltic herring',
        hints: ['Pieni kala', 'Elää Itämeressä', 'Hopeanhohtoinen', 'Savustettuna'],
        funFact: 'Pyydetty satoja vuosia!'
      },
      {
        name: 'Ahven',
        wikiTitle: 'Perca fluviatilis',
        hints: ['Raidallinen', 'Vihreä selkä', 'Punaiset evät', 'Elää järvissä ja merellä'],
        funFact: 'Selässä piikkievä!'
      },
      {
        name: 'Lohi',
        wikiTitle: 'Atlantic salmon',
        hints: ['Iso kala', 'Punainen liha', 'Vaeltaa merestä jokiin', 'Hyppää vesiputouksia'],
        funFact: 'Muistaa syntymäjokensa!'
      },
      {
        name: 'Siika',
        wikiTitle: 'Coregonus lavaretus',
        hints: ['Hopeanhohtoinen', 'Suomalaisten suosikki', 'Elää järvissä', 'Herkullinen savustettuna'],
        funFact: 'Parasta savukalaa!'
      },
      {
        name: 'Hauki',
        wikiTitle: 'Esox lucius',
        hints: ['Pitkä ja ohut', 'Teräväät hampaat', 'Vihertävä', 'Peto'],
        funFact: 'Yli 700 hammasta!'
      },
      {
        name: 'Kuha',
        wikiTitle: 'Sander lucioperca',
        hints: ['Iso peto', 'Tumma selkä', 'Piikkievä', 'Elää syvällä'],
        funFact: 'Arvostettu ruokakala!'
      },
      {
        name: 'Made',
        wikiTitle: 'Lota lota',
        hints: ['Pitkä kuin käärme', 'Limainen', 'Elää mudassa', 'Tumma selkä'],
        funFact: 'Hengittää ihonsa läpi!'
      },
      {
        name: 'Nieriä',
        wikiTitle: 'Salvelinus alpinus',
        hints: ['Punainen liha', 'Elää syvissä järvissä', 'Sukulainen lohelle', 'Punaiset täplät'],
        funFact: 'Suomen alkuperäinen lohikala!'
      }
    ]
  }
};

type CategoryKey = keyof typeof categories;

const getSpeciesKey = (category: string, speciesName: string) => `${category}::${speciesName}`;

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const App = () => {
  const [currentCategory, setCurrentCategory] = useState<CategoryKey | null>(null);
  const [currentSpecies, setCurrentSpecies] = useState<Species | null>(null);
  const [score, setScore] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [usedSpecies, setUsedSpecies] = useState<{ name: string; category: CategoryKey }[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Species[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<CategoryKey, CategoryStats>>({});
  const [imageCache, setImageCache] = useState<ImageCache>({});

  const categoryEntries = Object.entries(categories) as [CategoryKey, Category][];
  const currentCategoryData = currentCategory ? categories[currentCategory] : null;
  const currentSpeciesKey =
    currentCategory && currentSpecies ? getSpeciesKey(currentCategory, currentSpecies.name) : null;
  const fallbackImage = currentSpecies ? fallbackImages[currentSpecies.wikiTitle] : undefined;
  const currentImageData = currentSpeciesKey ? imageCache[currentSpeciesKey] : undefined;
  const currentCategoryStats = currentCategory ? categoryStats[currentCategory] : undefined;

  const postToServiceWorker = useCallback((message: unknown) => {
    if (!('serviceWorker' in navigator)) return;

    const send = (worker?: ServiceWorker | null) => {
      worker?.postMessage(message);
    };

    if (navigator.serviceWorker.controller) {
      send(navigator.serviceWorker.controller);
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => {
        send(registration.active);
      })
      .catch((error) => {
        console.warn('Service worker not ready', error);
      });
  }, []);

  const saveSessionResult = useCallback(
    (category: CategoryKey, correct: number, total: number) => {
      if (total <= 0) return;

      const timestamp = Date.now();
      setCategoryStats((prev) => {
        const previous = prev[category];
        const nextSessions = (previous?.sessions ?? 0) + 1;
        return {
          ...prev,
          [category]: {
            sessions: nextSessions,
            lastScore: { correct, total, timestamp }
          }
        };
      });

      postToServiceWorker({
        type: 'SAVE_SCORE',
        payload: { category, correct, total, timestamp }
      });
    },
    [postToServiceWorker, setCategoryStats]
  );

  useEffect(() => {
    if (currentCategory && currentSpecies === null) {
      selectRandomSpecies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory, currentSpecies]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SCORES_UPDATED') {
        const incoming = (payload || {}) as Record<string, CategoryStats>;
        const sanitized = Object.fromEntries(
          Object.entries(incoming).filter(([key]) => key in categories)
        ) as Record<CategoryKey, CategoryStats>;
        setCategoryStats(sanitized);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    postToServiceWorker({ type: 'REQUEST_SCORES' });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [postToServiceWorker]);

  useEffect(() => {
    if (!currentSpecies || !currentSpeciesKey) return;

    const cacheKey = currentSpeciesKey;
    const fallbackForSpecies = fallbackImages[currentSpecies.wikiTitle];

    if (fallbackForSpecies) {
      setImageCache((prev) => {
        const existing = prev[cacheKey];
        if (existing?.status === 'loaded') {
          return prev;
        }

        return {
          ...prev,
          [cacheKey]: {
            status: 'loaded',
            error: undefined,
            source: 'fallback',
            data: {
              src: fallbackForSpecies.src,
              thumb: fallbackForSpecies.thumb,
              descriptionUrl: fallbackForSpecies.descriptionUrl,
              credit: fallbackForSpecies.credit,
              license: fallbackForSpecies.license,
              licenseUrl: fallbackForSpecies.licenseUrl
            }
          }
        };
      });
      return;
    }

    let shouldFetch = false;
    let didSetLoading = false;

    setImageCache((prev) => {
      const existing = prev[cacheKey];
      if (!existing || existing.status === 'error') {
        shouldFetch = true;
        didSetLoading = true;
        return { ...prev, [cacheKey]: { status: 'loading', error: undefined } };
      }

      if (existing.status === 'loading') {
        shouldFetch = true;
        return prev;
      }

      return prev;
    });

    if (!shouldFetch) {
      return;
    }

    let isCancelled = false;

    const fetchImageData = async () => {
      try {
        const normalizedTitle = currentSpecies.wikiTitle.replace(/\s+/g, '_');
        const summaryResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`
        );

        if (!summaryResponse.ok) {
          throw new Error('Artikkelia ei löytynyt');
        }

        const summaryData = await summaryResponse.json();
        let src = summaryData.originalimage?.source || summaryData.thumbnail?.source || '';
        const thumb = summaryData.thumbnail?.source || src;

        if (isCancelled) return;

        if (!src) {
          throw new Error('Kuvaa ei löytynyt');
        }

        let credit: string | undefined;
        let license: string | undefined;
        let licenseUrl: string | undefined;
        let descriptionUrl: string | undefined =
          summaryData?.content_urls?.desktop?.page || summaryData?.content_urls?.mobile?.page;

        const sourceForFilename = summaryData.originalimage?.source || summaryData.thumbnail?.source;
        const fileName = sourceForFilename
          ? decodeURIComponent(sourceForFilename.split('/').pop() || '')
          : undefined;

        if (fileName) {
          try {
            const fileResponse = await fetch(
              `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(
                fileName
              )}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`
            );
            const fileJson = await fileResponse.json();
            const filePages = fileJson?.query?.pages || {};
            const filePage = Object.values(filePages)[0] as any;
            const imageInfo = filePage?.imageinfo?.[0];

            if (imageInfo) {
              src = imageInfo.url || src;
              descriptionUrl = imageInfo.descriptionurl || descriptionUrl;
              const metadata = imageInfo.extmetadata || {};
              const artist = metadata.Artist?.value ? stripHtml(metadata.Artist.value) : undefined;
              const creditRaw = metadata.Credit?.value ? stripHtml(metadata.Credit.value) : undefined;
              credit = artist || creditRaw;
              license = metadata.LicenseShortName?.value || metadata.UsageTerms?.value;
              licenseUrl = metadata.LicenseUrl?.value;

              if (!licenseUrl && license && license.toLowerCase().includes('public domain')) {
                licenseUrl = 'https://creativecommons.org/publicdomain/mark/1.0/';
              }
            }
          } catch (metadataError) {
            console.warn('Kuvan lisätietoja ei saatu', metadataError);
          }

          if (!descriptionUrl) {
            descriptionUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`;
          }
        }

        if (isCancelled) return;

        setImageCache((prev) => ({
          ...prev,
          [cacheKey]: {
            status: 'loaded',
            error: undefined,
            data: {
              src,
              thumb,
              descriptionUrl,
              credit,
              license,
              licenseUrl
            }
          }
        }));
      } catch (error) {
        if (isCancelled) return;
        const message = error instanceof Error ? error.message : 'Kuvan haku epäonnistui';
        setImageCache((prev) => ({
          ...prev,
          [cacheKey]: { status: 'error', error: message }
        }));
      }
    };

    fetchImageData();

    return () => {
      isCancelled = true;
      if (didSetLoading) {
        setImageCache((prev) => {
          const existing = prev[cacheKey];
          if (!existing || existing.status !== 'loading') {
            return prev;
          }
          const { [cacheKey]: _removed, ...rest } = prev;
          return rest;
        });
      }
    };
  }, [currentSpecies, currentSpeciesKey]);

  const selectRandomSpecies = () => {
    if (!currentCategory) return;

    const categoryKey = currentCategory as CategoryKey;
    const categoryData = categories[categoryKey];
    const availableSpecies = categoryData.items.filter(
      (item) =>
        !usedSpecies.some((used) => used.name === item.name && used.category === categoryKey)
    );

    let nextSpecies: Species;
    if (availableSpecies.length === 0) {
      setUsedSpecies([]);
      const randomIndex = Math.floor(Math.random() * categoryData.items.length);
      nextSpecies = categoryData.items[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * availableSpecies.length);
      nextSpecies = availableSpecies[randomIndex];
    }

    const wrongAnswersPool = categoryData.items.filter((item) => item.name !== nextSpecies.name);
    const wrongAnswers = [...wrongAnswersPool].sort(() => Math.random() - 0.5).slice(0, 3);
    const answers = [...wrongAnswers, nextSpecies].sort(() => Math.random() - 0.5);

    setCurrentSpecies(nextSpecies);
    setCurrentAnswers(answers);

    setShowFeedback(false);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (!currentSpecies || !currentCategory) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);
    setTotalAnswered((prev) => prev + 1);

    if (answer === currentSpecies.name) {
      const categoryKey = currentCategory as CategoryKey;
      setScore((prev) => prev + 1);
      setUsedSpecies((prev) => [...prev, { name: currentSpecies.name, category: categoryKey }]);
    }
  };

  const handleNext = () => {
    selectRandomSpecies();
  };

  const resetGame = () => {
    if (currentCategory && totalAnswered > 0) {
      saveSessionResult(currentCategory as CategoryKey, score, totalAnswered);
    }

    setCurrentCategory(null);
    setCurrentSpecies(null);
    setScore(0);
    setTotalAnswered(0);
    setUsedSpecies([]);
    setCurrentAnswers([]);
    setShowFeedback(false);
    setSelectedAnswer(null);
  };

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
              🌲 Luonnon Löytöretki 🌲
            </h1>
            <p className="text-lg md:text-xl text-gray-700">Valitse kategoria ja testaa tietosi!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categoryEntries.map(([key, category]) => {
              const stats = categoryStats[key as CategoryKey];
              return (
                <button
                  key={key}
                  onClick={() => setCurrentCategory(key)}
                  className={`${category.color} hover:opacity-90 text-white p-6 md:p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200`}
                >
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">{category.emoji}</div>
                  <div className="text-lg md:text-xl font-semibold">{category.name}</div>
                  <div className="text-xs md:text-sm mt-2 opacity-90">
                    {category.items.length} lajia
                  </div>
                  {stats ? (
                    <div className="text-xs md:text-sm mt-3 bg-white/20 rounded-lg px-3 py-2 space-y-1">
                      <div className="font-semibold">
                        Viimeisin: {stats.lastScore?.correct ?? 0} / {stats.lastScore?.total ?? 0}
                      </div>
                      <div className="opacity-90">
                        Harjoiteltu {stats.sessions}{' '}
                        {stats.sessions === 1 ? 'kerta' : 'kertaa'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs md:text-sm mt-3 opacity-80">Ei harjoituksia vielä</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!currentSpecies || !currentCategoryData) return null;

  const answers = currentAnswers.length ? currentAnswers : [currentSpecies];

  const imageStatus = currentImageData?.status ?? (fallbackImage ? 'loaded' : undefined);
  const imageDetails = currentImageData?.data ?? fallbackImage;
  const imageSrc = imageDetails?.src || imageDetails?.thumb || '';
  const attributionCredit = imageDetails?.credit || 'Tuntematon tekijä';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-2xl md:text-3xl">{currentCategoryData.emoji}</span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{currentCategoryData.name}</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                  <span className="text-lg md:text-xl font-bold text-gray-700">
                    {score} / {totalAnswered}
                  </span>
                </div>
                {currentCategoryStats && (
                  <div className="text-xs md:text-sm text-gray-500 mt-1">
                    Viimeisin: {currentCategoryStats.lastScore?.correct ?? 0}/
                    {currentCategoryStats.lastScore?.total ?? 0} · Harjoiteltu{' '}
                    {currentCategoryStats.sessions}{' '}
                    {currentCategoryStats.sessions === 1 ? 'kerta' : 'kertaa'}
                  </div>
                )}
              </div>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm md:text-base"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Vaihda</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
            Mikä tämä on?
          </h3>

          <div className="flex flex-col lg:flex-row gap-6 mb-6 md:mb-8">
            <div className="lg:w-1/2">
              <div className="bg-white border-2 border-green-100 rounded-xl shadow-inner h-full flex flex-col items-center justify-center p-4">
                {imageStatus === 'loaded' && imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={`${currentSpecies.name} luonnossa`}
                    className="w-full h-56 md:h-64 object-contain rounded-xl shadow bg-white"
                    loading="lazy"
                  />
                ) : imageStatus === 'loading' ? (
                  <div className="w-full h-56 md:h-64 rounded-xl bg-gradient-to-r from-green-100 via-blue-100 to-green-100 animate-pulse" />
                ) : imageStatus === 'error' ? (
                  <div className="w-full h-56 md:h-64 flex flex-col items-center justify-center bg-green-50 rounded-xl text-center text-sm md:text-base text-green-700 px-4">
                    <span className="text-3xl mb-2" role="img" aria-label="metsä">
                      🌲
                    </span>
                    <p>
                      Kuva puuttuu, mutta voit kuvitella mielessäsi miten {currentSpecies.name.toLowerCase()} näyttää
                      luonnossa.
                    </p>
                    {currentImageData?.error && (
                      <p className="mt-2 text-xs md:text-sm text-green-600">
                        ({currentImageData.error})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-56 md:h-64 flex items-center justify-center bg-green-50 rounded-xl text-sm md:text-base text-green-700">
                    Haetaan kuvaa...
                  </div>
                )}

                {imageStatus === 'loaded' && (
                  <div className="mt-3 text-xs text-gray-600 text-center leading-relaxed space-y-1">
                    <p>
                      Kuva:{' '}
                      {imageDetails?.descriptionUrl ? (
                        <a
                          href={imageDetails.descriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:underline"
                        >
                          {attributionCredit}
                        </a>
                      ) : (
                        attributionCredit
                      )}
                    </p>
                    {imageDetails?.license && (
                      <p>
                        Lisenssi:{' '}
                        {imageDetails.licenseUrl ? (
                          <a
                            href={imageDetails.licenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 hover:underline"
                          >
                            {imageDetails.license}
                          </a>
                        ) : (
                          imageDetails.license
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="bg-green-50 rounded-xl p-4 md:p-6 h-full">
                <h4 className="font-semibold text-green-800 mb-3 text-base md:text-lg">Vihjeet:</h4>
                <ul className="space-y-2">
                  {currentSpecies.hints.map((hint) => (
                    <li key={hint} className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">•</span>
                      <span className="text-sm md:text-base text-gray-700">{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {answers.map((answer) => {
              const isCorrect = answer.name === currentSpecies.name;
              const isSelected = selectedAnswer === answer.name;

              let buttonClass = 'p-3 md:p-4 rounded-xl border-2 text-base md:text-lg font-semibold transition-all ';

              if (!showFeedback) {
                buttonClass += 'border-gray-300 hover:border-green-500 hover:bg-green-50 bg-white';
              } else if (isSelected && isCorrect) {
                buttonClass += 'border-green-500 bg-green-100 text-green-800';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-100 text-red-800';
              } else if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-100 text-green-800';
              } else {
                buttonClass += 'border-gray-300 bg-gray-50 text-gray-500';
              }

              return (
                <button
                  key={answer.name}
                  onClick={() => !showFeedback && handleAnswer(answer.name)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  {answer.name}
                  {showFeedback && isCorrect && <CheckCircle className="inline ml-2 w-5 h-5 md:w-6 md:h-6" />}
                  {showFeedback && isSelected && !isCorrect && <XCircle className="inline ml-2 w-5 h-5 md:h-6" />}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div
              className={`rounded-xl p-4 md:p-6 ${
                selectedAnswer === currentSpecies.name
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-red-100 border-2 border-red-500'
              }`}
            >
              {selectedAnswer === currentSpecies.name ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    <h4 className="text-xl md:text-2xl font-bold text-green-800">Oikein! 🎉</h4>
                  </div>
                  <p className="text-sm md:text-base text-gray-700 mb-2">
                    <strong>Tiesitkö:</strong> {currentSpecies.funFact}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                    <h4 className="text-xl md:text-2xl font-bold text-red-800">Väärin</h4>
                  </div>
                  <p className="text-sm md:text-base text-gray-700 mb-3">
                    Oikea vastaus oli{' '}
                    <strong className="text-green-700">{currentSpecies.name}</strong>.
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 md:p-4 rounded">
                    <p className="text-sm md:text-base text-gray-700 mb-2">
                      <strong>Opitaan yhdessä:</strong>
                    </p>
                    <p className="text-sm md:text-base text-gray-700 mb-2">{currentSpecies.funFact}</p>
                    <p className="text-xs md:text-sm text-gray-600 italic">
                      Muista: {currentSpecies.hints[0]}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Seuraava kysymys
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {totalAnswered > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">Edistyminen</h3>
              <span className="text-2xl">
                {score === totalAnswered ? '🏆' : score / totalAnswered >= 0.7 ? '⭐' : '💪'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(score / totalAnswered) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm md:text-base text-gray-600">
              {score === totalAnswered && totalAnswered >= 5
                ? '🎉 Täydellinen! Olet todellinen luontoasiantuntija!'
                : score / totalAnswered >= 0.7
                ? '👍 Hienosti menee! Olet oppimassa nopeasti!'
                : '💪 Jatka harjoittelua, niin opit lisää!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
