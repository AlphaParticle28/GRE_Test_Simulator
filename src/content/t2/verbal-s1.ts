import type { QuestionSet } from '../../types.ts';

export const set: QuestionSet = {
  testId: 't2',
  measure: 'verbal',
  key: 's1',
  passages: [
    {
      id: 't2-v1-pA',
      paragraphs: [
        [
          'When neurophysiologists recording from the premotor cortex of macaque monkeys reported in the early 1990s that certain cells fired both when an animal grasped an object and when it merely watched an experimenter perform the same grasp, the finding seemed to offer a neural bridge between doing and perceiving.',
          'Within a decade, these so-called mirror neurons had been enlisted to explain an extraordinary range of human capacities, from the imitation of gestures to the understanding of other people’s intentions, the evolution of language, and even empathy.',
          'Some researchers went further, proposing that a malfunctioning mirror system might underlie the social difficulties associated with autism.',
        ],
        [
          'The very breadth of these claims has become a source of skepticism.',
          'Critics point out that the original recordings established a correlation between a neuron’s activity and two kinds of events, not that the activity is what enables an observer to grasp the meaning of an action.',
          'A cell that fires when a monkey sees a hand close around a raisin might be registering a familiar pattern of movement, or preparing the monkey’s own response, rather than computing the goal that the movement serves.',
          'Moreover, patients with damage to motor regions of the brain can sometimes recognize actions that they can no longer perform, a dissociation that is difficult to reconcile with the view that understanding an action depends on simulating it.',
          'Nor have studies of autistic individuals consistently found the diminished mirror-system activity that the so-called broken-mirror hypothesis predicts.',
        ],
        [
          'None of this shows that mirror neurons are unimportant.',
          'Their existence is well documented, and the overlap between the neural codes for performed and observed actions is a genuinely surprising fact about the primate brain.',
          'What the skeptics dispute is the inference from overlap to function: that a structure is active while a task is performed does not establish that the task requires it.',
          'A more modest hypothesis now gaining favor holds that mirror activity may refine or accelerate the interpretation of actions without being its foundation, a role that would explain both why the cells exist and why damage to them produces subtler deficits than early enthusiasts expected.',
        ],
      ],
    },
    {
      id: 't2-v1-pB',
      paragraphs: [
        [
          'Histories of jazz have long told the story of bebop as a revolt: in the early 1940s, the account goes, young musicians weary of the commercial formulas of the swing bands retreated to after-hours clubs in Harlem and there invented a music too fast and too harmonically intricate for dancing.',
          'The account is not so much wrong as incomplete.',
          'Many of bebop’s signature devices, including its extended harmonies and its displacement of melodic accents away from the beat, can be heard in the solos of swing-era players, who often experimented within big-band arrangements more freely than the bands’ recorded output suggests.',
          'Moreover, a dispute between the musicians’ union and the record companies halted most commercial recording from 1942 into 1944, so the transitional music of those years survives chiefly in a scattering of informal recordings made in clubs.',
          'When bebop finally reached the public on disc, it therefore seemed to have arrived fully formed, and the gradual evolution that had produced it became easy to overlook.',
        ],
      ],
    },
    {
      id: 't2-v1-pC',
      paragraphs: [
        [
          'Agronomist: In the Velmar plain, maize planted in fields that grew soybeans the previous year yields about 15 percent more grain per hectare than maize planted in fields that grew maize the previous year.',
          'Soybeans, unlike maize, harbor root bacteria that convert atmospheric nitrogen into a form plants can use, and some of that nitrogen remains in the soil after the soybeans are harvested.',
          'The yield advantage of maize planted after soybeans must therefore be due to its having more soil nitrogen available than maize planted after maize.',
        ],
      ],
    },
  ],
  dataSets: [],
  questions: [
    // 1. TC 1-blank
    {
      id: 't2-v1-01',
      type: 'tc',
      difficulty: 2,
      topic: 'tc.1blank',
      stem: 'Far from being the work of a single inspired afternoon, the composer’s celebrated overture was the product of years of {{1}} revision, as the dozens of heavily annotated drafts in her archive attest.',
      blanks: [['cursory', 'impulsive', 'unremitting', 'desultory', 'impromptu']],
      answer: [2],
      explanation: '"Far from ... a single inspired afternoon" contrasts a quick burst of inspiration with long, sustained labor, and "years" plus "dozens of heavily annotated drafts" confirm persistent effort. "Unremitting" (never slackening) fits. "Cursory" and "desultory" (half-hearted, unmethodical) contradict the heavy annotation; "impulsive" and "impromptu" describe exactly the spontaneity the sentence rejects.',
      traps: [
        { option: 4, blank: 0, trap: 'reversal', why: '"Impromptu" describes the single inspired afternoon that "far from" explicitly rules out.' },
      ],
      vocab: [
        { word: 'unremitting', meaning: 'never relaxing or slackening; incessant' },
        { word: 'desultory', meaning: 'lacking a plan or purpose; half-hearted' },
        { word: 'cursory', meaning: 'hasty and superficial' },
      ],
    },
    // 2. TC 2-blank
    {
      id: 't2-v1-02',
      type: 'tc',
      difficulty: 3,
      topic: 'tc.2blank',
      stem: 'The union leader’s reputation for {{1}} was belied by her conduct during the contract talks, in which she proved remarkably {{2}}, yielding on point after point to secure an agreement before the deadline.',
      blanks: [
        ['pragmatism', 'eloquence', 'obduracy'],
        ['obstinate', 'tractable', 'taciturn'],
      ],
      answer: [2, 1],
      explanation: 'The appositive "yielding on point after point" defines blank (ii): she was easily led or flexible, so "tractable." "Belied" means her conduct contradicted her reputation, so the reputation must have been for the opposite of yielding: "obduracy" (stubbornness). A reputation for "pragmatism" would be confirmed, not belied, by compromise; "taciturn" says nothing about yielding.',
      traps: [
        { option: 0, blank: 0, trap: 'reversal', why: 'Yielding to secure a deal is pragmatic, so it would confirm rather than belie a reputation for pragmatism.' },
        { option: 2, blank: 1, trap: 'partial', why: '"Taciturn" would contrast with "eloquence," but the sentence defines blank (ii) by "yielding," not by silence.' },
      ],
      vocab: [
        { word: 'obduracy', meaning: 'stubborn refusal to change one’s opinion or course of action' },
        { word: 'tractable', meaning: 'easily managed or persuaded; compliant' },
        { word: 'belie', meaning: 'to show to be false; to contradict' },
      ],
    },
    // 3. TC 2-blank
    {
      id: 't2-v1-03',
      type: 'tc',
      difficulty: 3,
      topic: 'tc.2blank',
      stem: 'The critic’s review of the retrospective was surprisingly {{1}}: readers accustomed to her withering dismissals instead found an essay that {{2}} its reservations with generous praise for the painter’s late canvases.',
      blanks: [
        ['evenhanded', 'caustic', 'abstruse'],
        ['compounded', 'supplanted', 'leavened'],
      ],
      answer: [0, 2],
      explanation: '"Surprisingly" and "accustomed to her withering dismissals ... instead" signal that this review was not harsh. The essay kept its reservations but mixed in generous praise, so it "leavened" (lightened by mixing in something) its criticism, and the review as a whole was "evenhanded" (balanced). "Caustic" is what readers expected, not the surprise; "supplanted" would mean the praise replaced the reservations entirely, which contradicts a balanced review.',
      traps: [
        { option: 1, blank: 0, trap: 'reversal', why: '"Caustic" matches her usual "withering dismissals," but "surprisingly" and "instead" require a departure from them.' },
        { option: 1, blank: 1, trap: 'wrong-shade', why: '"Supplanted" means replaced; the essay still voices its reservations, it just tempers them.' },
      ],
      vocab: [
        { word: 'evenhanded', meaning: 'fair and impartial; balanced' },
        { word: 'leaven', meaning: 'to lighten or temper by mixing in something different' },
        { word: 'supplant', meaning: 'to take the place of; replace' },
      ],
    },
    // 4. TC 3-blank
    {
      id: 't2-v1-04',
      type: 'tc',
      difficulty: 4,
      topic: 'tc.3blank',
      stem: 'Scholarly fashions are rarely as {{1}} as their adherents believe: the supposedly novel turn toward material culture in literary studies, for instance, {{2}} a set of concerns that nineteenth-century philologists had already {{3}}, albeit in a different idiom.',
      blanks: [
        ['rigorous', 'contentious', 'revolutionary'],
        ['repudiates', 'recapitulates', 'trivializes'],
        ['broached', 'dismissed', 'misconstrued'],
      ],
      answer: [2, 1, 0],
      explanation: 'The colon introduces an example, and "supposedly novel" shows the example is about a lack of novelty: fashions are rarely as "revolutionary" as adherents think. For the example to show this, the new turn must repeat old concerns, so it "recapitulates" concerns that the philologists had already "broached" (raised), "albeit in a different idiom." "Repudiates" or "trivializes" would not show that the turn is unoriginal, and philologists who "dismissed" the concerns could not have voiced them in their own idiom.',
      traps: [
        { option: 0, blank: 1, trap: 'reversal', why: 'Rejecting earlier concerns would make the turn more original, the opposite of what the example must show.' },
        { option: 1, blank: 2, trap: 'partial', why: '"Dismissed" clashes with "albeit in a different idiom," which implies the philologists expressed these concerns themselves.' },
      ],
      vocab: [
        { word: 'recapitulate', meaning: 'to repeat or restate the main points of; to repeat in a new form' },
        { word: 'broach', meaning: 'to raise a subject for discussion' },
        { word: 'idiom', meaning: 'a characteristic mode of expression' },
      ],
    },
    // 5-7. RC passage A
    {
      id: 't2-v1-05',
      type: 'rc-single',
      passageId: 't2-v1-pA',
      difficulty: 3,
      topic: 'rc.main-idea',
      stem: 'The primary purpose of the passage is to',
      options: [
        'question an expansive interpretation of a neurophysiological discovery while affirming that the discovery itself is significant',
        'trace the history of research on mirror neurons from early studies of monkeys to later studies of humans',
        'argue that mirror neurons play no meaningful role in the interpretation of actions',
        'defend a hypothesis about the neural basis of autism against recent objections',
        'explain why damage to motor regions of the brain impairs the recognition of actions',
      ],
      answer: 0,
      explanation: 'Paragraph 1 describes the discovery and the broad claims built on it; paragraph 2 says "the very breadth of these claims has become a source of skepticism" and gives the critics’ objections; paragraph 3 says "None of this shows that mirror neurons are unimportant" and calls their existence "a genuinely surprising fact," then endorses a more modest role. That is questioning an expansive interpretation while affirming the discovery’s significance.',
      traps: [
        { option: 2, trap: 'too-extreme', why: 'The passage says mirror activity may "refine or accelerate" interpretation; it denies only that it is the foundation.' },
        { option: 1, trap: 'partial', why: 'The passage includes some history, but its purpose is to evaluate the claims, not to narrate the research.' },
        { option: 4, trap: 'reversal', why: 'The passage notes that such patients can sometimes still recognize actions.' },
      ],
    },
    {
      id: 't2-v1-06',
      type: 'rc-multi',
      passageId: 't2-v1-pA',
      difficulty: 4,
      topic: 'rc.inference',
      stem: 'It can be inferred from the passage that the critics discussed in the second paragraph would agree with which of the following?<br><i>Consider each of the choices separately and select all that apply.</i>',
      options: [
        'The activity of a neuron during the observation of an action does not by itself show that the neuron enables the observer to understand that action.',
        'The existence of neurons that respond both to performing and to observing an action has not been adequately established.',
        'If understanding an action depended on simulating it, damage to motor regions would be expected to impair the recognition of actions.',
      ],
      answer: [0, 2],
      explanation: 'Choice A restates the critics’ point that the recordings "established a correlation ... not that the activity is what enables an observer to grasp the meaning of an action." Choice C is the logic behind the patient evidence: the dissociation is "difficult to reconcile with the view that understanding an action depends on simulating it" only if that view predicts impaired recognition after motor damage. Choice B is wrong: the passage says the cells’ existence "is well documented" and that what the skeptics dispute is "the inference from overlap to function," not the overlap itself.',
      traps: [
        { option: 1, trap: 'out-of-scope', why: 'The critics accept that the neurons exist; they dispute only what their activity shows.' },
      ],
    },
    {
      id: 't2-v1-07',
      type: 'rc-select',
      passageId: 't2-v1-pA',
      difficulty: 3,
      topic: 'rc.select-in-passage',
      stem: 'Select the sentence in the passage that proposes specific alternatives to the view that a mirror neuron’s response to an observed movement reflects an understanding of the movement’s purpose.',
      answer: { p: 1, s: 2 },
      explanation: 'The third sentence of paragraph 2 says the cell "might be registering a familiar pattern of movement, or preparing the monkey’s own response, rather than computing the goal that the movement serves." These are two specific alternatives to the goal-understanding view. The previous sentence criticizes the inference but proposes no alternative, and the last sentence of the passage concerns the role of mirror activity in general, not what a single neuron’s response signals.',
    },
    // 8-9. SE
    {
      id: 't2-v1-08',
      type: 'se',
      difficulty: 2,
      topic: 'se',
      stem: 'Though the novelist’s early stories were {{1}}, crowded with digressions and ornate descriptions, her later fiction is so spare that some critics have accused her of austerity for its own sake.',
      options: ['terse', 'baroque', 'insipid', 'laconic', 'florid', 'discursive'],
      answer: [1, 4],
      explanation: '"Crowded with ... ornate descriptions" and the contrast with the "spare" later fiction call for a word meaning elaborately ornamented. "Baroque" and "florid" both mean that and produce sentences alike in meaning. "Terse" and "laconic" are a synonym pair describing the later style, not the early one. "Discursive" fits "digressions" but has no partner among the choices.',
      traps: [
        { option: 0, trap: 'synonym-pair-trap', why: '"Terse" and "laconic" are synonyms, but they describe spareness, the opposite of the early stories.' },
        { option: 5, trap: 'partial', why: '"Discursive" matches "digressions" but not "ornate," and no other choice means the same thing.' },
      ],
      vocab: [
        { word: 'baroque', meaning: 'highly ornate and extravagant in style' },
        { word: 'florid', meaning: 'elaborately or excessively ornamented, especially of language' },
        { word: 'discursive', meaning: 'digressing from subject to subject' },
      ],
    },
    {
      id: 't2-v1-09',
      type: 'se',
      difficulty: 3,
      topic: 'se',
      stem: 'Though the startup’s founders insisted that their device was revolutionary, independent engineers found its supposed innovations largely {{1}}, little more than repackaged versions of technology already on the market.',
      options: ['imitative', 'abstruse', 'spurious', 'derivative', 'recondite', 'pioneering'],
      answer: [0, 3],
      explanation: 'The appositive "little more than repackaged versions of technology already on the market" defines the blank: copied from existing work. "Imitative" and "derivative" both mean this and yield equivalent sentences. "Spurious" (not genuine) is tempting but means fake, not copied, and has no partner. "Abstruse" and "recondite" are a synonym pair meaning obscure, which the context does not support; "pioneering" is the founders’ claim, not the engineers’ finding.',
      traps: [
        { option: 2, trap: 'wrong-shade', why: '"Spurious" means false or counterfeit; the clue is specifically about being copied from existing products.' },
        { option: 1, trap: 'synonym-pair-trap', why: '"Abstruse" and "recondite" are synonyms, but difficulty of understanding is not the engineers’ complaint.' },
        { option: 5, trap: 'reversal', why: '"Pioneering" echoes the founders’ claim that the engineers reject.' },
      ],
      vocab: [
        { word: 'derivative', meaning: 'imitative of the work of another; unoriginal' },
        { word: 'imitative', meaning: 'copying or following a model; not original' },
        { word: 'recondite', meaning: 'little known; obscure' },
        { word: 'spurious', meaning: 'not genuine; false' },
      ],
    },
    // 10-11. RC passage B
    {
      id: 't2-v1-10',
      type: 'rc-single',
      passageId: 't2-v1-pB',
      difficulty: 1,
      topic: 'rc.detail',
      stem: 'According to the passage, the halt in commercial recording contributed to which of the following?',
      options: [
        'A decline in the popularity of the swing bands',
        'The impression that bebop emerged abruptly rather than gradually',
        'The movement of young musicians into after-hours clubs',
        'The loss of most informal recordings made in clubs',
        'The replacement of big-band arrangements by small ensembles',
      ],
      answer: 1,
      explanation: 'The fourth and fifth sentences say the recording halt left the transitional music largely undocumented, so "when bebop finally reached the public on disc, it therefore seemed to have arrived fully formed." That is the impression of an abrupt emergence. The passage does not connect the halt to any of the other effects.',
    },
    {
      id: 't2-v1-11',
      type: 'rc-single',
      passageId: 't2-v1-pB',
      difficulty: 3,
      topic: 'rc.function',
      stem: 'The author mentions the solos of swing-era players primarily in order to',
      options: [
        'suggest that big-band arrangements were more harmonically intricate than bebop',
        'explain why dancers lost interest in swing music during the early 1940s',
        'argue that swing musicians deserve more credit than bebop musicians for the innovations of jazz',
        'show that the commercial formulas of the swing bands prevented musicians from experimenting',
        'provide evidence that features associated with bebop had antecedents in earlier jazz',
      ],
      answer: 4,
      explanation: 'The author calls the revolt story "incomplete" and then says bebop’s "signature devices ... can be heard in the solos of swing-era players." The solos are evidence that bebop’s features had earlier roots, supporting the point about gradual evolution.',
      traps: [
        { option: 3, trap: 'reversal', why: 'The passage says these players "experimented within big-band arrangements more freely" than the records suggest.' },
        { option: 2, trap: 'too-extreme', why: 'The author says only that the revolt story is incomplete, not that swing players deserve more credit.' },
      ],
    },
    // 12. CR passage C
    {
      id: 't2-v1-12',
      type: 'rc-single',
      passageId: 't2-v1-pC',
      difficulty: 5,
      topic: 'cr.assumption',
      stem: 'The agronomist’s argument depends on which of the following assumptions?',
      options: [
        'Soybeans leave more nitrogen in the soil than any other crop that could be planted in rotation with maize.',
        'A field planted with soybeans contains more soil nitrogen when the soybeans are harvested than it did when they were planted.',
        'Farmers in the Velmar plain apply no nitrogen fertilizer to maize planted after soybeans.',
        'In fields that grew maize the previous year, the amount of nitrogen available in the soil limits the yield of maize.',
        'Planting maize after soybeans is more profitable for farmers in the Velmar plain than planting maize after maize.',
      ],
      answer: 3,
      explanation: 'The agronomist attributes the yield gap to the extra nitrogen available after soybeans. Extra nitrogen can raise yields only if nitrogen is in short supply in the comparison fields. Negate D: if maize after maize already has all the nitrogen it can use, having more nitrogen cannot explain the higher yields after soybeans, and the argument collapses. B is not required, because the comparison is with maize after maize: a soybean field could merely hold its nitrogen steady while maize drains it. A and E are irrelevant, and C is far stronger than the argument needs.',
      traps: [
        { option: 1, trap: 'partial', why: 'The argument compares fields after soybeans with fields after maize; soybeans need not increase soil nitrogen in absolute terms, only leave more than maize does.' },
        { option: 2, trap: 'too-extreme', why: 'The argument survives if farmers add some fertilizer, as long as nitrogen still differs between the field types and limits yield.' },
      ],
    },
  ],
};
