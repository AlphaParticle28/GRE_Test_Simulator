import type { QuestionSet } from '../../types.ts';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'verbal',
  key: 's1',
  passages: [
    {
      id: 't1-v1-pA',
      paragraphs: [
        [
          'For most of the twentieth century, cell biologists understood the interior of the eukaryotic cell chiefly in terms of membranes: organelles such as the nucleus and the mitochondrion were defined by the lipid boundaries that separated their contents from the surrounding cytoplasm.',
          'Yet cells also contain numerous compartments that lack any membrane, among them the nucleolus and the stress granules that form when a cell is exposed to heat or toxins.',
          'How such structures maintain a distinctive composition without a physical barrier long remained obscure.',
        ],
        [
          'In the past two decades, many researchers have embraced an answer borrowed from physical chemistry.',
          'Under certain conditions, proteins and RNA molecules that attract one another weakly but at many sites can separate from the surrounding fluid, much as droplets of oil separate from water—a process known as liquid-liquid phase separation.',
          'The resulting condensates concentrate particular molecules while excluding others, and because they can dissolve as readily as they form, they would allow a cell to assemble and dismantle compartments as conditions change.',
          'In support of this view, purified proteins from several membraneless compartments readily form droplets in a test tube, and in living cells some of these compartments fuse with one another and, when part of their fluorescently tagged contents is bleached with a laser, regain their fluorescence within seconds—behaviors characteristic of liquids.',
        ],
        [
          'The model’s explanatory reach, however, has invited skepticism.',
          'Critics point out that droplet formation in vitro often requires protein concentrations far higher than those measured inside cells, so the ability of a purified protein to separate in a test tube shows what the protein can do, not what it actually does in its native environment.',
          'Rapid recovery of fluorescence after bleaching, moreover, is consistent with several mechanisms, including the transient binding of molecules to a stable scaffold, and therefore cannot by itself distinguish a liquid droplet from a more conventional molecular assembly.',
          'None of these objections refutes the phase-separation model; rather, they suggest that its proponents have sometimes treated the plausibility of a mechanism as evidence of its operation.',
          'To show that a given compartment forms by phase separation, researchers must demonstrate that it behaves as the theory predicts at the concentrations actually found in cells—that it dissolves, for instance, when the concentration of its key components falls below a critical threshold—rather than merely that it resembles a droplet.',
        ],
      ],
    },
    {
      id: 't1-v1-pB',
      paragraphs: [
        [
          'Connoisseurs of Renaissance painting have long treated pentimenti—traces of an artist’s changes of mind, such as a repositioned hand or an altered contour visible beneath the final layer of paint—as a sign that a work is an original rather than a copy.',
          'The reasoning is intuitive: a copyist reproducing a finished composition has no occasion to revise it, whereas an artist inventing a design is likely to adjust it while working.',
          'Infrared imaging, which can reveal underdrawing through layers of paint, has made such traces far easier to detect, and attributions based on them have multiplied accordingly.',
          'Yet the same technology has complicated the inference on which those attributions rest.',
          'Infrared examinations of workshop replicas—versions of a master’s popular compositions painted by assistants for other buyers—have shown that the assistants often modified poses or backgrounds to suit a new patron’s taste, leaving pentimenti of their own.',
          'A revision beneath the surface thus establishes that someone was making decisions at the easel, but not that this someone was the master.',
        ],
      ],
    },
    {
      id: 't1-v1-pC',
      paragraphs: [
        [
          'Last year Fennimore Books, a chain of bookstores, introduced a loyalty card that gives members a 10 percent discount on every purchase.',
          'Members now account for 60 percent of Fennimore’s sales, and the average member spends twice as much per year at Fennimore as the average nonmember does.',
          'Fennimore’s managers conclude that the loyalty program has substantially increased the amount customers spend at its stores.',
        ],
      ],
    },
  ],
  dataSets: [],
  questions: [
    // 1. TC 1-blank
    {
      id: 't1-v1-01',
      type: 'tc',
      difficulty: 2,
      topic: 'tc.1blank',
      stem: 'The documentary’s narrator adopts a deliberately {{1}} tone, recounting even the most harrowing episodes in a flat, unhurried voice that leaves viewers to supply their own outrage.',
      blanks: [['dispassionate', 'indignant', 'whimsical', 'reverent', 'conspiratorial']],
      answer: [0],
      explanation: 'The clue is “a flat, unhurried voice” that “leaves viewers to supply their own outrage”: the narrator expresses no emotion. “Dispassionate” (unemotional, detached) fits. “Indignant” is the reverse, since the outrage is left to the viewers; “whimsical,” “reverent,” and “conspiratorial” do not describe a flat, emotionless delivery.',
      traps: [{ option: 1, blank: 0, trap: 'reversal', why: 'The harrowing subject invites “indignant,” but the sentence says the narrator leaves the outrage to viewers, so the narrator is not indignant.' }],
      vocab: [
        { word: 'dispassionate', meaning: 'not influenced by strong emotion; calm and detached' },
        { word: 'indignant', meaning: 'angered by something perceived as unjust' },
      ],
    },
    // 2. TC 2-blank
    {
      id: 't1-v1-02',
      type: 'tc',
      difficulty: 3,
      topic: 'tc.2blank',
      stem: 'Scholars who regard the treaty as a triumph of diplomacy tend to {{1}} the role of chance in its negotiation, yet the archival record suggests that the agreement owed as much to a fortuitous illness in the rival delegation as to any {{2}} on the part of the negotiators.',
      blanks: [
        ['overstate', 'scrutinize', 'discount'],
        ['adroitness', 'obstinacy', 'naivete'],
      ],
      answer: [2, 0],
      explanation: 'Scholars who credit diplomacy for the treaty would minimize luck, and “yet” signals that the record shows chance mattered after all, so blank (i) is “discount” (treat as unimportant). The illness (chance) is contrasted with the negotiators’ skill, the thing the “triumph of diplomacy” view emphasizes, so blank (ii) is “adroitness.” “Obstinacy” and “naivete” are not what those scholars would credit for a diplomatic triumph.',
      traps: [
        { option: 0, blank: 0, trap: 'reversal', why: '“Overstate” gets the logic backward: people who see the treaty as a triumph of skill would play down chance, and the “yet” clause corrects that.' },
        { option: 1, blank: 1, trap: 'wrong-shade', why: 'Stubbornness can win concessions, but the contrast is between luck and diplomatic skill, not between luck and stubbornness.' },
      ],
      vocab: [
        { word: 'discount', meaning: 'to regard as unimportant or unworthy of consideration' },
        { word: 'adroitness', meaning: 'cleverness or skill, especially in handling situations' },
        { word: 'fortuitous', meaning: 'happening by chance' },
      ],
    },
    // 3. TC 2-blank
    {
      id: 't1-v1-03',
      type: 'tc',
      difficulty: 2,
      topic: 'tc.2blank',
      stem: 'Because the museum’s new director had a reputation for being {{1}}, the staff were astonished when she {{2}} the institution’s decades-old acquisitions policy within weeks of her arrival.',
      blanks: [
        ['impulsive', 'circumspect', 'gregarious'],
        ['jettisoned', 'reaffirmed', 'publicized'],
      ],
      answer: [1, 0],
      explanation: 'The staff were “astonished,” so her action must clash with her reputation. A cautious director (“circumspect”) who abruptly discards (“jettisoned”) a long-standing policy within weeks would astonish people. An “impulsive” director acting quickly would not be surprising, and reaffirming or publicizing the policy would not be astonishing for a cautious person.',
      traps: [{ option: 0, blank: 0, trap: 'reversal', why: 'An impulsive director making a sudden change is exactly what staff would expect; the astonishment requires a cautious reputation.' }],
      vocab: [
        { word: 'circumspect', meaning: 'wary and unwilling to take risks; cautious' },
        { word: 'jettison', meaning: 'to abandon or discard' },
      ],
    },
    // 4. TC 3-blank
    {
      id: 't1-v1-04',
      type: 'tc',
      difficulty: 4,
      topic: 'tc.3blank',
      stem: 'The historian’s reputation for {{1}} rests largely on her early monographs, whose painstaking documentation and refusal to speculate beyond the evidence made them models of scholarly restraint; her later, more {{2}} books, by contrast, have struck many reviewers as {{3}} the very caution that first won her readers.',
      blanks: [
        ['erudition', 'flamboyance', 'scrupulousness'],
        ['conjectural', 'meticulous', 'accessible'],
        ['exemplifying', 'betraying', 'anticipating'],
      ],
      answer: [2, 0, 1],
      explanation: 'The early books are “models of scholarly restraint” and later the sentence calls this quality “the very caution that first won her readers,” so blank (i) is “scrupulousness.” “By contrast” means the later books do what the early ones refused to do, speculate beyond the evidence, so blank (ii) is “conjectural.” Books that speculate would be seen as “betraying” that caution in blank (iii).',
      traps: [
        { option: 0, blank: 0, trap: 'wrong-shade', why: 'Painstaking documentation could suggest learning, but the sentence ties her reputation to restraint and caution, not breadth of knowledge.' },
        { option: 2, blank: 1, trap: 'out-of-scope', why: 'Later books might well be more accessible, but accessibility is not the opposite of refusing to speculate, so it does not set up the contrast.' },
        { option: 0, blank: 2, trap: 'reversal', why: '“By contrast” requires the later books to depart from the early caution, not exemplify it.' },
      ],
      vocab: [
        { word: 'scrupulousness', meaning: 'extreme care and attention to accuracy and propriety' },
        { word: 'conjectural', meaning: 'based on guesswork or speculation rather than evidence' },
        { word: 'betray', meaning: 'to be disloyal to; to reveal unintentionally' },
        { word: 'erudition', meaning: 'deep, extensive learning' },
      ],
    },
    // 5-7. RC passage A
    {
      id: 't1-v1-05',
      type: 'rc-single',
      passageId: 't1-v1-pA',
      difficulty: 3,
      topic: 'rc.attitude',
      stem: 'The author’s attitude toward the phase-separation model is best described as',
      options: [
        'enthusiastic endorsement of the model’s explanatory reach',
        'qualified skepticism directed less at the model itself than at the evidence often offered for it',
        'settled conviction that the model has been refuted by observations of living cells',
        'neutral interest in the model as one of several equally well-supported hypotheses',
        'impatience with critics who have questioned the model’s applicability to living cells',
      ],
      answer: 1,
      explanation: 'The author reports the critics’ objections approvingly but states that “None of these objections refutes the phase-separation model; rather, they suggest that its proponents have sometimes treated the plausibility of a mechanism as evidence of its operation.” The doubt is aimed at how the model has been supported, not at the model itself. (C) contradicts “None of these objections refutes”; (A) and (E) ignore the author’s endorsement of the critics’ points.',
      traps: [
        { option: 2, trap: 'too-extreme', why: 'The author explicitly says the objections do not refute the model.' },
        { option: 0, trap: 'reversal', why: 'The model’s “explanatory reach” is mentioned only as the thing that “has invited skepticism.”' },
      ],
    },
    {
      id: 't1-v1-06',
      type: 'rc-multi',
      passageId: 't1-v1-pA',
      difficulty: 3,
      topic: 'rc.detail',
      stem: 'According to the passage, which of the following is a reason that some evidence cited in support of the phase-separation model is inconclusive?<br><i>Consider each of the choices separately and select all that apply.</i>',
      options: [
        'Purified proteins may form droplets in a test tube only at concentrations higher than those found in cells.',
        'Condensates dissolve so readily that they are difficult to observe in living cells.',
        'Rapid recovery of fluorescence after bleaching can also arise when molecules bind briefly to a stable scaffold.',
      ],
      answer: [0, 2],
      explanation: 'The third paragraph gives two reasons: droplet formation in vitro “often requires protein concentrations far higher than those measured inside cells” (A), and fluorescence recovery “is consistent with several mechanisms, including the transient binding of molecules to a stable scaffold” (C). The passage says condensates dissolve readily, but presents this as a possible advantage, not as an obstacle to observing them (B).',
      traps: [{ option: 1, trap: 'out-of-scope', why: 'It reuses the passage’s phrase about dissolving “as readily as they form,” but the passage never says this makes condensates hard to observe or weakens the evidence.' }],
    },
    {
      id: 't1-v1-07',
      type: 'rc-select',
      passageId: 't1-v1-pA',
      difficulty: 3,
      topic: 'rc.select-in-passage',
      stem: 'Select the sentence in the passage that offers the author’s general characterization of a flaw in the way some researchers have argued for the phase-separation model.',
      answer: { p: 2, s: 3 },
      explanation: 'In the fourth sentence of the third paragraph, the author steps back from the critics’ specific points and generalizes: proponents “have sometimes treated the plausibility of a mechanism as evidence of its operation.” The second and third sentences of that paragraph are specific objections attributed to critics, not the author’s general characterization.',
    },
    // 8-9. SE
    {
      id: 't1-v1-08',
      type: 'se',
      difficulty: 1,
      topic: 'se',
      stem: 'Despite forecasts of a punishing winter, the season proved remarkably {{1}}, with temperatures seldom dipping below freezing.',
      options: ['severe', 'mild', 'brief', 'inclement', 'gentle', 'damp'],
      answer: [1, 4],
      explanation: '“Despite forecasts of a punishing winter” and “temperatures seldom dipping below freezing” call for a word meaning not harsh or extreme. “Mild” and “gentle” both fit and produce sentences alike in meaning. “Severe” and “inclement” agree with the forecast, not the outcome; “brief” and “damp” are not supported by the temperature clue.',
      vocab: [
        { word: 'mild', meaning: 'of weather: moderately warm; not severe' },
        { word: 'inclement', meaning: 'of weather: unpleasantly cold, wet, or stormy' },
      ],
    },
    {
      id: 't1-v1-09',
      type: 'se',
      difficulty: 3,
      topic: 'se',
      stem: 'Though the senator’s public remarks on the trade bill were {{1}}, her voting record left little doubt about where she stood.',
      options: ['equivocal', 'candid', 'incendiary', 'noncommittal', 'frank', 'infrequent'],
      answer: [0, 3],
      explanation: '“Though” sets the remarks against a voting record that “left little doubt about where she stood,” so the remarks must have left her position unclear. “Equivocal” (deliberately ambiguous) and “noncommittal” (not revealing a definite position) both fit and yield equivalent sentences. “Candid” and “frank” are a synonym pair that reverses the contrast. “Infrequent” makes a sensible sentence but has no partner with the same meaning.',
      traps: [
        { option: 1, trap: 'synonym-pair-trap', why: '“Candid” and “frank” are synonyms, but plain-spoken remarks would not contrast with a clear voting record.' },
        { option: 5, trap: 'wrong-shade', why: 'Rare remarks could also leave doubt, but no other choice means “infrequent,” so it cannot complete an equivalent pair.' },
      ],
      vocab: [
        { word: 'equivocal', meaning: 'open to more than one interpretation; deliberately ambiguous' },
        { word: 'noncommittal', meaning: 'not expressing or revealing a definite opinion' },
        { word: 'incendiary', meaning: 'tending to stir up conflict; inflammatory' },
      ],
    },
    // 10-11. RC passage B
    {
      id: 't1-v1-10',
      type: 'rc-single',
      passageId: 't1-v1-pB',
      difficulty: 3,
      topic: 'rc.main-idea',
      stem: 'The passage is primarily concerned with',
      options: [
        'arguing that many paintings attributed to Renaissance masters are in fact copies',
        'describing a technique that has made it possible to distinguish reliably between a master’s work and an assistant’s',
        'defending traditional connoisseurship against the claims of technical analysis',
        'explaining why Renaissance masters so often revised their own compositions',
        'questioning the reliability of a kind of evidence used in attributing paintings',
      ],
      answer: 4,
      explanation: 'The passage describes the connoisseurs’ use of pentimenti as a sign of originality, then shows (“Yet the same technology has complicated the inference”) that assistants’ replicas also contain pentimenti, so pentimenti do not prove a work is the master’s. That is a challenge to a type of evidence. (A) overstates: the passage never says many attributions are wrong. (B) reverses the point that imaging complicated attribution.',
      traps: [
        { option: 0, trap: 'too-extreme', why: 'The author says pentimenti do not establish the master’s hand, not that many attributed works are actually copies.' },
        { option: 1, trap: 'reversal', why: 'Infrared imaging made pentimenti easier to see but undermined, rather than secured, their use in telling master from assistant.' },
      ],
    },
    {
      id: 't1-v1-11',
      type: 'rc-single',
      passageId: 't1-v1-pB',
      difficulty: 5,
      topic: 'rc.inference',
      stem: 'The author would most likely agree that the presence of pentimenti in a painting attributed to a Renaissance master',
      options: [
        'indicates that someone other than the master had a hand in painting it',
        'shows that the painting was not reproduced from an existing composition',
        'is compatible with the painting’s being one of several versions of a single composition',
        'should carry no weight in debates about who painted the work',
        'suggests that the painting was altered to satisfy the preferences of a particular patron',
      ],
      answer: 2,
      explanation: 'The passage says workshop replicas, “versions of a master’s popular compositions,” often contain pentimenti of their own. So finding pentimenti does not rule out that a painting is one of several versions of one composition. (A) turns “does not establish that it was the master” into “establishes that it was not the master,” which the passage never claims. (B) is contradicted by the replicas. (D) is too strong, since pentimenti still show “someone was making decisions at the easel.” (E) treats one possible cause as the meaning of every pentimento.',
      traps: [
        { option: 0, trap: 'reversal', why: 'Failing to prove the master painted it is not the same as proving someone else did; the master’s own changes of mind also leave pentimenti.' },
        { option: 3, trap: 'too-extreme', why: 'The last sentence grants that pentimenti do establish something (decisions made at the easel), so they are not worthless as evidence.' },
        { option: 1, trap: 'reversal', why: 'Replicas reproduced existing compositions and still showed pentimenti, so pentimenti cannot show that a work was not reproduced.' },
      ],
    },
    // 12. CR
    {
      id: 't1-v1-12',
      type: 'rc-single',
      passageId: 't1-v1-pC',
      difficulty: 4,
      topic: 'cr.assumption',
      stem: 'The managers’ conclusion depends on which of the following assumptions?',
      options: [
        'A majority of Fennimore’s customers have enrolled in the loyalty program.',
        'The loyalty program has increased Fennimore’s profits as well as its sales.',
        'Customers who have not enrolled in the program would spend more at Fennimore if they did enroll.',
        'Customers who enrolled in the program were not, before it began, already spending considerably more at Fennimore than other customers were.',
        'Members of the program do not also shop at bookstores operated by Fennimore’s competitors.',
      ],
      answer: 3,
      explanation: 'The only evidence is that members now spend twice as much as nonmembers. That supports the claim that the program increased spending only if the gap was not already there before the program began. Negate (D): if Fennimore’s biggest spenders were the ones who signed up, the gap reflects who joined, not what the program did, and the argument collapses. (C) concerns hypothetical future enrollees and is not needed for a claim about what the program has already done.',
      traps: [
        { option: 2, trap: 'out-of-scope', why: 'This is a natural next step for the managers, but the conclusion is about past effects on members, so nonmembers’ hypothetical behavior is not required.' },
        { option: 1, trap: 'out-of-scope', why: 'The conclusion is about customers’ spending, not Fennimore’s profits.' },
      ],
    },
  ],
};
