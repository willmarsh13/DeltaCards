// Major-version groups for "Family" mode: one card per model family (A330, 757, CRJ...)
// instead of per exact variant (A330-300, 757-200, CRJ900...).
// Cheats here are about telling the family apart from other families, not variants apart.
window.FAMILIES = [
  {
    id: 'A220', maker: 'Airbus', name: 'A220', members: ['a220_100', 'a220_300'],
    aka: 'Designed by Bombardier as the CSeries',
    cheats: [
      'Small jet with comically big, round geared-turbofan engines.',
      'Big, nearly square passenger windows.',
      'Plain swept wingtips: no winglets, sharklets or fences.',
      'Smoother, pointier nose than the A320 family\'s rounded Airbus nose.',
      'Five seats across (2-3), so it\'s fatter than any CRJ or E-Jet.'
    ],
    confusedWith: ['E-Jet', 'A319', 'A320']
  },
  {
    id: 'A319', maker: 'Airbus', name: 'A319', members: ['a319'],
    confusedWith: ['A320', 'A220']
  },
  {
    id: 'A320', maker: 'Airbus', name: 'A320', members: ['a320'],
    confusedWith: ['A319', 'A321', '737']
  },
  {
    id: 'A321', maker: 'Airbus', name: 'A321', members: ['a321', 'a321neo'],
    cheats: [
      'Long, skinny Airbus. Clearly stretched compared with the A320.',
      'Tall upturned sharklets on the wingtips (Delta\'s A319/A320 have small wingtip fences instead).',
      'Rounded Airbus nose and a level stance. A 737 sits lower with a pointier nose; a 757 stands nose-high on tall gear.',
      'Engines can be slim CFM56s (A321ceo) or much fatter, rounder geared turbofans (A321neo). Either way it\'s an A321.'
    ],
    confusedWith: ['737', '757', 'A320']
  },
  {
    id: 'A330', maker: 'Airbus', name: 'A330', members: ['a330_200', 'a330_300', 'a330_900'],
    cheats: [
      'Twin-engine widebody with the rounded Airbus nose.',
      'Wingtips sweep up into blended winglets (older A330s) or long curved sharklets (A330-900).',
      'Noticeably fatter body than a 767 (8 across vs 7).',
      'No black "raccoon mask" around the cockpit windows. That\'s the A350.'
    ],
    confusedWith: ['A350', '767']
  },
  {
    id: 'A350', maker: 'Airbus', name: 'A350', members: ['a350_900'],
    confusedWith: ['A330']
  },
  {
    id: '717', maker: 'Boeing', name: '717', members: ['b717'],
    confusedWith: ['CRJ', 'A220']
  },
  {
    id: '737', maker: 'Boeing', name: '737', members: ['b737_800', 'b737_900er'],
    cheats: [
      'The 737 "hamster pouch": engine nacelles with a flattened bottom so they clear the ground.',
      'Sits low to the ground on short gear. Main wheels sit exposed in the belly with no gear doors.',
      'Pointy Boeing nose and a small dorsal fillet running forward from the base of the tail.',
      'Winglets on the wingtips: blended or split-scimitar (a fin pointing down as well as up).'
    ],
    confusedWith: ['A320', 'A321', '757']
  },
  {
    id: '757', maker: 'Boeing', name: '757', members: ['b757_200', 'b757_300'],
    cheats: [
      'Long, skinny "pencil" fuselage on very tall landing gear: it stands nose-high like it\'s ready to leap.',
      'Engines look huge for such a narrow body.',
      'Single-aisle, but much longer than any A321 or 737, with a distinctly droopy nose.',
      'Some have blended winglets and some don\'t, so don\'t lean on the wingtips.'
    ],
    confusedWith: ['A321', '737', '767']
  },
  {
    id: '767', maker: 'Boeing', name: '767', members: ['b767_300er', 'b767_400er'],
    cheats: [
      'Slim widebody (7 across, 2-3-2) with a pointy Boeing nose. Skinnier than any A330.',
      'Big, tall tail fin.',
      'Wingtips are either tall blended winglets (most -300ERs) or raked tips that sweep back to a point (-400ER).',
      'Vs. the 757: two aisles, a much wider body, and no nose-high stance.'
    ],
    confusedWith: ['A330', '757']
  },
  {
    id: 'CRJ', maker: 'Bombardier', name: 'CRJ', members: ['crj700', 'crj900'],
    aka: 'Delta flies the CRJ700 (and its 50-seat CRJ550 version) and the CRJ900',
    cheats: [
      'T-tail with both engines hung on the rear fuselage.',
      'Long, thin tube with only 4 seats across (2-2) and a long pointed nose.',
      'Sits very low to the ground.',
      'Vs. the 717: much skinnier. The 717 is a fat 5-across jet.',
      'Vs. E-Jets: the Embraers hang their engines UNDER the wings.'
    ],
    confusedWith: ['717', 'E-Jet']
  },
  {
    id: 'E-Jet', maker: 'Embraer', name: 'E-Jet', members: ['e170', 'e175'],
    aka: 'Delta Connection flies the E170 and E175',
    cheats: [
      'Engines hang UNDER the wings, with a normal low-set tail (not a T-tail). That rules out a CRJ.',
      'Rounded "mini-airliner" nose and a fatter body than a CRJ, still only 4 across (2-2).',
      'Vs. the A220: smaller, 4 across instead of 5, with winglets and much smaller engines.'
    ],
    confusedWith: ['CRJ', 'A220']
  }
];
