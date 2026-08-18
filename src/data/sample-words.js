/**
 * Sample German Vocabulary Dataset
 * Simple, accessible everyday sentences designed so the target word is the only challenging element.
 */

export const SAMPLE_WORDS = [
  {
    id: "w_sehnsucht",
    rawInput: "Sehnsucht",
    normalizedWord: "die Sehnsucht",
    article: "die",
    partOfSpeech: "Substantiv (f)",
    meaning: "longing, yearning, deep desire",
    plural: "die Sehnsüchte",
    verbForms: null,
    governingPrepositions: "Sehnsucht nach + Dat.",
    fixedExpressions: [
      "Sehnsucht haben nach (to long for)",
      "große Sehnsucht spüren (to feel a great yearning)"
    ],
    memoryHook: "From 'sehnen' (to yearn) + 'Sucht' (intense craving) — a deep, craving desire.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000000000,
    sentences: [
      {
        id: "w_sehnsucht_s1",
        german: "Er wohnt weit weg von zu Hause und hat große Sehnsucht nach seiner Familie.",
        englishHint: "He lives far from home and has a great longing for his family."
      },
      {
        id: "w_sehnsucht_s2",
        german: "Im kalten Winter habe ich oft Sehnsucht nach Sonne und warmem Meer.",
        englishHint: "In cold winter I often have a longing for sun and warm sea."
      },
      {
        id: "w_sehnsucht_s3",
        german: "Sie schaute die alten Urlaubsfotos mit trauriger Sehnsucht an.",
        englishHint: "She looked at old vacation photos with sad longing."
      },
      {
        id: "w_sehnsucht_s4",
        german: "Nach vielen Wochen allein spürt er eine tiefe Sehnsucht nach Freunden.",
        englishHint: "After many weeks alone, he feels a deep longing for friends."
      },
      {
        id: "w_sehnsucht_s5",
        german: "Er denkt jeden Tag voller Sehnsucht an seine Freundin.",
        englishHint: "He thinks of his girlfriend every day full of longing."
      },
      {
        id: "w_sehnsucht_s6",
        german: "Das schöne Lied handelt von Liebe und Sehnsucht.",
        englishHint: "The beautiful song is about love and longing."
      },
      {
        id: "w_sehnsucht_s7",
        german: "Hattest du während deiner langen Reise Sehnsucht nach deiner Heimat?",
        englishHint: "Did you feel longing for your homeland during your long journey?"
      },
      {
        id: "w_sehnsucht_s8",
        german: "Wenn ich diesen Geruch rieche, packt mich sofort die Sehnsucht nach Italien.",
        englishHint: "When I smell this scent, longing for Italy grips me immediately."
      },
      {
        id: "w_sehnsucht_s9",
        german: "Ihre Augen waren voller Sehnsucht nach Freiheit.",
        englishHint: "Her eyes were full of longing for freedom."
      },
      {
        id: "w_sehnsucht_s10",
        german: "Er schrieb ihr einen Brief, um seine Sehnsucht zu zeigen.",
        englishHint: "He wrote her a letter to show his longing."
      }
    ]
  },
  {
    id: "w_feierabend",
    rawInput: "Feierabend",
    normalizedWord: "der Feierabend",
    article: "der",
    partOfSpeech: "Substantiv (m)",
    meaning: "end of the workday, evening free time",
    plural: "die Feierabende",
    verbForms: null,
    governingPrepositions: null,
    fixedExpressions: [
      "Feierabend machen (to clock off / finish work for the day)",
      "Schönen Feierabend! (Have a nice evening after work!)"
    ],
    memoryHook: "'Feier' (celebration) + 'Abend' (evening) — the joyful end of the working day.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000010000,
    sentences: [
      {
        id: "w_feierabend_s1",
        german: "Um 17 Uhr mache ich endlich Feierabend und gehe nach Hause.",
        englishHint: "At 5 p.m. I finally clock off and go home."
      },
      {
        id: "w_feierabend_s2",
        german: "Die Kollegen trinken nach der Arbeit ein Bier zum Feierabend.",
        englishHint: "The colleagues drink a beer after work to celebrate the end of the day."
      },
      {
        id: "w_feierabend_s3",
        german: "Ich wünsche dir einen schönen und erholsamen Feierabend!",
        englishHint: "I wish you a nice and relaxing evening after work!"
      },
      {
        id: "w_feierabend_s4",
        german: "Wann machst du heute Feierabend? Wollen wir zusammen kochen?",
        englishHint: "When do you finish work today? Do we want to cook together?"
      },
      {
        id: "w_feierabend_s5",
        german: "Nach einem langen Tag freue ich mich sehr auf den Feierabend.",
        englishHint: "After a long day I really look forward to the evening after work."
      },
      {
        id: "w_feierabend_s6",
        german: "Im Feierabendverkehr auf der Straße braucht man immer viel Zeit.",
        englishHint: "In rush-hour traffic on the street one always needs lots of time."
      },
      {
        id: "w_feierabend_s7",
        german: "Am Feierabend sitze ich gerne ruhig auf dem Sofa und lese.",
        englishHint: "After work I like to sit quietly on the couch and read."
      },
      {
        id: "w_feierabend_s8",
        german: "Er schaltete sein Diensttelefon pünktlich zum Feierabend aus.",
        englishHint: "He turned off his work phone right on time at the end of the workday."
      },
      {
        id: "w_feierabend_s9",
        german: "Genieße deinen Feierabend, du hast heute viel gearbeitet!",
        englishHint: "Enjoy your evening off, you worked hard today!"
      },
      {
        id: "w_feierabend_s10",
        german: "Freitags machen viele Mitarbeiter schon früher Feierabend.",
        englishHint: "On Fridays many employees finish work earlier."
      }
    ]
  },
  {
    id: "w_verabreden",
    rawInput: "verabreden",
    normalizedWord: "sich verabreden",
    article: null,
    partOfSpeech: "Verb (reflexiv, regelmäßig)",
    meaning: "to arrange to meet, to make plans/an appointment with someone",
    plural: null,
    verbForms: "verabredete, hat sich verabredet",
    governingPrepositions: "sich verabreden mit + Dat. (zu + Dat.)",
    fixedExpressions: [
      "verabredet sein mit (to have plans to meet with)",
      "sich zum Kaffee verabreden (to arrange to meet for coffee)"
    ],
    memoryHook: "'abreden' (agree) with prefix 'ver-' — agreeing on a time and place to meet.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000020000,
    sentences: [
      {
        id: "w_verabreden_s1",
        german: "Lass uns für Samstag zum Kaffeetrinken verabreden!",
        englishHint: "Let's arrange to meet for coffee on Saturday!"
      },
      {
        id: "w_verabreden_s2",
        german: "Ich kann nicht kommen, weil ich schon mit Thomas verabredet bin.",
        englishHint: "I cannot come because I already have plans to meet Thomas."
      },
      {
        id: "w_verabreden_s3",
        german: "Wo wollt ihr euch heute Abend verabreden?",
        englishHint: "Where do you want to arrange to meet tonight?"
      },
      {
        id: "w_verabreden_s4",
        german: "Sie haben sich für 19 Uhr vor dem Kino verabredet.",
        englishHint: "They arranged to meet at 7 p.m. in front of the cinema."
      },
      {
        id: "w_verabreden_s5",
        german: "Wir sollten uns bald mal wieder verabreden!",
        englishHint: "We should arrange to meet again soon!"
      },
      {
        id: "w_verabreden_s6",
        german: "Er verabredet sich am Wochenende oft mit alten Schulfreunden.",
        englishHint: "He often makes plans to meet old school friends on weekends."
      },
      {
        id: "w_verabreden_s7",
        german: "Hast du dich schon mit dem neuen Kollegen zum Mittagessen verabredet?",
        englishHint: "Have you already arranged to meet the new colleague for lunch?"
      },
      {
        id: "w_verabreden_s8",
        german: "Wegen des Regens verabredeten wir uns drinnen im Restaurant.",
        englishHint: "Because of the rain we arranged to meet inside the restaurant."
      },
      {
        id: "w_verabreden_s9",
        german: "Um wie viel Uhr seid ihr morgen verabredet?",
        englishHint: "At what time are you planned to meet tomorrow?"
      },
      {
        id: "w_verabreden_s10",
        german: "Sie verabredeten sich spontan zu einem Spaziergang im Park.",
        englishHint: "They spontaneously arranged to meet for a walk in the park."
      }
    ]
  },
  {
    id: "w_gemuetlichkeit",
    rawInput: "Gemütlichkeit",
    normalizedWord: "die Gemütlichkeit",
    article: "die",
    partOfSpeech: "Substantiv (f)",
    meaning: "coziness, comfortable friendly warmth",
    plural: "die Gemütlichkeiten",
    verbForms: null,
    governingPrepositions: null,
    fixedExpressions: [
      "in aller Gemütlichkeit (unhurriedly, at one's ease)",
      "für Gemütlichkeit sorgen (to create a cozy atmosphere)"
    ],
    memoryHook: "From 'Gemüt' (mind/soul) — an atmosphere where the soul feels warm and relaxed.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000030000,
    sentences: [
      {
        id: "w_gemuetlichkeit_s1",
        german: "Mit Kerzen und heißem Tee schaffen wir viel Gemütlichkeit im Zimmer.",
        englishHint: "With candles and hot tea we create lots of coziness in the room."
      },
      {
        id: "w_gemuetlichkeit_s2",
        german: "Am Sonntag frühstücken wir immer in aller Gemütlichkeit ohne Stress.",
        englishHint: "On Sunday we always have breakfast in total coziness without stress."
      },
      {
        id: "w_gemuetlichkeit_s3",
        german: "Das kleine Café hat alte Holzmöbel und eine tolle Gemütlichkeit.",
        englishHint: "The small café has old wooden furniture and great coziness."
      },
      {
        id: "w_gemuetlichkeit_s4",
        german: "Ein warmer Teppich bringt sofort mehr Gemütlichkeit in die Wohnung.",
        englishHint: "A warm rug brings more coziness into the apartment immediately."
      },
      {
        id: "w_gemuetlichkeit_s5",
        german: "Im Winter lieben die Menschen die Gemütlichkeit vor dem Kamin.",
        englishHint: "In winter people love the coziness in front of the fireplace."
      },
      {
        id: "w_gemuetlichkeit_s6",
        german: "Die Gäste genossen das leckere Essen und die Gemütlichkeit am Tisch.",
        englishHint: "The guests enjoyed the delicious food and the warmth at the table."
      },
      {
        id: "w_gemuetlichkeit_s7",
        german: "Moderne weiße Büros haben oft leider gar keine Gemütlichkeit.",
        englishHint: "Modern white offices often unfortunately lack any coziness."
      },
      {
        id: "w_gemuetlichkeit_s8",
        german: "Wir saßen stundenlang zusammen und genossen die Ruhe und Gemütlichkeit.",
        englishHint: "We sat together for hours enjoying the calm and coziness."
      },
      {
        id: "w_gemuetlichkeit_s9",
        german: "Ein paar Kissen auf dem Sofa sorgen schnell für Gemütlichkeit.",
        englishHint: "A few cushions on the sofa quickly create coziness."
      },
      {
        id: "w_gemuetlichkeit_s10",
        german: "Kaffee und Kuchen gehören für viele zur echten Gemütlichkeit.",
        englishHint: "For many, coffee and cake are part of real cozy leisure."
      }
    ]
  },
  {
    id: "w_nachvollziehen",
    rawInput: "nachvollziehen",
    normalizedWord: "nachvollziehen",
    article: null,
    partOfSpeech: "Verb (trennbar, unregelmäßig)",
    meaning: "to understand, comprehend, follow someone's reasoning",
    plural: null,
    verbForms: "vollzog nach, hat nachvollzogen",
    governingPrepositions: "etwas nachvollziehen können",
    fixedExpressions: [
      "gut nachvollziehen können (to understand completely)",
      "leicht nachvollziehbar sein (to be easily understandable)"
    ],
    memoryHook: "'nach' (after) + 'vollziehen' (to carry out) — to follow and reconstruct the reasoning in your own mind.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000040000,
    sentences: [
      {
        id: "w_nachvollziehen_s1",
        german: "Ich verstehe dein Problem und kann deine Gefühle sehr gut nachvollziehen.",
        englishHint: "I understand your problem and can comprehend your feelings very well."
      },
      {
        id: "w_nachvollziehen_s2",
        german: "Warum er den Job gekündigt hat, kann niemand im Team nachvollziehen.",
        englishHint: "Why he quit the job, nobody in the team can comprehend."
      },
      {
        id: "w_nachvollziehen_s3",
        german: "Kannst du mir die Rechnung erklären, damit ich sie nachvollziehen kann?",
        englishHint: "Can you explain the calculation to me so I can follow it?"
      },
      {
        id: "w_nachvollziehen_s4",
        german: "Ihre Erklärung war so einfach, dass jeder sie nachvollziehen konnte.",
        englishHint: "Her explanation was so simple that everyone could follow it."
      },
      {
        id: "w_nachvollziehen_s5",
        german: "Ich kann deine Entscheidung absolut nachvollziehen.",
        englishHint: "I can completely understand your decision."
      },
      {
        id: "w_nachvollziehen_s6",
        german: "Nach diesem langen Gespräch konnte er ihre Meinung besser nachvollziehen.",
        englishHint: "After this long conversation, he could understand her opinion better."
      },
      {
        id: "w_nachvollziehen_s7",
        german: "Dass du nach dem langen Tag müde bist, kann ich gut nachvollziehen.",
        englishHint: "That you are tired after the long day, I can easily understand."
      },
      {
        id: "w_nachvollziehen_s8",
        german: "Seine Gründe waren für alle Anwesenden klar nachvollziehbar.",
        englishHint: "His reasons were clearly understandable to everyone present."
      },
      {
        id: "w_nachvollziehen_s9",
        german: "Ich versuche, deine Sichtweise Schritt für Schritt nachzuvollziehen.",
        englishHint: "I try to follow your perspective step by step."
      },
      {
        id: "w_nachvollziehen_s10",
        german: "Wie das passieren konnte, kann ich beim besten Willen nicht nachvollziehen.",
        englishHint: "How that could happen, I cannot comprehend at all."
      }
    ]
  },
  {
    id: "w_vorfreude",
    rawInput: "Vorfreude",
    normalizedWord: "die Vorfreude",
    article: "die",
    partOfSpeech: "Substantiv (f)",
    meaning: "anticipation, joyful expectation before an event",
    plural: "die Vorfreuden",
    verbForms: null,
    governingPrepositions: "Vorfreude auf + Akk.",
    fixedExpressions: [
      "voller Vorfreude sein (to be full of happy anticipation)",
      "Vorfreude ist die schönste Freude (anticipation is the best joy)"
    ],
    memoryHook: "'Vor' (before) + 'Freude' (joy) — the joy felt before something good happens.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000050000,
    sentences: [
      {
        id: "w_vorfreude_s1",
        german: "Schon beim Kofferpacken wuchs die Vorfreude auf den Urlaub.",
        englishHint: "Already while packing bags, the joyful anticipation for the vacation grew."
      },
      {
        id: "w_vorfreude_s2",
        german: "Die Kinder schauten voller Vorfreude auf die Geschenke unter dem Baum.",
        englishHint: "The children looked full of joyful expectation at the presents under the tree."
      },
      {
        id: "w_vorfreude_s3",
        german: "Ich habe riesige Vorfreude auf das Konzert am Samstag.",
        englishHint: "I have huge anticipation for the concert on Saturday."
      },
      {
        id: "w_vorfreude_s4",
        german: "Man sagt oft: Vorfreude ist die schönste Freude.",
        englishHint: "People often say: anticipation is the greatest joy."
      },
      {
        id: "w_vorfreude_s5",
        german: "Seine Vorfreude auf das Wochenende half ihm durch den stressigen Freitag.",
        englishHint: "His anticipation of the weekend helped him through stressful Friday."
      },
      {
        id: "w_vorfreude_s6",
        german: "Sie strahlte vor lauter Vorfreude auf das Treffen mit ihrer Schwester.",
        englishHint: "She beamed with joyful expectation for the meeting with her sister."
      },
      {
        id: "w_vorfreude_s7",
        german: "Kaum hatten wir die Tickets gekauft, stellte sich die Vorfreude ein.",
        englishHint: "Hardly had we bought the tickets, the happy anticipation set in."
      },
      {
        id: "w_vorfreude_s8",
        german: "Vorfreude macht das Warten auf ein schönes Fest viel leichter.",
        englishHint: "Anticipation makes waiting for a nice party much easier."
      },
      {
        id: "w_vorfreude_s9",
        german: "Mit einem Lächeln voller Vorfreude stieg er in den Zug.",
        englishHint: "With a smile full of anticipation, he boarded the train."
      },
      {
        id: "w_vorfreude_s10",
        german: "Die Vorfreude auf den Geburtstag war bei den Kindern groß.",
        englishHint: "The children's anticipation for the birthday was great."
      }
    ]
  },
  {
    id: "w_klarkommen",
    rawInput: "klarkommen",
    normalizedWord: "klarkommen",
    article: null,
    partOfSpeech: "Verb (trennbar, umgangssprachlich)",
    meaning: "to manage, cope, get along with someone or something",
    plural: null,
    verbForms: "kam klar, ist klargekommen",
    governingPrepositions: "klarkommen mit + Dat.",
    fixedExpressions: [
      "Kommst du klar? (Are you doing okay / do you need help?)",
      "gut miteinander klarkommen (to get along well with each other)"
    ],
    memoryHook: "'klar' (clear) + 'kommen' (to come) — getting through something clearly and smoothly.",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000060000,
    sentences: [
      {
        id: "w_klarkommen_s1",
        german: "Am Anfang war es schwer, aber jetzt komme ich in der neuen Stadt gut klar.",
        englishHint: "In the beginning it was hard, but now I manage well in the new city."
      },
      {
        id: "w_klarkommen_s2",
        german: "Ich komme mit meinem neuen Arbeitskollegen super klar.",
        englishHint: "I get along great with my new coworker."
      },
      {
        id: "w_klarkommen_s3",
        german: "Brauchst du Hilfe oder kommst du mit der Aufgabe alleine klar?",
        englishHint: "Do you need help or are you coping with the task on your own?"
      },
      {
        id: "w_klarkommen_s4",
        german: "Mach dir keine Sorgen um mich, ich komme schon klar.",
        englishHint: "Don't worry about me, I will manage fine."
      },
      {
        id: "w_klarkommen_s5",
        german: "Hoffentlich kommt meine Oma gut mit dem neuen Handy klar.",
        englishHint: "Hopefully my grandma manages well with the new mobile phone."
      },
      {
        id: "w_klarkommen_s6",
        german: "Die beiden Brüder kommen leider nicht immer gut miteinander klar.",
        englishHint: "Unfortunately the two brothers do not always get along well with each other."
      },
      {
        id: "w_klarkommen_s7",
        german: "Trotz des Stresses kam sie mit der Situation ruhig klar.",
        englishHint: "Despite the stress she handled the situation calmly."
      },
      {
        id: "w_klarkommen_s8",
        german: "Kommst du mit dem Geld bis zum Ende des Monats klar?",
        englishHint: "Are you managing okay with money until the end of the month?"
      },
      {
        id: "w_klarkommen_s9",
        german: "Der neue Schüler kam schnell mit den Klassenregeln klar.",
        englishHint: "The new student quickly adapted to the class rules."
      },
      {
        id: "w_klarkommen_s10",
        german: "Alles ist in Ordnung, ich komme mit den Anweisungen klar.",
        englishHint: "Everything is fine, I can manage with the instructions."
      }
    ]
  },
  {
    id: "w_fernweh",
    rawInput: "Fernweh",
    normalizedWord: "das Fernweh",
    article: "das",
    partOfSpeech: "Substantiv (n)",
    meaning: "wanderlust, longing to travel to distant places",
    plural: null,
    verbForms: null,
    governingPrepositions: "Fernweh haben / bekommen",
    fixedExpressions: [
      "Fernweh haben (to have wanderlust / desire to travel)",
      "das Fernweh packt mich (wanderlust grips me)"
    ],
    memoryHook: "Opposite of 'Heimweh' (homesickness) — 'Fern' (far away) + 'Weh' (ache).",
    masteryLevel: 0,
    lastLearnedDate: null,
    createdAt: 1710000070000,
    sentences: [
      {
        id: "w_fernweh_s1",
        german: "Wenn ich Fotos vom Meer sehe, bekomme ich sofort großes Fernweh.",
        englishHint: "When I see photos of the sea, I immediately get great wanderlust."
      },
      {
        id: "w_fernweh_s2",
        german: "Statt Heimweh hatte er im Ausland immer nur Fernweh nach neuen Ländern.",
        englishHint: "Instead of homesickness, abroad he only ever had a desire to see new countries."
      },
      {
        id: "w_fernweh_s3",
        german: "Die Reisedokus im Fernsehen wecken ihr Fernweh.",
        englishHint: "The travel documentaries on TV awaken her longing to travel."
      },
      {
        id: "w_fernweh_s4",
        german: "Im kalten grauen Winter wird mein Fernweh nach der Sonne besonders stark.",
        englishHint: "In cold gray winter my desire for distant sunshine becomes especially strong."
      },
      {
        id: "w_fernweh_s5",
        german: "Er kaufte einen Rucksack, um seinem ständigen Fernweh zu folgen.",
        englishHint: "He bought a backpack to follow his constant wanderlust."
      },
      {
        id: "w_fernweh_s6",
        german: "Gegen Fernweh hilft nur eine schöne Reise.",
        englishHint: "Against wanderlust, only a nice trip helps."
      },
      {
        id: "w_fernweh_s7",
        german: "Sie schaut auf die Weltkarte mit sehnsüchtigem Fernweh.",
        englishHint: "She looks at the world map with longing wanderlust."
      },
      {
        id: "w_fernweh_s8",
        german: "Kaum ist er aus dem Urlaub zurück, hat er schon wieder Fernweh.",
        englishHint: "Hardly is he back from vacation, he already has wanderlust again."
      },
      {
        id: "w_fernweh_s9",
        german: "Sein großes Fernweh trieb ihn durch viele verschiedene Kontinente.",
        englishHint: "His great wanderlust drove him across many different continents."
      },
      {
        id: "w_fernweh_s10",
        german: "Viele junge Leute haben Fernweh und wollen die Welt entdecken.",
        englishHint: "Many young people have wanderlust and want to discover the world."
      }
    ]
  }
];
